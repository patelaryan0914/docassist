"use client"

import {
  Archive,
  Flag,
  Ellipsis,
  Pin,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
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
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { deleteConversation } from "@/lib/axios"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export function NavMain({
  items,
  conversations,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
  conversations: {
    _id: string
    name: string
  }[]
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
const queryClient = useQueryClient();
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title} className="mx-2">
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={item.url}>
              <item.icon/>
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Your Chats</SidebarGroupLabel>
        <SidebarMenu>
          {conversations.map((conversation) => (
            <SidebarMenuItem key={conversation._id}>
              <SidebarMenuButton asChild>
                <Link
                  href={`/c/${conversation._id}`}
                  className={cn(
                    "group/item relative flex w-full items-center rounded-md px-2 py-1.5",
                    "transition-colors hover:bg-accent",
                    openMenuId === conversation._id && "bg-accent"
                  )}
                >
                  <span className="truncate pr-6">{conversation.name}</span>
                  <DropdownMenu
                    open={openMenuId === conversation._id}
                    onOpenChange={(isOpen) => {
                      setOpenMenuId(isOpen ? conversation._id : null)
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(conversation._id)
                        }}
                        className={cn(
                          "absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer",
                          "h-7 w-7 rounded",
                          "opacity-0 transition-opacity",
                          "group-hover/item:opacity-100",
                          openMenuId === conversation._id && "opacity-100",
                          "hover:bg-accent focus-visible:ring-0"
                        )}
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="start">
                      <DropdownMenuGroup>
                        <DropdownMenuItem key={"pin-chat"}>
                          <Pin />
                          Pin Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem key={"archieve"}>
                          <Archive />
                          Archieve
                        </DropdownMenuItem>
                        <DropdownMenuItem key={"report"}>
                          <Flag />
                          Report
                        </DropdownMenuItem>
                        <DropdownMenuItem key={"delete"} variant="destructive" onClick={async () => {
              try {
              const res = await deleteConversation(conversation._id);
              if (res.status == 200) {toast.success(res.data.message);   queryClient.invalidateQueries({
                queryKey: ["conversations"],
              });}
              else {toast.error(res.data.message);};

            } catch (err) {
              console.log("Error in Deleting Conversation", err);
            }
          }}
        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarMenu>
  )
}
