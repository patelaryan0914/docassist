"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DocAssistMark } from "@/components/doc-assist-mark"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useLanding } from "./landing-context"

const links = [
  { href: "#docs", label: "Docs" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#use-cases", label: "Use cases" },
]

export function LandingNavbar() {
  const { setCommandOpen } = useLanding()
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-background/75 supports-backdrop-filter:backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <DocAssistMark href="/" />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground sm:inline-flex"
            onClick={() => setCommandOpen(true)}
          >
            <kbd className="mr-1 hidden rounded border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] lg:inline">
              ⌘K
            </kbd>
            <span className="lg:sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="shadow-sm shadow-primary/20">
            <Link href="/sign-up">Start for free</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
