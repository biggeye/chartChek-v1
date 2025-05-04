"use client";

import { useRef, useEffect, Fragment } from "react";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { ScrollArea } from "@kit/ui/scroll-area";
import { cn } from "@kit/ui/utils";
import { KipuToolRenderer } from './kipu/KipuToolRenderer';
import { Markdown } from "./markdown";
import { Message } from 'ai/react';
import { Spinner } from '@kit/ui/spinner';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

type MessageRole = 'user' | 'assistant' | 'system';

type ToolInvocationState = 'partial-call' | 'call' | 'result';

interface ToolStatusBadgeProps {
  state: ToolInvocationState;
}

interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ToolInvocation {
  state: ToolInvocationState;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

interface MessagePart {
  type: string;
  text?: string;
  reasoning?: string;
  toolInvocation?: ToolInvocation;
}

const ToolStatusBadge = ({ state }: ToolStatusBadgeProps) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const displayStatus = 
    state === 'partial-call' || state === 'call' ? 'pending' : 
    state === 'result' ? 'success' : 'error';

  return (
    <span className={cn(
      'text-xs px-2 py-1 rounded-full border',
      statusStyles[displayStatus]
    )}>
      {displayStatus}
    </span>
  );
};

const ToolInvocationRenderer = ({ part }: { part: MessagePart & { type: 'tool-invocation', toolInvocation: ToolInvocation } }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <ToolStatusBadge state={part.toolInvocation.state} />
      <KipuToolRenderer 
        toolName={part.toolInvocation.toolName} 
        result={part.toolInvocation.result} 
      />
    </div>
  </div>
);

const MessageAvatar = ({ role }: { role: MessageRole }) => (
  <Avatar>
    <AvatarFallback>
      {role === 'user' ? (
        <User className="h-5 w-5" />
      ) : (
        <Bot className="h-5 w-5" />
      )}
    </AvatarFallback>
  </Avatar>
);

const MessageContent = ({ message }: { message: Message }) => {
  if (!message.parts?.length && message.content) {
    return (
      <div className="text-sm text-foreground">
        <Markdown>{message.content}</Markdown>
      </div>
    );
  }

  return (
    <Fragment>
      {message.parts?.map((part: MessagePart, idx: number) => {
        if (part.type === 'tool-invocation' && part.toolInvocation) {
          return <ToolInvocationRenderer key={`${message.id}-${idx}`} part={part as MessagePart & { type: 'tool-invocation', toolInvocation: ToolInvocation }} />;
        }
        if (part.type === 'reasoning' && part.reasoning) {
          return (
            <div key={`${message.id}-reasoning-${idx}`} className="text-xs italic text-muted-foreground bg-muted/50 rounded-md p-2">
              <span className="font-semibold">Reasoning:</span>{' '}
              <Markdown>{part.reasoning}</Markdown>
            </div>
          );
        }
        if (part.type === 'text' && part.text) {
          return (
            <div key={`${message.id}-text-${idx}`} className="text-sm text-foreground">
              <Markdown>{part.text}</Markdown>
            </div>
          );
        }
        return null;
      })}
    </Fragment>
  );
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  const textareaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4 p-4 pb-32">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg",
                  message.role === 'user' ? "bg-accent/10" : "bg-background"
                )}
              >
                {message.role !== 'data' && <MessageAvatar role={message.role as MessageRole} />}
                <div className="flex-1 space-y-2">
                  <MessageContent message={message} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
            <div ref={textareaRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}