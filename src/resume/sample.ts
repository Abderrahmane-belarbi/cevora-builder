import { upgradeLegacyResume } from "./migration";
import { translate, type Language } from "./translations";
import { type Design, type Paragraph, type LegacyResume, type Resume, type RichText, type TextRun } from "./model";

const p = (text: string): Paragraph => ({ type: "paragraph", content: [{ type: "text", text }] });
const rich = (...bullets: string[]): RichText => ({
  type: "doc", content: [{ type: "bulletList", content: bullets.map((line) => ({ type: "listItem", content: [p(line)] })) }],
});
const strong = (text: string): TextRun => ({ type: "text", text, marks: [{ type: "bold" }] });
const defaultDesign = (): Design => ({ template: "classic", accent: "#0e7066", spacing: "comfortable", paper: "A4", font: "sans", photoShape: "circle", language: "en" });

export const emptyResume = (): Resume => ({
  schemaVersion: 2, title: "",
  personal: { name: "", headline: "", email: "", phone: "", location: "", website: "", linkedin: "", photo: null },
  sections: [],
  design: defaultDesign(),
});

const legacySample = (): LegacyResume => ({
  schemaVersion: 1,
  title: "Jordan Lee — Résumé",
  personal: {
    photo: null,
    name: "Jordan Lee", headline: "Senior Product Designer", email: "jordan.lee@example.com",
    phone: "+1 (415) 555-0142", location: "Brooklyn, NY", website: "jordanlee.example.com", linkedin: "linkedin.com/in/jordanlee-design",
  },
  summary: { type: "doc", content: [{ type: "paragraph", content: [
    { type: "text", text: "Product designer with 7+ years of experience turning complex problems into " },
    strong("clear, accessible digital experiences"),
    { type: "text", text: ". I bring research, systems thinking, and a hands-on design practice to cross-functional teams building products people use every day." },
  ] }] },
  experience: [
    { id: "example-current", role: "Senior Product Designer", company: "Northline Studio", location: "New York, NY", start: "2022", end: "Present",
      description: rich(
        "Led a redesign of the onboarding experience, increasing activation by 24% across new accounts.",
        "Built and maintained a component library used by four product teams, improving consistency and release speed.",
      ) },
    { id: "example-previous", role: "Product Designer", company: "Common Thread", location: "Remote", start: "2019", end: "2022",
      description: rich(
        "Designed self-service reporting tools from research through launch, partnering with engineering and data teams.",
        "Ran usability sessions and translated findings into product improvements for a growing customer base.",
      ) },
  ],
  education: [{ id: "example-degree", degree: "BFA, Communication Design", school: "Parsons School of Design", location: "New York, NY", start: "2015", end: "2019" }],
  skills: ["Product strategy", "Interaction design", "Design systems", "User research", "Prototyping", "Accessibility"],
  visibility: { summary: true, experience: true, education: true, skills: true },
  design: defaultDesign(),
});

export function sampleResume(language: Language = "en"): Resume {
  const resume = upgradeLegacyResume(legacySample());
  if (language === "en") return resume;
  resume.title = "سارة أحمد — السيرة الذاتية";
  resume.design = { ...resume.design, language: "ar", font: "noto-arabic", template: "atlas" };
  resume.personal = { ...resume.personal, name: "سارة أحمد", headline: "مصممة منتجات أولى", location: "الرياض، السعودية", email: "sara.ahmed@example.com", phone: "+966 50 123 4567", website: "sara.example.com", linkedin: "linkedin.com/in/sara-ahmed" };
  resume.sections.forEach((section) => {
    section.name = translate(section.name, language);
    section.fields.forEach((field) => { field.label = translate(field.label, language); });
  });
  resume.sections[0].items[0].values.text = { type: "doc", content: [p("مصممة منتجات بخبرة تزيد عن سبع سنوات في تطوير تجارب رقمية واضحة وسهلة الاستخدام. أجمع بين البحث والتفكير المنظومي والتعاون مع فرق متعددة التخصصات لبناء منتجات تلبي احتياجات المستخدمين.")] };
  resume.sections[1].items[0].values = { role: "مصممة منتجات أولى", company: "استوديو آفاق", location: "الرياض، السعودية", start: "2022", end: "حتى الآن", description: rich("قدت إعادة تصميم تجربة الانضمام، مما ساهم في تحسين تفاعل المستخدمين الجدد بنسبة 24%.", "طورت مكتبة مكونات مشتركة باستخدام Figma وReact لدعم أربع فرق منتجات.") };
  resume.sections[1].items[1].values = { role: "مصممة منتجات", company: "شركة مسارات", location: "عن بُعد", start: "2019", end: "2022", description: rich("صممت أدوات تقارير سهلة الاستخدام بالتعاون مع فرق الهندسة والبيانات.", "أجريت اختبارات قابلية الاستخدام وحولت نتائجها إلى تحسينات عملية في المنتج.") };
  resume.sections[2].items[0].values = { degree: "بكالوريوس التصميم والاتصال البصري", school: "جامعة المعرفة", location: "الرياض، السعودية", start: "2015", end: "2019" };
  resume.sections[3].items[0].values.tags = ["استراتيجية المنتج", "تصميم التفاعل", "أنظمة التصميم", "بحث المستخدم", "النماذج الأولية", "إمكانية الوصول"];
  return resume;
}
