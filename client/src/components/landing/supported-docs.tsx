"use client"

import { cn } from "@/lib/utils"
import type { DocSlug } from "@/lib/docassist/types"
import { invokeDocAssistSkill } from "@/lib/docassist/router"
import { ScrollReveal } from "./scroll-reveal"
import { useLanding } from "./landing-context"

const DOCS: {
  id: DocSlug
  name: string
  accent: string
  blurb: string
}[] = [
  {
    id: "stripe",
    name: "Stripe",
    accent: "from-violet-500/30 to-indigo-500/20",
    blurb: "Payments & billing",
  },
  {
    id: "livekit",
    name: "LiveKit",
    accent: "from-sky-500/25 to-cyan-500/15",
    blurb: "Realtime media",
  },
  {
    id: "firebase",
    name: "Firebase",
    accent: "from-amber-500/25 to-orange-500/15",
    blurb: "Backend & auth",
  },
  {
    id: "openai",
    name: "OpenAI",
    accent: "from-emerald-500/25 to-teal-500/15",
    blurb: "Models & APIs",
  },
  {
    id: "nextjs",
    name: "Next.js",
    accent: "from-zinc-400/25 to-zinc-600/15",
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

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <div
                  className={cn(
                    "mb-4 h-12 rounded-xl bg-linear-to-br opacity-90 ring-1 ring-white/10",
                    d.accent
                  )}
                />
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
