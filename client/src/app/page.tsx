import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Chat } from "@/components/chat"

export default async function Page() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Chat />
      </SidebarInset>
    </SidebarProvider>
  )
}
