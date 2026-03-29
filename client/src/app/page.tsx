import type { Metadata } from "next"
import { LandingPage } from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "DocAssist — Chat with developer documentation",
  description:
    "Select Stripe, LiveKit, Firebase, and more — ask questions, get instant context-aware answers with code snippets.",
}

export default function Page() {
  return <LandingPage />
}
