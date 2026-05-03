import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="relative py-20 px-4 sm:px-8 lg:px-16 overflow-hidden bg-gray-900 text-white">
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 container mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 max-w-4xl mx-auto">
          Ready to Transform Your Practice?
        </h2>
        <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
          Join hundreds of practitioners who are already saving time and improving patient outcomes with LucidCare.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            to="/signup"
            className="px-8 py-3 rounded-full text-gray-900 bg-white font-semibold shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/contact"
            className="px-8 py-3 rounded-full text-white font-semibold border-2 border-white hover:bg-white hover:text-gray-900 transition-colors duration-300"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
