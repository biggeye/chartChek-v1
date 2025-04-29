/*
 * Ultra Polished Version of MessageList.tsx
 * Includes extracted helper components, strict typing, DRY refactors, and cleaner state handling.
 */

"use client";
import { useRef, useEffect, useCallback, useState, memo } from "react";
import { useChat } from "ai/react";
import { Bot, User, Send, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { type Message as AIMessage, type ToolCall, type ToolResult, type JSONValue } from 'ai';
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { ScrollArea } from "@kit/ui/scroll-area";
import { Textarea } from "@kit/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
import { cn } from "@kit/ui/utils";
import { ReactNode } from 'react';


// Custom Components
import { KipuToolRenderer } from './kipu/KipuToolRenderer';
import { Markdown } from "./rag/markdown";
import { MessageInput } from "./message-input";

// Types
interface ToolStatus {
  state: 'pending' | 'running' | 'complete' | 'error' | 'processing';
  startTime?: number;
  endTime?: number;
  error?: string;
}
interface ToolInvocationRendererProps {
  part: {
    type: 'tool-call' | 'tool-result';
    toolCallId: string;
    toolName: string;
    args?: Record<string, any>;
    state: 'call' | 'result';
    result?: any;
    reasoning?: string;
  }
}

/** Helper: Display Tool Status Badge */
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


const ToolInvocationRenderer: React.FC<ToolInvocationRendererProps> = ({ part }) => {
  const { toolCallId, toolName, args, state, result, reasoning } = part;

  return (
    <div className="flex flex-col gap-2">
      {reasoning && (
        <div className="text-sm text-gray-500">
          {reasoning}
        </div>
      )}
      <div className="flex items-center gap-2">
        <ToolStatusBadge status={state} />
        <KipuToolRenderer toolName={toolName} result={result} />
      </div>
    </div>
  );
}; 

export function MessageList() {
  const [toolStatus, setToolStatus] = useState<Record<string, { status: string; result?: unknown }>>({});
  const textareaRef = useRef<HTMLDivElement>(null);

  const { messages } = useChat({
    id: 'test23',
    maxSteps: 5,
    onToolCall: useCallback(async ({ toolCall }: { toolCall: { toolCallId: string; toolName: string; args: any } }) => {
      const startTime = Date.now();
      setToolStatus(prev => ({
        ...prev,
        [toolCall.toolCallId]: {
          status: 'processing',
          startTime
        }
      }));

      try {
        // in your MessageList onToolCall:
        const response = await fetch(`/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },      // ← add this
          body: JSON.stringify({
            toolName: toolCall.toolName,
            args: toolCall.args,
            // you don’t really need “context” here unless your server uses it
          }),
        });


        if (!response.ok) {
          throw new Error('Failed to process request');
        }

        const result = await response.json();
        setToolStatus(prev => ({
          ...prev,
          [toolCall.toolCallId]: {
            status: 'complete',
            startTime,
            endTime: Date.now(),
            result
          }
        }));

        return {
          status: 'processed',
          message: 'Request processed',
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setToolStatus(prev => ({
          ...prev,
          [toolCall.toolCallId]: {
            status: 'error',
            startTime,
            endTime: Date.now(),
            error: errorMessage
          }
        }));
        throw error;
      }
    }, []),
  });

  useEffect(() => {
    textareaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <ScrollArea className="flex-1 pb-[80px]">
        <div className="flex flex-col space-y-4 p-4">
          {messages.map((message: any) => (
            <div key={message.id} className={cn("flex items-start space-x-4 p-4 rounded-lg", message.role === 'user' ? "bg-accent/10" : "bg-background")}>
              <Avatar>
                <AvatarFallback>
                  {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {message.parts?.map((part: any, idx: number) => {
                  if (part.type === 'tool-invocation') {
                    return <ToolInvocationRenderer
                      key={`${message.id}-${idx}`}
                      part={part}
                    />;
                  }
                  if (part.type === 'reasoning') {
                    return (
                      <div key={`${message.id}-reasoning-${idx}`} className="text-xs italic text-muted-foreground bg-muted/50 rounded-md p-2">
                        <span className="font-semibold">Reasoning:</span> {part.reasoning}
                      </div>
                    );
                  }
                  if (part.type === 'text') {
                    return <div key={`${message.id}-text-${idx}`} className="text-sm text-foreground">
                      <Markdown>
                      {part.text}
                      </Markdown>
                      </div>;
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          <div ref={textareaRef} />
        </div>
      </ScrollArea>

      {/* Input Footer */}
      <div className="fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out left-4 right-4 lg:left-24 xl:right-[calc(24rem+1rem)]">
 
          <MessageInput />
      
      </div>
    </div>
  );
}