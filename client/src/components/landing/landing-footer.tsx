"use client"

import Link from "next/link"
import { DocAssistMark } from "@/components/doc-assist-mark"

const cols = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#demo", label: "Demo" },
      { href: "/chat", label: "App" },
    ],
  },
  {
    title: "Docs",
    links: [
      { href: "#how", label: "How it works" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Sign up" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://github.com", label: "GitHub" },
      { href: "mailto:hello@docassist.dev", label: "Contact" },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div>
          <DocAssistMark href="/" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Documentation Assist — chat with vendor docs, get answers and code
            instantly.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.title}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-foreground/90 hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DocAssist. All rights reserved.
        <span className="mx-2">·</span>
        <a href="https://twitter.com" className="hover:text-foreground">
          Twitter / X
        </a>
        <span className="mx-2">·</span>
        <a href="https://discord.com" className="hover:text-foreground">
          Discord
        </a>
      </div>
    </footer>
  )
}
