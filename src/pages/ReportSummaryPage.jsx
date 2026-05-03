// src/pages/ReportSummaryPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkle,
  Menu,
  LogOut,
  User,
  CheckCircle2,
  FileText,
  AlertCircle,
  Upload,
  GitCompare,
  History,
} from "lucide-react";

import ReportUploader from "../components/ReportUploader";
import LanguageSelector from "../components/LanguageSelector";
import SummaryGenerator from "../components/SummaryGenerator";
import SummaryHistorySidebar from "../components/SummaryHistorySidebar";
import ComparativeAnalysisPanel from "../components/ComparativeAnalysisPanel";

export default function ReportSummaryPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [language, setLanguage] = useState("en");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Comparative analysis state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSummaries, setSelectedSummaries] = useState([]);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleGenerate = async () => {
    if (!pdfFile) {
      return alert("Please upload a Medical Report (PDF).");
    }
    setLoading(true);

    const formData = new FormData();
    if (pdfFile) formData.append("pdf", pdfFile);
    formData.append("language", language);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          token: localStorage.getItem("token"),
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
      } else {
        alert(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  function handleCompare(summaries) {
    setSelectedSummaries(summaries);
    setCompareMode(true);
  }

  function handleCloseCompare() {
    setCompareMode(false);
    setSelectedSummaries([]);
  }

  return (
    <div className="bg-gray-50 min-h-[100svh] font-inter text-gray-800">
      {/* Sidebar */}
      <SummaryHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCompare={handleCompare}
      />

      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-6 sm:px-8 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Hamburger — opens history sidebar */}
          <button
            id="history-sidebar-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-teal-600 relative"
            aria-label="Open summary history"
          >
            <Menu size={22} />
            {/* subtle pulse dot to hint there's history */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full ring-2 ring-white" />
          </button>

          <div className="flex items-center space-x-2">
            <Sparkle className="text-teal-500 w-7 h-7" />
            <span className="font-bold text-xl text-gray-900">LucidCare</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Compare mode indicator */}
          {compareMode && (
            <div className="hidden sm:flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <GitCompare size={13} />
              Comparison Active
            </div>
          )}

          {/* History shortcut */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <History size={16} />
            History
          </button>

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition border border-gray-200"
            >
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                <User size={18} />
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">User Account</p>
                  <p className="text-xs text-gray-500">user@example.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-4 sm:p-8 lg:px-12 max-w-7xl mx-auto w-full pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {compareMode && (
            <button
              onClick={handleCloseCompare}
              className="text-sm text-gray-500 hover:text-red-500 transition font-medium flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg hover:border-red-200 hover:bg-red-50"
            >
              ✕ Exit Comparison
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column — Upload */}
          {!compareMode && (
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <CheckCircle2 size={20} className="text-teal-500" /> New Analysis
                </h2>
                <div className="space-y-8">
                  <ReportUploader
                    label="Upload Medical Report (PDF)"
                    accept=".pdf"
                    icon={Upload}
                    onFileSelect={setPdfFile}
                  />
                  <LanguageSelector
                    language={language}
                    onLanguageChange={setLanguage}
                  />
                  <SummaryGenerator
                    loading={loading}
                    onGenerate={handleGenerate}
                  />
                </div>
              </div>

              {/* History hint card */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-full bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-5 text-left shadow-md hover:shadow-lg transition hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition">
                    <GitCompare size={18} className="text-white" />
                  </div>
                  <p className="font-bold text-white text-base">Compare Summaries</p>
                </div>
                <p className="text-teal-100 text-xs leading-relaxed">
                  Open history to select past reports and run an AI-powered
                  comparative analysis to track health trends.
                </p>
              </button>
            </div>
          )}

          {/* Right / Full Column */}
          <div
            className={`flex flex-col min-h-[600px] ${compareMode ? "lg:col-span-12" : "lg:col-span-8"
              }`}
          >
            {/* ── Comparative Analysis Panel ── */}
            {compareMode && selectedSummaries.length >= 2 && (
              <ComparativeAnalysisPanel
                summaries={selectedSummaries}
                onClose={handleCloseCompare}
              />
            )}

            {/* ── Regular Report Summary ── */}
            {!compareMode && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative h-full min-h-[600px]">
                {/* Card Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkle size={18} className="text-teal-500" /> Report Summary
                  </h2>
                  {summary && (
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      Ready
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="relative bg-white flex-1">
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
                      <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-4" />
                      <p className="text-gray-600 font-medium animate-pulse">
                        Analyzing documents...
                      </p>
                    </div>
                  )}

                  {!loading && !summary && (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FileText size={40} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Report Generated
                      </h3>
                      <p className="max-w-xs mx-auto text-sm text-gray-500 leading-relaxed">
                        Upload a Medical Report (PDF) on the left to generate a
                        summary, or use{" "}
                        <button
                          onClick={() => setIsSidebarOpen(true)}
                          className="text-teal-600 font-semibold underline underline-offset-2 hover:text-teal-700"
                        >
                          History
                        </button>{" "}
                        to compare past reports.
                      </p>
                    </div>
                  )}

                  {!loading && summary && (
                    <div className="h-full overflow-y-auto p-8 lg:p-10">
                      <div className="text-gray-700 text-base leading-8 whitespace-pre-wrap">
                        {summary}
                      </div>
                      <div className="mt-12 pt-6 border-t border-gray-100 flex items-start gap-3">
                        <AlertCircle size={18} className="text-gray-400 mt-0.5" />
                        <p className="text-xs text-gray-400 italic leading-relaxed">
                          Disclaimer: This summary is generated by AI for
                          informational purposes only. Always consult a qualified
                          healthcare professional for medical advice.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
