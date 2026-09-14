import { QdrantClient } from "@qdrant/js-client-rest";
import { v5 as uuidv5 } from "uuid";
import type { DocumentationSlug } from "../constants/documentation.js";
import { EMBEDDING_DIMS } from "./embeddings.js";
import type { DocChunk } from "./chunk.js";

const POINT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export type RetrievedChunk = {
  score: number;
  text: string;
  url: string;
  title: string;
  heading: string;
  documentation: DocumentationSlug;
};

export function getCollectionName() {
  return "docassist";
}

export function getQdrantClient() {
  const url = process.env.QDRANT_URL?.trim();
  if (!url) {
    throw new Error("QDRANT_URL is required");
  }
  return new QdrantClient({
    url,
    apiKey: process.env.QDRANT_API_KEY?.trim() || undefined,
  });
}

export function chunkPointId(
  documentation: string,
  url: string,
  text: string,
  index: number,
) {
  return uuidv5(`${documentation}|${url}|${index}|${text.slice(0, 48)}`, POINT_NAMESPACE);
}

function collectionVectorSize(info: { config?: { params?: { vectors?: unknown } } }) {
  const vectors = info.config?.params?.vectors;
  if (vectors && typeof vectors === "object" && "size" in vectors) {
    return Number((vectors as { size?: number }).size);
  }
  return undefined;
}

export async function ensureCollection(options?: {
  recreateIfDimensionMismatch?: boolean;
}) {
  const client = getQdrantClient();
  const name = getCollectionName();
  const existing = await client.collectionExists(name);
  if (existing.exists) {
    const info = await client.getCollection(name);
    const size = collectionVectorSize(info);
    if (size && size !== EMBEDDING_DIMS) {
      if (!options?.recreateIfDimensionMismatch) {
        throw new Error(
          `Qdrant collection ${name} has ${size} dims but Hugging Face embeddings are ${EMBEDDING_DIMS}. Re-run ingest to recreate it.`,
        );
      }
      await client.deleteCollection(name);
    }
  }

  const stillExists = (await client.collectionExists(name)).exists;
  if (!stillExists) {
    await client.createCollection(name, {
      vectors: {
        size: EMBEDDING_DIMS,
        distance: "Cosine",
      },
    });
  }
  try {
    await client.createPayloadIndex(name, {
      field_name: "documentation",
      field_schema: "keyword",
    });
  } catch {
    // index already exists
  }
  return { client, name };
}

export async function deleteDocumentationPoints(documentation: DocumentationSlug) {
  const { client, name } = await ensureCollection();
  await client.delete(name, {
    wait: true,
    filter: {
      must: [{ key: "documentation", match: { value: documentation } }],
    },
  });
}

export async function upsertChunks(params: {
  documentation: DocumentationSlug;
  chunks: DocChunk[];
  embeddings: number[][];
  startIndex?: number;
}) {
  const { client, name } = await ensureCollection();
  const startIndex = params.startIndex ?? 0;
  const points = params.chunks.map((chunk, index) => ({
    id: chunkPointId(
      params.documentation,
      chunk.url,
      chunk.text,
      startIndex + index,
    ),
    vector: params.embeddings[index] ?? [],
    payload: {
      documentation: params.documentation,
      url: chunk.url,
      title: chunk.title,
      heading: chunk.heading,
      text: chunk.text,
      chunkIndex: startIndex + index,
    },
  }));

  const batchSize = 64;
  for (let i = 0; i < points.length; i += batchSize) {
    await client.upsert(name, {
      wait: true,
      points: points.slice(i, i + batchSize),
    });
  }
}

export async function searchDocumentation(params: {
  documentation: DocumentationSlug;
  vector: number[];
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const { client, name } = await ensureCollection();
  const results = await client.query(name, {
    query: params.vector,
    limit: params.limit ?? 8,
    score_threshold: 0.22,
    with_payload: true,
    params: { hnsw_ef: 64 },
    filter: {
      must: [{ key: "documentation", match: { value: params.documentation } }],
    },
  });

  return results.points.flatMap((hit) => {
    const payload = (hit.payload ?? {}) as Record<string, unknown>;
    const text = typeof payload.text === "string" ? payload.text : "";
    if (!text) return [];
    return [
      {
        score: hit.score ?? 0,
        text,
        url: typeof payload.url === "string" ? payload.url : "",
        title: typeof payload.title === "string" ? payload.title : "",
        heading: typeof payload.heading === "string" ? payload.heading : "",
        documentation: params.documentation,
      },
    ];
  });
}
