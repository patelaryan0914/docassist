import type { DocSlug } from "@/lib/docassist/types"

export type ClassifyConfidence = "high" | "medium" | "low"

export type DocumentationIntent = {
  documentation: DocSlug | null
  confidence: ClassifyConfidence
}

const SLUGS: DocSlug[] = ["stripe", "livekit", "nextjs"]

type WeightedSignal = { weight: number; pattern: RegExp }

const SIGNALS: Record<DocSlug, WeightedSignal[]> = {
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
}

export function classifyDocumentationHeuristic(
  query: string
): DocumentationIntent {
  const text = query.trim()
  if (!text) return { documentation: null, confidence: "low" }

  const scores: Record<DocSlug, number> = {
    stripe: 0,
    livekit: 0,
    nextjs: 0,
  }

  for (const slug of SLUGS) {
    for (const signal of SIGNALS[slug]) {
      if (signal.pattern.test(text)) scores[slug] += signal.weight
    }
  }

  const ranked = SLUGS.map((documentation) => ({
    documentation,
    score: scores[documentation],
  })).sort((a, b) => b.score - a.score)

  const [top, second] = ranked
  if (!top || top.score <= 0) {
    return { documentation: null, confidence: "low" }
  }

  const margin = top.score - (second?.score ?? 0)
  if (top.score >= 4 && margin >= 2) {
    return { documentation: top.documentation, confidence: "high" }
  }
  if (top.score >= 3 && margin >= 2) {
    return { documentation: top.documentation, confidence: "medium" }
  }
  return { documentation: null, confidence: "low" }
}

export function shouldPromptDocumentationSwitch(
  current: DocSlug,
  intent: DocumentationIntent
): intent is DocumentationIntent & { documentation: DocSlug } {
  return (
    intent.documentation != null &&
    intent.documentation !== current &&
    intent.confidence !== "low"
  )
}

type PendingAsk = {
  conversationId: string
  documentation: DocSlug
  content: string
  media: Array<{
    url: string
    mimeType: string
    fileName?: string
    mediaType?: "image" | "audio" | "video" | "document"
  }>
}

const PENDING_ASK_KEY = "docassist:pending-ask"

export function writePendingAsk(payload: PendingAsk) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PENDING_ASK_KEY, JSON.stringify(payload))
}

export function takePendingAsk(conversationId: string): PendingAsk | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(PENDING_ASK_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingAsk
    if (parsed.conversationId !== conversationId) return null
    sessionStorage.removeItem(PENDING_ASK_KEY)
    return parsed
  } catch {
    sessionStorage.removeItem(PENDING_ASK_KEY)
    return null
  }
}
