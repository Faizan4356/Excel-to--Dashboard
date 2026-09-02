import { useCallback, useRef, useState } from "react";

interface UploadStageProps {
  onFile: (file: File) => void;
  onSample: () => void;
  error: string | null;
  loading: boolean;
}

export default function UploadStage({ onFile, onSample, error, loading }: UploadStageProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) onFile(files[0]);
    },
    [onFile]
  );

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4 animate-fade-in">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-center mb-2" style={{ color: "var(--text)" }}>
        Turn a spreadsheet into an attrition dashboard
      </h1>
      <p className="text-sm sm:text-base text-center max-w-lg mb-8" style={{ color: "var(--text-muted)" }}>
        Upload an employee .xlsx / .xls / .csv file and get KPI cards, breakdowns, risk
        scoring, and drill-down charts — instantly, in your browser.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className="w-full max-w-lg cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors"
        style={{
          borderColor: dragOver ? "var(--stayed)" : "var(--border)",
          background: dragOver ? "color-mix(in srgb, var(--stayed) 8%, transparent)" : "var(--panel)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl"
          style={{ background: "color-mix(in srgb, var(--stayed) 16%, transparent)", color: "var(--stayed)" }}
          aria-hidden
        >
          ⇧
        </div>
        <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
          {loading ? "Reading your file…" : "Drag & drop your spreadsheet here"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          or click to browse · .xlsx, .xls, .csv
        </p>
      </div>

      {error && (
        <div
          className="mt-4 max-w-lg rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--left)", color: "var(--left)", background: "color-mix(in srgb, var(--left) 10%, transparent)" }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          or
        </span>
      </div>
      <button
        onClick={onSample}
        className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ borderColor: "var(--stayed)", color: "var(--stayed)", background: "color-mix(in srgb, var(--stayed) 10%, transparent)" }}
      >
        Try it with sample data
      </button>

      <p className="mt-10 text-xs max-w-md text-center" style={{ color: "var(--text-faint)" }}>
        🔒 Your data never leaves your browser. Nothing is uploaded to a server — parsing,
        cleaning, and analysis all happen locally on your device.
      </p>
    </div>
  );
}
