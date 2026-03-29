"use client"

import * as React from "react"
import { MessageSquare, Search, SquarePen } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { DocAssistMark } from "./doc-assist-mark"
import { useAppSelector } from "@/store/hooks"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/lib/axios"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { APP_DOCUMENTATION_OPTIONS } from "@/lib/app-documentation-options"
import { parseDocSlug } from "@/lib/doc-preference"

type Conversation = {
  _id: string
  name: string
  documentation?: string
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()
  const [compactLogoHovered, setCompactLogoHovered] = React.useState(false)
  const router = useRouter()
  const { userInfo } = useAppSelector((state) => state.auth)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      300
    )
    return () => window.clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    if (!searchOpen) {
      setSearchInput("")
      setDebouncedSearch("")
    }
  }, [searchOpen])

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => {
      return getConversations(1, 50)
    },
    placeholderData: (prev) => prev,
  })

  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ["conversations", "search", debouncedSearch],
    queryFn: () => getConversations(1, 50, debouncedSearch || undefined),
    enabled: searchOpen,
    placeholderData: (prev) => prev,
  })

  const searchResults: Conversation[] =
    searchData?.data?.data?.conversations ?? []

  const docLabel = (slug?: string) => {
    const id = parseDocSlug(slug)
    return APP_DOCUMENTATION_OPTIONS.find((o) => o.id === id)?.label ?? id
  }

  const navMainItems = [
    {
      title: "New Chat",
      url: "/chat",
      icon: SquarePen,
    },
    {
      title: "Search",
      icon: Search,
      onClick: () => setSearchOpen(true),
    },
  ]

  React.useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData.data.data.conversations)
    }
  }, [conversationsData])
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <DocAssistMark href="/" size="sm" />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative hidden size-8 shrink-0 group-data-[collapsible=icon]:block"
                onPointerEnter={() => setCompactLogoHovered(true)}
                onPointerLeave={() => setCompactLogoHovered(false)}
              >
                <Link
                  href="/"
                  className={cn(
                    "absolute inset-0 z-0 flex items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20 transition-all duration-150",
                    "hover:scale-105",
                    compactLogoHovered &&
                      "pointer-events-none scale-100 opacity-0"
                  )}
                  aria-label="DocAssist home"
                >
                  <span className="text-[10px] font-semibold">DA</span>
                </Link>
                <SidebarTrigger
                  className={cn(
                    "absolute inset-0 z-10 size-8 shrink-0 rounded-lg p-0 opacity-0 transition-opacity duration-150",
                    compactLogoHovered
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none"
                  )}
                  aria-label="Open sidebar"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side={open ? "bottom" : "right"}>
              {compactLogoHovered
                ? open
                  ? "Close sidebar"
                  : "Open sidebar"
                : "DocAssist home"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger
                className={cn(
                  "items-center pl-2 transition-opacity hover:bg-accent",
                  "group-data-[collapsible=full]:opacity-100",
                  "group-data-[collapsible=icon]:hidden"
                )}
              />
            </TooltipTrigger>
            <TooltipContent side={open ? "bottom" : "right"}>
              {open ? "Close sidebar" : "Open sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-2">
        <NavMain items={navMainItems} conversations={conversations} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.image || "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="top"
          showCloseButton
          className="mx-auto mt-16 h-auto max-h-[min(420px,70vh)] w-[min(100%-2rem,480px)] rounded-2xl border border-border/80 p-0 shadow-2xl data-[side=top]:slide-in-from-top-4"
        >
          <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
            <SheetTitle className="text-sm font-medium">
              Search conversations
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              Find a chat by title. Results update as you type.
            </p>
          </SheetHeader>
          <div className="p-2">
            <Input
              autoFocus
              placeholder="Search by name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-xl border-border/80 bg-muted/30"
            />
          </div>
          <ul className="max-h-64 overflow-auto px-2 pb-3" role="listbox">
            {searchFetching && searchResults.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </li>
            ) : null}
            {!searchFetching && searchResults.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {debouncedSearch
                  ? "No conversations match your search."
                  : "No conversations yet."}
              </li>
            ) : null}
            {searchResults.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    setSearchOpen(false)
                    router.push(`/c/${c._id}`)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    "hover:bg-muted/80"
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60">
                    <MessageSquare className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    {c.documentation ? (
                      <span className="text-xs text-muted-foreground">
                        {docLabel(c.documentation)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </Sidebar>
  )
}
