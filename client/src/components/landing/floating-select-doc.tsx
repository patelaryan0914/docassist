"use client"

import { BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanding } from "./landing-context"
import { cn } from "@/lib/utils"

export function FloatingSelectDoc() {
  const { setCommandOpen } = useLanding()

  return (
    <div className="fixed bottom-6 left-6 z-40 md:bottom-8 md:left-8">
      <Button
        type="button"
        size="lg"
        className={cn(
          "group relative overflow-hidden rounded-full px-5 shadow-xl shadow-primary/25",
          "ring-2 ring-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        )}
        onClick={() => {
          setCommandOpen(true)
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--x,50%) var(--y,50%), oklch(0.55 0.2 277 / 0.35), transparent 55%)",
          }}
        />
        <BookMarked className="relative size-4" />
        <span className="relative ml-2 font-medium">Select documentation</span>
      </Button>
    </div>
  )
}
