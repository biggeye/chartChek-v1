"use client"

import { useRef, useEffect } from "react"
import { Avatar, AvatarFallback } from "@kit/ui/avatar"
import { cn } from "@kit/ui/utils"
import type { Message } from 'types/chat'
import { Bot, User } from "lucide-react"
import { ScrollArea } from "@kit/ui/scroll-area"
import { Markdown } from "~/components/chat/markdown"

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  loadingMessage?: string
  compact?: boolean
}

export function MessageList({ 
  messages, 
  isLoading = false, 
  loadingMessage = "Thinking...",
  compact = false 
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  return (
    <ScrollArea className={cn(
      "h-full w-full",
      "pr-4"
    )}>
      <div className="flex flex-col gap-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 rounded-lg",
              message.role === "user" 
                ? "ml-auto bg-primary/10 max-w-[80%]" 
                : "bg-muted max-w-[80%]",
              compact && "p-2 text-sm"
            )}
          >
            {message.role !== "user" && (
              <Avatar className={cn("h-8 w-8 p-1", compact && "h-6 w-6")}>
                <AvatarFallback>
                  <Bot className={cn("h-4 w-4 p-1", compact && "h-3 w-3")} />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 overflow-hidden">
              <Markdown>{message.content}</Markdown>
            </div>
            {message.role === "user" && (
              <Avatar className={cn("h-8 w-8 p-1", compact && "h-6 w-6")}>
                <AvatarFallback>
                  <User className={cn("h-4 w-4 p-1", compact && "h-3 w-3")} />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className={cn(
            "flex items-start gap-3 rounded-lg bg-muted max-w-[80%]",
            compact && "p-2 text-sm"
          )}>
            <Avatar className={cn("h-8 w-8", compact && "h-6 w-6")}>
              <AvatarFallback>
                <Bot className={cn("h-4 w-4", compact && "h-3 w-3")} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="animate-pulse">{loadingMessage}</div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  )
}
