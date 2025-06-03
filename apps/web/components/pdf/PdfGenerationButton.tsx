'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { FileText } from 'lucide-react';
import { Spinner } from '@kit/ui/spinner';
import { usePdfGeneration } from '~/hooks/usePdfGeneration';
import { PdfPreviewModal } from './PdfPreviewModal';
import type { ContextItem } from '~/lib/services/pdfService';

interface PdfGenerationButtonProps {
  contextItems: ContextItem[];
  patientId?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  showPreview?: boolean;
}

export function PdfGenerationButton({
  contextItems,
  patientId,
  variant = 'secondary',
  size = 'sm',
  className = '',
  children,
  disabled = false,
  showPreview = true,
}: PdfGenerationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const {
    state,
    generatePreview,
    generateAndDownload,
    generateDirectDownload,
    generateFilename,
    reset,
  } = usePdfGeneration();

  const handleButtonClick = async () => {
    if (contextItems.length === 0) return;

    if (showPreview) {
      // Generate preview and show modal
      await generatePreview(contextItems);
      setShowModal(true);
    } else {
      // Direct download without preview
      const filename = generateFilename(contextItems, patientId);
      await generateDirectDownload(contextItems, filename);
    }
  };

  const handleGeneratePdf = async () => {
    if (!state.previewContent) return;

    try {
      const filename = generateFilename(contextItems, patientId);
      await generateAndDownload(state.previewContent, filename);
      setShowModal(false);
      reset();
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Error is handled by the hook
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} ${variant === 'secondary' ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
        onClick={handleButtonClick}
        disabled={disabled || state.isLoading || contextItems.length === 0}
      >
        {state.isLoading ? (
          <div className="h-3 w-3 animate-spin">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="15.708"
                strokeDashoffset="15.708"
              />
            </svg>
          </div>
        ) : (
          <>
            {children || (
              <>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </>
            )}
          </>
        )}
      </Button>

      <PdfPreviewModal
        isOpen={showModal}
        onClose={handleCloseModal}
        previewContent={state.previewContent}
        error={state.error}
        isLoading={state.isLoading}
        onGenerate={handleGeneratePdf}
      />
    </>
  );
} 