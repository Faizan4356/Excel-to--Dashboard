import { FIELD_DEFS, GENERIC_FIELD_DEFS } from "./fields";
import type {
  ColumnMapping,
  DatasetMode,
  GenericColumnMapping,
  RawRow,
} from "../types";

export function getHeaders(rows: RawRow[]): string[] {
  const headers = new Set<string>();
  for (const row of rows.slice(0, 50)) {
    Object.keys(row).forEach((k) => headers.add(k));
  }
  return Array.from(headers);
}

interface FieldLike {
  key: string;
  keywords: string[];
}

function guess<T extends string>(
  headers: string[],
  fields: FieldLike[]
): Partial<Record<T, string | null>> {
  const mapping: Partial<Record<T, string | null>> = {};
  const usedHeaders = new Set<string>();

  for (const field of fields) {
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
      mapping[field.key as T] = best;
      usedHeaders.add(best);
    } else {
      mapping[field.key as T] = null;
    }
  }

  return mapping;
}

export function guessMapping(headers: string[]): ColumnMapping {
  return guess(headers, FIELD_DEFS);
}

export function guessGenericMapping(headers: string[]): GenericColumnMapping {
  return guess(headers, GENERIC_FIELD_DEFS);
}

const ATTRITION_FIELD = FIELD_DEFS.find((f) => f.key === "attrition")!;

export function detectDatasetMode(headers: string[]): DatasetMode {
  const guessed = guess<string>(headers, [ATTRITION_FIELD]);
  return guessed[ATTRITION_FIELD.key] ? "hr" : "generic";
}
