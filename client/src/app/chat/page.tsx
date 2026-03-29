import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Chat } from "@/components/chat"

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
