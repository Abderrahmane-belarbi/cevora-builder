import type { ChartValue } from "./model";

export function donutArc(start: number, ratio: number) {
  const point = (fraction: number) => [50 + 32 * Math.cos(fraction * Math.PI * 2 - Math.PI / 2), 50 + 32 * Math.sin(fraction * Math.PI * 2 - Math.PI / 2)];
  const [x1, y1] = point(start);
  const [x2, y2] = point(start + ratio);
  if (ratio >= 0.999999) return "M 50 18 A 32 32 0 1 1 50 82 A 32 32 0 1 1 50 18";
  return "M " + x1 + " " + y1 + " A 32 32 0 " + (ratio > 0.5 ? 1 : 0) + " 1 " + x2 + " " + y2;
}

export function chartSlices(chart: ChartValue, accent: string) {
  const segments = chart.segments.filter((segment) => segment.value > 0);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let start = 0;
  return segments.map((segment, index) => {
    const ratio = segment.value / total;
    const shade = (index % 5) * 0.15;
    const color = "#" + [1, 3, 5].map((offset) => Math.round(parseInt(accent.slice(offset, offset + 2), 16) * (1 - shade) + 255 * shade).toString(16).padStart(2, "0")).join("");
    const result = { ...segment, color, ratio, start, percent: Math.round(ratio * 100) };
    start += ratio;
    return result;
  });
}

