import type { Metadata, Viewport } from "next"
import { Geist_Mono, Figtree } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { ReactQueryProviderWrapper } from "@/components/ReactQueryProviderWrapper"
import { Toaster } from "@/components/ui/sonner"
import { ReduxProviderWrapper } from "@/components/ReduxProviderWrapper"
import {
  getSiteUrl,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
} from "@/lib/site"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: siteUrl }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  keywords: [...SITE_KEYWORDS],
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1e" },
  ],
}

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
