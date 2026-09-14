"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { cjk } from "@streamdown/cjk"
import { code } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"
import type { UIMessage } from "ai"
import type { ComponentProps, HTMLAttributes, ReactNode } from "react"
import { isValidElement, memo } from "react"
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  Streamdown,
} from "streamdown"

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"]
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-full flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm leading-relaxed",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-sm group-[.is-user]:border group-[.is-user]:border-border/60 group-[.is-user]:bg-card/70 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground supports-backdrop-filter:group-[.is-user]:backdrop-blur-sm",
      "group-[.is-assistant]:rounded-2xl group-[.is-assistant]:rounded-tl-sm group-[.is-assistant]:border-transparent group-[.is-assistant]:bg-transparent group-[.is-assistant]:px-4 group-[.is-assistant]:py-3 group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionsProps = ComponentProps<"div">

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
)

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string
  label?: string
}

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

export type MessageResponseProps = ComponentProps<typeof Streamdown>

const streamdownPlugins = { cjk, code, math, mermaid }
const languageClass = /language-([^\s]+)/

const getFenceText = (children: ReactNode): string => {
  if (typeof children === "string") return children
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return getFenceText(children.props.children)
  }
  if (Array.isArray(children)) {
    return children.map(getFenceText).join("")
  }
  return ""
}

const ChatCode = ({
  className,
  children,
  ...props
}: ComponentProps<"code">) => {
  const isBlock = "data-block" in props
  if (!isBlock) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  const language = className?.match(languageClass)?.[1] ?? ""
  const text = getFenceText(children)

  return (
    <div className="chat-code-block not-typeset my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <span className="ml-1 font-mono text-xs text-muted-foreground lowercase">
          {language}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <CodeBlockDownloadButton code={text} language={language} />
          <CodeBlockCopyButton code={text} />
        </div>
      </div>
      <CodeBlock className={className} code={text} language={language} />
    </div>
  )
}

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn("typeset typeset-chat w-full max-w-full size-full", className)}
      components={{ code: ChatCode } as MessageResponseProps["components"]}
      controls={{ code: false }}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    nextProps.isAnimating === prevProps.isAnimating
)

MessageResponse.displayName = "MessageResponse"
