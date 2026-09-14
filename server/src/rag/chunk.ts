export type DocChunk = {
  title: string;
  heading: string;
  text: string;
  url: string;
};

const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 160;
const MIN_CHARS = 120;

function normalizeText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) => `\n${block}\n`)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function windowChunks(text: string): string[] {
  if (text.length <= TARGET_CHARS) return [text];
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + TARGET_CHARS, text.length);
    if (end < text.length) {
      const breakAt = text.lastIndexOf("\n", end);
      if (breakAt > start + MIN_CHARS) end = breakAt;
    }
    const slice = text.slice(start, end).trim();
    if (slice.length >= MIN_CHARS) parts.push(slice);
    if (end >= text.length) break;
    start = Math.max(0, end - OVERLAP_CHARS);
  }
  return parts;
}

export function chunkMarkdown(params: {
  markdown: string;
  url: string;
  title: string;
}): DocChunk[] {
  const markdown = normalizeText(params.markdown);
  if (!markdown) return [];

  const headingSplit = markdown.split(/^(#{1,3})\s+(.+)$/gm);
  const sections: Array<{ heading: string; body: string }> = [];

  if (headingSplit.length === 1) {
    sections.push({ heading: params.title, body: markdown });
  } else {
    const preamble = headingSplit[0]?.trim() ?? "";
    if (preamble.length >= MIN_CHARS) {
      sections.push({ heading: params.title, body: preamble });
    }
    for (let i = 1; i < headingSplit.length; i += 3) {
      const heading = headingSplit[i + 1]?.trim() || params.title;
      const body = headingSplit[i + 2]?.trim() ?? "";
      if (body.length >= MIN_CHARS) {
        sections.push({ heading, body });
      }
    }
  }

  const chunks: DocChunk[] = [];
  for (const section of sections) {
    const paragraphs = splitParagraphs(section.body);
    let buffer = "";
    const flush = () => {
      const packed = windowChunks(buffer.trim());
      for (const text of packed) {
        chunks.push({
          title: params.title,
          heading: section.heading,
          text,
          url: params.url,
        });
      }
      buffer = "";
    };

    for (const paragraph of paragraphs) {
      if ((buffer + "\n\n" + paragraph).length > TARGET_CHARS && buffer.length >= MIN_CHARS) {
        flush();
      }
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
    if (buffer.trim().length >= MIN_CHARS) flush();
  }

  return chunks;
}
