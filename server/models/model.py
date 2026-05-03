import os
import cv2
import json
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
from groq import Groq
import fitz  # PyMuPDF
from PyPDF2 import PdfReader

# Constants
MODEL_FILENAME = 'densenet121_xray_pytorch_finetuned.pth'
CLASS_NAMES = ['COVID-19', 'Normal', 'Pneumonia', 'Tuberculosis']

class MedicalDiagnosticSystem:
    def __init__(self, groq_api_key):
        self.groq_api_key = groq_api_key
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.groq_client = Groq(api_key=groq_api_key) if groq_api_key else None
        
        # Preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _load_model(self):
        """Loads the DenseNet model from the local directory."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, MODEL_FILENAME)
        
        if not os.path.exists(model_path):
             model_path = os.path.join(os.path.dirname(current_dir), MODEL_FILENAME)

        if os.path.exists(model_path):
            try:
                print(f"Loading PyTorch model from {model_path}...")
                
                # Initialize DenseNet121 architecture
                model = models.densenet121(weights=None) # We load our own weights
                
                # Modify the classifier to match our 4 classes
                num_ftrs = model.classifier.in_features
                model.classifier = nn.Linear(num_ftrs, len(CLASS_NAMES))
                
                # Load state dict
                state_dict = torch.load(model_path, map_location=self.device)
                
                # Check for Sequential classifier structure (classifier.0, classifier.2, etc.)
                is_sequential = any(k.startswith('classifier.0') for k in state_dict.keys())
                
                if is_sequential:
                    print("Detected Sequential classifier structure.")
                    # Try to infer structure from keys
                    # Expected: classifier.0 (Linear), classifier.1 (Activation/Dropout?), classifier.2 (Linear)
                    
                    # Get dimensions from weights
                    if 'classifier.0.weight' in state_dict:
                        w0 = state_dict['classifier.0.weight']
                        in_ftrs_0 = w0.shape[1]
                        out_ftrs_0 = w0.shape[0]
                        print(f"Layer 0: Linear({in_ftrs_0}, {out_ftrs_0})")
                    
                    if 'classifier.2.weight' in state_dict:
                        w2 = state_dict['classifier.2.weight']
                        in_ftrs_2 = w2.shape[1]
                        out_ftrs_2 = w2.shape[0]
                        print(f"Layer 2: Linear({in_ftrs_2}, {out_ftrs_2})")
                        
                        # Reconstruct Sequential
                        # Assuming structure: Linear -> ReLU/Dropout -> Linear
                        # We can try to just use the layers we have weights for.
                        # However, we need to handle the intermediate layer (1). 
                        # Usually it's ReLU or Dropout. DenseNet implementation usually just puts Linear.
                        # But since keys are 0 and 2, 1 must exist.
                        
                        model.classifier = nn.Sequential(
                            nn.Linear(in_ftrs_0, out_ftrs_0),
                            nn.ReLU(), # Assuming ReLU for 1
                            nn.Linear(in_ftrs_2, out_ftrs_2)
                        )
                        
                        # If there is a Dropout at 1, loading state dict might not complain if it has no weights.
                        # But if 1 was something with weights, we would see it.
                        
                else:
                    # Standard single layer
                    if 'classifier.weight' in state_dict:
                        w = state_dict['classifier.weight']
                        in_f = w.shape[1]
                        out_f = w.shape[0]
                        model.classifier = nn.Linear(in_f, out_f)

                model.load_state_dict(state_dict)
                
                model = model.to(self.device)
                model.eval()
                print("Model loaded successfully.")
                return model
            except Exception as e:
                print(f"Error loading model: {e}")
                return None
        else:
            print(f"Model file {MODEL_FILENAME} not found.")
            return None

    def extract_pdf_text(self, pdf_path):
        """Reads text from the uploaded PDF."""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return None

    def extract_images_from_pdf(self, pdf_path):
        """Extracts the largest image from the PDF, assuming it's the X-ray."""
        try:
            doc = fitz.open(pdf_path)
            largest_image = None
            max_size = 0
            
            output_dir = os.path.dirname(pdf_path)
            image_path = None

            for page_index in range(len(doc)):
                page = doc[page_index]
                image_list = page.get_images()

                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    width = base_image["width"]
                    height = base_image["height"]
                    ext = base_image["ext"]
                    
                    # Calculate size to find the largest image
                    size = width * height
                    
                    if size > max_size:
                        max_size = size
                        image_filename = f"extracted_xray_{page_index}_{img_index}.{ext}"
                        image_path = os.path.join(output_dir, image_filename)
                        
                        with open(image_path, "wb") as f:
                            f.write(image_bytes)
                            
            return image_path
            
        except Exception as e:
            print(f"Error extracting image from PDF: {e}")
            return None

    def _get_gradcam_data(self, img_tensor, original_img):
        """Generates the heatmap using gradients from the last convolutional layer."""
        try:
            # Requires gradients for this specific pass
            img_tensor.requires_grad = True
            
            # Hook to capture gradients and activations
            gradients = []
            activations = []

            def backward_hook(module, grad_input, grad_output):
                gradients.append(grad_output[0])

            def forward_hook(module, input, output):
                activations.append(output)

            # Target layer: Last convolutional block of denseblock4
            # In DenseNet121 features, the last block is 'denseblock4' and then 'norm5'
            # We usually use the output of the features part
            target_layer = self.model.features.norm5
            
            handle_f = target_layer.register_forward_hook(forward_hook)
            handle_b = target_layer.register_full_backward_hook(backward_hook)

            # Forward pass
            output = self.model(img_tensor)
            pred_idx = output.argmax(dim=1).item()
            score = output[:, pred_idx]

            # Backward pass
            self.model.zero_grad()
            score.backward()

            # Remove hooks
            handle_f.remove()
            handle_b.remove()

            # Get gradients and activations
            grads = gradients[0] # [1, 1024, 7, 7]
            acts = activations[0] # [1, 1024, 7, 7]

            # Pool the gradients across channels
            pooled_grads = torch.mean(grads, dim=[0, 2, 3]) # [1024]

            # Weight the activations by pooled gradients
            # (1, 1024, 7, 7) * (1024) broadcasting
            for i in range(acts.shape[1]):
                acts[:, i, :, :] *= pooled_grads[i]
            
            # Average the channels to get the heatmap
            heatmap = torch.mean(acts, dim=1).squeeze() # [7, 7]
            heatmap = F.relu(heatmap)
            heatmap = heatmap.detach().cpu().numpy()
            
            # Normalize heatmap
            if np.max(heatmap) != 0:
                heatmap /= np.max(heatmap)

            # Resize to original image size
            heatmap_resized = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))
            
            # Find Hotspot
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(heatmap_resized)
            hotspot_x, hotspot_y = max_loc

            # Determine Location String
            width = original_img.shape[1]
            height = original_img.shape[0]

            side = "Right Lung" if hotspot_x < width / 2 else "Left Lung"
            if hotspot_y < height / 3: zone = "Upper Zone"
            elif hotspot_y < (2 * height) / 3: zone = "Middle Zone"
            else: zone = "Lower Zone"

            return f"{side} ({zone})"

        except Exception as e:
            print(f"Grad-CAM Error: {e}")
            return "Chest Area"

    def analyze_image(self, image_path):
        """Analyzes an X-ray image and returns the findings."""
        if self.model is None:
            return {"error": "Model not loaded"}

        try:
            # Load and preprocess image
            img_pil = Image.open(image_path).convert('RGB')
            img_tensor = self.transform(img_pil).unsqueeze(0).to(self.device) # [1, 3, 224, 224]
            original_img = cv2.imread(image_path)

            # Predict
            with torch.no_grad(): # Use no_grad for inference, but our GradCAM needs grad...
                # Actually, for standard inference we don't need grad
                # But to call _get_gradcam_data we might need to re-run with grad enabled if we separate them
                # Or just run it once with grad enabled if performance allows.
                # For safety and speed, let's just do a clean forward pass first.
                outputs = self.model(img_tensor)
                probs = F.softmax(outputs, dim=1)
                confidence, class_idx = torch.max(probs, 1)
                
            confidence = confidence.item()
            class_idx = class_idx.item()
            disease_name = CLASS_NAMES[class_idx]

            # Grad-CAM Location (only if likely abnormal)
            location = "N/A"
            if disease_name != "Normal":
                 # We need to run a pass with gradients enabled for GradCAM
                 location = self._get_gradcam_data(img_tensor, original_img)

            json_report = {
                "overall_status": "Abnormal" if disease_name != "Normal" else "Normal",
                "findings": []
            }

            if disease_name != "Normal":
                json_report["findings"].append({
                    "condition": disease_name,
                    "confidence": f"{confidence*100:.1f}%",
                    "location": location,
                    "note": "AI detected anomaly using Grad-CAM attention."
                })
            else:
                 json_report["findings"].append({
                    "condition": "Normal",
                    "confidence": f"{confidence*100:.1f}%",
                    "location": "N/A"
                })
            
            return json_report

        except Exception as e:
            print(f"Image Analysis Error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    def generate_summary(self, pdf_text, image_findings, target_language="English"):
        """Generates a detailed summary using Groq."""
        if not self.groq_client:
            return "Groq Client not initialized. Check API Key."

        try:
            json_string = json.dumps(image_findings, indent=2) if image_findings else "No X-ray analysis provided."
            pdf_content = pdf_text if pdf_text else "No Medical Report Text provided."

            if target_language == "ml" or target_language == "Malayalam":
                lang_instruction = """
                OUTPUT LANGUAGE: MALAYALAM (മലയാളം).
                CRITICAL INSTRUCTION: WRITE IN PURE MALAYALAM SCRIPT.
                - DO NOT USE MANGLISH (Manglish is strictly forbidden).
                - DO NOT write English words in Malayalam characters (transliteration). translate the meaning.
                - Use proper medical terminology in Malayalam where possible, or keep specific medical terms in English brackets if no direct translation exists, e.g., "Pneumonia (ന്യുമോണിയ)".
                - Provide a detailed and comprehensive explanation, same length as English.
                - Explain why a value is dangerous.
                - Use clear and formal Malayalam.
                """
            else:
                lang_instruction = """
                OUTPUT LANGUAGE: ENGLISH.
                - Provide a detailed layman explanation.
                - Connect all dots between Vitals and X-Ray.
                """

            system_instruction = f"""
            You are an expert doctor explaining a detailed diagnosis to a patient.

            STRICT FORMATTING RULES:
            1. PLAIN TEXT ONLY. Do not use markdown (no bold **, no headers #, no bullets -).
            2. NO Emojis.
            3. NO Numbered lists for sections.
            4. Format exactly like the examples below.

            REQUIRED OUTPUT FORMAT:

            Vitals and Lab Data
            [Medical Term] ([Simple Definition]): [Value] -> [Status]
            [Medical Term] ([Simple Definition]): [Value] -> [Status]

            X-Ray Findings
            Condition: [Name]
            Location: [Location]
            Meaning: [Explanation]

            Integrated Summary
            [Detailed paragraph explaining the condition, evidence, and next steps in simple language.]

            {lang_instruction}
            """

            user_message = f"""
            Here is the raw data:

            --- SOURCE 1: AI X-RAY ANALYSIS (DenseNet + GradCAM) ---
            {json_string}

            --- SOURCE 2: MEDICAL REPORT TEXT ---
            {pdf_content}

            Please generate the Detailed Integrated Summary in {target_language}.
            """

            completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_message}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
            )
            return completion.choices[0].message.content

        except Exception as e:
            return f"Groq API Error: {e}"

    def generate_comparison(self, summary_older: str, summary_newer: str, target_language: str = "English") -> dict:
        """
        Compares two medical summaries using Groq and returns a structured JSON analysis.
        Returns a dict with keys: verdict, confidence, summary, highlights, recommendation.
        """
        if not self.groq_client:
            return {"error": "Groq client not initialised. Check API Key."}

        lang_instruction = ""
        if target_language in ["ml", "Malayalam"]:
            lang_instruction = """
- OUTPUT LANGUAGE RULE: You MUST output all textual fields ('summary', 'recommendation', 'note', 'metric', 'oldValue', 'newValue') in MALAYALAM (മലയാളം).
- CRITICAL: Write in pure Malayalam script. Do not use Manglish.
- CRITICAL: Do NOT translate the actual keys of the JSON object.
- CRITICAL: Do NOT translate the strict enum values for 'verdict' ("deteriorated" | "improved" | "normal") or 'change' ("deteriorated" | "improved" | "stable").
"""
        else:
            lang_instruction = """
- OUTPUT LANGUAGE RULE: Write all responses in plain ENGLISH.
"""

        system_prompt = f"""
You are a calm, supportive medical assistant helping a patient understand changes in their health over time.
You will be given two medical report summaries: one older and one recent.
Your job is to compare them and determine if the patient's health has IMPROVED, DETERIORATED, or is STABLE/NORMAL.

Return ONLY valid JSON (no markdown, no code fences) in this exact structure:
{{
  "verdict": "deteriorated" | "improved" | "normal",
  "confidence": <integer 0-100>,
  "summary": "<2-3 sentence plain language summary written in a calm and reassuring tone>",
  "highlights": [
    {{
      "metric": "<metric name>",
      "oldValue": "<value from older report>",
      "newValue": "<value from newer report>",
      "change": "deteriorated" | "improved" | "stable",
      "note": "<one sentence explanation, written gently without causing alarm>"
    }}
  ],
  "recommendation": "<1-2 sentence gentle suggestion encouraging the patient to follow up with their doctor. Do NOT use urgent or alarming language. Be warm and supportive.>"
}}

Rules:
- Extract up to 6 key metrics from the reports (e.g. specific lab values, findings, conditions).
- If a metric cannot be compared, omit it from highlights.
- Be concise. No markdown in any string value.
- confidence reflects how certain you are based on evidence strength.
- Tone must always be calm, encouraging, and non-alarming — even when health has deteriorated.
{lang_instruction}
"""

        user_message = f"""
--- OLDER REPORT ---
{summary_older}

--- RECENT REPORT ---
{summary_newer}

Analyse and return the JSON comparison.
"""

        try:
            completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
            )
            raw = completion.choices[0].message.content.strip()
            # Strip any accidental markdown code fences
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except json.JSONDecodeError as e:
            return {"error": f"LLM returned invalid JSON: {e}", "raw": raw}
        except Exception as e:
            return {"error": f"Groq API Error: {e}"}