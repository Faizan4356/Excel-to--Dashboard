import { useEffect, useMemo, useState } from "react";
import type { ColumnMapping, ParsedWorkbook } from "./types";
import { parseWorkbookFile } from "./utils/parse";
import { cleanRows } from "./utils/clean";
import { getHeaders, guessMapping } from "./utils/mapping";
import { normalizeRows } from "./utils/normalize";
import { generateSampleData } from "./utils/sampleData";
import Header from "./components/Header";
import UploadStage from "./components/UploadStage";
import MappingStage from "./components/MappingStage";
import Dashboard from "./components/Dashboard";
import type { CleaningSummary } from "./types";

type Stage = "upload" | "mapping" | "dashboard";

export default function App() {
  const [stage, setStage] = useState<Stage>("upload");
  const [dark, setDark] = useState(true);
  const [colorBlindSafe, setColorBlindSafe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [cleaningSummary, setCleaningSummary] = useState<CleaningSummary>({
    cellsTrimmed: 0,
    duplicateRowsRemoved: 0,
    emptyRowsRemoved: 0,
    blanksNormalized: 0,
    outliersExcluded: 0,
  });
  const [mapping, setMapping] = useState<ColumnMapping>({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const activeRawRows = useMemo(() => {
    if (!workbook || !activeSheet) return [];
    const { rows } = cleanRows(workbook.sheets[activeSheet] ?? []);
    return rows;
  }, [workbook, activeSheet]);

  const headers = useMemo(() => getHeaders(activeRawRows), [activeRawRows]);

  function loadWorkbook(wb: ParsedWorkbook, defaultSheet: string) {
    setWorkbook(wb);
    setActiveSheet(defaultSheet);
    const { rows, summary } = cleanRows(wb.sheets[defaultSheet] ?? []);
    setCleaningSummary(summary);
    const guessedHeaders = getHeaders(rows);
    setMapping(guessMapping(guessedHeaders));
    setStage("mapping");
  }

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const wb = await parseWorkbookFile(file);
      loadWorkbook(wb, wb.sheetNames[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSample() {
    setError(null);
    const sample = generateSampleData();
    const wb: ParsedWorkbook = { sheetNames: ["Sample Data"], sheets: { "Sample Data": sample } };
    loadWorkbook(wb, "Sample Data");
  }

  function handleSheetChange(sheet: string) {
    if (!workbook) return;
    setActiveSheet(sheet);
    const { rows, summary } = cleanRows(workbook.sheets[sheet] ?? []);
    setCleaningSummary(summary);
    const guessedHeaders = getHeaders(rows);
    setMapping(guessMapping(guessedHeaders));
  }

  function handleMappingChange(field: string, header: string | null) {
    setMapping((prev) => ({ ...prev, [field]: header }));
  }

  const canContinue = !!mapping.attrition;

  const cleanedRows = useMemo(() => {
    if (stage !== "dashboard") return [];
    return normalizeRows(activeRawRows, mapping).cleaned;
  }, [stage, activeRawRows, mapping]);

  function handleStartOver() {
    setStage("upload");
    setWorkbook(null);
    setActiveSheet("");
    setMapping({});
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4">
        <Header
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          colorBlindSafe={colorBlindSafe}
          onToggleColorBlindSafe={() => setColorBlindSafe((c) => !c)}
        />
      </div>

      {stage === "upload" && (
        <UploadStage onFile={handleFile} onSample={handleSample} error={error} loading={loading} />
      )}

      {stage === "mapping" && (
        <MappingStage
          headers={headers}
          mapping={mapping}
          onChange={handleMappingChange}
          cleaningSummary={cleaningSummary}
          rowCount={activeRawRows.length}
          sheetNames={workbook?.sheetNames ?? []}
          activeSheet={activeSheet}
          onSheetChange={handleSheetChange}
          onContinue={() => setStage("dashboard")}
          onBack={handleStartOver}
          canContinue={canContinue}
        />
      )}

      {stage === "dashboard" && (
        <Dashboard rows={cleanedRows} mapping={mapping} colorBlindSafe={colorBlindSafe} onStartOver={handleStartOver} />
      )}
    </div>
  );
}
