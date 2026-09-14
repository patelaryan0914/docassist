"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUp,
  AudioLines,
  Brain,
  Loader2,
  Mic,
  Paperclip,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MediaAttachments from "./media-attachments"
import { uploadMedia } from "@/lib/axios"
import { toast } from "sonner"

type ChatAttachment = {
  filename: string
  id: string
  mimeType: string
  mediaType: "image" | "audio" | "video" | "document"
  type: "file"
  url: string
}

export function ChatInput({
  onSend,
  isSending,
  disabled,
}: {
  onSend?: (
    text: string,
    media?: Array<{
      url: string
      mimeType: string
      fileName?: string
      mediaType?: "image" | "audio" | "video" | "document"
    }>
  ) => void | Promise<void>
  isSending?: boolean
  disabled?: boolean
} = {}) {
  const [value, setValue] = React.useState("")
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [think, setThink] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleRemove = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const hasAttachments = attachments.length > 0
  const submit = value.trim().length > 0 || attachments.length > 0
  const expanded = value.includes("\n") || value.length > 80 || hasAttachments

  const handlePickFiles = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (!files.length) return

      setIsUploading(true)
      try {
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const uploadedMedia = await uploadMedia(file)
            return {
              id: crypto.randomUUID(),
              filename: file.name,
              mimeType: uploadedMedia.mimeType,
              mediaType: uploadedMedia.mediaType,
              type: "file" as const,
              url: uploadedMedia.url,
            }
          })
        )
        setAttachments((prev) => [...prev, ...uploaded])
        toast.success(
          uploaded.length === 1
            ? "File uploaded"
            : `${uploaded.length} files uploaded`
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed")
      } finally {
        setIsUploading(false)
        event.target.value = ""
      }
    },
    []
  )

  const handleSend = React.useCallback(async () => {
    if (!submit || !onSend || disabled || isSending) return
    const text = value.trim()
    if (!text && attachments.length === 0) return

    await onSend(
      text,
      attachments.map((attachment) => ({
        url: attachment.url,
        mimeType: attachment.mimeType,
        fileName: attachment.filename,
        mediaType: attachment.mediaType,
      }))
    )
    setValue("")
    setAttachments([])
  }, [submit, onSend, disabled, isSending, value, attachments])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) return
      e.preventDefault()
      void handleSend()
    },
    [handleSend]
  )

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl border border-border/70 bg-card/80 shadow-lg shadow-black/20 ring-1 ring-border/30 supports-backdrop-filter:bg-card/70 supports-backdrop-filter:backdrop-blur-md",
        expanded ? "rounded-3xl" : "rounded-full"
      )}
    >
      {hasAttachments ? (
        <div className="px-4 pt-3">
          <MediaAttachments
            attachments={attachments.map((a) => ({
              type: "file" as const,
              id: a.id,
              url: a.url,
              mediaType: a.mimeType,
              filename: a.filename,
            }))}
            onRemove={handleRemove}
          />
        </div>
      ) : null}

      <div className="flex items-end gap-1 px-2 py-1.5">
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="mb-0.5 size-10 shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Plus className="size-5" />
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="top">
              <p>Add files</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            side="top"
            className="rounded-xl border-border/80"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handlePickFiles}>
                <Paperclip />
                Add photos & files
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          className={cn(
            "min-h-10 flex-1 border-0 bg-transparent px-1 py-2.5 text-[15px] shadow-none placeholder:text-muted-foreground/80 focus-visible:border-0 focus-visible:ring-0",
            expanded ? "max-h-40 min-h-16" : "max-h-10"
          )}
          placeholder="Ask anything"
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "mb-0.5 h-10 shrink-0 cursor-pointer rounded-full px-3 text-muted-foreground hover:bg-muted hover:text-foreground",
                think && "bg-muted text-foreground"
              )}
              onClick={() => setThink((prev) => !prev)}
            >
              <Brain className="size-4" />
              Think
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{think ? "Thinking on" : "Think before answering"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="mb-0.5 size-10 shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => toast.info("Voice input coming soon")}
            >
              <Mic className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Voice</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="mb-0.5 size-10 shrink-0 cursor-pointer rounded-full bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
              disabled={
                Boolean(disabled) ||
                Boolean(isSending) ||
                Boolean(isUploading) ||
                (!!onSend && !submit)
              }
              onClick={() => {
                if (submit) {
                  void handleSend()
                  return
                }
                toast.info("Voice mode coming soon")
              }}
            >
              {isSending || isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : submit ? (
                <ArrowUp className="size-4" />
              ) : (
                <AudioLines className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {isSending
                ? "Sending…"
                : isUploading
                  ? "Uploading…"
                  : submit
                    ? "Send"
                    : "Voice"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.csv,.json,.xml,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        multiple
        onChange={handleFileInputChange}
      />
    </div>
  )
}
