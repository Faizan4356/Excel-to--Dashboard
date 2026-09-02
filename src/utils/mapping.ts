import { FIELD_DEFS } from "./fields";
import type { ColumnMapping, RawRow } from "../types";

export function getHeaders(rows: RawRow[]): string[] {
  const headers = new Set<string>();
  for (const row of rows.slice(0, 50)) {
    Object.keys(row).forEach((k) => headers.add(k));
  }
  return Array.from(headers);
}

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  for (const field of FIELD_DEFS) {
    let best: string | null = null;
    let bestScore = 0;

    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const h = header.toLowerCase().replace(/[_\-]/g, " ").trim();
      let score = 0;
      for (const kw of field.keywords) {
        if (h === kw) {
          score = Math.max(score, 100);
        } else if (h.includes(kw)) {
          score = Math.max(score, 60 + kw.length);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = header;
      }
    }

    if (best && bestScore > 0) {
      mapping[field.key] = best;
      usedHeaders.add(best);
    } else {
      mapping[field.key] = null;
    }
  }

  return mapping;
}
