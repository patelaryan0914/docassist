export const DOCUMENTATION_SLUGS = [
  "stripe",
  "livekit",
  "firebase",
  "openai",
  "nextjs",
] as const;

export type DocumentationSlug = (typeof DOCUMENTATION_SLUGS)[number];

export function normalizeDocumentationSlug(value: unknown): DocumentationSlug {
  if (
    typeof value === "string" &&
    (DOCUMENTATION_SLUGS as readonly string[]).includes(value)
  ) {
    return value as DocumentationSlug;
  }
  return "stripe";
}
