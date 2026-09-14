import type {
  DocSlug,
  SelectDocumentationInput,
  SelectDocumentationOutput,
} from "../types"

const LABELS: Record<DocSlug, { label: string; indexUrl: string }> = {
  stripe: { label: "Stripe", indexUrl: "https://docs.stripe.com" },
  livekit: { label: "LiveKit", indexUrl: "https://docs.livekit.io" },
  nextjs: { label: "Next.js", indexUrl: "https://nextjs.org/docs" },
}

export function selectDocumentation(
  input: SelectDocumentationInput
): SelectDocumentationOutput {
  const meta = LABELS[input.documentationId]
  return {
    ok: true,
    documentationId: input.documentationId,
    label: meta.label,
    indexUrl: meta.indexUrl,
  }
}
