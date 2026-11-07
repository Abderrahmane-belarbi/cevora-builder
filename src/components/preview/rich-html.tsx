import { Fragment, type ReactNode } from "react";
import type { Block, RichText } from "@/resume/model";
function renderBlock(node: Block, key: number): ReactNode {
  if (node.type === "bulletList") return <ul key={key}>{node.content.map((item, index) => <li key={index}>{item.content.map(renderBlock)}</li>)}</ul>;
  return <p key={key}>{node.content?.length ? node.content.map(({ text, marks }, i) => {
    let result: ReactNode = text;
    if (marks?.some((mark) => mark.type === "bold")) result = <strong>{result}</strong>;
    if (marks?.some((mark) => mark.type === "italic")) result = <em>{result}</em>;
    return <Fragment key={i}>{result}</Fragment>;
  }) : <br />}</p>;
}
export function HtmlRichText({ value }: { value: RichText }) {
  return <>{value.content.map(renderBlock)}</>;
}

