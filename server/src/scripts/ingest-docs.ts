import {
  DOCUMENTATION_SLUGS,
  normalizeDocumentationSlug,
  type DocumentationSlug,
} from "../constants/documentation.js";
import { chunkMarkdown } from "../rag/chunk.js";
import { embedTexts } from "../rag/embeddings.js";
import { scrapeDocumentation } from "../rag/scrape-docs.js";
import {
  deleteDocumentationPoints,
  ensureCollection,
  upsertChunks,
} from "../rag/qdrant.js";
import { DOC_SOURCES } from "../rag/sources.js";

const EMBED_BATCH = 32;

function readArgs() {
  return process.argv.slice(2);
}

function readNpmConfig(name: string): string | undefined {
  const key = `npm_config_${name.replace(/-/g, "_")}`;
  const value = process.env[key];
  if (value == null || value === "") return undefined;
  return value;
}

function readFlag(name: string): string | undefined {
  const args = readArgs();
  const eq = args.find((arg) => arg.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3) || "true";
  const index = args.indexOf(`--${name}`);
  if (index !== -1) {
    const next = args[index + 1];
    if (!next || next.startsWith("--")) return "true";
    return next;
  }
  return readNpmConfig(name);
}

function readDocsArg(): string | undefined {
  const fromFlag = readFlag("docs");
  if (fromFlag) return fromFlag;
  const positional = readArgs().find(
    (arg) =>
      !arg.startsWith("--") &&
      (arg === "all" ||
        (DOCUMENTATION_SLUGS as readonly string[]).includes(arg)),
  );
  return positional;
}

function resolveDocs(value: string | undefined): DocumentationSlug[] {
  if (!value || value === "all") return [...DOCUMENTATION_SLUGS];
  return value
    .split(",")
    .map((part) => normalizeDocumentationSlug(part.trim()))
    .filter((slug, index, all) => all.indexOf(slug) === index);
}

async function ingestOne(
  slug: DocumentationSlug,
  limit: number,
  keepExisting: boolean,
  concurrency: number,
  usePlaywright: boolean,
) {
  const source = DOC_SOURCES[slug];
  console.log(`\n=== Ingesting ${source.label} (${slug}) ===`);

  await ensureCollection({ recreateIfDimensionMismatch: true });

  if (!keepExisting) {
    console.log(`Deleting previous ${slug} points`);
    await deleteDocumentationPoints(slug);
  }

  const pending: ReturnType<typeof chunkMarkdown> = [];
  let pageCount = 0;
  let chunkCount = 0;
  let writeChain = Promise.resolve();

  const flush = async (force = false) => {
    while (pending.length >= EMBED_BATCH || (force && pending.length)) {
      const batch = pending.splice(0, EMBED_BATCH);
      const embeddings = await embedTexts(batch.map((chunk) => chunk.text));
      await upsertChunks({
        documentation: slug,
        chunks: batch,
        embeddings,
        startIndex: chunkCount,
      });
      chunkCount += batch.length;
      console.log(`  upserted ${chunkCount} vectors`);
    }
  };

  const enqueue = (work: () => Promise<void>) => {
    writeChain = writeChain.then(work, work);
    return writeChain;
  };

  await scrapeDocumentation(source, {
    limit,
    concurrency,
    usePlaywright,
    onPage: async (page) => {
      pageCount += 1;
      const chunks = chunkMarkdown({
        markdown: page.markdown,
        url: page.url,
        title: page.title,
      });
      await enqueue(async () => {
        pending.push(...chunks);
        await flush();
      });
    },
  });

  await enqueue(async () => {
    await flush(true);
  });

  if (!chunkCount) {
    console.warn(`No chunks for ${slug}; nothing to upsert`);
    return;
  }

  console.log(`Done ${slug}: ${pageCount} pages, ${chunkCount} vectors`);
}

async function main() {
  const docs = resolveDocs(readDocsArg());
  const limit = Number(readFlag("limit") ?? 0);
  const concurrency = Number(readFlag("concurrency") ?? 2);
  const keepExisting = readFlag("keep") === "true";
  const usePlaywright =
    readFlag("playwright") === "true" || readFlag("playwrite") === "true";

  if (!process.env.HF_TOKEN) {
    throw new Error("Set HF_TOKEN before ingesting");
  }
  if (!process.env.QDRANT_URL) {
    throw new Error("Set QDRANT_URL before ingesting");
  }

  console.log(
    `Ingest target: ${docs.join(", ")} | limit=${Number.isFinite(limit) ? limit : 0} | concurrency=${concurrency} | keep=${keepExisting} | playwright=${usePlaywright}`,
  );

  for (const slug of docs) {
    await ingestOne(
      slug,
      Number.isFinite(limit) ? limit : 0,
      keepExisting,
      Number.isFinite(concurrency) ? concurrency : 2,
      usePlaywright,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
