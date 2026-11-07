import { z } from "zod";
import type {
  LegacyResume,
  Resume,
  ResumeSection,
  RichText,
  SectionField,
  FieldValue,
} from "./model";

const rich = (text: string): RichText => ({
  type: "doc",
  content: text
    .split("\n")
    .map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text" as const, text: line }] } : {}),
    })),
});
const field = (
  id: string,
  label: string,
  type: SectionField["type"],
  showLabel = false,
): SectionField => ({ id, label, type, showLabel });

export function upgradeLegacyResume(old: LegacyResume): Resume {
  const make = (
    id: keyof LegacyResume["visibility"],
    name: string,
    kind: ResumeSection["kind"],
    icon: ResumeSection["icon"],
    column: 0 | 1,
    fields: SectionField[],
    items: ResumeSection["items"],
  ): ResumeSection => ({
    id: "legacy-" + id,
    name,
    kind,
    icon,
    column,
    fields,
    items,
    hidden: !old.visibility[id],
  });
  return {
    schemaVersion: 2,
    title: old.title,
    personal: old.personal,
    design: old.design,
    sections: [
      make(
        "summary",
        "Professional summary",
        "prose",
        "summary",
        0,
        [field("text", "Text", "richText")],
        [{ id: "legacy-summary-text", values: { text: old.summary } }],
      ),
      make(
        "experience",
        "Work experience",
        "entries",
        "experience",
        0,
        [
          field("role", "Role", "title"),
          field("company", "Organization", "subtitle"),
          field("location", "Location", "text"),
          field("start", "Start date", "date"),
          field("end", "End date", "date"),
          field("description", "Description", "richText"),
        ],
        old.experience.map(({ id, ...values }) => ({ id, values })),
      ),
      make(
        "education",
        "Education",
        "entries",
        "education",
        1,
        [
          field("degree", "Degree", "title"),
          field("school", "Institution", "subtitle"),
          field("location", "Location", "text"),
          field("start", "Start date", "date"),
          field("end", "End date", "date"),
        ],
        old.education.map(({ id, ...values }) => ({ id, values })),
      ),
      make(
        "skills",
        "Skills",
        "tags",
        "skills",
        1,
        [field("tags", "Skills", "tags")],
        [{ id: "legacy-skill-tags", values: { tags: old.skills } }],
      ),
    ],
  };
}

const exampleSchema = z.object({
  title: z.string(),
  header: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  sections: z.record(
    z.string(),
    z.object({
      name: z.string(),
      column: z.union([z.literal(0), z.literal(1)]).default(0),
      order: z.number().int().default(0),
      hidden: z.boolean().default(false),
      items: z.array(z.record(z.string(), z.unknown())),
    }),
  ),
  style: z
    .object({
      layout: z.string().optional(),
      isLetterSize: z.boolean().optional(),
    })
    .optional(),
});
const dateSchema = z.object({
  fromYear: z.number().int().optional(),
  fromMonth: z.number().int().min(0).max(11).optional(),
  toYear: z.number().int().optional(),
  toMonth: z.number().int().min(0).max(11).optional(),
  isOngoing: z.boolean().optional(),
});
function dateText(value: unknown) {
  const parsed = dateSchema.safeParse(value);
  if (!parsed.success)
    throw new Error("Invalid dateRange in the imported section.");
  const date = (year?: number, month?: number) =>
    year === undefined
      ? ""
      : month === undefined
        ? String(year)
        : [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ][month] +
          " " +
          year;
  const d = parsed.data;
  return [
    date(d.fromYear, d.fromMonth),
    d.isOngoing ? "Present" : date(d.toYear, d.toMonth),
  ]
    .filter(Boolean)
    .join(" – ");
}
const label = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
function convertFieldValue(
  type: SectionField["type"],
  key: string,
  value: unknown,
): FieldValue {
  if (value == null)
    return type === "tags" ? [] : type === "richText" ? rich("") : "";
  if (type === "tags") return Array.isArray(value) ? value.map(String) : [];
  if (type === "richText") {
    if (key === "bullets" && Array.isArray(value))
      return value.length
        ? {
            type: "doc",
            content: [
              {
                type: "bulletList",
                content: value.map((text) => ({
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: String(text) || " " }],
                    },
                  ],
                })),
              },
            ],
          }
        : rich("");
    return rich(
      typeof value === "string"
        ? value
        : value == null
          ? ""
          : JSON.stringify(value, null, 2),
    );
  }
  return key === "dateRange"
    ? dateText(value)
    : value == null
      ? ""
      : String(value);
}

/** Adapts the supplied header + named sections example into the versioned model. */
export function convertSectionExample(input: unknown): Resume {
  const parsed = exampleSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Invalid section document at " +
        parsed.error.issues[0].path.join(".") +
        ": " +
        parsed.error.issues[0].message,
    );
  const source = parsed.data;
  const sections = Object.entries(source.sections)
    .sort((a, b) => a[1].column - b[1].column || a[1].order - b[1].order)
    .map(([key, value], sectionIndex): ResumeSection => {
      const keys = [
        ...new Set(value.items.flatMap((item) => Object.keys(item))),
      ];
      const titleKey = [
        "position",
        "degree",
        "role",
        "title",
        "name",
        "workplace",
        "institution",
      ].find((key) => keys.includes(key));
      const subtitleKey = [
        "workplace",
        "institution",
        "issuer",
        "edition",
        "author",
      ].find((key) => keys.includes(key) && key !== titleKey);
      const fields = keys.map((key, index) => {
        const examples = value.items
          .map((item) => item[key])
          .filter((item) => item != null);
        const type: SectionField["type"] =
          key === titleKey
            ? "title"
            : key === subtitleKey
              ? "subtitle"
              : key === "dateRange"
                ? "date"
                : key === "tags"
                  ? "tags"
                  : ["text", "description", "bullets", "quote"].includes(key) ||
                      examples.some((item) => typeof item === "object")
                    ? "richText"
                    : /link|url|logo|image/i.test(key)
                      ? "link"
                      : "text";
        return field(
          "field-" + index,
          label(key),
          type,
          !["title", "subtitle", "date", "richText", "tags", "link"].includes(
            type,
          ),
        );
      });
      const items = value.items.map((item, index) => ({
        id: "import-" + sectionIndex + "-item-" + index,
        values: Object.fromEntries(
          fields.map((field, i) => [
            field.id,
            convertFieldValue(field.type, keys[i], item[keys[i]]),
          ]),
        ),
      }));
      return {
        id: "import-section-" + sectionIndex,
        name: value.name,
        column: value.column,
        hidden: value.hidden,
        kind:
          keys.length === 1 && keys[0] === "text"
            ? "prose"
            : keys.length === 1 && keys[0] === "tags"
              ? "tags"
              : "entries",
        icon: /educat|course|certificate/i.test(key)
          ? "education"
          : /experien|project|volunteer/i.test(key)
            ? "experience"
            : /skill|award|strength|achieve/i.test(key)
              ? "skills"
              : "summary",
        fields,
        items,
      };
    });
  return {
    schemaVersion: 2,
    title: source.title,
    personal: {
      name: source.header.name,
      headline: source.header.title ?? "",
      email: source.header.email ?? "",
      phone: source.header.phone ?? "",
      location: source.header.location ?? "",
      website: source.header.website ?? "",
      linkedin: source.header.linkedin ?? "",
      photo: null,
    },
    sections,
    design: {
      template: source.style?.layout === "double" ? "double-column" : "classic",
      paper: source.style?.isLetterSize ? "LETTER" : "A4",
      font: "sans",
      accent: "#0e7066",
      spacing: "comfortable",
      photoShape: "circle",
      language: "en",
    },
  };
}
