import { chromium, type Browser, type Page } from "playwright";
import { titleFromUrl, type DocSource } from "./sources.js";
import { collectDocumentationUrls } from "./sitemap.js";

const MAX_BODY_CHARS = 80_000;
const MIN_BODY_CHARS = 160;
const PLAYWRIGHT_BATCH = 20;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export type ScrapedPage = {
  url: string;
  title: string;
  markdown: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTitle(markdown: string, fallback: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback;
}

async function fetchMarkdown(url: string): Promise<string | null> {
  const candidates = url.endsWith(".md")
    ? [url]
    : [`${url.replace(/\/$/, "")}.md`, url];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/markdown, text/plain;q=0.9, */*;q=0.1",
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") ?? "";
      const raw = (await response.text()).slice(0, MAX_BODY_CHARS);
      if (raw.length < MIN_BODY_CHARS) continue;
      if (contentType.includes("html") || raw.trimStart().startsWith("<!")) continue;
      return raw;
    } catch {
      // try next candidate
    }
  }
  return null;
}

const EXTRACT_PAGE_SCRIPT = `(() => {
  const root =
    document.querySelector("article") ||
    document.querySelector("[role='main']") ||
    document.querySelector("main") ||
    document.body;
  const clone = root.cloneNode(true);
  clone.querySelectorAll(
    "nav, aside, footer, script, style, noscript, iframe, header, [role='navigation'], [role='complementary']",
  ).forEach(function (node) { node.remove(); });
  const text = (clone.textContent || "").replace(/\\s+\\n/g, "\\n").replace(/\\n{3,}/g, "\\n\\n").trim();
  const heading = document.querySelector("h1");
  const title = (heading && heading.textContent ? heading.textContent.trim() : "") ||
    document.title.replace(/\\s+[|\\-–].*$/, "").trim();
  return { title: title, markdown: text.slice(0, ${MAX_BODY_CHARS}) };
})()`;

async function scrapeWithPlaywright(page: Page, url: string): Promise<ScrapedPage | null> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  if (!response || !response.ok()) return null;
  await page.waitForSelector("h1, article, main", { timeout: 8_000 }).catch(() => undefined);
  const extracted = (await page.evaluate(EXTRACT_PAGE_SCRIPT)) as {
    title: string;
    markdown: string;
  };
  if (!extracted.markdown || extracted.markdown.length < MIN_BODY_CHARS) return null;
  return {
    url,
    title: extracted.title || titleFromUrl(url),
    markdown: extracted.markdown,
  };
}

async function emitPage(
  page: ScrapedPage,
  index: number,
  total: number,
  options: {
    onPage?: (page: ScrapedPage, index: number, total: number) => Promise<void> | void;
    collected: ScrapedPage[];
  },
) {
  if (options.onPage) {
    await options.onPage(page, index, total);
  } else {
    options.collected.push(page);
  }
  console.log(`  scraped (${index + 1}/${total}): ${page.url}`);
}

export async function scrapeDocumentation(
  source: DocSource,
  options: {
    limit?: number;
    concurrency?: number;
    delayMs?: number;
    onPage?: (page: ScrapedPage, index: number, total: number) => Promise<void> | void;
    usePlaywright?: boolean;
  } = {},
): Promise<ScrapedPage[]> {
  const limit = options.limit ?? 0;
  const delayMs = options.delayMs ?? 80;
  const collected: ScrapedPage[] = [];

  const urls = await collectDocumentationUrls(source);
  const selected = limit > 0 ? urls.slice(0, limit) : urls;
  console.log(`Sitemap kept ${urls.length} documentation URLs, scraping ${selected.length}`);

  const needsPlaywright: Array<{ url: string; index: number }> = [];

  for (const [index, url] of selected.entries()) {
    if (!url) continue;
    const markdown = await fetchMarkdown(url);
    if (markdown) {
      await emitPage(
        {
          url,
          title: extractTitle(markdown, titleFromUrl(url)),
          markdown,
        },
        index,
        selected.length,
        { onPage: options.onPage, collected },
      );
    } else {
      needsPlaywright.push({ url, index });
    }
    if (delayMs) await sleep(delayMs);
  }

  if (!options.usePlaywright) {
    if (needsPlaywright.length) {
      console.warn(`  skipped ${needsPlaywright.length} HTML-only pages (pass --playwright to scrape them)`);
    }
    return collected;
  }

  for (let start = 0; start < needsPlaywright.length; start += PLAYWRIGHT_BATCH) {
    const batch = needsPlaywright.slice(start, start + PLAYWRIGHT_BATCH);
    const browser: Browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        userAgent: USER_AGENT,
        locale: "en-US",
        javaScriptEnabled: true,
      });
      await context.route("**/*", (route) => {
        const type = route.request().resourceType();
        if (type === "image" || type === "media" || type === "font" || type === "stylesheet") {
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      for (const item of batch) {
        try {
          const scraped = await scrapeWithPlaywright(page, item.url);
          if (scraped) {
            await emitPage(scraped, item.index, selected.length, {
              onPage: options.onPage,
              collected,
            });
          } else {
            console.warn(`  skip (${item.index + 1}/${selected.length}): ${item.url}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`  error (${item.index + 1}/${selected.length}): ${item.url} — ${message}`);
        }
        if (delayMs) await sleep(delayMs);
      }
      await page.close();
      await context.close();
    } finally {
      await browser.close();
    }
  }

  return collected;
}
