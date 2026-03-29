"use client"

import Link from "next/link"
import { useLanding } from "./landing-context"
import { invokeDocAssistSkill } from "@/lib/docassist/router"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function StickyChatPreview() {
  const { selectedDoc } = useLanding()
  const sel = invokeDocAssistSkill("selectDocumentation", {
    documentationId: selectedDoc,
  }) as { label: string }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-24 z-30 hidden w-[min(100%-2rem,280px)] md:block lg:bottom-8 lg:right-8"
      )}
    >
      <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xl supports-backdrop-filter:backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" />
          Chat preview
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">
          Active: {sel.label}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          Ask in the demo — answers use the queryDocumentation skill with
          sources and snippets.
        </p>
        <Link
          href="#demo"
          className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
        >
          Open demo →
        </Link>
      </div>
    </div>
  )
}
