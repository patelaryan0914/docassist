import { generateText } from "ai";
import {
  DOCUMENTATION_SLUGS,
  type DocumentationSlug,
} from "../constants/documentation.js";
import { resolveModel } from "../utils/AiProvider.js";
import logger from "../utils/Logger.js";

export type ClassifyConfidence = "high" | "medium" | "low";

export type DocumentationIntent = {
  documentation: DocumentationSlug | null;
  confidence: ClassifyConfidence;
  method: "heuristic" | "llm" | "none";
};

type WeightedSignal = { weight: number; pattern: RegExp };

const SIGNALS: Record<DocumentationSlug, WeightedSignal[]> = {
  stripe: [
    { weight: 5, pattern: /\bstripe\b/i },
    { weight: 4, pattern: /\bpayment\s*intents?\b/i },
    { weight: 4, pattern: /\bpaymentintents?\b/i },
    { weight: 4, pattern: /\bsetup\s*intents?\b/i },
    { weight: 4, pattern: /\bcheckout\s+sessions?\b/i },
    { weight: 3, pattern: /\bstripe\.js\b/i },
    { weight: 3, pattern: /\bpayment\s+elements?\b/i },
    { weight: 3, pattern: /\bconnect\s+accounts?\b/i },
    { weight: 3, pattern: /\bbilling\s+portal\b/i },
    { weight: 3, pattern: /\bcustomer\s+portal\b/i },
    { weight: 3, pattern: /\bpayment\s+links?\b/i },
    { weight: 3, pattern: /\bpk_(?:test|live)_/i },
    { weight: 3, pattern: /\bsk_(?:test|live)_/i },
    { weight: 2, pattern: /\baccept\s+payments?\b/i },
    { weight: 2, pattern: /\bcredit\s+cards?\b/i },
    { weight: 2, pattern: /\bsubscriptions?\b/i },
    { weight: 2, pattern: /\binvoices?\b/i },
    { weight: 2, pattern: /\brefunds?\b/i },
  ],
  livekit: [
    { weight: 5, pattern: /\blivekit\b/i },
    { weight: 4, pattern: /\broom\s+service\b/i },
    { weight: 4, pattern: /\blivekit\s+agents?\b/i },
    { weight: 3, pattern: /\begress\b/i },
    { weight: 3, pattern: /\bingress\b/i },
    { weight: 3, pattern: /\bsip\s+trunk/i },
    { weight: 3, pattern: /\btrack\s+subscri/i },
    { weight: 3, pattern: /\bwebrtc\b/i },
    { weight: 2, pattern: /\breal[- ]?time\s+(audio|video|media|comms)\b/i },
    { weight: 2, pattern: /\bvideo\s+conferenc/i },
    { weight: 2, pattern: /\bvoice\s+agents?\b/i },
    { weight: 2, pattern: /\bparticipants?\b/i },
  ],
  nextjs: [
    { weight: 5, pattern: /\bnext\.?js\b/i },
    { weight: 4, pattern: /\bapp\s+router\b/i },
    { weight: 4, pattern: /\bpages\s+router\b/i },
    { weight: 3, pattern: /\bserver\s+actions?\b/i },
    { weight: 3, pattern: /\bserver\s+components?\b/i },
    { weight: 3, pattern: /\bget(?:server)?sideprops\b/i },
    { weight: 3, pattern: /\bgetstaticprops\b/i },
    { weight: 3, pattern: /\bnext\/(?:image|link|navigation|font)\b/i },
    { weight: 3, pattern: /\bnext\.config\b/i },
    { weight: 2, pattern: /\bapp\s+directory\b/i },
    { weight: 2, pattern: /\bmiddleware\.ts\b/i },
  ],
};

function scoreQuery(query: string): Record<DocumentationSlug, number> {
  const scores = {
    stripe: 0,
    livekit: 0,
    nextjs: 0,
  } as Record<DocumentationSlug, number>;

  for (const slug of DOCUMENTATION_SLUGS) {
    for (const signal of SIGNALS[slug]) {
      if (signal.pattern.test(query)) scores[slug] += signal.weight;
    }
  }
  return scores;
}

export function classifyDocumentationHeuristic(
  query: string,
): DocumentationIntent {
  const text = query.trim();
  if (!text) {
    return { documentation: null, confidence: "low", method: "none" };
  }

  const scores = scoreQuery(text);
  const ranked = DOCUMENTATION_SLUGS.map((documentation) => ({
    documentation,
    score: scores[documentation],
  })).sort((a, b) => b.score - a.score);

  const [top, second] = ranked;
  if (!top || top.score <= 0) {
    return { documentation: null, confidence: "low", method: "none" };
  }

  const margin = top.score - (second?.score ?? 0);
  if (top.score >= 4 && margin >= 2) {
    return { documentation: top.documentation, confidence: "high", method: "heuristic" };
  }
  if (top.score >= 3 && margin >= 2) {
    return { documentation: top.documentation, confidence: "medium", method: "heuristic" };
  }
  return { documentation: null, confidence: "low", method: "none" };
}

function parseClassificationJson(raw: string): DocumentationIntent | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
      documentation?: unknown;
      confidence?: unknown;
    };
    const documentation =
      typeof parsed.documentation === "string" &&
      (DOCUMENTATION_SLUGS as readonly string[]).includes(parsed.documentation)
        ? (parsed.documentation as DocumentationSlug)
        : null;
    const confidence =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : documentation
          ? "medium"
          : "low";
    return {
      documentation,
      confidence,
      method: "llm",
    };
  } catch {
    return null;
  }
}

async function classifyDocumentationWithLlm(
  query: string,
): Promise<DocumentationIntent | null> {
  if (!process.env.GROQ_API_KEY?.trim()) return null;

  const modelId =
    process.env.GROQ_CLASSIFY_MODEL_ID?.trim() || "llama-3.1-8b-instant";

  const { text } = await generateText({
    model: resolveModel("groq", modelId),
    temperature: 0,
    system: [
      "Classify the user question into exactly one documentation corpus.",
      "stripe: Stripe payments, Checkout, PaymentIntents, billing, Connect, refunds.",
      "livekit: LiveKit realtime audio/video, rooms, participants, egress/ingress, Agents.",
      "nextjs: Next.js framework, App Router, Server Components, next/image, routing.",
      "If it is a follow-up, generic, or not clearly one of those, documentation must be null.",
      'Reply with JSON only: {"documentation":"stripe"|"livekit"|"nextjs"|null,"confidence":"high"|"medium"|"low"}',
    ].join(" "),
    prompt: query.slice(0, 1500),
  });

  return parseClassificationJson(text);
}

export async function classifyDocumentationIntent(
  query: string,
): Promise<DocumentationIntent> {
  const heuristic = classifyDocumentationHeuristic(query);
  if (heuristic.documentation && heuristic.confidence !== "low") {
    return heuristic;
  }

  try {
    const llm = await classifyDocumentationWithLlm(query);
    if (llm?.documentation && llm.confidence !== "low") {
      return llm;
    }
  } catch (error) {
    logger.warn("Documentation classify LLM failed", {
      uniqueCode: "CLASSIFY",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return heuristic.documentation
    ? heuristic
    : { documentation: null, confidence: "low", method: "none" };
}
