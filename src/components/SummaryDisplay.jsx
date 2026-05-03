// src/components/SummaryDisplay.jsx
import { AlertCircle, Activity, Stethoscope, FileText, ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Parser ────────────────────────────────────────────────────────────────

function parseSummaryText(text) {
  if (!text) return null;

  const result = { vitals: [], xray: null, summary: [], doctorNote: "", raw: text };

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l);
  let section = null;
  let summaryLines = [];
  let doctorLines = [];
  let xrayBuf = {};

  for (const line of lines) {
    if (/^vitals and lab data:?\s*$/i.test(line)) { section = "vitals"; continue; }
    if (/^x-?ray findings:?\s*$/i.test(line))     { section = "xray";   continue; }
    if (/^summary$/i.test(line))             { section = "summary"; continue; }
    if (/^doctor'?s? note$/i.test(line))     { section = "doctor";  continue; }

    if (section === "vitals") {
      // Supports BOTH formats:
      //   "Term (definition): value -> Status"   ← with definition
      //   "Term: value -> Status"                 ← WITHOUT definition (e.g. Vitamin D)
      const withDef    = line.match(/^(.+?)\s*\((.+?)\)\s*:\s*(.+?)\s*->\s*(.+)$/);
      const withoutDef = line.match(/^(.+?)\s*:\s*(.+?)\s*->\s*(.+)$/);

      if (withDef) {
        result.vitals.push({
          name:       withDef[1].trim(),
          definition: withDef[2].trim(),
          value:      withDef[3].trim(),
          status:     withDef[4].trim(),
        });
      } else if (withoutDef) {
        result.vitals.push({
          name:       withoutDef[1].trim(),
          definition: "",
          value:      withoutDef[2].trim(),
          status:     withoutDef[3].trim(),
        });
      }
    } else if (section === "xray") {
      const cond = line.match(/^Condition:\s*(.+)$/i);
      const loc  = line.match(/^Location:\s*(.+)$/i);
      const mean = line.match(/^Meaning:\s*(.+)$/i);
      if (cond) xrayBuf.condition = cond[1];
      if (loc)  xrayBuf.location  = loc[1];
      if (mean) xrayBuf.meaning   = mean[1];
    } else if (section === "summary") {
      summaryLines.push(line);
    } else if (section === "doctor") {
      doctorLines.push(line);
    }
  }

  if (xrayBuf.condition) result.xray = xrayBuf;

  // Split summary paragraphs into individual sentences for bullet rendering.
  // Skips abbreviations like Dr., Mr., Ms., St., vs., etc. to avoid false splits.
  const ABBREVS = /\b(Dr|Mr|Mrs|Ms|Prof|St|vs|etc|approx|dept|corp|Inc|Ltd|No|Fig|Ref|Vol)\./gi;
  const PLACEHOLDER = "\x00";
  // Discourse markers that start a new "thought"
  const DISCOURSE = /\s+(?=(?:Additionally|However|Furthermore|Moreover|In addition|On the other hand|Notably|Importantly|Overall|In summary|It is important|The patient|This suggests|These findings|As a result|Therefore|In conclusion)[,\s])/g;

  const bullets = [];
  for (const para of summaryLines) {
    // Temporarily mask abbreviation dots so the splitter ignores them
    const masked = para.replace(ABBREVS, (m) => m.slice(0, -1) + PLACEHOLDER);

    // Split on spaces that look like sentence boundaries (followed by Uppercase/Quotes)
    let sentences = masked
      .split(/\s+(?=[A-Z"'])|\s*;\s*/)
      .map((s) => s.replace(new RegExp(PLACEHOLDER, "g"), ".").trim())
      .filter((s) => s.length > 8);

    // Further split on discourse markers within any remaining long sentence
    const expanded = [];
    for (const s of sentences) {
      const parts = s.split(DISCOURSE).map((p) => p.trim()).filter((p) => p.length > 8);
      expanded.push(...parts);
    }
    bullets.push(...expanded);
  }
  result.summary    = bullets;
  result.doctorNote = doctorLines.join(" ");
  return result;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

// 4-tier severity palette:
//  tier-0  green   = Normal
//  tier-1  yellow  = Slightly High / Slightly Low   (borderline — gentle nudge)
//  tier-2  orange  = High / Low / Deficient          (notable — pay attention)
//  tier-3  red     = Very High / Very Low / Critical (concerning — take action)

const STATUS = {
  normal:       { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400", badge: "bg-emerald-100", Icon: ShieldCheck  },
  slightlyHigh: { bg: "bg-yellow-50",   border: "border-yellow-200",  text: "text-yellow-700",  dot: "bg-yellow-400", badge: "bg-yellow-100",  Icon: TrendingUp   },
  high:         { bg: "bg-orange-50",   border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-400", badge: "bg-orange-100",  Icon: TrendingUp   },
  veryHigh:     { bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500",    badge: "bg-red-100",    Icon: TrendingUp   },
  slightlyLow:  { bg: "bg-yellow-50",   border: "border-yellow-200",  text: "text-yellow-700",  dot: "bg-yellow-400", badge: "bg-yellow-100",  Icon: TrendingDown },
  low:          { bg: "bg-orange-50",   border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-400", badge: "bg-orange-100",  Icon: TrendingDown },
  veryLow:      { bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500",    badge: "bg-red-100",    Icon: TrendingDown },
  deficient:    { bg: "bg-orange-50",   border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-400", badge: "bg-orange-100",  Icon: TrendingDown },
  critical:     { bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",     dot: "bg-red-600",    badge: "bg-red-100",    Icon: TrendingUp   },
  default:      { bg: "bg-gray-50",     border: "border-gray-200",    text: "text-gray-600",    dot: "bg-gray-400",   badge: "bg-gray-100",   Icon: Minus        },
};

function getStatus(statusStr) {
  const s = (statusStr || "").toLowerCase().trim();
  if (s === "normal")                                    return STATUS.normal;
  if (s === "slightly high" || s === "borderline high")  return STATUS.slightlyHigh;
  if (s === "high")                                      return STATUS.high;
  if (s === "very high" || s === "elevated")             return STATUS.veryHigh;
  if (s === "critical")                                  return STATUS.critical;
  if (s === "slightly low" || s === "borderline low")    return STATUS.slightlyLow;
  if (s === "low")                                       return STATUS.low;
  if (s === "very low")                                  return STATUS.veryLow;
  if (s === "deficient")                                 return STATUS.deficient;
  // Fuzzy fallbacks for unexpected wording
  if (s.includes("critical"))                            return STATUS.critical;
  if (s.includes("very high") || s.includes("severely")) return STATUS.veryHigh;
  if (s.includes("slightly high") || s.includes("borderline")) return STATUS.slightlyHigh;
  if (s.includes("high") || s.includes("elevated") || s.includes("above")) return STATUS.high;
  if (s.includes("very low") || s.includes("severely low")) return STATUS.veryLow;
  if (s.includes("deficient"))                           return STATUS.deficient;
  if (s.includes("slightly low"))                        return STATUS.slightlyLow;
  if (s.includes("low") || s.includes("below"))         return STATUS.low;
  if (s.includes("normal"))                              return STATUS.normal;
  return STATUS.default;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function VitalCard({ vital, index }) {
  const cfg = getStatus(vital.status);

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-2`}
      style={{ animation: `fadeSlideUp 0.4s ease both`, animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{vital.name}</p>
          {vital.definition && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{vital.definition}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {vital.status}
        </span>
      </div>
      <p className={`text-base font-bold ${cfg.text}`}>{vital.value}</p>
    </div>
  );
}

function XRayCard({ xray, gradcamImg }) {
  const isNormal = xray.condition?.toLowerCase() === "normal";
  return (
    <div
      className={`rounded-2xl border p-5 flex gap-4 items-start ${isNormal ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
      style={{ animation: "fadeSlideUp 0.5s ease both", animationDelay: "100ms" }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isNormal ? "bg-emerald-100" : "bg-red-100"}`}>
        <Stethoscope size={20} className={isNormal ? "text-emerald-600" : "text-red-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-gray-900">X-Ray Findings</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isNormal ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {xray.condition}
          </span>
        </div>
        {xray.location && xray.location !== "N/A" && (
          <p className="text-xs text-gray-500 mb-1">Location: {xray.location}</p>
        )}
        {xray.meaning && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{xray.meaning}</p>
        )}
        {gradcamImg && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
             <img src={`data:image/jpeg;base64,${gradcamImg}`} alt="Grad-CAM Heatmap" className="w-full object-cover max-h-[300px]" />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStats({ vitals }) {
  const total    = vitals.length;
  const abnormal = vitals.filter((v) => {
    const s = getStatus(v.status);
    return s !== STATUS.normal && s !== STATUS.default;
  }).length;
  const critical = vitals.filter((v) => {
    const s = getStatus(v.status);
    return s === STATUS.veryHigh || s === STATUS.veryLow || s === STATUS.critical;
  }).length;
  const normal = total - abnormal;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      {[
        { label: "Parameters",      value: total,    color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200" },
        { label: "Normal",          value: normal,   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
        { label: "Needs Attention", value: abnormal, color: critical > 0 ? "text-red-700" : "text-orange-700", bg: critical > 0 ? "bg-red-50" : "bg-orange-50", border: critical > 0 ? "border-red-200" : "border-orange-200" },
      ].map(({ label, value, color, bg, border }) => (
        <div key={label} className={`rounded-xl border ${border} ${bg} py-3 px-4 text-center`}>
          <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SummaryDisplay({ summary, gradcamImg }) {
  const parsed = parseSummaryText(summary);

  const hasStructure = parsed && (parsed.vitals.length > 0 || parsed.xray || parsed.summary.length > 0);

  if (!hasStructure) {
    return (
      <div className="p-8 lg:p-10 h-full overflow-y-auto" style={{ animation: "fadeSlideUp 0.5s ease both" }}>
        <div className="flex items-center gap-2 mb-6">
          <FileText size={18} className="text-teal-500" />
          <h3 className="text-base font-bold text-gray-900">Report Summary</h3>
        </div>
        <p className="text-gray-700 text-sm leading-8 whitespace-pre-wrap">{summary}</p>
        
        {gradcamImg && (
          <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
             <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
               <h4 className="font-bold text-gray-900 text-sm">Grad-CAM Heatmap</h4>
             </div>
             <img src={`data:image/jpeg;base64,${gradcamImg}`} alt="Grad-CAM Heatmap" className="w-full object-cover max-h-[400px]" />
          </div>
        )}
        
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto space-y-6">

      {/* Stats Row */}
      {parsed.vitals.length > 0 && <SummaryStats vitals={parsed.vitals} />}

      {/* Vitals Grid */}
      {parsed.vitals.length > 0 && (() => {
        const COLLAPSED_LIMIT = 6;
        const isLong = parsed.vitals.length > COLLAPSED_LIMIT;
        const hidden = parsed.vitals.length - COLLAPSED_LIMIT;
        return (
          <section style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "50ms" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-teal-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Vitals &amp; Lab Results</h3>
              </div>
              {isLong && (
                <span className="text-xs text-teal-600 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {parsed.vitals.length} parameters · scroll to see all
                </span>
              )}
            </div>
            {/* Scrollable container — activates only when vitals > 6 */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isLong ? "overflow-y-auto pr-1" : ""}`}
              style={isLong ? { maxHeight: "370px" } : {}}
            >
              {parsed.vitals.map((v, i) => (
                <VitalCard key={i} vital={v} index={i} />
              ))}
            </div>
            {/* Gradient fade hint at the bottom when scrollable */}
            {isLong && (
              <div className="relative -mt-8 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-xl" />
            )}
          </section>
        );
      })()}

      {/* X-Ray Section */}
      {parsed.xray && (
        <section style={{ animation: "fadeSlideUp 0.5s ease both", animationDelay: "150ms" }}>
          <XRayCard xray={parsed.xray} gradcamImg={gradcamImg} />
        </section>
      )}

      {/* Summary — Bullet Points */}
      {parsed.summary.length > 0 && (
        <section
          className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-6"
          style={{ animation: "fadeSlideUp 0.55s ease both", animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-teal-600" />
            <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider">Summary</h3>
          </div>
          <ul className="space-y-3">
            {parsed.summary.map((sentence, i) => (
              <li
                key={i}
                className="flex items-start gap-3"
                style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: `${220 + i * 50}ms` }}
              >
                <span className="mt-2 w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                <span className="text-gray-700 text-sm leading-7">{sentence}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Doctor's Note */}
      {parsed.doctorNote && (
        <section
          className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4"
          style={{ animation: "fadeSlideUp 0.6s ease both", animationDelay: "250ms" }}
        >
          <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 italic leading-relaxed">{parsed.doctorNote}</p>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 pt-4 border-t border-gray-100 mt-4">
      <AlertCircle size={14} className="text-gray-300 mt-0.5 shrink-0" />
      <p className="text-xs text-gray-400 italic leading-relaxed">
        This summary is generated by AI for informational purposes only. Always consult a qualified healthcare professional for medical advice.
      </p>
    </div>
  );
}
