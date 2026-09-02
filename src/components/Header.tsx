interface HeaderProps {
  dark: boolean;
  onToggleDark: () => void;
  colorBlindSafe: boolean;
  onToggleColorBlindSafe: () => void;
  showControls?: boolean;
}

export default function Header({
  dark,
  onToggleDark,
  colorBlindSafe,
  onToggleColorBlindSafe,
  showControls = true,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold text-sm"
          style={{ background: "var(--stayed)", color: "#04211d" }}
          aria-hidden
        >
          S→D
        </span>
        <span className="font-display font-semibold text-lg" style={{ color: "var(--text)" }}>
          Sheet <span style={{ color: "var(--text-faint)" }}>→</span> Dashboard
        </span>
      </div>
      {showControls && (
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleColorBlindSafe}
            aria-pressed={colorBlindSafe}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: colorBlindSafe ? "var(--stayed)" : "var(--border)",
              color: colorBlindSafe ? "var(--stayed)" : "var(--text-muted)",
              background: colorBlindSafe ? "color-mix(in srgb, var(--stayed) 12%, transparent)" : "var(--panel)",
            }}
            title="Toggle colorblind-safe chart palette"
          >
            Colorblind-safe
          </button>
          <button
            onClick={onToggleDark}
            aria-pressed={dark}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--panel)" }}
            title="Toggle light / dark theme"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      )}
    </header>
  );
}
