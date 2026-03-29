"use client"

import { ScrollReveal } from "./scroll-reveal"

const bullets = [
  "Saves hours of reading and re-reading long doc pages.",
  "Reduces context switching between search, tabs, and your editor.",
  "Improves day-to-day productivity for integration-heavy work.",
  "Developer-first UX: dark, fast, and respectful of your flow.",
]

export function WhySection() {
  return (
    <section id="why" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <ScrollReveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why DocAssist
          </h2>
          <p className="mt-4 text-muted-foreground">
            Documentation is essential — but finding the right paragraph at the
            right time shouldn&apos;t be a bottleneck. DocAssist keeps you in
            flow with structured, source-backed answers.
          </p>
        </ScrollReveal>
        <ScrollReveal delayMs={100}>
          <ul className="space-y-4">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm leading-relaxed"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  )
}
