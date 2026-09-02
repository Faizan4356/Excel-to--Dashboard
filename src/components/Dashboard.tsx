import { useMemo, useState } from "react";
import type { ActiveFilters, CleanedRow, ColumnMapping } from "../types";
import {
  applyFilters,
  breakdownBy,
  breakdownByAgeGroup,
  breakdownByMonth,
  breakdownBySalarySlab,
  breakdownByTenureBucket,
  computeKpis,
  computeRiskRows,
  generateInsights,
} from "../utils/compute";
import { getPalette } from "../utils/colors";
import { downloadCsv } from "../utils/csv";
import KpiCard from "./KpiCard";
import FilterBar from "./FilterBar";
import InsightsPanel from "./InsightsPanel";
import RiskTable from "./RiskTable";
import {
  AttritionBarChart,
  ChartPanel,
  GenderDonutChart,
  RetentionDonut,
  TrendLineChart,
} from "./ChartPanel";

interface DashboardProps {
  rows: CleanedRow[];
  mapping: ColumnMapping;
  colorBlindSafe: boolean;
  onStartOver: () => void;
}

const EMPTY_FILTERS: ActiveFilters = {
  department: null,
  gender: null,
  jobRole: null,
  education: null,
};

export default function Dashboard({ rows, mapping, colorBlindSafe, onStartOver }: DashboardProps) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const palette = getPalette(colorBlindSafe);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const insights = useMemo(() => generateInsights(filtered), [filtered]);

  const deptBreakdown = useMemo(() => breakdownBy(filtered, (r) => r.department), [filtered]);
  const roleBreakdown = useMemo(() => breakdownBy(filtered, (r) => r.jobRole), [filtered]);
  const eduBreakdown = useMemo(() => breakdownBy(filtered, (r) => r.education), [filtered]);
  const genderBreakdown = useMemo(() => breakdownBy(filtered, (r) => r.gender), [filtered]);
  const ageBreakdown = useMemo(() => breakdownByAgeGroup(filtered), [filtered]);
  const salaryBreakdown = useMemo(() => breakdownBySalarySlab(filtered), [filtered]);
  const tenureBreakdown = useMemo(() => breakdownByTenureBucket(filtered), [filtered]);
  const trend = useMemo(() => (mapping.date ? breakdownByMonth(filtered) : []), [filtered, mapping.date]);

  const riskRows = useMemo(() => computeRiskRows(filtered, mapping), [filtered, mapping]);

  const mappedCount = useMemo(
    () => [mapping.department, mapping.jobRole, mapping.gender, mapping.education, mapping.age, mapping.income, mapping.tenure].filter(Boolean).length,
    [mapping]
  );

  const filterOptions = useMemo(
    () => ({
      department: Array.from(new Set(rows.map((r) => r.department).filter((v): v is string => !!v))).sort(),
      gender: Array.from(new Set(rows.map((r) => r.gender).filter((v): v is string => !!v))).sort(),
      jobRole: Array.from(new Set(rows.map((r) => r.jobRole).filter((v): v is string => !!v))).sort(),
    }),
    [rows]
  );

  function toggleFilter(key: keyof ActiveFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  }

  function handleExport() {
    const exportRows = riskRows.map((r) => ({
      ...r.raw,
      RiskScore: r.score,
      RiskLevel: r.level,
    }));
    downloadCsv("sheet-to-dashboard-export.csv", exportRows);
  }

  return (
    <div className="flex-1 py-6 px-4 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <FilterBar
          filters={filters}
          options={filterOptions}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onClearAll={() => setFilters(EMPTY_FILTERS)}
        />
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

      <div className="mt-5 flex gap-3 overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible pb-1">
        <KpiCard label="Total Employees" value={kpis.total} icon="👥" accent="var(--violet)" />
        <KpiCard label="Total Attrition" value={kpis.attritionCount} icon="🚪" accent="var(--left)" />
        <KpiCard
          label="Attrition Rate"
          value={kpis.attritionRate}
          icon="📉"
          accent="var(--left)"
          suffix="%"
          decimals={1}
          featured
        />
        {mapping.age && <KpiCard label="Average Age" value={kpis.avgAge} icon="🎂" accent="var(--gold)" decimals={1} />}
        {mapping.income && (
          <KpiCard label="Average Income" value={kpis.avgIncome} icon="💰" accent="var(--stayed)" prefix="$" decimals={0} />
        )}
        {mapping.tenure && (
          <KpiCard label="Average Tenure" value={kpis.avgTenure} icon="⏳" accent="var(--violet)" suffix=" yrs" decimals={1} />
        )}
      </div>

      {mappedCount === 0 && (
        <div
          className="mt-6 rounded-xl border p-6 text-center text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)", background: "var(--panel)" }}
        >
          Map at least one breakdown column (Department, Job Role, Gender, Education, Age, Income, or
          Tenure) on the mapping screen to unlock breakdown charts.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartPanel title="Overall Retention" icon="◐">
          <RetentionDonut
            stayed={kpis.total - kpis.attritionCount}
            left={kpis.attritionCount}
            stayedColor={palette.stayed}
            leftColor={palette.left}
          />
        </ChartPanel>

        {mapping.department && (
          <ChartPanel title="Attrition by Department" icon="🏢" featured>
            <AttritionBarChart
              buckets={deptBreakdown}
              stayedColor={palette.stayed}
              leftColor={palette.left}
              onClickLabel={(label) => toggleFilter("department", label)}
              activeLabel={filters.department}
            />
          </ChartPanel>
        )}

        {mapping.jobRole && (
          <ChartPanel title="Attrition by Job Role" icon="💼" featured>
            <AttritionBarChart
              buckets={roleBreakdown}
              stayedColor={palette.stayed}
              leftColor={palette.left}
              onClickLabel={(label) => toggleFilter("jobRole", label)}
              activeLabel={filters.jobRole}
              horizontal
            />
          </ChartPanel>
        )}

        {mapping.age && (
          <ChartPanel title="Attrition by Age Group" icon="🎂">
            <AttritionBarChart buckets={ageBreakdown} stayedColor={palette.stayed} leftColor={palette.left} />
          </ChartPanel>
        )}

        {mapping.income && (
          <ChartPanel title="Attrition by Salary Slab" icon="💰">
            <AttritionBarChart buckets={salaryBreakdown} stayedColor={palette.stayed} leftColor={palette.left} />
          </ChartPanel>
        )}

        {mapping.education && (
          <ChartPanel title="Attrition by Education" icon="🎓">
            <AttritionBarChart
              buckets={eduBreakdown}
              stayedColor={palette.stayed}
              leftColor={palette.left}
              onClickLabel={(label) => toggleFilter("education", label)}
              activeLabel={filters.education}
            />
          </ChartPanel>
        )}

        {mapping.tenure && (
          <ChartPanel title="Attrition by Tenure" icon="⏳">
            <AttritionBarChart buckets={tenureBreakdown} stayedColor={palette.stayed} leftColor={palette.left} />
          </ChartPanel>
        )}

        {mapping.gender && (
          <ChartPanel title="Attrition by Gender" icon="⚧">
            <GenderDonutChart
              buckets={genderBreakdown}
              palette={palette.series}
              onClickLabel={(label) => toggleFilter("gender", label)}
              activeLabel={filters.gender}
            />
          </ChartPanel>
        )}

        {mapping.date && trend.length > 1 && (
          <ChartPanel title="Attrition Rate Over Time" icon="📈" featured>
            <TrendLineChart points={trend} color={palette.left} />
          </ChartPanel>
        )}
      </div>

      <div className="mt-6">
        <RiskTable rows={riskRows} />
      </div>
    </div>
  );
}
