import { useMemo, useState } from "react";
import type { Aggregation, GenericActiveFilters, GenericCleanedRow, GenericColumnMapping } from "../types";
import {
  applyGenericFilters,
  breakdownByCategoryGeneric,
  breakdownByProductGeneric,
  computeGenericKpis,
  generateGenericInsights,
  genericTrendByMonth,
} from "../utils/compute";
import { getPalette } from "../utils/colors";
import { downloadCsv } from "../utils/csv";
import KpiCard from "./KpiCard";
import InsightsPanel from "./InsightsPanel";
import {
  ChartPanel,
  GenericBarChart,
  GenericPieChart,
  GenericTrendChart,
} from "./ChartPanel";

interface GenericDashboardProps {
  rows: GenericCleanedRow[];
  mapping: GenericColumnMapping;
  aggregation: Aggregation;
  colorBlindSafe: boolean;
  onStartOver: () => void;
}

const EMPTY_FILTERS: GenericActiveFilters = { category: null, product: null };

export default function GenericDashboard({
  rows,
  mapping,
  aggregation,
  colorBlindSafe,
  onStartOver,
}: GenericDashboardProps) {
  const [filters, setFilters] = useState<GenericActiveFilters>(EMPTY_FILTERS);
  const palette = getPalette(colorBlindSafe);
  const hasMeasure = !!mapping.measure;
  const measureLabel = hasMeasure ? (aggregation === "avg" ? "Average" : "Total") : "Row Count";

  const filtered = useMemo(() => applyGenericFilters(rows, filters), [rows, filters]);
  const kpis = useMemo(() => computeGenericKpis(filtered, hasMeasure), [filtered, hasMeasure]);
  const insights = useMemo(
    () => generateGenericInsights(filtered, aggregation, !!mapping.product),
    [filtered, aggregation, mapping.product]
  );

  const categoryBuckets = useMemo(
    () => breakdownByCategoryGeneric(filtered, aggregation),
    [filtered, aggregation]
  );
  const productBuckets = useMemo(
    () => (mapping.product ? breakdownByProductGeneric(filtered, aggregation, 10) : []),
    [filtered, aggregation, mapping.product]
  );
  const trend = useMemo(
    () => (mapping.date ? genericTrendByMonth(filtered, aggregation) : []),
    [filtered, aggregation, mapping.date]
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter((v): v is string => !!v))).sort(),
    [rows]
  );
  const productOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.product).filter((v): v is string => !!v))).sort(),
    [rows]
  );

  function toggleFilter(key: keyof GenericActiveFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  }

  function handleExport() {
    downloadCsv("sheet-to-dashboard-export.csv", filtered.map((r) => r.raw));
  }

  const activeEntries = (Object.entries(filters) as [keyof GenericActiveFilters, string | null][]).filter(
    ([, v]) => v !== null
  );

  return (
    <div className="flex-1 py-6 px-4 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categoryOptions.length > 0 && (
              <select
                value={filters.category ?? ""}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value || null }))}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                aria-label="Filter by Category"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {productOptions.length > 0 && (
              <select
                value={filters.product ?? ""}
                onChange={(e) => setFilters((p) => ({ ...p, product: e.target.value || null }))}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                aria-label="Filter by Product"
              >
                <option value="">All Products</option>
                {productOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
          {activeEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                Active filters:
              </span>
              {activeEntries.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setFilters((p) => ({ ...p, [key]: null }))}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium hover:opacity-80"
                  style={{
                    borderColor: "var(--stayed)",
                    color: "var(--stayed)",
                    background: "color-mix(in srgb, var(--stayed) 12%, transparent)",
                  }}
                >
                  {key === "category" ? "Category" : "Product"}: {value}
                  <span aria-hidden>×</span>
                </button>
              ))}
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs underline"
                style={{ color: "var(--text-faint)" }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--stayed)", color: "var(--stayed)", background: "color-mix(in srgb, var(--stayed) 10%, transparent)" }}
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={onStartOver}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--panel)" }}
          >
            Start over
          </button>
        </div>
      </div>

      <InsightsPanel insights={insights} />

      <div className="mt-5 flex gap-3 overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible pb-1">
        <KpiCard label="Total Rows" value={kpis.totalRows} icon="📄" accent="var(--violet)" />
        {hasMeasure && (
          <KpiCard
            label={aggregation === "avg" ? "Average" : "Total"}
            value={aggregation === "avg" ? kpis.avgMeasure : kpis.totalMeasure}
            icon="Σ"
            accent="var(--stayed)"
            decimals={aggregation === "avg" ? 1 : 0}
            featured
          />
        )}
        <KpiCard label="Categories" value={kpis.uniqueCategories} icon="🏷" accent="var(--gold)" />
        {mapping.product && <KpiCard label="Products" value={kpis.uniqueProducts} icon="📦" accent="var(--violet)" />}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <ChartPanel title={`${measureLabel} by Category`} icon="🏷" featured>
          <GenericBarChart
            buckets={categoryBuckets}
            color={palette.stayed}
            valueLabel={measureLabel}
            onClickLabel={(label) => toggleFilter("category", label)}
            activeLabel={filters.category}
          />
        </ChartPanel>

        <ChartPanel title="Category Share" icon="◐">
          <GenericPieChart
            buckets={categoryBuckets}
            palette={palette.series}
            onClickLabel={(label) => toggleFilter("category", label)}
            activeLabel={filters.category}
          />
        </ChartPanel>

        {mapping.product ? (
          <ChartPanel title={`Top Products by ${measureLabel}`} icon="📦" featured>
            <GenericBarChart
              buckets={productBuckets}
              color={palette.gold}
              valueLabel={measureLabel}
              onClickLabel={(label) => toggleFilter("product", label)}
              activeLabel={filters.product}
              horizontal
            />
          </ChartPanel>
        ) : (
          <ChartPanel title="Top Products" icon="📦" empty featured>
            <div />
          </ChartPanel>
        )}

        {mapping.date && trend.length > 1 && (
          <ChartPanel title={`${measureLabel} Over Time`} icon="📈" featured>
            <GenericTrendChart points={trend} color={palette.violet} valueLabel={measureLabel} />
          </ChartPanel>
        )}
      </div>
    </div>
  );
}
