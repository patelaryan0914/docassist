"use client"

import * as React from "react"
import { LandingProvider, useLanding } from "./landing-context"
import { AnimatedBackground } from "./animated-background"
import { LandingNavbar } from "./landing-navbar"
import { LandingHero } from "./landing-hero"
import { SupportedDocs } from "./supported-docs"
import { HowItWorks } from "./how-it-works"
import { FeaturesSection } from "./features-section"
import { InteractiveDemo } from "./interactive-demo"
import { UseCasesSection } from "./use-cases-section"
import { WhySection } from "./why-section"
import { Testimonials } from "./testimonials"
import { FinalCta } from "./final-cta"
import { LandingFooter } from "./landing-footer"
import { CommandPalette } from "./command-palette"
import { FloatingSelectDoc } from "./floating-select-doc"
import { StickyChatPreview } from "./sticky-chat-preview"

function LandingShortcuts() {
  const { setCommandOpen } = useLanding()

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setCommandOpen])

  return null
}

function LandingInner() {
  return (
    <>
      <LandingShortcuts />
      <AnimatedBackground />
      <LandingNavbar />
      <main className="relative">
        <LandingHero />
        <SupportedDocs />
        <HowItWorks />
        <FeaturesSection />
        <InteractiveDemo />
        <UseCasesSection />
        <WhySection />
        <Testimonials />
        <FinalCta />
      </main>
      <LandingFooter />
      <CommandPalette />
      <FloatingSelectDoc />
      <StickyChatPreview />
    </>
  )
}

export function LandingPage() {
  return (
    <LandingProvider>
      <LandingInner />
    </LandingProvider>
  )
}
