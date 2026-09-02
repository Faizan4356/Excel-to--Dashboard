export interface Palette {
  stayed: string;
  left: string;
  gold: string;
  violet: string;
  series: string[];
}

export function getPalette(colorBlindSafe: boolean): Palette {
  if (colorBlindSafe) {
    return {
      stayed: "#0072b2",
      left: "#d55e00",
      gold: "#e69f00",
      violet: "#cc79a7",
      series: ["#0072b2", "#d55e00", "#e69f00", "#cc79a7", "#009e73", "#f0e442"],
    };
  }
  return {
    stayed: "#2dd4bf",
    left: "#f2994a",
    gold: "#f2c94c",
    violet: "#a78bfa",
    series: ["#2dd4bf", "#f2994a", "#f2c94c", "#a78bfa", "#60a5fa", "#f472b6"],
  };
}
