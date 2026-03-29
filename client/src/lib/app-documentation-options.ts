import type { DocSlug } from "@/lib/docassist/types"

export const APP_DOCUMENTATION_OPTIONS: { id: DocSlug; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "livekit", label: "LiveKit" },
  { id: "firebase", label: "Firebase" },
  { id: "openai", label: "OpenAI" },
  { id: "nextjs", label: "Next.js" },
]
