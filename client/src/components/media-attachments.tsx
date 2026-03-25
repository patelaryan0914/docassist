"use client"

import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ai-elements/attachments"
import type { FileUIPart } from "ai"

interface MediaAttachmentsProps {
  attachments: (FileUIPart & { id: string })[]
  onRemove?: (id: string) => void
}

const MediaAttachments = ({ attachments, onRemove }: MediaAttachmentsProps) => (
  <Attachments variant="grid">
    {attachments.map((file) => (
      <Attachment
        key={file.id}
        data={file}
        onRemove={onRemove ? () => onRemove(file.id) : undefined}
      >
        <AttachmentPreview />
        <AttachmentRemove />
      </Attachment>
    ))}
  </Attachments>
)

export default MediaAttachments
