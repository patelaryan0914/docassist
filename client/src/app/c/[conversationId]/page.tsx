import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Chat } from "@/components/chat"

export const metadata: Metadata = {
  title: "Conversation",
  description: "DocAssist conversation.",
  robots: { index: false, follow: false },
}

export default async function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Chat conversationId={conversationId} />
      </SidebarInset>
    </SidebarProvider>
  )
}
