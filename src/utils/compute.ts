import type {
  ActiveFilters,
  Aggregation,
  CleanedRow,
  ColumnMapping,
  GenericActiveFilters,
  GenericCleanedRow,
  RiskLevel,
  RiskRow,
} from "../types";

export function applyFilters(rows: CleanedRow[], filters: ActiveFilters): CleanedRow[] {
  return rows.filter((r) => {
    if (filters.department && r.department !== filters.department) return false;
    if (filters.gender && r.gender !== filters.gender) return false;
    if (filters.jobRole && r.jobRole !== filters.jobRole) return false;
    if (filters.education && r.education !== filters.education) return false;
    return true;
  });
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface Kpis {
  total: number;
  attritionCount: number;
  attritionRate: number | null;
  avgAge: number | null;
  avgIncome: number | null;
  avgTenure: number | null;
}

export function computeKpis(rows: CleanedRow[]): Kpis {
  const total = rows.length;
  const attritionCount = rows.filter((r) => r.attrition).length;
  return {
    total,
    attritionCount,
    attritionRate: total > 0 ? (attritionCount / total) * 100 : null,
    avgAge: mean(rows.map((r) => r.age).filter((v): v is number => v !== null)),
    avgIncome: mean(rows.map((r) => r.income).filter((v): v is number => v !== null)),
    avgTenure: mean(rows.map((r) => r.tenure).filter((v): v is number => v !== null)),
  };
}

export interface BreakdownBucket {
  label: string;
  stayed: number;
  left: number;
  total: number;
  rate: number;
}

export function breakdownBy(
  rows: CleanedRow[],
  getKey: (r: CleanedRow) => string | null
): BreakdownBucket[] {
  const map = new Map<string, { stayed: number; left: number }>();
  for (const row of rows) {
    const key = getKey(row);
    if (key === null) continue;
    const entry = map.get(key) ?? { stayed: 0, left: 0 };
    if (row.attrition) entry.left++;
    else entry.stayed++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([label, { stayed, left }]) => ({
      label,
      stayed,
      left,
      total: stayed + left,
      rate: stayed + left > 0 ? (left / (stayed + left)) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export const AGE_BUCKETS: [string, (age: number) => boolean][] = [
  ["18-25", (a) => a >= 18 && a <= 25],
  ["26-35", (a) => a >= 26 && a <= 35],
  ["36-45", (a) => a >= 36 && a <= 45],
  ["46+", (a) => a >= 46],
];

export const SALARY_BUCKETS: [string, (v: number) => boolean][] = [
  ["0-5K", (v) => v < 5000],
  ["5-10K", (v) => v >= 5000 && v < 10000],
  ["10-15K", (v) => v >= 10000 && v < 15000],
  ["15K+", (v) => v >= 15000],
];

export const TENURE_BUCKETS: [string, (v: number) => boolean][] = [
  ["0-2 yrs", (v) => v >= 0 && v <= 2],
  ["3-5 yrs", (v) => v > 2 && v <= 5],
  ["6-10 yrs", (v) => v > 5 && v <= 10],
  ["10+ yrs", (v) => v > 10],
];

function bucketize(
  rows: CleanedRow[],
  getValue: (r: CleanedRow) => number | null,
  buckets: [string, (v: number) => boolean][]
): BreakdownBucket[] {
  const order = buckets.map(([label]) => label);
  const raw = breakdownBy(rows, (r) => {
    const v = getValue(r);
    if (v === null) return null;
    const bucket = buckets.find(([, test]) => test(v));
    return bucket ? bucket[0] : null;
  });
  return order
    .map((label) => raw.find((b) => b.label === label) ?? { label, stayed: 0, left: 0, total: 0, rate: 0 })
    .filter((b) => b.total > 0);
}

export function breakdownByAgeGroup(rows: CleanedRow[]) {
  return bucketize(rows, (r) => r.age, AGE_BUCKETS);
}
export function breakdownBySalarySlab(rows: CleanedRow[]) {
  return bucketize(rows, (r) => r.income, SALARY_BUCKETS);
}
export function breakdownByTenureBucket(rows: CleanedRow[]) {
  return bucketize(rows, (r) => r.tenure, TENURE_BUCKETS);
}

export interface TrendPoint {
  label: string;
  stayed: number;
  left: number;
  rate: number;
}

export function breakdownByMonth(rows: CleanedRow[]): TrendPoint[] {
  const map = new Map<string, { stayed: number; left: number }>();
  for (const row of rows) {
    if (!row.date) continue;
    const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key) ?? { stayed: 0, left: 0 };
    if (row.attrition) entry.left++;
    else entry.stayed++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, { stayed, left }]) => ({
      label,
      stayed,
      left,
      rate: stayed + left > 0 ? (left / (stayed + left)) * 100 : 0,
    }));
}

export interface Insight {
  text: string;
}

const MIN_GROUP_SIZE = 3;

export function generateInsights(rows: CleanedRow[]): Insight[] {
  const insights: Insight[] = [];
  const overall = computeKpis(rows);
  if (overall.total === 0 || overall.attritionRate === null) return insights;
  const overallRate = overall.attritionRate;

  const categoricalDims: { name: string; getKey: (r: CleanedRow) => string | null }[] = [
    { name: "department", getKey: (r) => r.department },
    { name: "job role", getKey: (r) => r.jobRole },
    { name: "education level", getKey: (r) => r.education },
  ];

  for (const dim of categoricalDims) {
    const buckets = breakdownBy(rows, dim.getKey).filter((b) => b.total >= MIN_GROUP_SIZE);
    if (buckets.length < 2) continue;
    const worst = buckets.reduce((a, b) => (b.rate > a.rate ? b : a));
    if (worst.rate > overallRate * 1.15 && worst.rate > 0) {
      const multiple = overallRate > 0 ? worst.rate / overallRate : 0;
      insights.push({
        text: `${worst.label} has the highest attrition among ${dim.name} groups, at ${worst.rate.toFixed(0)}%${
          multiple > 1.1 ? ` — ${multiple.toFixed(1)}x the overall rate of ${overallRate.toFixed(0)}%` : ""
        }.`,
      });
    }
  }

  const salaryBuckets = breakdownBySalarySlab(rows).filter((b) => b.total >= MIN_GROUP_SIZE);
  if (salaryBuckets.length >= 2) {
    const lowest = salaryBuckets[0];
    const highest = salaryBuckets[salaryBuckets.length - 1];
    if (lowest.rate > 0 && highest.rate > 0 && lowest.rate > highest.rate * 1.3) {
      insights.push({
        text: `Employees earning ${lowest.label} leave at ${(lowest.rate / highest.rate).toFixed(1)}x the rate of employees earning ${highest.label}.`,
      });
    } else if (lowest.rate > overallRate * 1.15) {
      insights.push({
        text: `Employees earning ${lowest.label} leave well above the overall rate (${lowest.rate.toFixed(0)}% vs ${overallRate.toFixed(0)}%).`,
      });
    }
  }

  const tenureBuckets = breakdownByTenureBucket(rows).filter((b) => b.total >= MIN_GROUP_SIZE);
  const earlyTenure = tenureBuckets.find((b) => b.label === "0-2 yrs");
  if (earlyTenure && earlyTenure.rate > overallRate * 1.15) {
    insights.push({
      text: `Employees with 0-2 years of tenure leave well above the overall rate (${earlyTenure.rate.toFixed(0)}% vs ${overallRate.toFixed(0)}%) — early tenure is a strong risk signal here.`,
    });
  }

  const genderBuckets = breakdownBy(rows, (r) => r.gender).filter((b) => b.total >= MIN_GROUP_SIZE);
  if (genderBuckets.length >= 2) {
    const worst = genderBuckets.reduce((a, b) => (b.rate > a.rate ? b : a));
    if (worst.rate > overallRate * 1.15) {
      insights.push({
        text: `${worst.label} employees show a higher attrition rate (${worst.rate.toFixed(0)}%) than the overall average of ${overallRate.toFixed(0)}%.`,
      });
    }
  }

  const ageBuckets = breakdownByAgeGroup(rows).filter((b) => b.total >= MIN_GROUP_SIZE);
  if (ageBuckets.length >= 2) {
    const worst = ageBuckets.reduce((a, b) => (b.rate > a.rate ? b : a));
    if (worst.rate > overallRate * 1.15) {
      insights.push({
        text: `The ${worst.label} age group has the highest attrition rate, at ${worst.rate.toFixed(0)}% vs the ${overallRate.toFixed(0)}% overall average.`,
      });
    }
  }

  insights.push({
    text: `Overall, ${overall.attritionCount} of ${overall.total} employees in the current view have left (${overallRate.toFixed(1)}%).`,
  });

  return insights.slice(0, 5);
}

export function computeRiskRows(rows: CleanedRow[], mapping: ColumnMapping): RiskRow[] {
  const deptRates = new Map(breakdownBy(rows, (r) => r.department).map((b) => [b.label, b.rate]));
  const roleRates = new Map(breakdownBy(rows, (r) => r.jobRole).map((b) => [b.label, b.rate]));
  const overall = computeKpis(rows).attritionRate ?? 0;

  return rows.map((row, index) => {
    let score = 0;
    if (row.tenure !== null) {
      if (row.tenure < 2) score += 2;
      else if (row.tenure <= 5) score += 1;
    }
    if (row.income !== null) {
      if (row.income < 5000) score += 2;
      else if (row.income < 10000) score += 1;
    }
    if (row.department && mapping.department) {
      const rate = deptRates.get(row.department);
      if (rate !== undefined && rate > overall) score += 1;
    }
    if (row.jobRole && mapping.jobRole) {
      const rate = roleRates.get(row.jobRole);
      if (rate !== undefined && rate > overall) score += 1;
    }

    let level: RiskLevel = "Low";
    if (score >= 4) level = "High";
    else if (score >= 2) level = "Medium";

    return {
      index,
      raw: row.raw,
      department: row.department,
      jobRole: row.jobRole,
      gender: row.gender,
      age: row.age,
      income: row.income,
      tenure: row.tenure,
      attrition: row.attrition,
      score,
      level,
    };
  });
}

// --- Generic (non-HR) dataset support ---

export function applyGenericFilters(
  rows: GenericCleanedRow[],
  filters: GenericActiveFilters
): GenericCleanedRow[] {
  return rows.filter((r) => {
    if (filters.category && r.category !== filters.category) return false;
    if (filters.product && r.product !== filters.product) return false;
    return true;
  });
}

function aggregate(values: number[], aggregation: Aggregation, rowCount: number): number {
  if (aggregation === "count") return rowCount;
  if (values.length === 0) return 0;
  if (aggregation === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + b, 0);
}

export interface GenericKpis {
  totalRows: number;
  totalMeasure: number | null;
  avgMeasure: number | null;
  uniqueCategories: number;
  uniqueProducts: number;
}

export function computeGenericKpis(rows: GenericCleanedRow[], hasMeasure: boolean): GenericKpis {
  const measures = rows.map((r) => r.measure).filter((v): v is number => v !== null);
  return {
    totalRows: rows.length,
    totalMeasure: hasMeasure ? measures.reduce((a, b) => a + b, 0) : null,
    avgMeasure: hasMeasure ? mean(measures) : null,
    uniqueCategories: new Set(rows.map((r) => r.category).filter(Boolean)).size,
    uniqueProducts: new Set(rows.map((r) => r.product).filter(Boolean)).size,
  };
}

export interface GenericBucket {
  label: string;
  value: number;
  rowCount: number;
}

function groupGeneric(
  rows: GenericCleanedRow[],
  getKey: (r: GenericCleanedRow) => string | null,
  aggregation: Aggregation
): GenericBucket[] {
  const map = new Map<string, { values: number[]; rowCount: number }>();
  for (const row of rows) {
    const key = getKey(row);
    if (key === null) continue;
    const entry = map.get(key) ?? { values: [], rowCount: 0 };
    if (row.measure !== null) entry.values.push(row.measure);
    entry.rowCount++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([label, { values, rowCount }]) => ({
      label,
      value: aggregate(values, aggregation, rowCount),
      rowCount,
    }))
    .sort((a, b) => b.value - a.value);
}

export function breakdownByCategoryGeneric(
  rows: GenericCleanedRow[],
  aggregation: Aggregation
): GenericBucket[] {
  return groupGeneric(rows, (r) => r.category, aggregation);
}

export function breakdownByProductGeneric(
  rows: GenericCleanedRow[],
  aggregation: Aggregation,
  topN = 10
): GenericBucket[] {
  return groupGeneric(rows, (r) => r.product, aggregation).slice(0, topN);
}

export interface GenericTrendPoint {
  label: string;
  value: number;
}

export function genericTrendByMonth(
  rows: GenericCleanedRow[],
  aggregation: Aggregation
): GenericTrendPoint[] {
  const map = new Map<string, { values: number[]; rowCount: number }>();
  for (const row of rows) {
    if (!row.date) continue;
    const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key) ?? { values: [], rowCount: 0 };
    if (row.measure !== null) entry.values.push(row.measure);
    entry.rowCount++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, { values, rowCount }]) => ({
      label,
      value: aggregate(values, aggregation, rowCount),
    }));
}

export interface GenericInsight {
  text: string;
}

export function generateGenericInsights(
  rows: GenericCleanedRow[],
  aggregation: Aggregation,
  hasProduct: boolean
): GenericInsight[] {
  const insights: GenericInsight[] = [];
  if (rows.length === 0) return insights;

  const metricLabel = aggregation === "count" ? "rows" : aggregation === "avg" ? "average" : "total";

  const categoryBuckets = breakdownByCategoryGeneric(rows, aggregation).filter((b) => b.rowCount >= 3);
  if (categoryBuckets.length >= 2) {
    const top = categoryBuckets[0];
    const sumAll = categoryBuckets.reduce((a, b) => a + b.value, 0);
    const share = sumAll > 0 ? (top.value / sumAll) * 100 : 0;
    insights.push({
      text: `${top.label} leads by ${metricLabel} at ${top.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${
        aggregation !== "count" && share > 0 ? ` — ${share.toFixed(0)}% of the total across categories` : ""
      }.`,
    });

    const bottom = categoryBuckets[categoryBuckets.length - 1];
    if (bottom.label !== top.label && bottom.value > 0 && top.value / bottom.value > 2) {
      insights.push({
        text: `${top.label} outperforms ${bottom.label} by ${(top.value / bottom.value).toFixed(1)}x on ${metricLabel}.`,
      });
    }
  }

  if (hasProduct) {
    const productBuckets = breakdownByProductGeneric(rows, aggregation, 1000).filter((b) => b.rowCount >= 3);
    if (productBuckets.length >= 1) {
      const top = productBuckets[0];
      insights.push({
        text: `${top.label} is the top product by ${metricLabel}, at ${top.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}.`,
      });
    }
  }

  insights.push({
    text: `${rows.length.toLocaleString()} rows in the current view across ${new Set(rows.map((r) => r.category)).size} categories${
      hasProduct ? ` and ${new Set(rows.map((r) => r.product).filter(Boolean)).size} products` : ""
    }.`,
  });

  return insights.slice(0, 5);
}
