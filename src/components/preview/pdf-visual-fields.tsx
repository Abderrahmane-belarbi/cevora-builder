import { Circle, Path, Rect, Svg, View } from "@react-pdf/renderer";
import { Text } from "./pdf-text";
import type { ChartValue, RatingValue } from "@/resume/model";
import { chartSlices, donutArc } from "@/resume/visual-fields";

export function PdfRating({ value, color }: { value: RatingValue; color: string }) {
  return <View style={{ marginTop: 3 }}>
    <Svg width={value.style === "bar" ? 100 : value.max * 10} height={10}>
      {value.style === "bar" ? <>
        <Rect x={0} y={3} width={100} height={4} rx={2} fill="#dce5df" />
        <Rect x={0} y={3} width={value.value / value.max * 100} height={4} rx={2} fill={color} />
      </> : Array.from({ length: value.max }, (_, index) => <Circle key={index} cx={index * 10 + 4} cy={5} r={3.5} fill={index < value.value ? color : "#dce5df"} />)}
    </Svg>
    <Text style={{ fontSize: 7, marginTop: 2, direction: "ltr" }}>{value.value} / {value.max}</Text>
  </View>;
}
export function PdfTimeChart({ value, accent }: { value: ChartValue; accent: string }) {
  const slices = chartSlices(value, accent);
  return <View style={{ flexDirection: "row", columnGap: 8, marginTop: 4 }}>
    <Svg width={76} height={76} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <Circle cx={50} cy={50} r={32} fill="none" stroke="#e6ece8" strokeWidth={16} />
      {slices.map((slice) => <Path key={slice.id} d={donutArc(slice.start, slice.ratio)} fill="none" stroke={slice.color} strokeWidth={16} />)}
    </Svg>
    <View style={{ flexGrow: 1, flexShrink: 1, paddingTop: 3 }}>{slices.map((slice) => <View key={slice.id} style={{ flexDirection: "row", columnGap: 4, marginBottom: 4 }}>
      <Svg width={5} height={5} style={{ marginTop: 3, flexShrink: 0 }}><Rect x={0} y={0} width={5} height={5} fill={slice.color} /></Svg>
      <Text style={{ flexShrink: 1, fontSize: 8 }}>{slice.label || "Untitled"} {slice.percent}%</Text>
    </View>)}</View>
  </View>;
}

