import { Geist_Mono, Figtree } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { ReactQueryProviderWrapper } from "@/components/ReactQueryProviderWrapper"
import { Toaster } from "@/components/ui/sonner"
import { ReduxProviderWrapper } from "@/components/ReduxProviderWrapper"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body>
          <ReactQueryProviderWrapper>
            <ReduxProviderWrapper>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
               <Toaster />
            </ThemeProvider>
            </ReduxProviderWrapper>
          </ReactQueryProviderWrapper>
      </body>
    </html>
  )
}
