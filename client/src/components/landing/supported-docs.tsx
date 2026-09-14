"use client"

import { cn } from "@/lib/utils"
import type { DocSlug } from "@/lib/docassist/types"
import { invokeDocAssistSkill } from "@/lib/docassist/router"
import { DocBrandMark } from "@/components/doc-brand-mark"
import { ScrollReveal } from "./scroll-reveal"
import { useLanding } from "./landing-context"

const DOCS: {
  id: DocSlug
  name: string
  blurb: string
}[] = [
  {
    id: "stripe",
    name: "Stripe",
    blurb: "Payments & billing",
  },
  {
    id: "livekit",
    name: "LiveKit",
    blurb: "Realtime media",
  },
  {
    id: "nextjs",
    name: "Next.js",
    blurb: "App framework",
  },
]

export function SupportedDocs() {
  const { selectedDoc, setSelectedDoc } = useLanding()

  return (
    <section id="docs" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <p className="text-center text-sm font-medium uppercase tracking-widest text-primary">
          Supported documentation
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick a corpus. Chat like it&apos;s on your team.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Interactive cards set the active documentation for the demo and MCP
          skills layer.
        </p>
      </ScrollReveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map((d, i) => {
          const active = selectedDoc === d.id
          const selection = invokeDocAssistSkill("selectDocumentation", {
            documentationId: d.id,
          }) as { label: string }

          return (
            <ScrollReveal key={d.id} delayMs={i * 60}>
              <button
                type="button"
                onClick={() => setSelectedDoc(d.id)}
                className={cn(
                  "group relative w-full rounded-2xl border p-5 text-left transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
                  active
                    ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30"
                    : "border-border/80 bg-card/40 hover:border-primary/25"
                )}
              >
                <DocBrandMark id={d.id} className="mb-4" />
                <div className="text-lg font-semibold tracking-tight">
                  {selection.label}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{d.blurb}</p>
                <span className="mt-4 inline-flex text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Set active →
                </span>
              </button>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
