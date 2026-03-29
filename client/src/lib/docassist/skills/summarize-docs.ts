import type { SummarizeDocsInput, SummarizeDocsOutput } from "../types"

export function summarizeDocs(
  input: SummarizeDocsInput
): SummarizeDocsOutput {
  const hint = input.sectionHint?.trim()
  return {
    summary: hint
      ? `High-signal overview of **${input.documentationId}** focused on “${hint}”: auth flows, core APIs, and the fastest path to a working integration.`
      : `Executive summary of **${input.documentationId}** documentation: entry points, SDKs, and the minimum viable integration path for production apps.`,
    bulletPoints: [
      "Indexed sections map to retrievable chunks for RAG-style answers.",
      "Sources are returned alongside answers for trust and deep links.",
      "Skills are composable: summarize → query → generate snippet.",
    ],
  }
}
