"use client"

import { ScrollReveal } from "./scroll-reveal"

const quotes = [
  {
    quote:
      "It’s like having a staff engineer who has memorized every SDK I touch.",
    name: "Alex M.",
    role: "Backend engineer",
  },
  {
    quote:
      "We onboarded two devs onto Stripe Connect in an afternoon using DocAssist.",
    name: "Jordan K.",
    role: "Tech lead",
  },
  {
    quote:
      "The code blocks alone paid for the context switch I used to waste daily.",
    name: "Sam R.",
    role: "Indie hacker",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Loved by builders
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Minimal cards. Real outcomes.
        </p>
      </ScrollReveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {quotes.map((q, i) => (
          <ScrollReveal key={q.name} delayMs={i * 80}>
            <figure className="h-full rounded-2xl border border-border/70 bg-card/50 p-6">
              <blockquote className="text-sm leading-relaxed text-foreground">
                “{q.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{q.name}</span> ·{" "}
                {q.role}
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
