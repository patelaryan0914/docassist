"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn, userInitials } from "@/lib/utils"
import { DocAssistMark } from "@/components/doc-assist-mark"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, MessageSquare, Search, UserRound, X } from "lucide-react"
import { useLanding } from "./landing-context"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { signOutStore } from "@/store/authSlice"
import { signOut } from "@/lib/axios"
import { toast } from "sonner"

const links = [
  { href: "#docs", label: "Docs" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#use-cases", label: "Use cases" },
]

export function LandingNavbar() {
  const { setCommandOpen } = useLanding()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isLoggedIn, userInfo } = useAppSelector((state) => state.auth)
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleSignOut = React.useCallback(async () => {
    try {
      const res = await signOut()
      if (res.status === 200) toast.success(res.data.message)
      dispatch(signOutStore())
      router.push("/")
    } catch {
      toast.error("Something went wrong.")
    }
  }, [dispatch, router])

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
            size="icon-sm"
            className="rounded-full text-muted-foreground"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-full px-1.5 pr-3"
                >
                  <Avatar size="sm" className="size-7">
                    <AvatarImage src={userInfo.photo} alt={userInfo.name} />
                    <AvatarFallback>
                      {userInitials(userInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">
                    {userInfo.name || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="truncate font-medium">
                      {userInfo.name || "Account"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userInfo.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/chat">
                    <MessageSquare />
                    Open chat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserRound />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="shadow-sm shadow-primary/20">
                <Link href="/sign-up">Start for free</Link>
              </Button>
            </>
          )}

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
            {isLoggedIn ? (
              <>
                <Link
                  href="/chat"
                  className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  Open chat
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
