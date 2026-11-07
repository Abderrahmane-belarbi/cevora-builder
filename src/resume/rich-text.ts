import type { Block, RichText } from "./model";

export function hasRichText(value: RichText): boolean {
  const hasText = (node: Block): boolean => node.type === "paragraph"
    ? !!node.content?.some(({ text }) => text.trim())
    : node.content.some((item) => item.content.some(hasText));
  return value.content.some(hasText);
}
