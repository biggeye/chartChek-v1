"use client";

import { useRef, useEffect, useState } from "react";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { ScrollArea } from "@kit/ui/scroll-area";
import { cn } from "@kit/ui/utils";
import { KipuToolRenderer } from './kipu/KipuToolRenderer';
import { Markdown } from "./rag/markdown";

interface MessageListProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    parts?: Array<{
      type: 'tool-invocation' | 'reasoning' | 'text';
      toolCallId?: string;
      toolName?: string;
      args?: Record<string, any>;
      state?: 'call' | 'result';
      result?: any;
      reasoning?: string;
      text?: string;
    }>;
    content?: string;
  }>;
}

function ToolStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={cn(
      'text-xs px-2 py-1 rounded-full border',
      statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
    )}>
      {status}
    </span>
  );
}

const ToolInvocationRenderer = ({ part }: { part: any }) => (
  <div className="flex flex-col gap-2">
    {part.reasoning && (
      <div className="text-sm text-gray-500">
        {part.reasoning}
      </div>
    )}
    <div className="flex items-center gap-2">
      <ToolStatusBadge status={part.state} />
      <KipuToolRenderer toolName={part.toolName} result={part.result} />
    </div>
  </div>
);

export function MessageList({ messages }: MessageListProps) {
  const textareaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <ScrollArea className="flex-1 pb-[80px]">
        <div className="flex flex-col space-y-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start space-x-4 p-4 rounded-lg",
                message.role === 'user' ? "bg-accent/10" : "bg-background"
              )}
            >
              <Avatar>
                <AvatarFallback>
                  {message.role === 'user' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {message.parts?.map((part, idx) => {
                  if (part.type === 'tool-invocation') {
                    return <ToolInvocationRenderer key={`${message.id}-${idx}`} part={part} />;
                  }
                  if (part.type === 'reasoning') {
                    return (
                      <div key={`${message.id}-reasoning-${idx}`} className="text-xs italic text-muted-foreground bg-muted/50 rounded-md p-2">
                        <span className="font-semibold">Reasoning:</span> {part.reasoning}
                      </div>
                    );
                  }
                  if (part.type === 'text') {
                    return (
                      <div key={`${message.id}-text-${idx}`} className="text-sm text-foreground">
                        <Markdown>{part.text || ""}</Markdown>
                      </div>
                    );
                  }
                  return null;
                })}
                {message.content && !message.parts && (
                  <div className="text-sm text-foreground">
                    <Markdown>{message.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={textareaRef} />
        </div>
      </ScrollArea>
    </div>
  );
}