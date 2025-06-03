'use client';

import React from 'react';
import { Button } from '@kit/ui/button';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewContent: string | null;
  error: string | null;
  isLoading: boolean;
  onGenerate: () => Promise<void>;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  previewContent,
  error,
  isLoading,
  onGenerate,
}: PdfPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">PDF Preview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-900/20 dark:border-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex-1 min-h-0 mb-4">
          {previewContent ? (
            <div className="h-full overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 dark:bg-gray-900 p-4 font-mono overflow-wrap-anywhere">
                {previewContent}
              </pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400">No preview content available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!!error || !previewContent || isLoading}
            className="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
} 