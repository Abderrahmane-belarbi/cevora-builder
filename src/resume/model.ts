import { z } from "zod";
import { convertSectionExample, upgradeLegacyResume } from "./migration";

export type TextRun = {
  type: "text";
  text: string;
  marks?: { type: "bold" | "italic" }[];
};
export type Paragraph = { type: "paragraph"; content?: TextRun[] };
export type BulletList = { type: "bulletList"; content: ListItem[] };
type ListItem = { type: "listItem"; content: [Paragraph, ...Block[]] };
export type Block = Paragraph | BulletList;
export type RichText = { type: "doc"; content: Block[] };

const paragraph = z.strictObject({
  type: z.literal("paragraph"),
  content: z
    .array(
      z.strictObject({
        type: z.literal("text"),
        text: z.string().min(1),
        marks: z
          .array(z.strictObject({ type: z.enum(["bold", "italic"]) }))
          .optional(),
      }),
    )
    .optional(),
});

const block: z.ZodType<Block> = z.lazy(() => z.union([paragraph, bulletList]));
const bulletList: z.ZodType<BulletList> = z.strictObject({
  type: z.literal("bulletList"),
  content: z
    .array(
      z.strictObject({
        type: z.literal("listItem"),
        content: z.tuple([paragraph], block),
      }),
    )
    .min(1),
});
const richText: z.ZodType<RichText> = z.strictObject({
  type: z.literal("doc"),
  content: z.array(block).min(1),
});

const string = z.string();
const entry = {
  id: string.min(1),
  location: string,
  start: string,
  end: string,
};
function uniqueIds(entries: { id: string }[]) {
  return new Set(entries.map(({ id }) => id)).size === entries.length;
}

export const accentColors = [
  "#0e7066",
  "#253e66",
  "#785147",
  "#654b76",
  "#333d46",
] as const;
export const templateIds = [
  "classic",
  "modern",
  "executive",
  "professional",
  "minimal",
  "elegant",
  "double-column",
  "academic",
  "side-panel",
  "editorial",
  "modern-split",
  "contemporary",
  "wave",
  "essential",
  "minimal-split",
  "atlas", "horizon", "linen", "studio", "scholar", "mosaic",
] as const;
export const fontIds = ["sans", "serif", "mono", "lato", "open-sans", "source-serif", "noto-arabic", "naskh", "cairo", "amiri"] as const;
// Photos stay inside the backup, with no remote URLs or file-path dependencies.
export const photoSchema = z
  .string()
  .max(350_000, "Photo is too large. Please upload it again.")
  .regex(
    /^data:image\/(?:jpeg|png);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    "Use a JPEG or PNG profile photo.",
  )
  .refine(
    (value) =>
      value.startsWith("data:image/jpeg;base64,/9j/") ||
      value.startsWith("data:image/png;base64,iVBORw0KGgo"),
    "The profile photo data is invalid.",
  );
export const legacyResumeSchema = z.strictObject({
  schemaVersion: z.literal(1),
  title: string,
  personal: z.strictObject({
    name: string,
    headline: string,
    email: string,
    phone: string,
    location: string,
    website: string,
    linkedin: string,
    photo: photoSchema.nullable().default(null),
  }),
  summary: richText,
  experience: z
    .array(
      z.strictObject({
        ...entry,
        role: string,
        company: string,
        description: richText,
      }),
    )
    .refine(uniqueIds, "Duplicate experience IDs"),
  education: z
    .array(z.strictObject({ ...entry, degree: string, school: string }))
    .refine(uniqueIds, "Duplicate education IDs"),
  skills: z.array(string.min(1)),
  visibility: z.strictObject({
    summary: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
  }),
  design: z.strictObject({
    template: z.enum(templateIds),
    font: z.enum(fontIds).default("sans"),
    photoShape: z.enum(["circle", "square"]).default("circle"),
    accent: z.enum(accentColors),
    spacing: z.enum(["compact", "comfortable", "spacious"]),
    paper: z.enum(["A4", "LETTER"]),
    language: z.enum(["en", "ar"]).default("en"),
  }),
});
export type LegacyResume = z.infer<typeof legacyResumeSchema>;
export type Design = LegacyResume["design"];
export const fieldTypes = [
  "title",
  "subtitle",
  "date",
  "text",
  "richText",
  "tags",
  "link",
  "rating",
  "chart",
  "image",
] as const;
export const fieldTypeLabels = {
  title: "Title",
  subtitle: "Subtitle",
  date: "Date",
  text: "Short text",
  richText: "Rich text / bullets",
  tags: "Tags",
  link: "Link",
  rating: "Proficiency",
  chart: "Time chart",
  image: "Image / logo",
} as const;
export const fieldSchema = z.strictObject({
  id: string.min(1),
  label: string,
  type: z.enum(fieldTypes),
  showLabel: z.boolean().default(false),
  hidden: z.boolean().optional(),
});
export type SectionField = z.infer<typeof fieldSchema>;
const ratingSchema = z
  .strictObject({
    type: z.literal("rating"),
    value: z.number().min(0).max(10),
    max: z.number().int().min(1).max(10),
    style: z.enum(["dots", "bar"]),
  })
  .refine(
    (rating) => rating.value <= rating.max,
    "Proficiency cannot exceed its maximum",
  );
const chartSchema = z.strictObject({
  type: z.literal("chart"),
  segments: z
    .array(
      z.strictObject({
        id: string.min(1),
        label: string,
        value: z.number().min(0).max(1_000_000),
      }),
    )
    .max(20)
    .refine(uniqueIds, "Duplicate chart segment IDs"),
});
export type RatingValue = z.infer<typeof ratingSchema>;
export type ChartValue = z.infer<typeof chartSchema>;
export type FieldValue =
  | string
  | RichText
  | string[]
  | RatingValue
  | ChartValue;
const valueSchema = z.union([
  string,
  richText,
  z.array(string),
  ratingSchema,
  chartSchema,
]);
export const sectionSchema = z
  .strictObject({
    id: string.min(1),
    name: string,
    column: z.union([z.literal(0), z.literal(1)]),
    hidden: z.boolean(),
    icon: z.enum(["summary", "experience", "education", "skills", "contact"]),
    kind: z.enum(["prose", "entries", "tags"]),
    fields: z.array(fieldSchema).refine(uniqueIds, "Duplicate field IDs"),
    items: z
      .array(
        z.strictObject({
          id: string.min(1),
          values: z.record(string, valueSchema),
          hiddenFields: z.array(string).optional(),
        }),
      )
      .refine(uniqueIds, "Duplicate item IDs"),
  })
  .superRefine((section, context) => {
    const fields = new Map(section.fields.map((field) => [field.id, field]));
    section.items.forEach((item, index) => {
      Object.entries(item.values).forEach(([id, value]) => {
        const field = fields.get(id);
        if (
          !field ||
          (field.type === "richText"
            ? typeof value !== "object" ||
              Array.isArray(value) ||
              value.type !== "doc"
            : field.type === "rating"
              ? typeof value !== "object" ||
                Array.isArray(value) ||
                value.type !== "rating"
              : field.type === "chart"
                ? typeof value !== "object" ||
                  Array.isArray(value) ||
                  value.type !== "chart"
                : field.type === "tags"
                  ? !Array.isArray(value)
                  : typeof value !== "string")
        ) {
          context.addIssue({
            code: "custom",
            path: ["items", index, "values", id],
            message: field
              ? "Value does not match this field’s type"
              : "Unknown field ID",
          });
        }
        if (
          field?.type === "image" &&
          typeof value === "string" &&
          value &&
          !photoSchema.safeParse(value).success
        ) {
          context.addIssue({
            code: "custom",
            path: ["items", index, "values", id],
            message: "Use an uploaded JPEG or PNG image",
          });
        }
      });
    });
  });
export const resumeSchema = z.strictObject({
  schemaVersion: z.literal(2),
  title: string,
  personal: legacyResumeSchema.shape.personal,
  sections: z.array(sectionSchema).refine(uniqueIds, "Duplicate section IDs"),
  design: legacyResumeSchema.shape.design,
});
export type Resume = z.infer<typeof resumeSchema>;
export type ResumeSection = Resume["sections"][number];
export type SectionItem = ResumeSection["items"][number];
export const emptyRichText = (): RichText => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export function parseResume(raw: string): Resume {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("This file doesn’t contain valid JSON.");
  }
  if (
    json &&
    typeof json === "object" &&
    "schemaVersion" in json &&
    json.schemaVersion === 1
  ) {
    const legacy = legacyResumeSchema.safeParse(json);
    if (!legacy.success)
      throw new Error(
        "Invalid version 1 backup: " +
          legacy.error.issues[0].path.join(".") +
          " — " +
          legacy.error.issues[0].message,
      );
    json = upgradeLegacyResume(legacy.data);
  } else if (
    json &&
    typeof json === "object" &&
    !("schemaVersion" in json) &&
    "header" in json &&
    "sections" in json
  ) {
    json = convertSectionExample(json);
  }
  let result: ReturnType<typeof resumeSchema.safeParse>;
  try {
    result = resumeSchema.safeParse(json);
  } catch {
    throw new Error("This backup is too deeply nested to read.");
  }
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".") || "document";
    throw new Error(
      field === "schemaVersion"
        ? "This backup uses an unsupported résumé version."
        : "Invalid résumé backup at “" + field + "”: " + issue.message,
    );
  }
  return result.data;
}
