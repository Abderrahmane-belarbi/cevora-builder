import type { ChartValue, RatingValue } from "@/resume/model";
import { chartSlices, donutArc } from "@/resume/visual-fields";

export function Rating({ value }: { value: RatingValue }) {
  return <span className={"resume-rating rating-" + value.style} role="img" aria-label={"Proficiency " + value.value + " out of " + value.max}>
    {value.style === "dots" ? Array.from({ length: value.max }, (_, i) => <i key={i} className={i < value.value ? "rating-filled" : ""} />)
      : <span className="rating-track"><span style={{ width: value.value / value.max * 100 + "%" }} /></span>}
  </span>;
}
export function TimeChart({ value, accent }: { value: ChartValue; accent: string }) {
  const slices = chartSlices(value, accent);
  return <div className="resume-time-chart">
    <svg viewBox="0 0 100 100" role="img" aria-label={"Time allocation: " + slices.map((slice) => slice.label + " " + slice.percent + "%").join(", ")}>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#e6ece8" strokeWidth="16" />
      {slices.map((slice) => <path key={slice.id} d={donutArc(slice.start, slice.ratio)} fill="none" stroke={slice.color} strokeWidth="16" />)}
    </svg>
    <ul>{slices.map((slice) => <li key={slice.id}><i style={{ background: slice.color }} /><span>{slice.label || "Untitled"} <small>{slice.percent}%</small></span></li>)}</ul>
  </div>;
}

