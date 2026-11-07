"use client";

import type { ReactNode } from "react";
import { Document, Image, Page, Path, StyleSheet, Svg, View, pdf } from "@react-pdf/renderer";
import { Link, PdfDirection, Text } from "./pdf-text";
import { contacts, designTokens, ink, safeHref, sidebarFraction } from "@/resume/design";
import { presentation, sectionIconPaths, sectionPlan, wavePath, type fonts, type SectionIcon } from "@/resume/presentation";
import type { Block, ChartValue, RatingValue, ResumeSection, Resume, RichText, TextRun } from "@/resume/model";
import { fieldValue, filledItems, itemParts, richValue, tagsValue, textValue } from "@/resume/sections";
import { PdfRating, PdfTimeChart } from "./pdf-visual-fields";
import { registerPdfFonts, withArabicFallback } from "@/resume/pdf-fonts";
import { translate } from "@/resume/translations";

type PdfFont = typeof fonts[keyof typeof fonts];
function pdfRun(run: TextRun, key: number, font: PdfFont) {
  const bold = run.marks?.some((mark) => mark.type === "bold");
  const italic = run.marks?.some((mark) => mark.type === "italic");
  return <Text key={key} style={{ fontFamily: withArabicFallback(bold ? (italic ? font.boldItalic : font.bold) : (italic ? font.italic : font.regular), bold) }}>{run.text}</Text>;
}
function pdfBlock(node: Block, key: number, font: PdfFont, bullet = false): ReactNode {
  if (node.type === "paragraph") return <Text key={key} style={{ marginBottom: 3 }} orphans={2} widows={2}>
    {bullet ? "•  " : ""}{node.content?.length ? node.content.map((run, i) => pdfRun(run, i, font)) : " "}
  </Text>;
  return <View key={key}>{node.content.map((item, i) => <View key={i}>
    {item.content.map((block, j) => pdfBlock(block, j, font, j === 0))}
  </View>)}</View>;
}
function Rich({ value, font }: { value: RichText; font: PdfFont }) {
  return <View style={{ marginTop: 4 }}>{value.content.map((block, i) => pdfBlock(block, i, font))}</View>;
}
function Symbol({ id, color }: { id: SectionIcon; color: string }) {
  return <Svg width={11} height={11} viewBox="0 0 24 24">{sectionIconPaths[id].map((d, i) =>
    <Path key={i} d={d} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />)}</Svg>;
}

export function ResumePdf({ resume }: { resume: Resume }) {
  registerPdfFonts();
  const { personal, design } = resume;
  const rtl = design.language === "ar";
  const t = designTokens(design);
  const { template, font, sidebar, darkSidebar, sidebarColor, tint, band } = presentation(design);
  const plan = sectionPlan(template.layout, resume.sections);
  const centered = template.align === "center";
  const split = template.layout === "split";
  const right = template.layout === "right-sidebar";
  const editorial = design.template === "editorial";
  const academic = design.template === "academic";
  const icons = template.section === "icons";
  const ruled = ["rule", "strong", "center"].includes(template.section);
  const strong = template.section === "strong";
  const bar = template.section === "bar";
  const paperWidth = t.width - t.inset * 2;
  const photoSize = sidebar ? (icons ? 91 : 78) : 64;
  const headingColor = band ? "#ffffff" : editorial ? "#3f3021" : template.decoration === "wave" ? t.accent : ink.heading;

  const styles = StyleSheet.create({
    page: { fontFamily: withArabicFallback(font.regular), direction: rtl ? "rtl" : "ltr", textAlign: rtl ? "right" : "left", fontSize: 9.25, lineHeight: rtl ? Math.max(t.line, 1.65) : t.line, color: ink.body, backgroundColor: template.background,
      paddingTop: t.inset, paddingBottom: t.inset, paddingHorizontal: sidebar ? 0 : t.inset },
    sidebarBackground: { position: "absolute", top: 0, bottom: 0, left: right !== rtl ? t.width * (1 - sidebarFraction) : 0, width: t.width * sidebarFraction, backgroundColor: sidebarColor },
    columns: { flexDirection: rtl ? "row-reverse" : "row", columnGap: split ? 26 : 0 },
    main: { width: sidebar ? t.width * (1 - sidebarFraction) : (paperWidth - 26) * 0.6, paddingHorizontal: sidebar ? t.inset * 0.76 : 0 },
    side: { width: sidebar ? t.width * sidebarFraction : (paperWidth - 26) * 0.4, paddingHorizontal: sidebar ? 20 : 0, color: darkSidebar ? ink.sidebarText : ink.body },
    masthead: { backgroundColor: band ? t.accent : undefined, padding: band ? 18 : 0, borderBottomWidth: design.template === "executive" ? 1.5 : 0,
      borderBottomColor: t.accent, paddingBottom: band ? 18 : design.template === "executive" ? 14 : template.decoration === "wave" ? 15 : 0 },
    header: { flexDirection: centered ? "column" : rtl ? "row-reverse" : "row", alignItems: centered ? "center" : "flex-start", columnGap: 14, rowGap: 9 },
    identity: { flexGrow: 1, flexShrink: 1, alignSelf: centered ? "stretch" : undefined, textAlign: centered ? "center" : rtl ? "right" : "left" },
    photo: { width: photoSize, height: photoSize, objectFit: "cover", borderRadius: design.photoShape === "circle" ? photoSize / 2 : 4 },
    photoWrap: { width: photoSize, height: photoSize, position: "relative", flexShrink: 0 },
    sidePhoto: { alignSelf: "center", marginTop: icons ? 8 : 0, marginBottom: icons ? 25 : t.section },
    rightHero: { minHeight: 104, alignItems: "center" },
    name: { fontFamily: withArabicFallback(template.lightName ? font.regular : font.bold, !template.lightName), color: headingColor, fontSize: template.nameSize, lineHeight: rtl ? 1.4 : 1.04 },
    headline: { color: band ? "#ffffff" : academic ? ink.muted : editorial ? "#6d5a47" : icons ? ink.heading : t.accent,
      fontFamily: withArabicFallback(design.template === "elegant" ? font.italic : academic || editorial ? font.regular : font.bold, !academic && !editorial),
      fontSize: editorial ? 9 : icons ? 11 : 13, marginTop: editorial ? 14 : 5,
      letterSpacing: rtl ? 0 : editorial ? 1.62 : icons ? 0.99 : 0,
      backgroundColor: icons ? tint : undefined, borderRadius: icons ? 11 : 0, paddingVertical: icons ? 5 : 0, paddingHorizontal: icons ? 10 : 0 },
    contacts: { flexDirection: rtl ? "row-reverse" : "row", flexWrap: "wrap", justifyContent: centered ? "center" : "flex-start", marginTop: editorial ? 17 : 11,
      columnGap: 12, rowGap: 4, fontSize: 8.5, color: band ? "#ffffff" : ink.muted,
      borderTopWidth: editorial ? 0.65 : 0, borderBottomWidth: editorial ? 0.65 : 0, borderColor: "#d7cec2", paddingVertical: editorial ? 12 : 0 },
    sideContacts: { flexDirection: "column", marginTop: 0, color: darkSidebar ? ink.sidebarText : ink.body },
    section: { marginTop: t.section * (editorial ? 1.4 : academic ? 1.25 : design.template === "minimal-split" ? 1.5 : 1) },
    sectionTitle: { flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", columnGap: 6,
      paddingBottom: bar ? 0 : template.section === "plain" ? 3 : 4, marginBottom: 5,
      paddingTop: editorial ? 12 : 0, borderTopWidth: editorial ? 0.65 : 0, borderTopColor: "#d7cec2",
      borderBottomWidth: ruled ? (strong ? 1.5 : 0.65) : 0, borderBottomColor: strong || academic ? ink.heading : ink.line,
      borderLeftWidth: bar && !rtl ? 2 : 0, borderLeftColor: t.accent, borderRightWidth: bar && rtl ? 2 : 0, borderRightColor: t.accent, paddingLeft: bar && !rtl ? 7 : 0, paddingRight: bar && rtl ? 7 : 0, justifyContent: template.section === "center" ? "center" : "flex-start" },
    sectionText: { fontSize: strong ? 11 : template.section === "center" ? 12 : icons ? 10.5 : design.template === "essential" ? 10 : template.section === "plain" ? 8 : 9,
      fontFamily: withArabicFallback(template.section === "center" || template.section === "plain" && design.template !== "essential" ? font.regular : font.bold, template.section !== "center" && template.section !== "plain"),
      color: strong || academic ? ink.heading : design.template === "essential" || design.template === "modern-split" ? ink.muted : t.accent,
      letterSpacing: rtl || icons || template.section === "center" || design.template === "modern-split" ? 0 : strong || template.section === "plain" ? 0.3 : 1.08 },
    icon: { backgroundColor: tint, borderRadius: 3, padding: 3 },
    entry: { marginBottom: t.entry },
    entryHeading: { flexDirection: rtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", columnGap: 10 },
    entryTitle: { fontFamily: withArabicFallback(font.bold, true), fontSize: 10.5, color: ink.heading, flexShrink: 1 },
    date: { color: ink.muted, fontSize: 8.2, textAlign: rtl ? "left" : "right", maxWidth: "40%" },
    meta: { color: ["modern-split", "essential"].includes(design.template) ? t.accent : ink.muted, fontSize: 9 },
    skills: { flexDirection: rtl ? "row-reverse" : "row", flexWrap: "wrap", gap: template.plainSkills ? 8 : 4 },
    skill: { borderRadius: 3, paddingHorizontal: template.plainSkills ? 0 : 5, paddingVertical: 2, backgroundColor: template.plainSkills ? undefined : "#edf3f1" },
  });

  const textColor = (inSide: boolean) => inSide && darkSidebar ? ink.sidebarText : ink.muted;
  function section(title: string, icon: SectionIcon, content: ReactNode, inSide = false, first = false) {
    return <View style={first ? { marginTop: 0 } : styles.section}>
      <View minPresenceAhead={22} style={inSide && darkSidebar ? [styles.sectionTitle, { borderBottomColor: "#8aa59b" }] : styles.sectionTitle}>
        {icons && <View style={styles.icon}><Symbol id={icon} color={t.accent} /></View>}
        <Text style={inSide && darkSidebar ? [styles.sectionText, { color: "#ffffff" }] : styles.sectionText}>{template.sectionCase === "title" || template.section === "center" ? title : title.toUpperCase()}</Text>
      </View>{content}
    </View>;
  }
  const contactList = (inSide = false) => {
    const items = contacts(personal);
    return items.length ? <View style={inSide ? [styles.contacts, styles.sideContacts] : styles.contacts}>{items.map(({ key, text, href }) => href
      ? <Link key={key} src={href} style={{ direction: "ltr", color: inSide && darkSidebar ? ink.sidebarText : band && !inSide ? "#ffffff" : ink.muted, textDecoration: "none" }}>{text}</Link>
      : <Text key={key}>{text}</Text>)}</View> : null;
  };
  function resumeSection(data: ResumeSection, inSide = false, first = false) {
    const entries = filledItems(data);
    if (data.hidden || !entries.length) return null;
    const body = <View style={editorial && data.kind === "prose" ? { paddingHorizontal: 12, textAlign: "center", fontSize: 11, lineHeight: 1.6 } : undefined}>
      {entries.map((item, index) => {
        const parts = itemParts(data, item, template.companyFirst);
        return <View key={item.id} style={index === entries.length - 1 ? undefined : styles.entry}>
          {(parts.title || parts.date || parts.subtitle || parts.details) && <View minPresenceAhead={parts.body.length ? 15 : 0}>
            {(parts.title || parts.date) && <View style={inSide ? { flexDirection: "column" } : styles.entryHeading}>
              {parts.title && <Text style={inSide && darkSidebar ? [styles.entryTitle, { color: "#ffffff" }] : styles.entryTitle}>{parts.title}</Text>}
              {parts.date && <Text style={inSide ? { fontSize: 8.2, color: textColor(inSide), marginTop: 3 } : styles.date}>{parts.date}</Text>}
            </View>}
            {parts.subtitle && <Text style={inSide && darkSidebar ? [styles.meta, { color: ink.sidebarText }] : styles.meta}>{parts.subtitle}</Text>}
            {parts.details && <Text style={{ color: textColor(inSide), fontSize: 9 }}>{parts.details}</Text>}
          </View>}
          {parts.body.map((field) => <View key={field.id} style={{ marginTop: 2 }}>
            {field.type !== "link" && field.showLabel && field.label && <Text style={{ fontFamily: withArabicFallback(font.bold, true), fontSize: 9 }}>{field.label}</Text>}
            {field.type === "richText" ? <Rich value={richValue(item, field)} font={font} />
              : field.type === "tags" ? <View style={inSide ? [styles.skills, { flexDirection: "column", gap: 4 }] : styles.skills}>
                {tagsValue(item, field).map((tag, i) => <Text key={i} style={inSide ? { paddingVertical: 2 } : styles.skill}>{tag}</Text>)}
              </View> : field.type === "rating" ? <PdfRating value={fieldValue(item, field) as RatingValue} color={inSide && darkSidebar ? "#ffffff" : t.accent} />
                : field.type === "chart" ? <PdfTimeChart value={fieldValue(item, field) as ChartValue} accent={t.accent} />
                : field.type === "image" ? <Image src={textValue(item, field)} style={{ width: 36, height: 36, objectFit: "contain", marginTop: 3 }} />
                : safeHref(textValue(item, field)) ? <Link src={safeHref(textValue(item, field))!} style={{ color: inSide && darkSidebar ? ink.sidebarText : t.accent, fontSize: 9, textDecoration: "none" }}>{field.showLabel && field.label ? field.label + ": " : ""}{textValue(item, field)}</Link>
                : <Text style={{ fontSize: 9 }}>{field.showLabel && field.label ? field.label + ": " : ""}{textValue(item, field)}</Text>}
          </View>)}
        </View>;
      })}
    </View>;
    return data.name.trim() ? section(data.name, data.icon, body, inSide, first) : <View style={first ? undefined : styles.section}>{body}</View>;
  }
  const group = (sections: ResumeSection[], inSide = false) => sections.filter((data) => filledItems(data).length > 0).map((data, i) => <View key={data.id}>{resumeSection(data, inSide, sidebar && inSide && i === 0 && !plan.contactsInSide)}</View>);
  const photo = personal.photo ? <View style={styles.photoWrap}>
    {template.decoration === "organic" && <Svg width={photoSize + 12} height={photoSize + 12} viewBox="0 0 100 100" style={{ position: "absolute", top: -5, left: -5 }}>
      <Path d="M24 2C57-2 97 8 96 35L87 79C80 106 30 96 7 74S4 12 24 2Z" fill={tint} />
      <Path d="M4 34C2 6 50 13 76 9S104 46 84 73L45 94C18 99-8 66 4 34Z" fill={t.accent} opacity={0.2} />
    </Svg>}
    <Image src={personal.photo} style={styles.photo} />
  </View> : null;
  const identity = (personal.name.trim() || personal.headline.trim()) && <View style={styles.identity}>
    {personal.name.trim() && <Text style={styles.name}>{template.uppercaseName ? personal.name.toUpperCase() : personal.name}</Text>}
    {personal.headline.trim() && <Text style={styles.headline}>{editorial || icons ? personal.headline.toUpperCase() : personal.headline}</Text>}
  </View>;
  const header = identity || (!sidebar && photo) ? <View style={styles.header}>
    {centered && !sidebar && photo}{identity || null}{!centered && !sidebar && photo}
  </View> : null;
  const masthead = <View style={styles.masthead}>{header}{!plan.contactsInSide && contactList()}</View>;
  const sidePhoto = photo && <View style={styles.sidePhoto}>{photo}</View>;
  const side = <View style={styles.side}>
    {sidebar && (right ? <View style={styles.rightHero}>{sidePhoto}</View> : sidePhoto)}
    {plan.contactsInSide && contactList(true) && section(translate("Contact", design.language), "contact", contactList(true), true, true)}
    {group(plan.side, true)}
  </View>;
  const main = <View style={styles.main}>{sidebar && masthead}{group(plan.main)}</View>;

  return <PdfDirection.Provider value={rtl ? "rtl" : "ltr"}><Document title={resume.title.trim() || "Resume"} author={personal.name}>
    <Page size={design.paper} style={styles.page} wrap>
      {darkSidebar && <View style={styles.sidebarBackground} fixed />}
      {template.decoration === "wave" && <Svg width={t.width} height={145} viewBox="0 0 600 145" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
        <Path d={wavePath} fill={tint} /><Path d="M40 0C200 180 270-75 440 47S600 24 600 0" fill="none" stroke="#ffffff" strokeWidth={1.2} />
      </Svg>}
      {sidebar ? <View style={styles.columns}>{!right && side}{main}{right && side}</View>
        : split ? <>{masthead}<View style={styles.columns}>{main}{side}</View></> : <>{masthead}{group(plan.main)}</>}
    </Page>
  </Document></PdfDirection.Provider>;
}

export function generatePdf(resume: Resume) {
  return pdf(<ResumePdf resume={resume} />).toBlob();
}

