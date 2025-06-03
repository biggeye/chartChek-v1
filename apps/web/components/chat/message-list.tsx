"use client";

import { useRef, useEffect, Fragment, useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { ScrollArea } from "@kit/ui/scroll-area";
import { Button } from "@kit/ui/button";
import { cn } from "@kit/ui/utils";
import { KipuToolRenderer } from './kipu/KipuToolRenderer';
import { Markdown } from "./markdown";
import { Message } from 'ai/react';
import { Spinner } from '@kit/ui/spinner';
import { PdfGenerationButton, type ContextItem } from '~/components/pdf';

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

// Helper function to extract text content from a message
const extractMessageText = (message: Message): string => {
  if (message.content) {
    return message.content;
  }

  if (message.parts?.length) {
    return message.parts
      .map((part: MessagePart) => {
        if (part.type === 'text' && part.text) return part.text;
        if (part.type === 'reasoning' && part.reasoning) return `Reasoning: ${part.reasoning}`;
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  return '';
};

// Convert message to PDF context item
const messageToContextItem = (message: Message): ContextItem => {
  const content = extractMessageText(message);
  const timestamp = new Date().toLocaleString();
  
  return {
    id: message.id,
    title: `Chat Response - ${timestamp}`,
    content,
    type: 'chat-message',
  };
};

const CopyButton = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractMessageText(message);
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 w-6 p-0 hover:bg-accent/50"
      title="Copy message"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
};

const MessageFooter = ({ message }: { message: Message }) => {
  const contextItem = messageToContextItem(message);
  const hasContent = extractMessageText(message).trim().length > 0;

  if (!hasContent) return null;

  return (
    <div className="flex items-center justify-end gap-1 mt-2 opacity-60 hover:opacity-100 transition-opacity">
      <CopyButton message={message} />
      <PdfGenerationButton
        contextItems={[contextItem]}
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-accent/50"
        showPreview={true}
      >
        <div title="Generate PDF">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
      </PdfGenerationButton>
    </div>
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
                  {message.role === 'assistant' && <MessageFooter message={message} />}
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