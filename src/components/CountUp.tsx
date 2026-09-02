import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number | null;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 350,
}: CountUpProps) {
  const [display, setDisplay] = useState(value ?? 0);
  const fromRef = useRef(value ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === null) return;
    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (value === null) return <span>—</span>;

  return (
    <span>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
