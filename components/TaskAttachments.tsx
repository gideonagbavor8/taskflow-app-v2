"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, Paperclip, X, Download, Image as ImageIcon, FileText, Loader2 } from "lucide-react"

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: string
}

export default function TaskAttachments({ taskId }: { taskId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAttachments()
  }, [taskId])

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`)
      if (res.ok) {
        const data = await res.json()
        setAttachments(data)
      }
    } catch (err) {
      console.error("Failed to fetch attachments", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchAttachments()
      }
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="size-4 text-blue-500" />
    if (type.includes('pdf')) return <FileText className="size-4 text-red-500" />
    return <FileIcon className="size-4 text-gray-500" />
  }

  if (isLoading) return <div className="text-xs text-muted-foreground">Loading attachments...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
            <Paperclip className="size-3 text-cyan-600 dark:text-cyan-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Files ({attachments.length})</span>
        </div>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold hover:bg-cyan-700 transition-colors shadow-sm">
            {isUploading ? <Loader2 className="size-3 animate-spin" /> : <Paperclip className="size-3" />}
            {isUploading ? 'Uploading...' : 'Attach'}
          </div>
        </label>
      </div>

      <div className="grid gap-1.5">
        {attachments.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-1.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors group bg-background/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="size-7 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold truncate leading-tight">{file.name}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{formatSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="size-6" asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                  <Download className="size-3 text-muted-foreground hover:text-cyan-600" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-red-600">
                <X className="size-3" />
              </Button>
            </div>
          </div>
        ))}

        {attachments.length === 0 && !isUploading && (
          <p className="text-center py-4 text-xs text-muted-foreground italic border-2 border-dashed border-border/40 rounded-xl">
            No files attached yet.
          </p>
        )}
      </div>
    </div>
  )
}
