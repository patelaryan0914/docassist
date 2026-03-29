"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { cn } from "@/lib/utils"

function HeroChatMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-2xl shadow-primary/10 ring-1 ring-white/5 supports-backdrop-filter:backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/80" />
          <span className="size-2.5 rounded-full bg-amber-500/80" />
          <span className="size-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="ml-2 text-xs font-medium text-muted-foreground">
          Stripe · DocAssist
        </span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="mt-0.5 size-8 shrink-0 rounded-lg bg-muted font-mono text-xs font-medium leading-8 text-center text-muted-foreground">
            You
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-background/80 px-4 py-3 text-sm leading-relaxed">
            How do I create a payment intent in Stripe?
          </div>
        </div>
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
            <p>
              On the server, create a{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                PaymentIntent
              </code>{" "}
              with amount and currency. Return the{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                client_secret
              </code>{" "}
              to your client and confirm with Stripe.js.
            </p>
            <div className="overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] font-mono text-[11px] leading-relaxed text-zinc-300 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[10px] text-zinc-500">
                <span>api/payments/route.ts</span>
                <span>TypeScript</span>
              </div>
              <pre className="overflow-x-auto p-3 text-left">
                {`const intent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
})`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Sources: Payment Intents API · Accept a payment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingHero() {
  return (
    <section
      id="top"
      className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 md:pb-28"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Select docs → Ask → Answers instantly
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Stop Searching Docs.
            <span className="block bg-linear-to-r from-foreground via-primary to-chart-2 bg-clip-text text-transparent">
              Start Talking to Them.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Chat with developer documentation like Stripe, LiveKit, and more —
            instantly. Context-aware answers with code snippets, no tab
            hopping.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              asChild
              className="group rounded-full px-6 shadow-lg shadow-primary/25"
            >
              <Link href="/sign-up">
                Start for free
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-6">
              <a href="#demo">Try demo</a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Built for developers. Dark by default. Works with your stack.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={120} className="lg:justify-self-end">
          <HeroChatMock className="w-full max-w-xl lg:max-w-none" />
        </ScrollReveal>
      </div>
    </section>
  )
}
