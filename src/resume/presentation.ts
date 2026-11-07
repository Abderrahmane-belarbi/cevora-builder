import type { Design, ResumeSection } from "./model";

export type Layout = "single" | "split" | "left-sidebar" | "right-sidebar" | "contemporary";
type TemplateStyle = {
  align: "left" | "center"; nameSize: number;
  section: "rule" | "strong" | "bar" | "center" | "plain" | "icons";
  layout: Layout; defaultFont: Design["font"]; background: string;
  lightName: boolean; uppercaseName: boolean; companyFirst: boolean;
  decoration: "none" | "wave" | "organic";
  band: boolean; plainSkills: boolean; sectionCase: "upper" | "title";
};
export type Template = TemplateStyle & { id: Design["template"]; name: string; detail: string; collection: "inspired" | "original" };
function defineTemplate(id: Design["template"], name: string, detail: string, options: Partial<TemplateStyle> = {}, collection: Template["collection"] = "inspired"): Template {
  return { id, name, detail, collection, align: "left", nameSize: 30, section: "rule", layout: "single", defaultFont: "sans", background: "#ffffff",
    lightName: false, uppercaseName: false, companyFirst: false, decoration: "none", band: false, plainSkills: true, sectionCase: "upper", ...options };
}

// Layout and typography are shared by the HTML and PDF renderers.
export const templates = [
  defineTemplate("double-column", "Double Column", "Bold rules · balanced columns", { layout: "split", section: "strong", uppercaseName: true }),
  defineTemplate("academic", "Academic", "Centered serif · traditional rules", { align: "center", nameSize: 25, section: "center", defaultFont: "serif", companyFirst: true, sectionCase: "title" }),
  defineTemplate("side-panel", "Side Panel", "Dark right sidebar · clear hierarchy", { layout: "right-sidebar", nameSize: 27, uppercaseName: true }),
  defineTemplate("editorial", "Editorial", "Warm paper · spacious serif typography", { align: "center", nameSize: 37, section: "plain", defaultFont: "serif", background: "#fffaf3", lightName: true }),
  defineTemplate("modern-split", "Modern Split", "Fine rules · accent-colored details", { layout: "split", uppercaseName: true }),
  defineTemplate("contemporary", "Contemporary", "Photo accents · a light left column", { layout: "contemporary", nameSize: 31, section: "icons", decoration: "organic", uppercaseName: true, lightName: true, companyFirst: true }),
  defineTemplate("wave", "Wave", "Soft curves · a two-column body", { layout: "split", nameSize: 28, decoration: "wave", section: "plain", lightName: true }),
  defineTemplate("essential", "Essential", "Single column · clean typography", { nameSize: 30, section: "plain" }),
  defineTemplate("minimal-split", "Minimal Split", "Open columns · subtle section labels", { layout: "split", nameSize: 26, section: "plain", lightName: true }),
  defineTemplate("classic", "Classic", "Traditional, clear single column", { nameSize: 35, plainSkills: false }, "original"),
  defineTemplate("modern", "Modern", "Dark left sidebar", { layout: "left-sidebar", nameSize: 27, plainSkills: false }, "original"),
  defineTemplate("executive", "Executive", "Centered header and strong rules", { align: "center", nameSize: 31, section: "strong", sectionCase: "title" }, "original"),
  defineTemplate("professional", "Professional", "Color-block header", { band: true, plainSkills: false }, "original"),
  defineTemplate("minimal", "Minimal", "Subtle accent bars", { section: "bar" }, "original"),
  defineTemplate("elegant", "Elegant", "Balanced header and section titles", { align: "center", nameSize: 33, section: "center" }, "original"),
  defineTemplate("atlas", "Atlas", "Bold masthead · two-column clarity", { layout: "split", band: true, section: "strong", nameSize: 34, defaultFont: "lato", plainSkills: false }),
  defineTemplate("horizon", "Horizon", "Centered color band · clean sections", { align: "center", band: true, section: "bar", defaultFont: "open-sans", nameSize: 32 }),
  defineTemplate("linen", "Linen", "Warm tones · quiet serif", { background: "#faf7f0", section: "center", defaultFont: "source-serif", nameSize: 36, lightName: true, sectionCase: "title" }),
  defineTemplate("studio", "Studio", "Sidebar · crisp accent bars", { layout: "right-sidebar", section: "bar", defaultFont: "lato", nameSize: 32, plainSkills: false }),
  defineTemplate("scholar", "Scholar", "Scholarly serif · balanced columns", { layout: "split", align: "center", section: "center", defaultFont: "source-serif", nameSize: 29, sectionCase: "title", companyFirst: true }),
  defineTemplate("mosaic", "Mosaic", "Soft shapes · expressive sidebar", { layout: "contemporary", section: "icons", band: true, defaultFont: "open-sans", nameSize: 33, decoration: "organic", plainSkills: false }),
];

function embeddedFont(id: string, label: string, detail: string, arabic: boolean, italic = false) {
  return { label, detail, arabic, css: '"cevora-' + id + '", "cevora-noto-arabic", sans-serif',
    regular: "cevora-" + id, bold: "cevora-" + id + "-Bold", italic: "cevora-" + id + (italic ? "-Italic" : ""), boldItalic: "cevora-" + id + (italic ? "-BoldItalic" : "-Bold") };
}
export const fonts = {
  sans: { label: "Helvetica", detail: "Clean sans serif", arabic: false, css: 'Arial, Helvetica, "cevora-noto-arabic", sans-serif', regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique", boldItalic: "Helvetica-BoldOblique" },
  serif: { label: "Times", detail: "Traditional serif", arabic: false, css: '"Times New Roman", Times, "cevora-naskh", serif', regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic", boldItalic: "Times-BoldItalic" },
  mono: { label: "Courier", detail: "Distinct monospaced", arabic: false, css: '"Courier New", Courier, "cevora-noto-arabic", monospace', regular: "Courier", bold: "Courier-Bold", italic: "Courier-Oblique", boldItalic: "Courier-BoldOblique" },
  lato: embeddedFont("lato", "Lato", "Humanist sans serif", false, true),
  "open-sans": embeddedFont("open-sans", "Open Sans", "Friendly and readable", false, true),
  "source-serif": embeddedFont("source-serif", "Source Serif 4", "Literary serif", false, true),
  "noto-arabic": embeddedFont("noto-arabic", "Noto Sans Arabic", "Modern Arabic & English", true),
  naskh: embeddedFont("naskh", "Noto Naskh Arabic", "Traditional Arabic & English", true),
  cairo: embeddedFont("cairo", "Cairo · القاهرة", "Geometric Arabic & English", true),
  amiri: embeddedFont("amiri", "Amiri · أميري", "Calligraphic Arabic & English", true, true),
} as const;

export function compatibleFont(font: Design["font"], language: "en" | "ar"): Design["font"] {
  return language === "ar" && !fonts[font].arabic ? (["serif", "source-serif"].includes(font) ? "naskh" : "noto-arabic") : font;
}

export function mixColor(color: string, amount: number, target = 255) {
  return "#" + [1, 3, 5].map((offset) => Math.round(parseInt(color.slice(offset, offset + 2), 16) * (1 - amount) + target * amount).toString(16).padStart(2, "0")).join("");
}
export function presentation(design: Design) {
  const template = templates.find((template) => template.id === design.template)!;
  const sidebar = ["left-sidebar", "right-sidebar", "contemporary"].includes(template.layout);
  return { template, font: fonts[compatibleFont(design.font, design.language)], sidebar, band: template.band,
    darkSidebar: template.layout === "left-sidebar" || template.layout === "right-sidebar",
    sidebarColor: mixColor(design.accent, 0.52, 20), tint: mixColor(design.accent, 0.82), faint: mixColor(design.accent, 0.94),
  };
}

export function sectionPlan(layout: Layout, sections: ResumeSection[]) {
  const visible = sections.filter((section) => !section.hidden);
  return {
    main: layout === "single" ? visible : visible.filter((section) => section.column === 0),
    side: layout === "single" ? [] : visible.filter((section) => section.column === 1),
    contactsInSide: layout === "left-sidebar" || layout === "contemporary",
  };
}

export const sectionIconPaths = {
  summary: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"],
  experience: ["M4 7h16v14H4z", "M8 7V3h8v4", "M4 12h16", "M10 12v3h4v-3"],
  education: ["M2 9l10-6 10 6-10 6z", "M5 11v7l7 4 7-4v-7", "M22 9v9"],
  skills: ["M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"],
  contact: ["M3 5h18v14H3z", "M3 5l9 7 9-7"],
} as const;
export type SectionIcon = keyof typeof sectionIconPaths;
export const wavePath = "M0 0H600V145C480 85 445 23 300 49S108 112 0 0Z";

