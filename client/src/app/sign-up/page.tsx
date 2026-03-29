import type { Metadata } from "next"
import { SignupForm } from "@/components/signup-form"
import { AppShellBackground } from "@/components/app-shell-background"
import { SITE_NAME } from "@/lib/site"

export const metadata: Metadata = {
  title: "Sign up",
  description: `Create a ${SITE_NAME} account and start asking questions across Stripe, LiveKit, Firebase docs, and more.`,
  robots: { index: true, follow: true },
}

export default function SignupPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <AppShellBackground />
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/70 p-8 shadow-xl shadow-primary/10 supports-backdrop-filter:backdrop-blur-xl">
        <SignupForm />
      </div>
    </div>
  )
}
