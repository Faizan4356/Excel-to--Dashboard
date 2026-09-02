import type { ReactNode } from "react";
import CountUp from "./CountUp";

interface KpiCardProps {
  label: string;
  value: number | null;
  icon: ReactNode;
  accent: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  featured?: boolean;
}

export default function KpiCard({
  label,
  value,
  icon,
  accent,
  suffix = "",
  prefix = "",
  decimals = 0,
  featured = false,
}: KpiCardProps) {
  return (
    <div
      className="relative shrink-0 w-[168px] sm:w-auto overflow-hidden rounded-xl border p-4 shadow-sm"
      style={{
        background: featured
          ? `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, var(--panel)), var(--panel))`
          : "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
          style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <div
        className="font-display font-semibold"
        style={{ color: featured ? accent : "var(--text)", fontSize: featured ? "28px" : "22px" }}
      >
        <CountUp value={value} decimals={decimals} suffix={suffix} prefix={prefix} />
      </div>
    </div>
  );
}
