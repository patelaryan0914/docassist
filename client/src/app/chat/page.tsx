import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Chat } from "@/components/chat"

export const metadata: Metadata = {
  title: "Chat",
  description: "Private DocAssist chat session.",
  robots: { index: false, follow: false },
}

export default async function ChatPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Chat />
      </SidebarInset>
    </SidebarProvider>
  )
}
