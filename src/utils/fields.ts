import type { FieldMeta } from "../types";

export const FIELD_DEFS: FieldMeta[] = [
  {
    key: "attrition",
    label: "Attrition",
    required: true,
    kind: "categorical",
    keywords: ["attrition", "churn", "left", "status", "terminat"],
  },
  {
    key: "department",
    label: "Department",
    required: false,
    kind: "categorical",
    keywords: ["department", "dept"],
  },
  {
    key: "jobRole",
    label: "Job Role",
    required: false,
    kind: "categorical",
    keywords: ["job role", "jobrole", "role", "job title", "position", "title"],
  },
  {
    key: "gender",
    label: "Gender",
    required: false,
    kind: "categorical",
    keywords: ["gender", "sex"],
  },
  {
    key: "education",
    label: "Education",
    required: false,
    kind: "categorical",
    keywords: ["education", "degree", "qualification"],
  },
  {
    key: "age",
    label: "Age",
    required: false,
    kind: "numeric",
    keywords: ["age"],
  },
  {
    key: "income",
    label: "Monthly Income / Salary",
    required: false,
    kind: "numeric",
    keywords: ["income", "salary", "monthlyincome", "pay", "compensation", "wage"],
  },
  {
    key: "tenure",
    label: "Years At Company / Tenure",
    required: false,
    kind: "numeric",
    keywords: ["years at company", "tenure", "yearsatcompany", "years of service", "experience", "service years"],
  },
  {
    key: "date",
    label: "Hire / Exit Date",
    required: false,
    kind: "date",
    keywords: ["date", "hire date", "hiredate", "start date", "exit date", "termination date", "joining date"],
  },
];
