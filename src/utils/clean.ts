import type { CleaningSummary, RawRow } from "../types";

const BLANK_TOKENS = new Set([
  "na",
  "n/a",
  "null",
  "none",
  "-",
  "--",
  "?",
  "unknown",
  "undefined",
  "",
]);

function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export interface CleanResult {
  rows: RawRow[];
  summary: CleaningSummary;
}

export function cleanRows(rows: RawRow[]): CleanResult {
  const summary: CleaningSummary = {
    cellsTrimmed: 0,
    duplicateRowsRemoved: 0,
    emptyRowsRemoved: 0,
    blanksNormalized: 0,
    outliersExcluded: 0,
  };

  const step1: RawRow[] = rows.map((row) => {
    const out: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string") {
        const original = value;
        const collapsed = collapseSpaces(value);
        if (collapsed !== original) summary.cellsTrimmed++;

        const normalized = collapsed.toLowerCase();
        if (BLANK_TOKENS.has(normalized)) {
          if (collapsed !== "") summary.blanksNormalized++;
          out[key] = null;
        } else {
          out[key] = collapsed;
        }
      } else {
        out[key] = value ?? null;
      }
    }
    return out;
  });

  const nonEmpty: RawRow[] = [];
  for (const row of step1) {
    const hasValue = Object.values(row).some(
      (v) => v !== null && v !== undefined && String(v).length > 0
    );
    if (hasValue) {
      nonEmpty.push(row);
    } else {
      summary.emptyRowsRemoved++;
    }
  }

  const seen = new Set<string>();
  const deduped: RawRow[] = [];
  for (const row of nonEmpty) {
    const key = JSON.stringify(
      Object.entries(row).sort(([a], [b]) => a.localeCompare(b))
    );
    if (seen.has(key)) {
      summary.duplicateRowsRemoved++;
    } else {
      seen.add(key);
      deduped.push(row);
    }
  }

  return { rows: deduped, summary };
}

export function isCleanSummaryEmpty(s: CleaningSummary): boolean {
  return (
    s.cellsTrimmed === 0 &&
    s.duplicateRowsRemoved === 0 &&
    s.emptyRowsRemoved === 0 &&
    s.blanksNormalized === 0
  );
}
