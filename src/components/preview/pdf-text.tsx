import { createContext, useContext, type PropsWithChildren } from "react";
import { Link as PdfLink, Text as PdfText, type TextProps, type LinkProps } from "@react-pdf/renderer";

// React-pdf inherits text alignment but does not inherit the bidi direction.
// Apply it to every text fragment, including nested rich-text marks.
export const PdfDirection = createContext<"ltr" | "rtl">("ltr");
export function Text({ style, ...props }: PropsWithChildren<TextProps>) {
  const direction = useContext(PdfDirection);
  return <PdfText {...props} style={[{ direction }, ...(Array.isArray(style) ? style : style ? [style] : [])]} />;
}
export function Link({ style, ...props }: PropsWithChildren<LinkProps>) {
  const direction = useContext(PdfDirection);
  return <PdfLink {...props} style={[{ direction }, ...(Array.isArray(style) ? style : style ? [style] : [])]} />;
}
