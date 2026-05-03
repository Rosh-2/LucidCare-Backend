export default function SummaryGenerator({ onGenerate, loading }) {
  return (
    <button
      onClick={onGenerate}
      disabled={loading}
      className={`
        w-full rounded-lg py-3 text-sm font-semibold text-white
        bg-gradient-to-r from-blue-500 to-teal-500
        transition
        ${loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
      `}
    >
      {loading ? "Generating…" : "Generate Summary"}
    </button>
  );
}
