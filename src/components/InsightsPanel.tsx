import type { Insight } from "../utils/compute";

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div
      className="rounded-xl border p-4 shadow-sm animate-fade-in"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--violet) 10%, var(--panel)), var(--panel))",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ background: "color-mix(in srgb, var(--violet) 20%, transparent)", color: "var(--violet)" }}
          aria-hidden
        >
          ✦
        </span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Key Insights
        </h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--violet)" }} aria-hidden>
              •
            </span>
            <span>{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
