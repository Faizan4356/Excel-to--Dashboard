import { GENERIC_FIELD_DEFS } from "../utils/fields";
import { isCleanSummaryEmpty } from "../utils/clean";
import type { Aggregation, CleaningSummary, GenericColumnMapping } from "../types";

interface GenericMappingStageProps {
  headers: string[];
  mapping: GenericColumnMapping;
  onChange: (field: string, header: string | null) => void;
  aggregation: Aggregation;
  onAggregationChange: (agg: Aggregation) => void;
  cleaningSummary: CleaningSummary;
  rowCount: number;
  sheetNames: string[];
  activeSheet: string;
  onSheetChange: (sheet: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
}

export default function GenericMappingStage({
  headers,
  mapping,
  onChange,
  aggregation,
  onAggregationChange,
  cleaningSummary,
  rowCount,
  sheetNames,
  activeSheet,
  onSheetChange,
  onContinue,
  onBack,
  canContinue,
}: GenericMappingStageProps) {
  const cleanParts: string[] = [];
  if (cleaningSummary.cellsTrimmed > 0)
    cleanParts.push(`Trimmed whitespace in ${cleaningSummary.cellsTrimmed} cell${cleaningSummary.cellsTrimmed === 1 ? "" : "s"}`);
  if (cleaningSummary.blanksNormalized > 0)
    cleanParts.push(`Normalized ${cleaningSummary.blanksNormalized} placeholder blank${cleaningSummary.blanksNormalized === 1 ? "" : "s"}`);
  if (cleaningSummary.duplicateRowsRemoved > 0)
    cleanParts.push(`Removed ${cleaningSummary.duplicateRowsRemoved} duplicate row${cleaningSummary.duplicateRowsRemoved === 1 ? "" : "s"}`);
  if (cleaningSummary.emptyRowsRemoved > 0)
    cleanParts.push(`Removed ${cleaningSummary.emptyRowsRemoved} empty row${cleaningSummary.emptyRowsRemoved === 1 ? "" : "s"}`);

  return (
    <div className="flex-1 py-10 px-4 max-w-3xl mx-auto w-full animate-fade-in">
      <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
        Map your columns
      </h2>
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        No attrition-style column detected, so we switched to general-purpose mode: group any
        spreadsheet by Category and Product ({rowCount} rows found).
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Only Category is required — leave Product, Measure, or Date as "— none —" to skip a chart.
      </p>

      {sheetNames.length > 1 && (
        <div className="mb-6 rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <label className="text-xs font-medium block mb-2" style={{ color: "var(--text-muted)" }}>
            This workbook has multiple sheets — choose which one to use:
          </label>
          <select
            value={activeSheet}
            onChange={(e) => onSheetChange(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm w-full sm:w-64"
            style={{ background: "var(--panel-alt)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className="mb-6 rounded-xl border p-4"
        style={{
          background: "color-mix(in srgb, var(--stayed) 6%, var(--panel))",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: "var(--stayed)" }} aria-hidden>
            ✓
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Data cleaned
          </span>
        </div>
        {isCleanSummaryEmpty(cleaningSummary) ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Your data was already clean — no fixes were needed.
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {cleanParts.join(" · ")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {GENERIC_FIELD_DEFS.map((field) => (
          <div
            key={field.key}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border p-3"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            <div className="sm:w-56 shrink-0">
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {field.label}
              </span>
              {field.required && (
                <span className="ml-1.5 text-xs" style={{ color: "var(--left)" }}>
                  required
                </span>
              )}
            </div>
            <select
              value={mapping[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value === "" ? null : e.target.value)}
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
              style={{ background: "var(--panel-alt)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {!field.required && <option value="">— none —</option>}
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border p-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="sm:w-56 shrink-0">
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              How to combine values per group
            </span>
          </div>
          <select
            value={aggregation}
            onChange={(e) => onAggregationChange(e.target.value as Aggregation)}
            disabled={!mapping.measure}
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ background: "var(--panel-alt)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="sum">Sum of Measure</option>
            <option value="avg">Average of Measure</option>
            <option value="count">Row Count</option>
          </select>
        </div>
        {!mapping.measure && (
          <p className="text-xs px-1" style={{ color: "var(--text-faint)" }}>
            No Measure column mapped — charts will show row counts per group.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--panel)" }}
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--stayed)", color: "#04211d" }}
        >
          Build dashboard →
        </button>
      </div>
      {!canContinue && (
        <p className="text-xs mt-2 text-right" style={{ color: "var(--left)" }}>
          Map the Category field to continue.
        </p>
      )}
    </div>
  );
}
