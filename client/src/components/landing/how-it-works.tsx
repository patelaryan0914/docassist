"use client"

import { BookOpen, MessageCircleCode, Zap } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"

const steps = [
  {
    icon: BookOpen,
    title: "Select documentation",
    body: "Choose Stripe, LiveKit, Firebase, OpenAI, Next.js, or extend with your own corpus.",
  },
  {
    icon: MessageCircleCode,
    title: "Ask questions naturally",
    body: "Type the way you’d ask a senior engineer — no keyword gymnastics.",
  },
  {
    icon: Zap,
    title: "Get instant answers + code",
    body: "Structured replies with snippets, patterns, and source references you can trust.",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-y border-border/60 bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Three steps. Same flow in the product and in Cursor via MCP skills.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <ScrollReveal key={s.title} delayMs={i * 80}>
              <div className="relative rounded-2xl border border-border/70 bg-card/50 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <s.icon className="size-5" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
