import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ReactNode } from "react";
import type { BreakdownBucket, TrendPoint } from "../utils/compute";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface ChartPanelProps {
  title: string;
  icon: ReactNode;
  featured?: boolean;
  empty?: boolean;
  children: ReactNode;
}

export function ChartPanel({ title, icon, featured, empty, children }: ChartPanelProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm animate-fade-in ${featured ? "sm:col-span-2" : ""}`}
      style={{ background: "var(--panel)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ background: "var(--panel-alt)", color: "var(--text-muted)" }}
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </h3>
      </div>
      {empty ? (
        <div className="flex h-40 items-center justify-center text-xs text-center px-4" style={{ color: "var(--text-faint)" }}>
          Map a column for this field on the mapping screen to unlock this chart.
        </div>
      ) : (
        <div style={{ height: featured ? 260 : 200 }}>{children}</div>
      )}
    </div>
  );
}

const gridColor = "rgba(128,128,128,0.15)";

function textColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--text-muted") || "#888";
}

interface AttritionBarProps {
  buckets: BreakdownBucket[];
  stayedColor: string;
  leftColor: string;
  onClickLabel?: (label: string) => void;
  activeLabel?: string | null;
  horizontal?: boolean;
}

export function AttritionBarChart({
  buckets,
  stayedColor,
  leftColor,
  onClickLabel,
  activeLabel,
  horizontal,
}: AttritionBarProps) {
  const data = {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        label: "Stayed",
        data: buckets.map((b) => b.stayed),
        backgroundColor: buckets.map((b) =>
          activeLabel && activeLabel !== b.label
            ? `color-mix(in srgb, ${stayedColor} 35%, transparent)`
            : stayedColor
        ),
        borderRadius: 4,
        stack: "s",
      },
      {
        label: "Left",
        data: buckets.map((b) => b.left),
        backgroundColor: buckets.map((b) =>
          activeLabel && activeLabel !== b.label
            ? `color-mix(in srgb, ${leftColor} 35%, transparent)`
            : leftColor
        ),
        borderRadius: 4,
        stack: "s",
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        indexAxis: horizontal ? "y" : "x",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        onClick: (_evt, elements) => {
          if (!onClickLabel || elements.length === 0) return;
          const idx = elements[0].index;
          const label = buckets[idx]?.label;
          if (label) onClickLabel(label);
        },
        onHover: (evt, elements) => {
          if (evt.native?.target && onClickLabel) {
            (evt.native.target as HTMLElement).style.cursor =
              elements.length > 0 ? "pointer" : "default";
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor(), boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const b = buckets[idx];
                return b ? [`Attrition rate: ${b.rate.toFixed(1)}%`] : [];
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: horizontal, color: gridColor },
            ticks: { color: textColor(), font: { size: 11 } },
          },
          y: {
            stacked: true,
            grid: { display: !horizontal, color: gridColor },
            ticks: { color: textColor(), font: { size: 11 } },
          },
        },
      }}
    />
  );
}

interface DonutProps {
  stayed: number;
  left: number;
  stayedColor: string;
  leftColor: string;
}

export function RetentionDonut({ stayed, left, stayedColor, leftColor }: DonutProps) {
  const data = {
    labels: ["Stayed", "Left"],
    datasets: [
      {
        data: [stayed, left],
        backgroundColor: [stayedColor, leftColor],
        borderWidth: 0,
      },
    ],
  };
  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        cutout: "68%",
        plugins: {
          legend: { position: "bottom", labels: { color: textColor(), boxWidth: 12, font: { size: 11 } } },
        },
      }}
    />
  );
}

interface GenderDonutProps {
  buckets: BreakdownBucket[];
  palette: string[];
  onClickLabel?: (label: string) => void;
  activeLabel?: string | null;
}

export function GenderDonutChart({ buckets, palette, onClickLabel, activeLabel }: GenderDonutProps) {
  const data = {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        data: buckets.map((b) => b.total),
        backgroundColor: buckets.map((b, i) =>
          activeLabel && activeLabel !== b.label
            ? `color-mix(in srgb, ${palette[i % palette.length]} 35%, transparent)`
            : palette[i % palette.length]
        ),
        borderWidth: 0,
      },
    ],
  };
  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        cutout: "60%",
        onClick: (_evt, elements) => {
          if (!onClickLabel || elements.length === 0) return;
          const idx = elements[0].index;
          const label = buckets[idx]?.label;
          if (label) onClickLabel(label);
        },
        plugins: {
          legend: { position: "bottom", labels: { color: textColor(), boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                const b = buckets[idx];
                return b ? [`Attrition rate: ${b.rate.toFixed(1)}%`] : [];
              },
            },
          },
        },
      }}
    />
  );
}

export function TrendLineChart({
  points,
  color,
}: {
  points: TrendPoint[];
  color: string;
}) {
  const data = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label: "Attrition rate (%)",
        data: points.map((p) => p.rate),
        borderColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };
  return (
    <Line
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor(), font: { size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor(), font: { size: 10 } } },
        },
      }}
    />
  );
}
