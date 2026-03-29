"use client"

import {
  Archive,
  Flag,
  Ellipsis,
  Pin,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useState, useRef, useMemo, useLayoutEffect, useEffect } from "react"
import { APP_DOCUMENTATION_OPTIONS } from "@/lib/app-documentation-options"
import { parseDocSlug } from "@/lib/doc-preference"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { deleteConversation, updateConversationName } from "@/lib/axios"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Input } from "./ui/input"

export function NavMain({
  items,
  conversations,
}: {
  items: {
    title: string
    url?: string
    icon: LucideIcon
    isActive?: boolean
    badge?: string
    onClick?: () => void
  }[]
  conversations: {
    _id: string
    name: string
    documentation?: string
  }[]
}) {
  const queryClient = useQueryClient()

  const groupedConversations = useMemo(() => {
    const map = new Map<
      string,
      { _id: string; name: string; documentation?: string }[]
    >()
    for (const c of conversations) {
      const key = parseDocSlug(c.documentation)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    const order = APP_DOCUMENTATION_OPTIONS.map((o) => o.id)
    return order
      .filter((id) => map.has(id))
      .map((id) => ({
        docId: id,
        label: APP_DOCUMENTATION_OPTIONS.find((o) => o.id === id)?.label ?? id,
        items: map.get(id)!,
      }))
  }, [conversations])

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const inputRef = useRef<HTMLInputElement | null>(null)

  useLayoutEffect(() => {
    if (!renamingId) return
    const el = inputRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    el.select()
  }, [renamingId])

  useEffect(() => {
    if (!renamingId) return
    const run = () => {
      const el = inputRef.current
      if (!el) return
      el.focus({ preventScroll: true })
      el.select()
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(run)
    })
    const t = window.setTimeout(run, 0)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t)
    }
  }, [renamingId])

  const startRename = (id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
  }

  const saveRename = async (id: string, original: string) => {
    const next = renameValue.trim()

    setRenamingId(null)

    if (!next || next === original) return

    try {
      const res = await updateConversationName(id, next)
      if (res.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      }
    } catch {
      console.error("Failed to rename conversation")
    }
  }

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title} className="mx-2">
          <SidebarMenuButton asChild isActive={item.isActive}>
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="flex w-full items-center gap-2 rounded-lg transition-colors"
              >
                <item.icon />
                <span className="flex-1 truncate text-left">{item.title}</span>
                {item.badge ? (
                  <SidebarMenuBadge className="ml-auto">
                    {item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </button>
            ) : (
              <Link
                href={item.url ?? "#"}
                className="flex w-full items-center gap-2 rounded-lg transition-colors"
              >
                <item.icon />
                <span className="flex-1 truncate">{item.title}</span>
                {item.badge ? (
                  <SidebarMenuBadge className="ml-auto">
                    {item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </Link>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      {groupedConversations.map((group) => (
        <SidebarGroup
          key={group.docId}
          className="group-data-[collapsible=icon]:hidden"
        >
          <SidebarGroupLabel className="text-primary/90">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((c) => {
              const isRenaming = renamingId === c._id
              return (
                <SidebarMenuItem key={c._id}>
                  <SidebarMenuButton asChild>
                    {isRenaming ? (
                      <div className="relative flex h-9 w-full items-center overflow-hidden rounded-lg border border-primary/25 bg-primary/5 px-2">
                        <Input
                          ref={inputRef}
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => saveRename(c._id, c.name)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur()
                            if (e.key === "Escape") {
                              setRenamingId(null)
                              setRenameValue(c.name)
                            }
                          }}
                          className="min-w-0 flex-1 border-none bg-transparent pr-8 text-sm font-medium shadow-none outline-none caret-primary selection:bg-sky-400/35 selection:text-foreground dark:selection:bg-sky-400/30 focus-visible:border-transparent focus-visible:ring-0"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-7 w-7 shrink-0 -translate-y-1/2"
                        >
                          <Ellipsis className="h-4 w-4 opacity-60" />
                        </Button>
                      </div>
                    ) : (
                      <Link
                        href={`/c/${c._id}`}
                        className={cn(
                          "group/item relative flex h-9 w-full items-center overflow-hidden rounded-lg border border-transparent px-2",
                          "transition-colors hover:border-border/60 hover:bg-sidebar-accent/80",
                          openMenuId === c._id &&
                            "border-border/50 bg-sidebar-accent/90"
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate pr-8 text-sm">
                          {c.name}
                        </span>

                        <DropdownMenu
                          open={openMenuId === c._id}
                          onOpenChange={(v) => setOpenMenuId(v ? c._id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setOpenMenuId(c._id)
                              }}
                              className={cn(
                                "absolute top-1/2 right-1 h-7 w-7 shrink-0 -translate-y-1/2",
                                "opacity-0 transition-opacity group-hover/item:opacity-100",
                                openMenuId === c._id && "opacity-100"
                              )}
                            >
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="start"
                            className="w-40"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  startRename(c._id, c.name)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={async (e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const res = await deleteConversation(c._id)
                                  if (res.status === 200) {
                                    toast.success(res.data.message)
                                    queryClient.invalidateQueries({
                                      queryKey: ["conversations"],
                                    })
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarMenu>
  )
}
