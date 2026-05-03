import { Sparkle, Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-800 text-gray-300 py-12 px-4 sm:px-8 lg:px-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <Sparkle className="w-8 h-8 text-teal-500" />
            <span className="font-bold text-2xl">LucidCare</span>
          </div>
          <p className="text-sm">
            AI-powered clinical summarization for functional medicine practices.
          </p>
          <div className="flex space-x-4">
            <a href="#" aria-label="LinkedIn" className="hover:text-teal-400 transition-colors"><Linkedin size={24} /></a>
            <a href="#" aria-label="Twitter" className="hover:text-teal-400 transition-colors"><Twitter size={24} /></a>
            <a href="#" aria-label="Facebook" className="hover:text-teal-400 transition-colors"><Facebook size={24} /></a>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-bold text-white mb-2">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <Mail size={16} /><a href="mailto:info@lucidcare.com" className="hover:text-teal-400 transition-colors">info@lucidcare.com</a>
            </li>
            <li className="flex items-center space-x-2">
              <Phone size={16} /><a href="tel:+1234567890" className="hover:text-teal-400 transition-colors">+91 88484 78876</a>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin size={16} className="mt-1" /><span>Muthoot Institute of Technology & Science, Cochin</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t border-gray-700">
        &copy; 2025 LucidCare. All rights reserved.
      </div>
    </footer>
  );
}
