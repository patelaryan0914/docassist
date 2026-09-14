import { canonicalizeUrl, isDocumentationUrl, type DocSource } from "./sources.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXml(match[1] ?? ""),
  );
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

async function fetchSitemapXml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/xml,text/xml,text/plain,*/*",
      },
    });
    if (response.ok) {
      const text = await response.text();
      if (text.includes("<loc>")) return text;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function collectDocumentationUrls(
  source: DocSource,
): Promise<string[]> {
  const sitemapQueue = [...source.sitemapUrls];
  const seenSitemaps = new Set<string>();
  const pages = new Set<string>();

  while (sitemapQueue.length) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) continue;
    seenSitemaps.add(sitemapUrl);

    const xml = await fetchSitemapXml(sitemapUrl);
    if (!xml) {
      console.warn(`  could not read sitemap: ${sitemapUrl}`);
      continue;
    }

    const locs = extractLocs(xml);
    if (isSitemapIndex(xml)) {
      for (const loc of locs) {
        const next = canonicalizeUrl(loc) ?? loc;
        if (!seenSitemaps.has(next)) sitemapQueue.push(next);
      }
      continue;
    }

    for (const loc of locs) {
      if (!isDocumentationUrl(source, loc)) continue;
      const url = canonicalizeUrl(loc);
      if (url) pages.add(url);
    }
  }

  return [...pages].sort();
}
