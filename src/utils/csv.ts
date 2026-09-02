declare global {
  interface Window {
    claude?: { use: (name: string) => Promise<unknown> };
  }
}

interface DownloadsCapability {
  save: (req: { filename: string; data: string }) => Promise<{ status: "saved" }>;
}

export async function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  if (window.claude?.use) {
    try {
      const downloads = (await window.claude.use("downloads")) as DownloadsCapability | null;
      if (downloads) {
        await downloads.save({ filename, data: csv });
        return;
      }
    } catch {
      // fall through to the browser download path
    }
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
