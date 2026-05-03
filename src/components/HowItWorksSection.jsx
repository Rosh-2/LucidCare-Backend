import { Upload, Cpu, FileText } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Upload Your Report",
      description: "Drag and drop your medical document or select from your device.",
      icon: <Upload size={40} className="text-teal-500" />,
    },
    {
      step: "2",
      title: "AI Processing",
      description: "Our AI securely analyzes your report and extracts key insights.",
      icon: <Cpu size={40} className="text-teal-500" />,
    },
    {
      step: "3",
      title: "Get Easy Explanation",
      description: "Receive a clear, jargon-free explanation of your results.",
      icon: <FileText size={40} className="text-teal-500" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-8 lg:px-16 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Three Simple Steps to Understand Your Medical Reports
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
          Our process makes complex medical documents simple and easy to understand.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-transform transform hover:scale-105 duration-300 border border-gray-200"
            >
              <div className="bg-teal-100 rounded-full p-6 mb-6">{step.icon}</div>
              <div className="text-4xl font-bold text-teal-500 mb-2">{step.step}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
