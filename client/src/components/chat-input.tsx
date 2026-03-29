"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowUp, Plus, Loader2, Paperclip } from "lucide-react"
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

const initialAttachments: ChatAttachment[] = []
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
  const [attachments, setAttachments] = React.useState(initialAttachments)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleRemove = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const expanded = value.trim().length > 0
  const hasAttachments = attachments.length > 0
  const submit = value.trim().length > 0 || attachments.length > 0

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
    <Card
      className={cn(
        "mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] gap-0 rounded-2xl border-border/80 bg-card/70 py-1 shadow-lg ring-1 shadow-primary/5 ring-border/40 supports-backdrop-filter:backdrop-blur-md",
        expanded
          ? hasAttachments
            ? "[grid-template-areas:'files_files_files''textarea_textarea_textarea''media_tags_voice']"
            : "[grid-template-areas:'textarea_textarea_textarea''media_tags_voice']"
          : hasAttachments
            ? "[grid-template-areas:'files_files_files''media_textarea_voice']"
            : "items-center [grid-template-areas:'media_textarea_voice']"
      )}
    >
      <div
        className={cn(
          "flex items-start justify-start overflow-x-auto [grid-area:files]",
          hasAttachments && "p-4"
        )}
      >
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
      <div className="[grid-area:textarea]">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "min-h-8 border-0 bg-transparent text-[15px] placeholder:text-muted-foreground focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
            expanded && "min-h-16"
          )}
          placeholder="Ask anything about your docs…"
        />
      </div>
      <div
        className={cn(
          "flex items-center justify-center px-2 [grid-area:media]",
          expanded && "py-1"
        )}
      >
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="cursor-pointer rounded-full border-border/80 bg-background/50 hover:border-primary/30"
                >
                  <Plus />
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="bottom">
              <p>Add Files or More</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            side="top"
            className="rounded-xl border-border/80"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem key={"photos-files"} onClick={handlePickFiles}>
                <Paperclip />
                Add photos & files
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-center px-2 [grid-area:voice]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="cursor-pointer rounded-full shadow-md shadow-primary/25"
              disabled={
                Boolean(disabled) ||
                Boolean(isSending) ||
                Boolean(isUploading) ||
                (!!onSend && !submit)
              }
              onClick={() => void handleSend()}
            >
              {isSending || isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : submit ? (
                <ArrowUp />
              ) : (
                // <AudioLines />
                <ArrowUp />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {isSending
                ? "Sending…"
                : isUploading
                  ? "Uploading…"
                  : submit
                    ? "Send"
                    : "Use Voice"}
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
    </Card>
  )
}
