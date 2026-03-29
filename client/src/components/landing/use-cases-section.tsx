"use client"

import { ScrollReveal } from "./scroll-reveal"

const cases = [
  {
    title: "Developers",
    body: "Ship integrations faster with answers grounded in the docs you actually use.",
  },
  {
    title: "Startups",
    body: "Move from idea to working API calls without losing a day to reference drift.",
  },
  {
    title: "Teams",
    body: "Onboard engineers with conversational access to internal and vendor docs.",
  },
  {
    title: "Hackathons",
    body: "Prototype against unfamiliar SDKs in minutes with copy-paste-ready snippets.",
  },
]

export function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="border-y border-border/60 bg-muted/15 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Use cases
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Same underlying skills power the web app, agents, and MCP tooling.
          </p>
        </ScrollReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {cases.map((c, i) => (
            <ScrollReveal key={c.title} delayMs={i * 70}>
              <article className="h-full rounded-2xl border border-border/70 bg-card/50 p-6 transition-transform hover:-translate-y-0.5">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
