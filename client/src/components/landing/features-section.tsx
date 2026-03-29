"use client"

import { ScrollReveal } from "./scroll-reveal"

const features = [
  { emoji: "💬", title: "Chat with any documentation" },
  { emoji: "⚡", title: "Instant developer answers" },
  { emoji: "🧠", title: "Context-aware AI" },
  { emoji: "🧾", title: "Code snippet generation" },
  { emoji: "🔍", title: "No manual searching" },
  { emoji: "🌐", title: "Multi-docs support" },
  { emoji: "📌", title: "Source referencing" },
  { emoji: "🚀", title: "Built for developers" },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to ship faster
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Product features map cleanly to modular skills for agents and MCP
          hosts.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delayMs={(i % 4) * 50}>
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 transition-colors hover:border-primary/25 hover:bg-card/70">
              <span className="text-xl" aria-hidden>
                {f.emoji}
              </span>
              <span className="text-sm font-medium leading-snug">{f.title}</span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
