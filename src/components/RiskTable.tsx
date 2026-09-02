import { useMemo, useState } from "react";
import type { RiskLevel, RiskRow } from "../types";

const LEVEL_COLOR: Record<RiskLevel, { bg: string; text: string }> = {
  Low: { bg: "color-mix(in srgb, var(--stayed) 18%, transparent)", text: "var(--stayed)" },
  Medium: { bg: "color-mix(in srgb, var(--gold) 22%, transparent)", text: "var(--gold)" },
  High: { bg: "color-mix(in srgb, var(--left) 22%, transparent)", text: "var(--left)" },
};

type SortKey = "score" | "department" | "jobRole" | "tenure" | "income" | "age";

const MAX_VISIBLE = 100;

export default function RiskTable({ rows }: { rows: RiskRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.department, r.jobRole, r.gender, r.level, r.age, r.income, r.tenure, r.score]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (typeof av === "string" || typeof bv === "string") {
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const visible = sorted.slice(0, MAX_VISIBLE);
  const hiddenCount = sorted.length - visible.length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "department", label: "Department" },
    { key: "jobRole", label: "Job Role" },
    { key: "age", label: "Age" },
    { key: "income", label: "Income" },
    { key: "tenure", label: "Tenure" },
    { key: "score", label: "Risk Score" },
  ];

  return (
    <div className="rounded-xl border p-4 shadow-sm" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Attrition Risk Scoring
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            A simple transparent heuristic for exploration — not a validated predictive model.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm w-full sm:w-56"
          style={{ background: "var(--panel-alt)", borderColor: "var(--border)", color: "var(--text)" }}
          aria-label="Search risk table"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {columns.map((col) => (
                <th key={col.key} className="text-left py-2 pr-3">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 font-medium text-xs uppercase tracking-wide"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {col.label}
                    {sortKey === col.key && <span aria-hidden>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
              <th className="text-left py-2 pr-3">
                <span className="font-medium text-xs uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                  Risk Level
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const colors = LEVEL_COLOR[row.level];
              return (
                <tr key={row.index} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{row.department ?? "—"}</td>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{row.jobRole ?? "—"}</td>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{row.age ?? "—"}</td>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>
                    {row.income !== null ? row.income.toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{row.tenure ?? "—"}</td>
                  <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{row.score}</td>
                  <td className="py-2 pr-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {row.level}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
          Showing {visible.length} of {sorted.length} rows — {hiddenCount} more hidden. Refine your search to narrow the list.
        </p>
      )}
    </div>
  );
}
