import { SigninForm } from "@/components/signin-form"
import { AppShellBackground } from "@/components/app-shell-background"

export default function SigninPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <AppShellBackground />
      <div className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card/70 p-8 shadow-xl shadow-primary/10 supports-backdrop-filter:backdrop-blur-xl">
        <SigninForm />
      </div>
    </div>
  )
}
