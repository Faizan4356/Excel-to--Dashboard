export type RawRow = Record<string, unknown>;

export type LogicalField =
  | "attrition"
  | "department"
  | "jobRole"
  | "gender"
  | "education"
  | "age"
  | "income"
  | "tenure"
  | "date";

export interface FieldMeta {
  key: LogicalField;
  label: string;
  required: boolean;
  kind: "categorical" | "numeric" | "date";
  keywords: string[];
}

export type ColumnMapping = Partial<Record<LogicalField, string | null>>;

export interface CleanedRow {
  attrition: boolean;
  department: string | null;
  jobRole: string | null;
  gender: string | null;
  education: string | null;
  age: number | null;
  income: number | null;
  tenure: number | null;
  date: Date | null;
  raw: RawRow;
}

export interface CleaningSummary {
  cellsTrimmed: number;
  duplicateRowsRemoved: number;
  emptyRowsRemoved: number;
  blanksNormalized: number;
  outliersExcluded: number;
}

export interface ParsedWorkbook {
  sheetNames: string[];
  sheets: Record<string, RawRow[]>;
}

export interface ActiveFilters {
  department: string | null;
  gender: string | null;
  jobRole: string | null;
  education: string | null;
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface RiskRow {
  index: number;
  raw: RawRow;
  department: string | null;
  jobRole: string | null;
  gender: string | null;
  age: number | null;
  income: number | null;
  tenure: number | null;
  attrition: boolean;
  score: number;
  level: RiskLevel;
}
