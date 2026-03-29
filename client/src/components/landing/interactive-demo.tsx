"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollReveal } from "./scroll-reveal"
import { useLanding } from "./landing-context"
import { invokeDocAssistSkill } from "@/lib/docassist/router"
import type { QueryDocumentationOutput } from "@/lib/docassist/types"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"

const EXAMPLE =
  "How to handle Stripe webhooks?"

function useTyping(text: string, active: boolean, cps = 28) {
  const [out, setOut] = React.useState("")
  React.useEffect(() => {
    if (!active) {
      setOut("")
      return
    }
    let i = 0
    setOut("")
    const id = window.setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, 1000 / cps)
    return () => window.clearInterval(id)
  }, [text, active, cps])
  return out
}

export function InteractiveDemo() {
  const { selectedDoc } = useLanding()
  const [query, setQuery] = React.useState(EXAMPLE)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<QueryDocumentationOutput | null>(
    null
  )
  const [autoPlay, setAutoPlay] = React.useState(true)
  const typed = useTyping(EXAMPLE, autoPlay && !result && !loading)

  const run = React.useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      setLoading(true)
      setAutoPlay(false)
      await new Promise((r) => window.setTimeout(r, 420))
      const res = invokeDocAssistSkill("queryDocumentation", {
        documentationId: selectedDoc,
        query: trimmed,
      }) as QueryDocumentationOutput
      setResult(res)
      setLoading(false)
    },
    [selectedDoc]
  )

  React.useEffect(() => {
    if (!autoPlay) return
    const t = window.setTimeout(() => {
      run(EXAMPLE)
    }, 1600)
    return () => window.clearTimeout(t)
  }, [autoPlay, run])

  return (
    <section id="demo" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <ScrollReveal>
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Interactive demo
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Uses the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            queryDocumentation
          </code>{" "}
          skill against your selected documentation.
        </p>
      </ScrollReveal>

      <ScrollReveal delayMs={100} className="mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="demo-query">
              Your question
            </label>
            <Textarea
              id="demo-query"
              value={autoPlay && !result ? typed : query}
              onChange={(e) => {
                setAutoPlay(false)
                setQuery(e.target.value)
              }}
              rows={4}
              className="resize-none rounded-xl border-border/80 bg-card/60 font-mono text-sm"
              placeholder="Ask anything about the selected docs…"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={loading}
                onClick={() => run(query)}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="ml-1.5">Run query</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setResult(null)
                  setQuery(EXAMPLE)
                  setAutoPlay(true)
                }}
              >
                Replay typing
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Try “payment intent” on Stripe for a richer canned answer with
              sources.
            </p>
          </div>

          <div
            className={cn(
              "min-h-[280px] rounded-2xl border border-border/80 bg-card/50 p-5 shadow-inner",
              "transition-all duration-500",
              loading && "animate-pulse"
            )}
          >
            {!result && !loading ? (
              <p className="text-sm text-muted-foreground">
                Answer will appear here with steps, optional code, and sources.
              </p>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Retrieving documentation context…
              </div>
            ) : null}
            {result && !loading ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {result.answer}
                </p>
                {result.suggestedCode ? (
                  <div className="overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] font-mono text-[11px] leading-relaxed text-zinc-300">
                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[10px] text-zinc-500">
                      <span>snippet</span>
                      <span>{result.codeLanguage ?? "code"}</span>
                    </div>
                    <pre className="max-h-52 overflow-auto p-3 whitespace-pre-wrap">
                      {result.suggestedCode}
                    </pre>
                  </div>
                ) : null}
                {result.sources?.length ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sources
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-primary">
                      {result.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-4 hover:underline"
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
