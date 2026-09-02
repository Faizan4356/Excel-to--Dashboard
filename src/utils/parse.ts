import * as XLSX from "xlsx";
import type { ParsedWorkbook, RawRow } from "../types";

export async function parseWorkbookFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  const sheetNames = wb.SheetNames.filter((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });
    return rows.length > 0;
  });

  if (sheetNames.length === 0) {
    throw new Error(
      "This workbook doesn't seem to have any rows of data. Check that the file has a header row followed by data."
    );
  }

  const sheets: Record<string, RawRow[]> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    sheets[name] = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null, raw: true });
  }

  return { sheetNames: wb.SheetNames, sheets };
}
