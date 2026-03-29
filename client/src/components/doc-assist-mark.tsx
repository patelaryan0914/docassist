import Link from "next/link"
import { cn } from "@/lib/utils"

export function DocAssistMark({
  href = "/",
  className,
  showWordmark = true,
  size = "default",
}: {
  href?: string | null
  className?: string
  showWordmark?: boolean
  size?: "default" | "sm" | "lg"
}) {
  const box =
    size === "sm"
      ? "size-7 text-[10px]"
      : size === "lg"
        ? "size-10 text-sm"
        : "size-8 text-xs"

  const mark = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/15 font-semibold tracking-tight text-primary ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-105",
        box
      )}
    >
      DA
    </span>
  )

  const wordmark = showWordmark ? (
    <span className="font-semibold tracking-tight text-foreground">
      DocAssist
    </span>
  ) : null

  const inner = (
    <>
      {mark}
      {wordmark}
    </>
  )

  if (href === null) {
    return (
      <span className={cn("group inline-flex items-center gap-2", className)}>
        {inner}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
    >
      {inner}
    </Link>
  )
}
