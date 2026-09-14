import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProfileForm } from "@/components/profile-form"
import { AppShellBackground } from "@/components/app-shell-background"

export const metadata: Metadata = {
  title: "Profile",
  description: "Update your DocAssist profile.",
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative flex min-h-svh flex-1 flex-col">
          <AppShellBackground />
          <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-8 shadow-xl shadow-primary/10 supports-backdrop-filter:backdrop-blur-xl">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Your profile
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update how you appear in DocAssist
                </p>
              </div>
              <ProfileForm />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
