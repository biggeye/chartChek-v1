'use client';

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea";
import { Send, FileUp, User as UserIcon, FileText as FileTextIcon, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@kit/ui/utils";
import useSidebarStores from "~/store/sidebarStore";
import { useContextQueueStore } from "~/store/chat/contextQueueStore";
import { usePatientContextActions } from '~/hooks/usePatientContextActions';
import { useFileUpload } from '~/hooks/useFileUpload';
import { PdfGenerationButton } from '~/components/pdf/PdfGenerationButton';
import type { ContextItem } from '~/lib/services/pdfService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [modalShouldClose, setModalShouldClose] = useState(false);
  const [showContextQueueRow, setShowContextQueueRow] = useState(false);

  const { items: contextQueueItems } = usePatientContextActions();
  const { getSelectedIds } = useContextQueueStore();
  
  // Use the file upload hook
  const { 
    isProcessing: isProcessingFile, 
    lastError: fileProcessingError, 
    processFile, 
    clearError 
  } = useFileUpload({
    maxFileSize: 25 * 1024 * 1024, // 25MB limit for medical documents
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const handleModalProcessed = () => {
    setModalShouldClose(true);
    setTimeout(() => {
      setIsContextPanelOpen(false);
      setModalShouldClose(false);
    }, 350);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    const result = await processFile(file);
    
    if (result.success) {
      console.log('[MessageInput] File successfully added to context queue');
    } else if (result.error) {
      console.error('[MessageInput] File upload failed:', result.error.message);
      // Error is already handled by the hook
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Convert context queue items to PDF service format
  const convertToPdfContextItems = (): ContextItem[] => {
    const selectedIds = getSelectedIds();
    return contextQueueItems
      .filter(item => selectedIds.includes(item.id))
      .map(item => ({
        id: item.id,
        title: item.title,
        content: item.content || '',
        type: item.type || 'document',
      }));
  };

  const pdfContextItems = convertToPdfContextItems();
  // Extract patientId from first item if available
  const patientId = pdfContextItems.length > 0 && pdfContextItems[0] ? pdfContextItems[0].id : undefined;

  return (
    <div className={cn(
      "fixed bottom-4 bg-background dark:bg-muted/70 border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out",
      "left-4 right-4",
      isDesktopSidebarCollapsed ? "lg:left-24" : "lg:left-[calc(18rem+1rem)]",
      "xl:right-[calc(24rem+1rem)]"
    )}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isProcessingFile}
      />

      {/* File processing error display */}
      {fileProcessingError && (
        <div className="mx-2 mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
          <div className="flex items-center justify-between">
            <span>{fileProcessingError.message}</span>
            <button 
              onClick={clearError}
              className="ml-2 hover:text-destructive/80 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                <span>No context items yet. Use the patient context panel or upload files to add context.</span>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowContextQueueRow(false);
                      setIsContextPanelOpen(true);
                    }}
                  >
                    Open Patient Context
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowContextQueueRow(false);
                      handleFileUploadClick();
                    }}
                    disabled={isProcessingFile}
                  >
                    {isProcessingFile ? 'Processing...' : 'Upload File'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* PDF Generation Button: Only show if context queue is non-empty */}
      {contextQueueItems.length > 0 && (
        <div className="flex justify-end px-2 pt-2">
          <PdfGenerationButton
            contextItems={pdfContextItems}
            patientId={patientId}
            variant="secondary"
            size="sm"
          />
        </div>
      )}

      <div className="flex items-center w-full gap-2 p-1">
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full h-8 w-8 hover:bg-accent/50 transition-transform duration-200",
              isProcessingFile && "scale-90 text-primary"
            )}
            onClick={handleFileUploadClick}
            disabled={isProcessingFile}
            title={isProcessingFile ? "Processing file..." : "Upload PDF or TXT file"}
          >
            {isProcessingFile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
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