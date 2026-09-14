import type { DocumentationSlug } from "../constants/documentation.js";
import { embedQuery } from "./embeddings.js";
import { searchDocumentation, type RetrievedChunk } from "./qdrant.js";

export function isRagConfigured() {
  return Boolean(process.env.QDRANT_URL?.trim() && process.env.HF_TOKEN?.trim());
}

export type RagSource = {
  title: string;
  url: string;
};

export function uniqueSources(chunks: RetrievedChunk[]): RagSource[] {
  const seen = new Set<string>();
  const sources: RagSource[] = [];
  for (const chunk of chunks) {
    if (!chunk.url || seen.has(chunk.url)) continue;
    seen.add(chunk.url);
    sources.push({
      title: chunk.title || chunk.heading || chunk.url,
      url: chunk.url,
    });
    if (sources.length >= 6) break;
  }
  return sources;
}

export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "";
  return chunks
    .map((chunk, index) => {
      const source = chunk.url || chunk.title;
      const heading = chunk.heading && chunk.heading !== chunk.title
        ? ` — ${chunk.heading}`
        : "";
      return `[${index + 1}] ${chunk.title}${heading}\nSource: ${source}\n${chunk.text}`;
    })
    .join("\n\n---\n\n");
}

export function buildRagSystemPrompt(params: {
  documentation: DocumentationSlug;
  context: string;
}): string {
  const label = params.documentation;
  if (!params.context.trim()) {
    return [
      `You are DocAssist, an expert assistant for ${label} documentation.`,
      "No retrieved documentation snippets were available for this question.",
      "Answer carefully from general knowledge, say when you are unsure, and do not invent APIs.",
    ].join(" ");
  }

  return [
    `You are DocAssist, an expert assistant for official ${label} documentation.`,
    "Use the retrieved snippets as the source of truth.",
    "Prefer code and APIs that appear in the snippets.",
    "Cite supporting snippets inline like [1] or [2].",
    "If the snippets do not contain the answer, say so briefly, then give a cautious best-effort reply.",
    "Do not mention the retrieval system itself.",
    "",
    "Retrieved documentation:",
    params.context,
  ].join("\n");
}

export async function retrieveDocumentationContext(
  documentation: DocumentationSlug,
  query: string,
): Promise<RetrievedChunk[]> {
  if (!isRagConfigured() || !query.trim()) return [];
  const vector = await embedQuery(query.trim().slice(0, 4000));
  return searchDocumentation({
    documentation,
    vector,
    limit: 8,
  });
}
