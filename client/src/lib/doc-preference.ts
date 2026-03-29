import type { DocSlug } from "@/lib/docassist/types"
import { APP_DOCUMENTATION_OPTIONS } from "@/lib/app-documentation-options"

const STORAGE_KEY = "docassist:last-documentation"

const ALLOWED = new Set<string>(APP_DOCUMENTATION_OPTIONS.map((o) => o.id))

export function parseDocSlug(value: string | undefined | null): DocSlug {
  if (value && ALLOWED.has(value)) return value as DocSlug
  return "stripe"
}

export function readLastDocumentation(): DocSlug {
  if (typeof window === "undefined") return "stripe"
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return parseDocSlug(raw)
  } catch {
    return "stripe"
  }
}

export function writeLastDocumentation(doc: DocSlug) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, doc)
  } catch {
    /* ignore */
  }
}
