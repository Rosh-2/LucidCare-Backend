import { useState } from "react";
import { Upload } from "lucide-react";

export default function ReportUploader({ onFileSelect, label, accept, icon: Icon, multiple = false }) {
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    
    // Pass either the array of files (if multiple) or just the first file
    onFileSelect(multiple ? selectedFiles : selectedFiles[0]);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-teal-500" />}
        {label}
      </h3>

      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      />

      {files.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-semibold">Selected: </span>
          {files.map(f => f.name).join(", ")}
        </div>
      )}
    </div>
  );
}
