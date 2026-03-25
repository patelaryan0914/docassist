"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Home,
  Inbox,
  Map,
  PieChart,
  Search,
  Sparkles,
  SquarePen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAppSelector } from "@/store/hooks"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/lib/axios"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "New Chat",
      url: "/",
      icon: SquarePen,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    {
      title: "Home",
      url: "#",
      icon: Home,
      isActive: true,
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      badge: "10",
    },
  ],
  conversations: [
    {
      _id: "1",
      name: "Project Management & Task Tracking",
      url: "#",
      emoji: "📊",
    },
    {
      _id: "2",
      name: "Family Recipe Collection & Meal Planning",
      url: "#",
      emoji: "🍳",
    },
    {
      _id: "3",
      name: "Fitness Tracker & Workout Routines",
      url: "#",
      emoji: "💪",
    },
    {
      _id: "4",
      name: "Book Notes & Reading List",
      url: "#",
      emoji: "📚",
    },
    {
      _id: "5",
      name: "Sustainable Gardening Tips & Plant Care",
      url: "#",
      emoji: "🌱",
    },
    {
      _id: "6",
      name: "Language Learning Progress & Resources",
      url: "#",
      emoji: "🗣️",
    },
    {
      _id: "7",
      name: "Home Renovation Ideas & Budget Tracker",
      url: "#",
      emoji: "🏠",
    },
    {
      _id: "8",
      name: "Personal Finance & Investment Portfolio",
      url: "#",
      emoji: "💰",
    },
    {
      _id: "9",
      name: "Movie & TV Show Watchlist with Reviews",
      url: "#",
      emoji: "🎬",
    },
    {
      _id: "10",
      name: "Daily Habit Tracker & Goal Setting",
      url: "#",
      emoji: "✅",
    },
  ],
}
type Conversation = {
  _id: string;
  name: string;
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const { userInfo } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const { data:conversationsData, isLoading, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => {
      return getConversations();
    },
    placeholderData: (prev) => prev,
  });
  React.useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData.data.data.conversations);
    }
  }, [conversationsData]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link
            href="#"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:group-hover:hidden"
          >
            <GalleryVerticalEnd className="size-4" />
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger
                className={cn(
                  "items-center pl-2 transition-opacity hover:bg-accent",
                  "group-data-[collapsible=full]:opacity-100",
                  "group-data-[collapsible=icon]:hidden",
                  "group-data-[collapsible=icon]:group-hover:block"
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
        <NavMain items={data.navMain} conversations={conversations} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: userInfo.name, email: userInfo.email, avatar: userInfo.image || "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
