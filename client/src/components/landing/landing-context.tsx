"use client"

import * as React from "react"
import type { DocSlug } from "@/lib/docassist/types"

type LandingContextValue = {
  selectedDoc: DocSlug
  setSelectedDoc: (doc: DocSlug) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
}

const LandingContext = React.createContext<LandingContextValue | null>(null)

export function LandingProvider({ children }: { children: React.ReactNode }) {
  const [selectedDoc, setSelectedDoc] = React.useState<DocSlug>("stripe")
  const [commandOpen, setCommandOpen] = React.useState(false)

  const value = React.useMemo(
    () => ({
      selectedDoc,
      setSelectedDoc,
      commandOpen,
      setCommandOpen,
    }),
    [selectedDoc, commandOpen]
  )

  return (
    <LandingContext.Provider value={value}>{children}</LandingContext.Provider>
  )
}

export function useLanding() {
  const ctx = React.useContext(LandingContext)
  if (!ctx) {
    throw new Error("useLanding must be used within LandingProvider")
  }
  return ctx
}
