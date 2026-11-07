import { Font } from "@react-pdf/renderer";
import { fonts } from "./presentation";

let registered = false;
/** Register locally bundled static fonts, including a fallback for mixed Arabic/Latin text. */
export function registerPdfFonts(base?: string) {
  if (registered) return;
  const root = base ?? (typeof window === "undefined" ? "public/fonts/" : window.location.origin + window.location.pathname.replace(/\/?$/, "/") + "fonts/");
  for (const [id, font] of Object.entries(fonts)) {
    if (["sans", "serif", "mono"].includes(id)) continue;
    const variants = new Map([[font.regular, "Regular"], [font.bold, "Bold"]]);
    if (font.italic !== font.regular) variants.set(font.italic, "Italic");
    if (font.boldItalic !== font.bold) variants.set(font.boldItalic, "BoldItalic");
    variants.forEach((variant, family) => Font.register({ family, src: root + id + "-" + variant + ".ttf" }));
  }
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const withArabicFallback = (family: string, bold = false) => Array.from(new Set([family, bold ? fonts["noto-arabic"].bold : fonts["noto-arabic"].regular]));
