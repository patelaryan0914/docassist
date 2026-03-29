"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "./scroll-reveal"
import { ArrowRight } from "lucide-react"

export function FinalCta() {
  return (
    <section
      id="cta"
      className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-12"
    >
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-linear-to-br from-primary/20 via-card to-chart-2/10 p-10 text-center shadow-xl shadow-primary/15 sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.2_277/0.25),transparent_50%)]" />
          <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Your AI pair programmer for documentation
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            Pick any documentation, ask anything, get developer-ready answers
            with sources and snippets.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-full px-8 shadow-lg shadow-primary/30"
            >
              <Link href="/chat">
                Start chatting with docs
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8">
              <Link href="/sign-up">Create free account</Link>
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
