import { useEffect, useMemo, useState } from "react";
import type { Aggregation, ColumnMapping, DatasetMode, GenericColumnMapping, ParsedWorkbook } from "./types";
import { parseWorkbookFile } from "./utils/parse";
import { cleanRows } from "./utils/clean";
import { detectDatasetMode, getHeaders, guessGenericMapping, guessMapping } from "./utils/mapping";
import { normalizeGenericRows, normalizeRows } from "./utils/normalize";
import { generateSampleData } from "./utils/sampleData";
import Header from "./components/Header";
import UploadStage from "./components/UploadStage";
import MappingStage from "./components/MappingStage";
import GenericMappingStage from "./components/GenericMappingStage";
import Dashboard from "./components/Dashboard";
import GenericDashboard from "./components/GenericDashboard";
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
  const [mode, setMode] = useState<DatasetMode>("hr");
  const [cleaningSummary, setCleaningSummary] = useState<CleaningSummary>({
    cellsTrimmed: 0,
    duplicateRowsRemoved: 0,
    emptyRowsRemoved: 0,
    blanksNormalized: 0,
    outliersExcluded: 0,
  });
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [genericMapping, setGenericMapping] = useState<GenericColumnMapping>({});
  const [aggregation, setAggregation] = useState<Aggregation>("sum");

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
    const detectedMode = detectDatasetMode(guessedHeaders);
    setMode(detectedMode);
    if (detectedMode === "hr") {
      setMapping(guessMapping(guessedHeaders));
    } else {
      setGenericMapping(guessGenericMapping(guessedHeaders));
      setAggregation("sum");
    }
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
    const detectedMode = detectDatasetMode(guessedHeaders);
    setMode(detectedMode);
    if (detectedMode === "hr") {
      setMapping(guessMapping(guessedHeaders));
    } else {
      setGenericMapping(guessGenericMapping(guessedHeaders));
    }
  }

  function handleMappingChange(field: string, header: string | null) {
    setMapping((prev) => ({ ...prev, [field]: header }));
  }

  function handleGenericMappingChange(field: string, header: string | null) {
    setGenericMapping((prev) => ({ ...prev, [field]: header }));
  }

  const canContinue = mode === "hr" ? !!mapping.attrition : !!genericMapping.category;

  const cleanedRows = useMemo(() => {
    if (stage !== "dashboard" || mode !== "hr") return [];
    return normalizeRows(activeRawRows, mapping).cleaned;
  }, [stage, mode, activeRawRows, mapping]);

  const genericCleanedRows = useMemo(() => {
    if (stage !== "dashboard" || mode !== "generic") return [];
    return normalizeGenericRows(activeRawRows, genericMapping);
  }, [stage, mode, activeRawRows, genericMapping]);

  function handleStartOver() {
    setStage("upload");
    setWorkbook(null);
    setActiveSheet("");
    setMapping({});
    setGenericMapping({});
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

      {stage === "mapping" && mode === "hr" && (
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

      {stage === "mapping" && mode === "generic" && (
        <GenericMappingStage
          headers={headers}
          mapping={genericMapping}
          onChange={handleGenericMappingChange}
          aggregation={aggregation}
          onAggregationChange={setAggregation}
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

      {stage === "dashboard" && mode === "hr" && (
        <Dashboard rows={cleanedRows} mapping={mapping} colorBlindSafe={colorBlindSafe} onStartOver={handleStartOver} />
      )}

      {stage === "dashboard" && mode === "generic" && (
        <GenericDashboard
          rows={genericCleanedRows}
          mapping={genericMapping}
          aggregation={aggregation}
          colorBlindSafe={colorBlindSafe}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
