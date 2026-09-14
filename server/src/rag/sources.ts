import type { DocumentationSlug } from "../constants/documentation.js";

export type DocSource = {
  label: string;
  sitemapUrls: string[];
  hosts: string[];
  allowPath: RegExp;
  denyPath?: RegExp;
};

export const DOC_SOURCES: Record<DocumentationSlug, DocSource> = {
  stripe: {
    label: "Stripe",
    sitemapUrls: ["https://docs.stripe.com/sitemap.xml"],
    hosts: ["docs.stripe.com"],
    allowPath: /^\//,
    denyPath: /^\/(handoff|search|llms)/i,
  },
  livekit: {
    label: "LiveKit",
    sitemapUrls: ["https://docs.livekit.io/sitemap.xml"],
    hosts: ["docs.livekit.io"],
    allowPath: /^\//,
    denyPath: /\.md$/i,
  },
  nextjs: {
    label: "Next.js",
    sitemapUrls: ["https://nextjs.org/sitemap.xml"],
    hosts: ["nextjs.org"],
    allowPath: /^\/docs(\/|$)/i,
  },
};

export function titleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const last = path.split("/").filter(Boolean).pop() ?? "Documentation";
    return decodeURIComponent(last)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Documentation";
  }
}

export function canonicalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isDocumentationUrl(source: DocSource, raw: string): boolean {
  const url = canonicalizeUrl(raw);
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!source.hosts.includes(parsed.hostname)) return false;
    if (/\.(png|jpe?g|gif|svg|webp|ico|mp4|zip|pdf|xml|txt|json)$/i.test(parsed.pathname)) {
      return false;
    }
    if (!source.allowPath.test(parsed.pathname)) return false;
    if (source.denyPath?.test(parsed.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}
