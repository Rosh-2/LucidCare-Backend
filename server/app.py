from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import bcrypt
import jwt
import datetime
from functools import wraps
from supabase import create_client, Client
from werkzeug.utils import secure_filename
from models.model import MedicalDiagnosticSystem

load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase Configuration
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY missing from .env")

try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"Supabase Connection Error: {e}")

# Initialize AI System
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") 
diagnostic_system = MedicalDiagnosticSystem(GROQ_API_KEY)

# Upload Config
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# JWT Middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('token')

        if not token:
            return jsonify({'message': 'Token is missing!'}), 403

        try:
            data = jwt.decode(token, os.getenv('jwtSecret'), algorithms=["HS256"])
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 403

        return f(data['user']['id'], *args, **kwargs)

    return decorated

# --- AUTH ROUTES ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    age = data.get('age')
    sex = data.get('sex')

    if not all([name, email, password]):
        return jsonify({'error': 'name, email and password are required'}), 400

    try:
        existing_user = supabase.table('users').select("*").eq('user_email', email).execute()
    except Exception as e:
        print(f"[Register] Supabase SELECT error: {e}")
        return jsonify({'error': f'Database read error: {str(e)}'}), 500

    if existing_user.data and len(existing_user.data) > 0:
        return jsonify({'error': 'User already exists'}), 401

    try:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except Exception as e:
        print(f"[Register] bcrypt error: {e}")
        return jsonify({'error': f'Password hashing error: {str(e)}'}), 500

    new_user_data = {
        "user_fullname": name,
        "user_email": email,
        "user_password": hashed_password,
        "user_age": age,
        "user_sex": sex
    }

    try:
        insert_response = supabase.table('users').insert(new_user_data).execute()
    except Exception as e:
        print(f"[Register] Supabase INSERT error: {e}")
        return jsonify({'error': f'Database write error: {str(e)}'}), 500

    if not insert_response.data:
        return jsonify({'error': 'Failed to create user — Supabase returned no data. Check RLS policies.'}), 500

    new_user_id = insert_response.data[0]['user_id']

    try:
        token = jwt.encode({
            'user': {'id': new_user_id},
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, os.getenv('jwtSecret'), algorithm="HS256")
        return jsonify({'token': token})
    except Exception as e:
        print(f"[Register] JWT encode error: {e}")
        return jsonify({'error': f'Token generation error: {str(e)}'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    try:
        user_response = supabase.table('users').select("*").eq('user_email', email).execute()
    except Exception as e:
        print(f"[Login] Supabase SELECT error: {e}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    if not user_response.data or len(user_response.data) == 0:
        return jsonify({'error': 'Password or Email is incorrect'}), 401

    user = user_response.data[0]

    try:
        password_match = bcrypt.checkpw(password.encode('utf-8'), user['user_password'].encode('utf-8'))
    except Exception as e:
        print(f"[Login] bcrypt error: {e}")
        return jsonify({'error': f'Password check error: {str(e)}'}), 500

    if not password_match:
        return jsonify({'error': 'Password or Email is incorrect'}), 401

    try:
        token = jwt.encode({
            'user': {'id': user['user_id']},
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, os.getenv('jwtSecret'), algorithm="HS256")
        return jsonify({'token': token})
    except Exception as e:
        print(f"[Login] JWT encode error: {e}")
        return jsonify({'error': f'Token generation error: {str(e)}'}), 500

@app.route('/auth/is-verify', methods=['GET'])
@token_required
def is_verify(current_user):
    return jsonify(True)

# --- SUMMARY ROUTES ---

@app.route('/summaries', methods=['GET'])
@token_required
def get_summaries(current_user):
    """Return all summaries for the logged-in user, newest first."""
    try:
        response = (
            supabase.table('summaries')
            .select("summary_id, summary_text, language")
            .eq('user_id', current_user)
            .execute()
        )
        return jsonify(response.data), 200
    except Exception as e:
        print(f"Get Summaries Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/summaries/<summary_id>', methods=['GET'])
@token_required
def get_summary(current_user, summary_id):
    """Return a single summary (only if it belongs to the current user)."""
    try:
        response = (
            supabase.table('summaries')
            .select("summary_id, summary_text, language")
            .eq('summary_id', summary_id)
            .eq('user_id', current_user)
            .single()
            .execute()
        )
        if not response.data:
            return jsonify({'error': 'Summary not found'}), 404
        return jsonify(response.data), 200
    except Exception as e:
        print(f"Get Summary Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/compare', methods=['POST'])
@token_required
def compare_summaries(current_user):
    """
    Accepts a list of summary objects { id, fullText } from the frontend,
    verifies ownership, sorts by creation date, and runs a Groq comparison.
    """
    body = request.get_json()
    summaries = body.get('summaries', [])

    if len(summaries) < 2:
        return jsonify({'error': 'At least 2 summaries are required'}), 400

    try:
        # Verify ownership — fetch text for the selected IDs
        ids = [s['id'] for s in summaries]
        db_rows = (
            supabase.table('summaries')
            .select("summary_id, summary_text, language")
            .in_('summary_id', ids)
            .eq('user_id', current_user)
            .execute()
        )

        if not db_rows.data or len(db_rows.data) < 2:
            return jsonify({'error': 'Could not verify ownership of summaries'}), 403

        # Use the order the user selected them (index 0 = older, index 1 = newer)
        # Match db rows to the original order from the frontend
        id_order = {s['id']: i for i, s in enumerate(summaries)}
        sorted_rows = sorted(db_rows.data, key=lambda r: id_order.get(r['summary_id'], 0))

        older_text = sorted_rows[0]['summary_text']
        newer_text = sorted_rows[-1]['summary_text']

        target_language = sorted_rows[-1].get('language', 'English') or 'English'

        result = diagnostic_system.generate_comparison(older_text, newer_text, target_language)

        if 'error' in result:
            return jsonify(result), 500

        return jsonify(result), 200

    except Exception as e:
        print(f"Compare Error: {e}")
        return jsonify({'error': str(e)}), 500


# --- AI ROUTES ---

@app.route('/analyze', methods=['POST'])
@token_required
def analyze_medical_report(current_user):
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file part'}), 400
    
    pdf_file = request.files.get('pdf')

    pdf_text = None
    image_findings = None
    
    try:
        # Process PDF if uploaded
        if pdf_file and pdf_file.filename != '':
            filename = secure_filename(pdf_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            pdf_file.save(filepath)
            
            pdf_text = diagnostic_system.extract_pdf_text(filepath)
            
            # Extract Image from PDF
            extracted_image_path = diagnostic_system.extract_images_from_pdf(filepath)

            if extracted_image_path:
                 extract_img_filename = os.path.basename(extracted_image_path)
                 print(f"Extracted Image: {extract_img_filename}")
                 image_findings = diagnostic_system.analyze_image(extracted_image_path)
                 
                 # Clean up extracted image
                 if os.path.exists(extracted_image_path):
                     os.remove(extracted_image_path)
            
            if os.path.exists(filepath):
                os.remove(filepath)



        # Generate Summary
        if not pdf_text and not image_findings:
             return jsonify({'error': 'No valid data extracted from files'}), 400

        # Get language from request (default to English)
        language = request.form.get('language', 'English')
        summary = diagnostic_system.generate_summary(pdf_text, image_findings, language)

        # Store summary in Supabase
        try:
            summary_data = {
                "user_id": current_user,
                "summary_text": summary,
                "language": language
            }
            supabase.table('summaries').insert(summary_data).execute()
        except Exception as e:
            print(f"Error saving summary to Supabase: {e}")
            # We continue even if saving fails, as the user still wants the result

        return jsonify({
            'summary': summary,
            'details': image_findings
        })

    except Exception as e:
        print(f"Analysis Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
