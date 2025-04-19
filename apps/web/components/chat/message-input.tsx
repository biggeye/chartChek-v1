"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@kit/ui/button"
import { Textarea } from "@kit/ui/textarea"
import { Send } from "lucide-react"
import { cn } from "@kit/ui/utils"

interface MessageInputProps {
  onSend: (message: string) => void
  isDisabled?: boolean
  placeholder?: string
  compact?: boolean
  className?: string
}

export function MessageInput({ 
  onSend, 
  isDisabled = false, 
  placeholder = "Type your message...",
  compact = false,
  className
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && !isDisabled) {
      onSend(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className={cn(
      "flex-1 relative",
      compact ? "pt-1" : "pt-4",
      className
    )}>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[80px]"
             
      />
      <Button
        onClick={handleSend}
        disabled={isDisabled || !message.trim()}
        size={compact ? "sm" : "default"}
        className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 mr-2"
        >
        <Send className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
      </Button>
    </div>
  )
}
