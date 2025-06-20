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
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewContent, setPdfPreviewContent] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { items: contextQueueItems } = usePatientContextActions();
  const { items: selectedContextItems, getSelectedIds } = useContextQueueStore();

  const handleModalProcessed = () => {
    setModalShouldClose(true);
    setTimeout(() => {
      setIsContextPanelOpen(false);
      setModalShouldClose(false);
    }, 350);
  };

  // Handler for PDF button
  const handlePdfButtonClick = async () => {
    setPdfError(null);
    const selectedIds = getSelectedIds();
    const selectedItems = contextQueueItems.filter(item => selectedIds.includes(item.id));
    if (selectedItems.length === 0) return;
    if (selectedItems.length === 1 && selectedItems[0] && selectedItems[0].type === 'evaluation') {
      // Call generatePDFTool for structured path
      setIsPdfLoading(true);
      try {
        const res = await fetch('/api/chat/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: 'generatePDF',
            parameters: {
              patientId: selectedItems[0].id, // or use patientId if available
              requestText: selectedItems[0].title,
              templateId: selectedItems[0].id, // using id as templateId for now
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.result) throw new Error(data.error || 'Failed to generate PDF preview');
        setPdfPreviewContent(data.result.previewMarkdown);
      } catch (err: any) {
        setPdfError(err.message || 'Unknown error');
        setPdfPreviewContent(null);
      } finally {
        setIsPdfLoading(false);
        setShowPdfPreview(true);
      }
    } else {
      // Call generatePDFTool for unstructured (summary) path
      setIsPdfLoading(true);
      try {
        const summaryText = selectedItems.map(item => `## ${item.title}\n\n${item.content || ''}`).join('\n\n');
        const res = await fetch('/api/chat/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: 'generatePDF',
            parameters: {
              patientId: selectedItems[0]?.id || 'unknown',
              requestText: summaryText,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.result) throw new Error(data.error || 'Failed to generate PDF preview');
        setPdfPreviewContent(data.result.previewMarkdown);
      } catch (err: any) {
        setPdfError(err.message || 'Unknown error');
        setPdfPreviewContent(null);
      } finally {
        setIsPdfLoading(false);
        setShowPdfPreview(true);
      }
    }
  };

  // Handler for final PDF generation
  const handleGeneratePdf = async () => {
    if (!pdfPreviewContent) return;
    setIsPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pdfPreviewContent }),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'output.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowPdfPreview(false);
    } catch (err: any) {
      setPdfError(err.message || 'Unknown error');
    } finally {
      setIsPdfLoading(false);
    }
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
      {/* PDF Button: Only show if context queue is non-empty */}
      {contextQueueItems.length > 0 && (
        <div className="flex justify-end px-2 pt-2">
          <Button
            // TODO: Use custom styling for PDF button if needed
            variant="secondary"
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={handlePdfButtonClick}
            disabled={isPdfLoading}
          >
            {isPdfLoading ? 'Loading...' : 'PDF'}
          </Button>
        </div>
      )}
      {/* PDF Preview Modal (now with real preview) */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-lg font-bold mb-2">PDF Preview</h2>
            {pdfError && <div className="text-red-600 text-xs mb-2">{pdfError}</div>}
            <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded max-h-96 overflow-auto">{pdfPreviewContent}</pre>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPdfPreview(false)} disabled={isPdfLoading}>Cancel</Button>
              <Button variant="secondary" onClick={handleGeneratePdf} disabled={!!pdfError || isPdfLoading}>
                {isPdfLoading ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </div>
        </div>
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