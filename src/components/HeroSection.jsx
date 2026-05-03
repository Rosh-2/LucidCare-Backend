import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 lg:py-48 px-4 sm:px-8 lg:px-16 overflow-hidden bg-gradient-to-r from-blue-600 to-teal-500 text-white">
      <div className="relative z-10 container mx-auto flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-4 animate-fade-in-up">
          Understand Your Medical Reports Instantly
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-3xl animate-fade-in-up delay-200">
          Transform complex medical documents into clear, easy-to-understand explanations. Get the insights you need about your health in one click.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16 animate-fade-in-up delay-400">
          <Link
            to="/signup"
            className="px-8 py-3 rounded-full text-teal-600 bg-white font-semibold shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 duration-300"
          >
            Get Started <ArrowRight className="inline-block ml-2" size={20} />
          </Link>
          <a
            href="#features"
            className="px-8 py-3 rounded-full text-white font-semibold border-2 border-white hover:bg-white hover:text-teal-600 transition-colors duration-300"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
