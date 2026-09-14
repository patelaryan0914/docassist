import { InferenceClient } from "@huggingface/inference";

export const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";
export const EMBEDDING_DIMS = 384;

const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";
const EMBED_BATCH = 16;

function getHfToken() {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) {
    throw new Error("HF_TOKEN is required for embeddings");
  }
  return token;
}

let hfClient: InferenceClient | undefined;

function client() {
  hfClient ??= new InferenceClient(getHfToken());
  return hfClient;
}

function meanPool(tokens: number[][]): number[] {
  const dims = tokens[0]?.length ?? 0;
  const pooled = new Array<number>(dims).fill(0);
  for (const token of tokens) {
    for (let i = 0; i < dims; i++) {
      pooled[i] = (pooled[i] ?? 0) + (token[i] ?? 0);
    }
  }
  const count = tokens.length || 1;
  return pooled.map((value) => value / count);
}

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function toVector(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Hugging Face returned an empty embedding");
  }
  if (typeof value[0] === "number") {
    return l2Normalize(value as number[]);
  }
  if (Array.isArray(value[0]) && typeof value[0][0] === "number") {
    return l2Normalize(meanPool(value as number[][]));
  }
  throw new Error("Unexpected embedding shape from Hugging Face");
}

function toVectors(value: unknown, count: number): number[][] {
  if (count === 1) {
    return [toVector(value)];
  }
  if (!Array.isArray(value)) {
    throw new Error("Hugging Face returned a non-array batch embedding");
  }
  return (value as unknown[]).map((item) => toVector(item));
}

const RETRYABLE_INFERENCE =
  /503|502|504|429|529|loading|overloaded|timeout|econnreset|fetch failed|could not connect|workload|requested port|temporar|unavailable/i;

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRYABLE_INFERENCE.test(message) || attempt === 5) {
        throw error;
      }
      const waitMs = Math.min(20_000, 1500 * 2 ** attempt);
      console.warn(
        `  embedding retry ${attempt + 1}/5 in ${Math.round(waitMs / 1000)}s — ${message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const output = await withRetry(() =>
    client().featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: texts.length === 1 ? (texts[0] as string) : texts,
      normalize: true,
      provider: "hf-inference",
    }),
  );
  return toVectors(output, texts.length);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    embeddings.push(...(await embedBatch(batch)));
  }
  return embeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedBatch([`${QUERY_PREFIX}${text}`]);
  if (!embedding) {
    throw new Error("Hugging Face returned no query embedding");
  }
  return embedding;
}
