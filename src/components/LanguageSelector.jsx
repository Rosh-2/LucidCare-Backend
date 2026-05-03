export default function LanguageSelector({ language, onLanguageChange }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Output Language
      </h3>

      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      >
        <option value="en">English</option>
        <option value="ml">Malayalam</option>
      </select>
    </div>
  );
}
