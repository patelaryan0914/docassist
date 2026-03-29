import type { Metadata } from "next"
import { LandingPage } from "@/components/landing/landing-page"
import {
  getSiteUrl,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
} from "@/lib/site"

export const metadata: Metadata = {
  title: SITE_TITLE_DEFAULT,
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_AUTHOR }],
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
}

function HomeJsonLd() {
  const base = getSiteUrl()
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        author: {
          "@type": "Person",
          name: SITE_AUTHOR,
          url: base,
        },
        publisher: {
          "@type": "Person",
          name: SITE_AUTHOR,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${base}/#app`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        author: {
          "@type": "Person",
          name: SITE_AUTHOR,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default function Page() {
  return (
    <>
      <HomeJsonLd />
      <LandingPage />
    </>
  )
}
