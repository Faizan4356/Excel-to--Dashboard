import type { RawRow } from "../types";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const DEPARTMENTS = ["Sales", "Research & Development", "Human Resources"];
const JOB_ROLES: Record<string, string[]> = {
  Sales: ["Sales Executive", "Sales Representative", "Manager"],
  "Research & Development": ["Research Scientist", "Laboratory Technician", "Manufacturing Director", "Research Director"],
  "Human Resources": ["Human Resources", "HR Specialist"],
};
const EDUCATION = ["High School", "Bachelor", "Master", "PhD", "Below College"];
const GENDERS = ["Male", "Female"];

function randomDate(startYear: number, endYear: number): Date {
  const year = randInt(startYear, endYear);
  const month = randInt(0, 11);
  const day = randInt(1, 28);
  return new Date(year, month, day);
}

export function generateSampleData(count = 180): RawRow[] {
  const rows: RawRow[] = [];

  for (let i = 0; i < count; i++) {
    const department = pick(DEPARTMENTS);
    const jobRole = pick(JOB_ROLES[department]);
    const gender = pick(GENDERS);
    const education = pick(EDUCATION);
    const age = randInt(20, 60);
    const tenure = Math.min(randInt(0, Math.max(1, age - 20)), 20);
    const baseIncome =
      jobRole.includes("Director") || jobRole === "Manager"
        ? randInt(12000, 20000)
        : jobRole.includes("Research") || jobRole.includes("Scientist")
          ? randInt(6000, 13000)
          : randInt(2500, 9000);

    let leaveProb = 0.13;
    if (tenure < 2) leaveProb += 0.18;
    if (baseIncome < 5000) leaveProb += 0.15;
    if (department === "Sales") leaveProb += 0.08;
    if (age < 26) leaveProb += 0.07;

    const attrition = rand() < leaveProb ? "Yes" : "No";
    const hireDate = randomDate(2018, 2024);

    const row: RawRow = {
      EmployeeID: 1000 + i,
      Age: age,
      Gender: gender,
      Department: department,
      JobRole: jobRole,
      Education: education,
      MonthlyIncome: baseIncome,
      YearsAtCompany: tenure,
      HireDate: hireDate.toISOString().slice(0, 10),
      Attrition: attrition,
    };

    if (rand() < 0.02) {
      row.Department = "  " + row.Department + "  ";
    }
    if (rand() < 0.015) {
      row.Education = "N/A";
    }

    rows.push(row);
  }

  return rows;
}
