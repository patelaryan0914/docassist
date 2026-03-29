/** Shared SEO / branding (single source of truth). */

export const SITE_AUTHOR = "Patel Aryan"

export const SITE_NAME = "DocAssist"

export const SITE_DESCRIPTION =
  "Select Stripe, LiveKit, Firebase, and more — ask questions, get instant context-aware answers with code snippets."

export const SITE_TITLE_DEFAULT = `${SITE_NAME} — Chat with developer documentation`

export const SITE_KEYWORDS = [
  "developer documentation",
  "Stripe docs",
  "LiveKit",
  "Firebase",
  "AI chat",
  "documentation assistant",
  "code snippets",
  "DocAssist",
] as const

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "http://localhost:3000"
}
