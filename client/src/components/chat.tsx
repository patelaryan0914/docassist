"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  ChevronDown,
  Copy,
  Ellipsis,
  Flag,
  MessageCircleDashed,
  Pin,
  Share,
  ThumbsDown,
  ThumbsUp,
  Trash2,
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
import { useState } from "react"
import { ChatInput } from "./chat-input"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createMessageStream, getMessages } from "@/lib/axios"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STREAMING_ASSISTANT_ID = "__streaming__"

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
}

export function Chat({ conversationId }: { conversationId?: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [isSending, setIsSending] = useState(false)
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, "up" | "down" | null>
  >({})
  const pendingConversationIdRef = React.useRef<string | null>(null)
  const didAutoScrollOnConversationRef = React.useRef<string | null>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)

  const isNearBottom = React.useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return true
    const threshold = 120
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollAreaRef.current
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior })
        return
      }
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

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: () => getMessages(conversationId as string),
    placeholderData: (prev) => prev,
  })

  React.useEffect(() => {
    if (didAutoScrollOnConversationRef.current !== conversationId) {
      didAutoScrollOnConversationRef.current = null
    }
  }, [conversationId])

  React.useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const onScroll = () => {
      setShowScrollToLatest(!isNearBottom())
    }
    onScroll()
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
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
      if ((!trimmed && media.length === 0) || isSending) return

      setIsSending(true)
      pendingConversationIdRef.current = null

      try {
        await createMessageStream(
          {
            content: trimmed,
            media,
            ...(conversationId ? { conversationId } : {}),
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
                  },
                ]
              })

              const navId = pendingConversationIdRef.current
              pendingConversationIdRef.current = null

              if (navId && !conversationId) {
                router.replace(`/c/${navId}`)
              }

              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              queryClient.invalidateQueries({
                queryKey: ["messages", navId ?? conversationId],
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
    [conversationId, isSending, queryClient, router]
  )

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
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={item.url}
                    alt={label}
                    className="h-28 w-full rounded-xl border object-cover"
                  />
                </a>
              )
            }
            return (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 block rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
              >
                {label}
              </a>
            )
          })}
        </div>
      )
    },
    []
  )

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <header className="flex h-12 items-center gap-2 border-b px-4">
        <div className="flex w-full items-center justify-between">
          <div>hello</div>

          {conversationId ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="cursor-pointer">
                <Share />
                Share
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-40" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Pin /> Pin Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Flag /> Report
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MessageCircleDashed />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Temporary chat</TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>

      <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && conversationId ? (
          <div className="flex h-full items-center justify-center px-4">
            <p className="text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <h1 className="text-3xl font-semibold text-muted-foreground">
              What’s on your mind today?
            </h1>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 pb-44">
            {messages.map((message) => (
              <div key={message._id}>
                {message.sender === "user" ? (
                  <div className="group flex w-full flex-col items-end gap-1">
                    {renderMedia(message.media, "right")}
                    {message.content.trim().length > 0 && (
                      <div className="wrap-break-words max-w-[70%] rounded-[22px] bg-secondary px-4 py-2.5 leading-6 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                    <div className="flex items-center gap-0.5 pl-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                message.content
                              )
                              toast.success("Copied to clipboard")
                            }}
                          >
                            <Copy className="size-4" strokeWidth={1.75} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Copy</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <div className="group flex w-full flex-col items-start gap-1">
                    <div className="wrap-break-words max-w-[70%] rounded-[22px] px-4 py-2.5 leading-6 whitespace-pre-wrap">
                      {message.content}
                      {renderMedia(message.media, "left")}
                      {message._id === STREAMING_ASSISTANT_ID && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
                      )}
                    </div>
                    {message._id !== STREAMING_ASSISTANT_ID &&
                      message.content.trim().length > 0 && (
                        <div className="flex items-center gap-0.5 pl-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground"
                                onClick={() => {
                                  void navigator.clipboard.writeText(
                                    message.content
                                  )
                                  toast.success("Copied to clipboard")
                                }}
                              >
                                <Copy className="size-4" strokeWidth={1.75} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Copy</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground",
                                  messageFeedback[message._id] === "up" &&
                                    "text-foreground"
                                )}
                                onClick={() =>
                                  toggleFeedback(message._id, "up")
                                }
                              >
                                <ThumbsUp
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Good response
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground",
                                  messageFeedback[message._id] === "down" &&
                                    "text-foreground"
                                )}
                                onClick={() =>
                                  toggleFeedback(message._id, "down")
                                }
                              >
                                <ThumbsDown
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Bad response
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2">
          {showScrollToLatest && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="pointer-events-auto h-9 w-9 cursor-pointer rounded-full border bg-background text-foreground"
              onClick={() => {
                scrollToBottom("smooth")
                setShowScrollToLatest(false)
              }}
            >
              <ChevronDown className="size-4" />
            </Button>
          )}
          <div className="pointer-events-auto w-full">
            <ChatInput onSend={handleSend} isSending={isSending} />
          </div>
        </div>
        <p className="mx-auto max-w-3xl bg-background px-3 py-2 text-center text-xs text-muted-foreground">
          DocAssist can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
