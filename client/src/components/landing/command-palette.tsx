"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useLanding } from "./landing-context"
import type { DocSlug } from "@/lib/docassist/types"
import { cn } from "@/lib/utils"
import { Book, MessageSquare, Sparkles, Terminal } from "lucide-react"

type Action = {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  onSelect: () => void
}

const DOC_COMMANDS: { id: DocSlug; label: string }[] = [
  { id: "stripe", label: "Select Stripe docs" },
  { id: "livekit", label: "Select LiveKit docs" },
  { id: "firebase", label: "Select Firebase docs" },
  { id: "openai", label: "Select OpenAI docs" },
  { id: "nextjs", label: "Select Next.js docs" },
]

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setSelectedDoc } = useLanding()
  const [q, setQ] = React.useState("")

  React.useEffect(() => {
    if (!commandOpen) setQ("")
  }, [commandOpen])

  const actions: Action[] = React.useMemo(
    () => [
      {
        id: "demo",
        label: "Jump to interactive demo",
        hint: "Landing",
        icon: <Terminal className="size-4" />,
        onSelect: () => {
          setCommandOpen(false)
          document
            .getElementById("demo")
            ?.scrollIntoView({ behavior: "smooth" })
        },
      },
      {
        id: "chat",
        label: "Open chat app",
        hint: "/chat",
        icon: <MessageSquare className="size-4" />,
        onSelect: () => {
          setCommandOpen(false)
          window.location.href = "/chat"
        },
      },
      {
        id: "signup",
        label: "Start for free",
        hint: "/sign-up",
        icon: <Sparkles className="size-4" />,
        onSelect: () => {
          setCommandOpen(false)
          window.location.href = "/sign-up"
        },
      },
      ...DOC_COMMANDS.map((d) => ({
        id: `doc-${d.id}`,
        label: d.label,
        hint: "selectDocumentation",
        icon: <Book className="size-4" />,
        onSelect: () => {
          setSelectedDoc(d.id)
          setCommandOpen(false)
          document
            .getElementById("docs")
            ?.scrollIntoView({ behavior: "smooth" })
        },
      })),
    ],
    [setCommandOpen, setSelectedDoc]
  )

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return actions
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(s) ||
        (a.hint && a.hint.toLowerCase().includes(s))
    )
  }, [actions, q])

  return (
    <Sheet open={commandOpen} onOpenChange={setCommandOpen}>
      <SheetContent
        side="top"
        showCloseButton
        className="mx-auto mt-16 h-auto max-h-[min(420px,70vh)] w-[min(100%-2rem,480px)] rounded-2xl border border-border/80 p-0 shadow-2xl data-[side=top]:slide-in-from-top-4"
      >
        <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
          <SheetTitle className="text-sm font-medium">Command palette</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Navigate DocAssist. Powered by the same skill names as MCP tools.
          </p>
        </SheetHeader>
        <div className="p-2">
          <Input
            autoFocus
            placeholder="Search actions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 rounded-xl border-border/80 bg-muted/30"
          />
        </div>
        <ul className="max-h-64 overflow-auto px-2 pb-3" role="listbox">
          {filtered.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                role="option"
                onClick={a.onSelect}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-muted/80",
                  i === 0 && !q ? "bg-muted/50" : ""
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60">
                  {a.icon}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{a.label}</span>
                  {a.hint ? (
                    <span className="text-xs text-muted-foreground">{a.hint}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 px-4 py-2 text-center text-xs text-muted-foreground">
          <Link href="/chat" className="hover:text-foreground" onClick={() => setCommandOpen(false)}>
            Or continue in the full app →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
