import type { ActiveFilters } from "../types";

interface FilterBarProps {
  filters: ActiveFilters;
  options: {
    department: string[];
    gender: string[];
    jobRole: string[];
  };
  onChange: (patch: Partial<ActiveFilters>) => void;
  onClearAll: () => void;
}

const LABELS: Record<keyof ActiveFilters, string> = {
  department: "Department",
  gender: "Gender",
  jobRole: "Job Role",
  education: "Education",
};

export default function FilterBar({ filters, options, onChange, onClearAll }: FilterBarProps) {
  const activeEntries = (Object.entries(filters) as [keyof ActiveFilters, string | null][]).filter(
    ([, v]) => v !== null
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Department"
          value={filters.department}
          options={options.department}
          onChange={(v) => onChange({ department: v })}
        />
        <Select
          label="Gender"
          value={filters.gender}
          options={options.gender}
          onChange={(v) => onChange({ gender: v })}
        />
        <Select
          label="Job Role"
          value={filters.jobRole}
          options={options.jobRole}
          onChange={(v) => onChange({ jobRole: v })}
        />
      </div>
      {activeEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            Active filters:
          </span>
          {activeEntries.map(([key, value]) => (
            <button
              key={key}
              onClick={() => onChange({ [key]: null })}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--stayed)",
                color: "var(--stayed)",
                background: "color-mix(in srgb, var(--stayed) 12%, transparent)",
              }}
            >
              {LABELS[key]}: {value}
              <span aria-hidden>×</span>
            </button>
          ))}
          <button
            onClick={onClearAll}
            className="text-xs underline"
            style={{ color: "var(--text-faint)" }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      className="rounded-lg border px-3 py-1.5 text-sm"
      style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
      aria-label={`Filter by ${label}`}
    >
      <option value="">All {label}s</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
