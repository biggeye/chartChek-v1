'use client';

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea";
import { Send, FileUp, User as UserIcon, FileText as FileTextIcon, ChevronUp } from "lucide-react";
import { cn } from "@kit/ui/utils";
import useSidebarStores from "~/store/sidebarStore";
import { useContextQueueStore } from "~/store/chat/contextQueueStore";
import { usePatientContextActions } from '~/hooks/usePatientContextActions';

import { PatientContextModalAnim } from "./patient-context-modal-anim";
import { ContextQueue } from "./context-queue";

interface MessageInputProps {
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export function MessageInput({ input, onInputChange, onSubmit, disabled }: MessageInputProps) {
  const { isDesktopSidebarCollapsed } = useSidebarStores();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [modalShouldClose, setModalShouldClose] = useState(false);
  const [showContextQueueRow, setShowContextQueueRow] = useState(false);

  const { items: contextQueueItems } = usePatientContextActions();

  const handleModalProcessed = () => {
    setModalShouldClose(true);
    setTimeout(() => {
      setIsContextPanelOpen(false);
      setModalShouldClose(false);
    }, 350);
  };

  return (
    <div className={cn(
      "fixed bottom-4 bg-background dark:bg-muted/70 border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out",
      "left-4 right-4",
      isDesktopSidebarCollapsed ? "lg:left-24" : "lg:left-[calc(18rem+1rem)]",
      "xl:right-[calc(24rem+1rem)]"
    )}>
      {contextQueueItems.length > 0 ? (
        <ContextQueue compact />
      ) : (
        <>
          <div className="w-full flex justify-center relative">
            <button
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center bg-background border border-border rounded-full h-7 w-7 shadow hover:bg-accent transition-all duration-200"
              onClick={() => setShowContextQueueRow(true)}
              aria-label="Expand context queue"
              type="button"
              style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
            >
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {showContextQueueRow && (
            <div className="w-full flex flex-col gap-1 px-2 pt-2 pb-1 animate-slide-up">
              <div className="flex flex-col items-center justify-center text-xs text-muted-foreground py-2">
                <span>No context items yet. Use the patient context panel to add documents/evaluations.</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setShowContextQueueRow(false);
                    setIsContextPanelOpen(true);
                  }}
                >
                  Open Patient Context
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <div className="flex items-center w-full gap-2 p-1">
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/50">
            <FileUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full h-8 w-8 hover:bg-accent/50 transition-transform duration-200", isContextPanelOpen && 'scale-90 text-primary')}
            onClick={() => setIsContextPanelOpen((v) => !v)}
            aria-label="Open patient context"
          >
            <UserIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/50">
            <FileTextIcon className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="flex-1">
          <div className="flex items-center gap-2 w-full">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={onInputChange}
              placeholder="Type your message..."
              rows={1}
              className="text-sm relative w-full resize-none overflow-hidden min-h-[40px] max-h-[120px] px-2 py-2 rounded-md border border-input focus:border-primary focus:ring-1 focus-visible:outline-none dark:bg-muted"
            />
            <Button
              type="submit"
              disabled={!input.trim() || disabled}
              className="h-8 w-8 bg-primary text-primary-foreground hover:bg-accent ml-2"
            >
              <Send />
            </Button>
          </div>
        </form>
      </div>

      <PatientContextModalAnim
        isOpen={isContextPanelOpen && !modalShouldClose}
        onClose={() => setIsContextPanelOpen(false)}
        onProcessed={handleModalProcessed}
      />
    </div>
  );
}