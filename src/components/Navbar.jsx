import { useState } from "react";
import { Menu, X, Sparkle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 top-0 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm py-4 px-4 sm:px-8 lg:px-16 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2">
        <Sparkle className="text-teal-500 w-8 h-8" />
        <span className="font-bold text-2xl text-gray-900">LucidCare</span>
      </Link>
      <div className="hidden lg:flex items-center space-x-8">
        <a href="#features" className="hover:text-teal-600 transition">Features</a>
        {/* UPDATED: Changed href from "#pricing" to "#how-it-works" */}
        <a href="#how-it-works" className="hover:text-teal-600 transition">How it works?</a>
        <a href="#contact" className="hover:text-teal-600 transition">Contact</a>
      </div>
      <div className="hidden lg:flex items-center space-x-4">
        <Link
          to="/login"
          className="px-6 py-2 rounded-full text-teal-600 hover:bg-teal-50 font-semibold"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="px-6 py-2 rounded-full text-white bg-teal-500 hover:bg-teal-600 font-semibold"
        >
          Sign Up
        </Link>
      </div>
      <div className="lg:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center space-y-8 lg:hidden">
          <a onClick={() => setIsMobileMenuOpen(false)} href="#features" className="text-2xl font-semibold">Features</a>
          {/* UPDATED: Changed href from "#pricing" to "#how-it-works" and text from "Pricing" */}
          <a onClick={() => setIsMobileMenuOpen(false)} href="#how-it-works" className="text-2xl font-semibold">How it works?</a>
          <a onClick={() => setIsMobileMenuOpen(false)} href="#contact" className="text-2xl font-semibold">Contact</a>
          <div className="flex flex-col space-y-4 pt-8 w-64">
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center px-6 py-3 rounded-full text-teal-600 border border-teal-600 font-semibold"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center px-6 py-3 rounded-full text-white bg-teal-500 hover:bg-teal-600 font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}