"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  ChevronDown,
  Copy,
  Ellipsis,
  Flag,
  Menu,
  MessageCircleDashed,
  Pin,
  RefreshCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  ExternalLink,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import { useState } from "react"
import { ChatInput } from "./chat-input"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  classifyDocumentation,
  createConversation,
  createMessageStream,
  getMessages,
  updateConversation,
} from "@/lib/axios"
import type { ConversationMeta } from "@/lib/axios"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSidebar } from "./ui/sidebar"
import { AppShellBackground } from "./app-shell-background"
import { APP_DOCUMENTATION_OPTIONS } from "@/lib/app-documentation-options"
import type { DocSlug } from "@/lib/docassist/types"
import {
  parseDocSlug,
  readLastDocumentation,
  writeLastDocumentation,
} from "@/lib/doc-preference"
import {
  classifyDocumentationHeuristic,
  shouldPromptDocumentationSwitch,
  takePendingAsk,
  writePendingAsk,
} from "@/lib/doc-intent"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

const STREAMING_ASSISTANT_ID = "__streaming__"

function documentationLabel(slug: DocSlug) {
  return APP_DOCUMENTATION_OPTIONS.find((d) => d.id === slug)?.label ?? slug
}

type ChatMessageRow = {
  _id: string
  sender: "user" | "assistant"
  content: string
  media?: Array<{
    url: string
    mimeType: string
    fileName?: string
    mediaType?: "image" | "audio" | "video" | "document"
  }>
  sources?: Array<{ title: string; url: string }>
}

export function Chat({ conversationId }: { conversationId?: string }) {
  const { toggleSidebar } = useSidebar()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [isSending, setIsSending] = useState(false)
  const [draftDocumentation, setDraftDocumentation] =
    useState<DocSlug>("stripe")
  const [docConfirmOpen, setDocConfirmOpen] = useState(false)
  const [pendingDocumentation, setPendingDocumentation] =
    useState<DocSlug | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [docMismatchOpen, setDocMismatchOpen] = useState(false)
  const [pendingAsk, setPendingAsk] = useState<{
    content: string
    media: NonNullable<ChatMessageRow["media"]>
    detected: DocSlug
  } | null>(null)
  const pendingAskRef = React.useRef(pendingAsk)
  pendingAskRef.current = pendingAsk
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, "up" | "down" | null>
  >({})
  const pendingConversationIdRef = React.useRef<string | null>(null)
  const didAutoScrollOnConversationRef = React.useRef<string | null>(null)
  const prevConversationIdRef = React.useRef<string | undefined>(conversationId)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)

  const isNearBottom = React.useCallback(() => {
    if (typeof document === "undefined") return true
    const threshold = 160
    const doc = document.documentElement
    const y = window.scrollY ?? doc.scrollTop
    const visibleBottom = y + window.innerHeight
    return doc.scrollHeight - visibleBottom < threshold
  }, [])

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" })
    },
    []
  )

  const toggleFeedback = React.useCallback(
    (messageId: string, next: "up" | "down") => {
      setMessageFeedback((prev) => ({
        ...prev,
        [messageId]: prev[messageId] === next ? null : next,
      }))
    },
    []
  )

  const copyToClipboard = React.useCallback((content: string) => {
    void navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }, [])

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: () => getMessages(conversationId as string),
  })

  const conversationMeta = messagesData?.data?.data?.conversation as
    | ConversationMeta
    | undefined

  React.useEffect(() => {
    setDraftDocumentation(readLastDocumentation())
  }, [])

  const activeDocumentation: DocSlug = React.useMemo(() => {
    if (conversationId) {
      return parseDocSlug(conversationMeta?.documentation)
    }
    return draftDocumentation
  }, [conversationId, conversationMeta?.documentation, draftDocumentation])

  const handleDocumentationSelect = React.useCallback(
    async (next: DocSlug) => {
      if (next === activeDocumentation) return

      if (conversationId && isLoading) {
        toast.info("Still loading this chat…")
        return
      }

      if (!conversationId) {
        if (messages.length === 0) {
          setDraftDocumentation(next)
          writeLastDocumentation(next)
          return
        }
        setPendingDocumentation(next)
        setDocConfirmOpen(true)
        return
      }

      if (messages.length === 0) {
        try {
          await updateConversation(conversationId, { documentation: next })
          await queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          })
          await queryClient.invalidateQueries({ queryKey: ["conversations"] })
          const label = APP_DOCUMENTATION_OPTIONS.find(
            (o) => o.id === next
          )?.label
          toast.success(
            label ? `Documentation set to ${label}` : "Documentation updated"
          )
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Could not update documentation"
          )
        }
        return
      }

      setPendingDocumentation(next)
      setDocConfirmOpen(true)
    },
    [
      activeDocumentation,
      conversationId,
      isLoading,
      messages.length,
      queryClient,
    ]
  )

  const confirmDocumentationSwitch = React.useCallback(async () => {
    if (!pendingDocumentation) return
    try {
      const res = await createConversation({
        documentation: pendingDocumentation,
      })
      const id = res.data?.data?.newConversation?._id as string | undefined
      if (!id) throw new Error("No conversation id returned")
      const label =
        APP_DOCUMENTATION_OPTIONS.find((o) => o.id === pendingDocumentation)
          ?.label ?? pendingDocumentation
      writeLastDocumentation(pendingDocumentation)
      toast.success(`Started new chat with ${label} docs`)
      setDocConfirmOpen(false)
      setPendingDocumentation(null)
      router.push(`/c/${id}`)
      void queryClient.invalidateQueries({ queryKey: ["conversations"] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start a new chat")
    }
  }, [pendingDocumentation, queryClient, router])

  React.useEffect(() => {
    const previousId = prevConversationIdRef.current
    prevConversationIdRef.current = conversationId
    if (didAutoScrollOnConversationRef.current !== conversationId) {
      didAutoScrollOnConversationRef.current = null
    }
    if (previousId && previousId !== conversationId) {
      setMessages([])
    }
  }, [conversationId])

  React.useEffect(() => {
    const onScroll = () => setShowScrollToLatest(!isNearBottom())
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isNearBottom])

  React.useEffect(() => {
    if (!messages.length) return
    if (isSending || isNearBottom()) {
      scrollToBottom("smooth")
      return
    }
    setShowScrollToLatest(true)
  }, [messages, isNearBottom, isSending, scrollToBottom])

  React.useEffect(() => {
    if (!conversationId || !messages.length) return
    if (didAutoScrollOnConversationRef.current === conversationId) return
    scrollToBottom("auto")
    didAutoScrollOnConversationRef.current = conversationId
    setShowScrollToLatest(false)
  }, [conversationId, messages, scrollToBottom])

  React.useEffect(() => {
    if (isSending) return
    const list = messagesData?.data?.data?.messages as
      | ChatMessageRow[]
      | undefined
    if (list) {
      setMessages(list)
    }
  }, [messagesData, isSending])

  const sendNow = React.useCallback(
    async (
      content: string,
      media: Array<{
        url: string
        mimeType: string
        fileName?: string
        mediaType?: "image" | "audio" | "video" | "document"
      }> = [],
      options?: {
        conversationId?: string
        documentation?: DocSlug
      }
    ) => {
      const trimmed = content.trim()
      if ((!trimmed && media.length === 0) || isSending) return

      const targetConversationId = options?.conversationId ?? conversationId
      const targetDocumentation =
        options?.documentation ?? activeDocumentation

      setIsSending(true)
      pendingConversationIdRef.current = null

      try {
        await createMessageStream(
          {
            content: trimmed,
            media,
            documentation: targetDocumentation,
            ...(targetConversationId
              ? { conversationId: targetConversationId }
              : {}),
          },
          {
            onStart: ({ newConversationId, userMessage }) => {
              if (newConversationId) {
                pendingConversationIdRef.current = newConversationId
              }
              setMessages((prev) => [
                ...prev.filter(
                  (m) =>
                    m._id !== userMessage._id &&
                    m._id !== STREAMING_ASSISTANT_ID
                ),
                {
                  _id: userMessage._id,
                  sender: "user",
                  content: userMessage.content,
                  media: userMessage.media ?? [],
                },
                {
                  _id: STREAMING_ASSISTANT_ID,
                  sender: "assistant",
                  content: "",
                },
              ])
            },
            onSources: (sources) => {
              setMessages((prev) => {
                const i = prev.findIndex(
                  (m) => m._id === STREAMING_ASSISTANT_ID
                )
                if (i === -1) return prev
                const next = [...prev]
                const row = next[i]
                next[i] = { ...row, sources }
                return next
              })
            },
            onDelta: (text) => {
              setMessages((prev) => {
                const i = prev.findIndex(
                  (m) => m._id === STREAMING_ASSISTANT_ID
                )
                if (i === -1) return prev
                const next = [...prev]
                const row = next[i]
                next[i] = {
                  ...row,
                  content: row.content + text,
                }
                return next
              })
            },
            onDone: ({ assistantMessage }) => {
              setMessages((prev) => {
                const rest = prev.filter(
                  (m) => m._id !== STREAMING_ASSISTANT_ID
                )
                return [
                  ...rest,
                  {
                    _id: assistantMessage._id,
                    sender: "assistant",
                    content: assistantMessage.content,
                    media: assistantMessage.media ?? [],
                    sources: assistantMessage.sources ?? [],
                  },
                ]
              })

              const navId = pendingConversationIdRef.current
              pendingConversationIdRef.current = null

              if (navId && !targetConversationId) {
                router.replace(`/c/${navId}`)
              }

              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              queryClient.invalidateQueries({
                queryKey: ["messages", navId ?? targetConversationId],
              })
            },
            onError: (message) => {
              setMessages((prev) =>
                prev.filter((m) => m._id !== STREAMING_ASSISTANT_ID)
              )
              toast.error(message)
            },
          }
        )
      } catch (e) {
        setMessages((prev) =>
          prev.filter((m) => m._id !== STREAMING_ASSISTANT_ID)
        )
        toast.error(e instanceof Error ? e.message : "Failed to send message")
      } finally {
        setIsSending(false)
      }
    },
    [conversationId, activeDocumentation, isSending, queryClient, router]
  )

  const resolveDocumentationIntent = React.useCallback(
    async (query: string) => {
      const local = classifyDocumentationHeuristic(query)
      if (local.documentation && local.confidence === "high") return local
      try {
        return await classifyDocumentation(query)
      } catch {
        return local
      }
    },
    []
  )

  const handleSend = React.useCallback(
    async (
      content: string,
      media: Array<{
        url: string
        mimeType: string
        fileName?: string
        mediaType?: "image" | "audio" | "video" | "document"
      }> = []
    ) => {
      const trimmed = content.trim()
      if ((!trimmed && media.length === 0) || isSending || isClassifying) return

      if (!trimmed) {
        await sendNow(trimmed, media)
        return
      }

      setIsClassifying(true)
      try {
        const intent = await resolveDocumentationIntent(trimmed)
        if (shouldPromptDocumentationSwitch(activeDocumentation, intent)) {
          setPendingAsk({
            content: trimmed,
            media,
            detected: intent.documentation,
          })
          setDocMismatchOpen(true)
          return
        }
      } finally {
        setIsClassifying(false)
      }

      await sendNow(trimmed, media)
    },
    [
      activeDocumentation,
      isClassifying,
      isSending,
      resolveDocumentationIntent,
      sendNow,
    ]
  )

  const stayOnCurrentDocs = React.useCallback(() => {
    const pending = pendingAskRef.current
    setDocMismatchOpen(false)
    setPendingAsk(null)
    if (!pending) return
    void sendNow(pending.content, pending.media)
  }, [sendNow])

  const switchToDetectedDocs = React.useCallback(async () => {
    const pending = pendingAskRef.current
    if (!pending) return

    const detected = pending.detected
    setDocMismatchOpen(false)
    setPendingAsk(null)

    try {
      if (!conversationId) {
        setDraftDocumentation(detected)
        writeLastDocumentation(detected)
        await sendNow(pending.content, pending.media, {
          documentation: detected,
        })
        return
      }

      if (messages.length === 0) {
        await updateConversation(conversationId, { documentation: detected })
        writeLastDocumentation(detected)
        await queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        })
        await queryClient.invalidateQueries({ queryKey: ["conversations"] })
        await sendNow(pending.content, pending.media, {
          conversationId,
          documentation: detected,
        })
        return
      }

      const res = await createConversation({ documentation: detected })
      const id = res.data?.data?.newConversation?._id as string | undefined
      if (!id) throw new Error("No conversation id returned")
      writeLastDocumentation(detected)
      writePendingAsk({
        conversationId: id,
        documentation: detected,
        content: pending.content,
        media: pending.media,
      })
      router.push(`/c/${id}`)
      void queryClient.invalidateQueries({ queryKey: ["conversations"] })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not switch documentation"
      )
    }
  }, [
    conversationId,
    messages.length,
    pendingAsk,
    queryClient,
    router,
    sendNow,
  ])

  React.useEffect(() => {
    if (!conversationId || isSending || isClassifying) return
    const pending = takePendingAsk(conversationId)
    if (!pending) return
    void sendNow(pending.content, pending.media, {
      conversationId,
      documentation: pending.documentation,
    })
  }, [conversationId, isClassifying, isSending, sendNow])

  const renderMedia = React.useCallback(
    (media?: ChatMessageRow["media"], align: "left" | "right" = "left") => {
      if (!media?.length) return null
      return (
        <div
          className={cn(
            "mt-1 flex max-w-[70%] gap-2",
            align === "right"
              ? "ml-auto justify-items-start"
              : "mr-auto justify-items-start"
          )}
        >
          {media.map((item, index) => {
            const isImage = item.mimeType?.startsWith("image/")
            const label = item.fileName || `Attachment ${index + 1}`
            if (isImage) {
              return (
                <Link
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Image
                    src={item.url}
                    alt={label}
                    width={100}
                    height={100}
                    className="h-28 w-full rounded-xl border border-border/60 object-cover shadow-sm"
                  />
                </Link>
              )
            }
            return (
              <Link
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 block rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm transition-colors hover:border-primary/25 hover:bg-muted/50"
              >
                {label}
              </Link>
            )
          })}
        </div>
      )
    },
    []
  )

  const retryAssistantResponse = React.useCallback(
    (assistantMessageId: string) => {
      if (isSending || isClassifying) return
      const assistantIndex = messages.findIndex(
        (m) => m._id === assistantMessageId
      )
      if (assistantIndex <= 0) return

      for (let i = assistantIndex - 1; i >= 0; i--) {
        const candidate = messages[i]
        if (candidate.sender === "user") {
          void handleSend(candidate.content, candidate.media ?? [])
          return
        }
      }
    },
    [handleSend, isClassifying, isSending, messages]
  )

  const docLabel = documentationLabel(activeDocumentation)
  const detectedLabel = pendingAsk
    ? documentationLabel(pendingAsk.detected)
    : "other"

  return (
    <div className="relative flex min-h-svh flex-1 flex-col bg-background">
      <AppShellBackground />
      <header className="sticky top-0 z-30 flex min-h-14 shrink-0 flex-col gap-1 border-b border-border/60 bg-background/95 px-4 py-2 supports-backdrop-filter:backdrop-blur-xl sm:flex-row sm:items-center sm:gap-2 sm:py-0">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebar}
                className="shrink-0 md:hidden"
              >
                <Menu className="size-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 max-w-[min(100%,220px)] cursor-pointer justify-between gap-2 truncate rounded-full border-border/80 bg-card/50 shadow-sm transition-colors hover:border-primary/30 hover:bg-card/80"
                  >
                    <span className="truncate font-medium">{docLabel}</span>
                    <ChevronDown className="size-4 shrink-0 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-52 rounded-xl border-border/80"
                >
                  <DropdownMenuGroup>
                    {APP_DOCUMENTATION_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.id}
                        onClick={() => void handleDocumentationSelect(opt.id)}
                        className={cn(
                          "rounded-lg",
                          activeDocumentation === opt.id &&
                            "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                        )}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="truncate text-xs text-muted-foreground sm:max-w-[min(100%,280px)]">
              Chatting with:{" "}
              <span className="font-medium text-foreground">
                {docLabel} Docs
              </span>
            </p>
          </div>
          {conversationId ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="hidden cursor-pointer rounded-full sm:inline-flex"
              >
                <Share className="size-4" />
                Share
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                  >
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-44 rounded-xl border-border/80"
                  align="end"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="rounded-lg">
                      <Pin /> Pin chat
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg">
                      <Archive /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg">
                      <Flag /> Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      className="rounded-lg"
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-full">
                  <MessageCircleDashed className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {isLoading && conversationId ? (
          <div className="flex min-h-[50svh] flex-1 items-center justify-center px-4">
            <p className="text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[50svh] flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              DocAssist
            </p>
            <h1 className="max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              <span className="text-muted-foreground">Ask anything about </span>
              <span className="bg-linear-to-r from-foreground via-primary to-chart-2 bg-clip-text text-transparent">
                {docLabel}
              </span>
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Instant, context-aware answers with code — same flow as the
              landing demo.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 pb-6">
            {messages.map((message) => (
              <Message
                key={message._id}
                from={message.sender === "user" ? "user" : "assistant"}
                className={cn(
                  "w-full max-w-full",
                  message.sender === "user" ? "items-end" : "items-start"
                )}
              >
                {message.sender === "user" ? (
                  <div className="flex w-full flex-col items-end gap-1">
                    {renderMedia(message.media, "right")}
                    {message.content.trim().length > 0 && (
                      <MessageContent className="wrap-break-words w-fit max-w-[70%] rounded-3xl whitespace-pre-wrap">
                        {message.content}
                      </MessageContent>
                    )}
                    <MessageActions className="gap-0.5 pl-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <MessageAction
                        tooltip="Copy"
                        label="Copy"
                        className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="size-4" strokeWidth={1.75} />
                      </MessageAction>
                    </MessageActions>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-start gap-1">
                    <MessageContent className="wrap-break-words w-[70%] max-w-[70%] border-none bg-transparent px-0 whitespace-pre-wrap">
                      <MessageResponse>{message.content}</MessageResponse>
                      {renderMedia(message.media, "left")}
                      {message._id === STREAMING_ASSISTANT_ID && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                      )}
                    </MessageContent>
                    {!!message.sources?.length && (
                      <div className="mt-1 flex w-[70%] max-w-[70%] flex-col gap-2">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, index) => {
                            let host = source.title
                            try {
                              host = new URL(source.url).hostname.replace(
                                /^www\./,
                                ""
                              )
                            } catch {
                              /* keep title */
                            }
                            return (
                              <Link
                                key={`${source.url}-${index}`}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-xs text-foreground/90 transition-colors hover:border-primary/40 hover:bg-muted/60"
                              >
                                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                  {index + 1}
                                </span>
                                <span className="truncate">
                                  {source.title || host}
                                </span>
                                <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {message._id !== STREAMING_ASSISTANT_ID &&
                      message.content.trim().length > 0 && (
                        <MessageActions className="gap-0.5 pl-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <MessageAction
                            tooltip="Regenerate response"
                            label="Retry"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                            onClick={() => retryAssistantResponse(message._id)}
                            disabled={isSending}
                          >
                            <RefreshCcw
                              className={cn(
                                "size-4",
                                isSending && "animate-spin"
                              )}
                              strokeWidth={1.75}
                            />
                          </MessageAction>
                          <MessageAction
                            tooltip="Copy"
                            label="Copy"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="size-4" strokeWidth={1.75} />
                          </MessageAction>
                          <MessageAction
                            tooltip="Good response"
                            label="Like"
                            className={cn(
                              "h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground",
                              messageFeedback[message._id] === "up" &&
                                "text-foreground"
                            )}
                            onClick={() => toggleFeedback(message._id, "up")}
                          >
                            <ThumbsUp className="size-4" strokeWidth={1.75} />
                          </MessageAction>
                          <MessageAction
                            tooltip="Bad response"
                            label="Dislike"
                            className={cn(
                              "h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground",
                              messageFeedback[message._id] === "down" &&
                                "text-foreground"
                            )}
                            onClick={() => toggleFeedback(message._id, "down")}
                          >
                            <ThumbsDown className="size-4" strokeWidth={1.75} />
                          </MessageAction>
                        </MessageActions>
                      )}
                  </div>
                )}
              </Message>
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
      </div>

      <footer className="sticky bottom-0 z-30 mt-auto shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-4 pb-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2">
          {showScrollToLatest ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 cursor-pointer rounded-full border-border/80 bg-card/90 text-foreground shadow-lg shadow-primary/15 supports-backdrop-filter:backdrop-blur-md"
              onClick={() => {
                scrollToBottom("smooth")
                setShowScrollToLatest(false)
              }}
            >
              <ChevronDown className="size-4" />
            </Button>
          ) : null}
          {isClassifying ? (
            <p className="text-center text-xs text-muted-foreground">
              Checking which documentation this question is about…
            </p>
          ) : !showScrollToLatest ? (
            <p className="text-center text-xs text-muted-foreground">
              DocAssist can make mistakes. Check important info.
            </p>
          ) : null}
          <ChatInput
            onSend={handleSend}
            isSending={isSending || isClassifying}
          />
        </div>
      </footer>

      <AlertDialog
        open={docMismatchOpen}
        onOpenChange={(open) => {
          setDocMismatchOpen(open)
          if (!open) setPendingAsk(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {detectedLabel} docs?</AlertDialogTitle>
            <AlertDialogDescription>
              This question looks like it is about{" "}
              <span className="font-medium text-foreground">
                {detectedLabel}
              </span>
              , but this chat is using{" "}
              <span className="font-medium text-foreground">{docLabel}</span>{" "}
              documentation. Switch so answers use the matching sources?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={stayOnCurrentDocs}
            >
              Stay on {docLabel}
            </Button>
            <Button type="button" onClick={() => void switchToDetectedDocs()}>
              Switch to {detectedLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={docConfirmOpen}
        onOpenChange={(open) => {
          setDocConfirmOpen(open)
          if (!open) setPendingDocumentation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching documentation will start a new chat. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void confirmDocumentationSwitch()}
            >
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
