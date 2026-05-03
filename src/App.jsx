// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import Signup from "./components/Signup";
import Login from "./components/Login";
import ContactUs from "./components/ContactUs";
import ReportSummaryPage from "./pages/ReportSummaryPage";

// Layout for public pages (includes Navbar)
function PublicLayout() {
  return (
    <div className="bg-white text-gray-800 font-inter min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

// Home Page Component
function Home() {
  return (
    <div className="relative">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
      <Outlet /> 
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (With Navbar) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>
          <Route path="/contact" element={<ContactUs />} />
        </Route>

        {/* Private/Dashboard Route (NO Global Navbar) */}
        <Route path="/dashboard" element={<ReportSummaryPage />} />
      </Routes>
    </Router>
  );
}