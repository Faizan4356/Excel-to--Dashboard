import type { CleanedRow, ColumnMapping, RawRow } from "../types";

const TRUE_TOKENS = new Set(["yes", "true", "1", "left", "churned", "terminated", "y"]);
const FALSE_TOKENS = new Set(["no", "false", "0", "stayed", "active", "current", "n", "retained"]);

function parseAttrition(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (TRUE_TOKENS.has(s)) return true;
  if (FALSE_TOKENS.has(s)) return false;
  return null;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[,$\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCategory(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

const AGE_MIN = 14;
const AGE_MAX = 90;
const TENURE_MAX = 60;

export function normalizeRows(rows: RawRow[], mapping: ColumnMapping): {
  cleaned: CleanedRow[];
  outliersExcluded: number;
} {
  const cleaned: CleanedRow[] = [];
  let outliersExcluded = 0;

  for (const row of rows) {
    const attritionRaw = mapping.attrition ? row[mapping.attrition] : null;
    const attrition = parseAttrition(attritionRaw);
    if (attrition === null) continue;

    let age = mapping.age ? parseNumber(row[mapping.age]) : null;
    if (age !== null && (age < AGE_MIN || age > AGE_MAX)) {
      age = null;
      outliersExcluded++;
    }

    let income = mapping.income ? parseNumber(row[mapping.income]) : null;
    if (income !== null && income < 0) {
      income = null;
      outliersExcluded++;
    }

    let tenure = mapping.tenure ? parseNumber(row[mapping.tenure]) : null;
    if (tenure !== null && (tenure < 0 || tenure > TENURE_MAX)) {
      tenure = null;
      outliersExcluded++;
    }

    cleaned.push({
      attrition,
      department: mapping.department ? parseCategory(row[mapping.department]) : null,
      jobRole: mapping.jobRole ? parseCategory(row[mapping.jobRole]) : null,
      gender: mapping.gender ? parseCategory(row[mapping.gender]) : null,
      education: mapping.education ? parseCategory(row[mapping.education]) : null,
      age,
      income,
      tenure,
      date: mapping.date ? parseDate(row[mapping.date]) : null,
      raw: row,
    });
  }

  return { cleaned, outliersExcluded };
}
