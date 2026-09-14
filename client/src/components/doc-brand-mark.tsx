import Image from "next/image"
import { cn } from "@/lib/utils"
import type { DocSlug } from "@/lib/docassist/types"

const SRC: Record<
  DocSlug,
  { light: string; dark?: string; alt: string; well?: string; pad?: string }
> = {
  stripe: {
    light: "/brands/stripe.webp",
    alt: "Stripe",
  },
  livekit: {
    light: "/brands/livekit-color-light.webp",
    dark: "/brands/livekit-color-dark.webp",
    alt: "LiveKit",
    well: "bg-black",
    pad: "p-2",
  },
  nextjs: {
    light: "/brands/nextjs-light.webp",
    dark: "/brands/nextjs-dark.webp",
    alt: "Next.js",
    pad: "p-2",
  },
}

export function DocBrandMark({
  id,
  className,
}: {
  id: DocSlug
  className?: string
}) {
  const mark = SRC[id]
  return (
    <span
      className={cn(
        "relative inline-flex size-12 overflow-hidden rounded-xl ring-1 ring-border/70",
        mark.well ?? "bg-background",
        className
      )}
    >
      <Image
        src={mark.light}
        alt={mark.alt}
        fill
        sizes="48px"
        className={cn(
          "object-contain",
          mark.pad,
          mark.dark && "dark:hidden"
        )}
      />
      {mark.dark ? (
        <Image
          src={mark.dark}
          alt=""
          fill
          sizes="48px"
          className={cn("hidden object-contain dark:block", mark.pad)}
        />
      ) : null}
    </span>
  )
}
