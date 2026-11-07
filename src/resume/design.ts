import type { Design, Resume } from "./model";

export const paperSizes = { A4: { width: 595.28, height: 841.89, label: "A4" }, LETTER: { width: 612, height: 792, label: "US Letter" } };
const spacing = {
  compact: { inset: 33, section: 13, entry: 8, line: 1.29 },
  comfortable: { inset: 40, section: 18, entry: 11, line: 1.39 },
  spacious: { inset: 47, section: 23, entry: 15, line: 1.5 },
};
export const ink = { heading: "#192a2a", body: "#344545", muted: "#50605f", line: "#d6e0dd", sidebar: "#203633", sidebarText: "#e2efec" };
export const sidebarFraction = 0.32;
export const designTokens = (design: Design) => ({ ...spacing[design.spacing], ...paperSizes[design.paper], accent: design.accent });
export const join = (parts: string[], separator: string) => parts.map((part) => part.trim()).filter(Boolean).join(separator);
export const dates = (start: string, end: string) => join([start, end], " – ");

function webUrl(value: string) {
  try {
    const url = new URL(/^[a-z][\w+.-]*:/i.test(value) ? value : "https://" + value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function safeHref(value: string) {
  const trimmed = value.trim();
  if (/^(mailto:|tel:)/i.test(trimmed) && !/[\r\n]/.test(trimmed)) return trimmed;
  return webUrl(trimmed);
}

export function contacts(personal: Resume["personal"]) {
  const { location, email, phone, website, linkedin } = personal;
  return [
    { key: "location", text: location.trim() },
    { key: "email", text: email.trim(), href: email.trim() ? "mailto:" + email.trim().replace(/[\r\n]/g, "") : undefined },
    { key: "phone", text: phone.trim(), href: /\d/.test(phone) ? "tel:" + phone.replace(/[^+\d]/g, "") : undefined },
    { key: "website", text: website.trim(), href: webUrl(website.trim()) },
    { key: "linkedin", text: linkedin.trim(), href: webUrl(linkedin.trim()) },
  ].filter((item) => item.text);
}
