import { useState } from 'react';
import { TextChunker } from '~/utils/text-chunker';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';

interface FileUploadError {
  message: string;
  type: 'validation' | 'processing' | 'unknown';
}

interface FileUploadResult {
  success: boolean;
  error?: FileUploadError;
  itemId?: string;
}

interface UseFileUploadOptions {
  allowedTypes?: string[];
  maxFileSize?: number; // in bytes
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_OPTIONS: Required<UseFileUploadOptions> = {
  allowedTypes: ['application/pdf', 'text/plain'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  chunkSize: 1500,
  chunkOverlap: 200,
};

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<FileUploadError | null>(null);
  const { addItem } = useContextQueueStore();

  const config = { ...DEFAULT_OPTIONS, ...options };

  const validateFile = (file: File): FileUploadError | null => {
    // Check file size
    if (file.size > config.maxFileSize) {
      return {
        message: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB.`,
        type: 'validation'
      };
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = config.allowedTypes.includes(file.type) || 
                       (fileExtension === 'pdf' && config.allowedTypes.includes('application/pdf')) ||
                       (fileExtension === 'txt' && config.allowedTypes.includes('text/plain'));

    if (!isValidType) {
      return {
        message: 'Only PDF and TXT files are supported.',
        type: 'validation'
      };
    }

    return null;
  };

  const processFile = async (file: File): Promise<FileUploadResult> => {
    // Validate file first
    const validationError = validateFile(file);
    if (validationError) {
      setLastError(validationError);
      return { success: false, error: validationError };
    }

    setIsProcessing(true);
    setLastError(null);

    try {
      let content = '';
      let title = `Uploaded Document - ${file.name}`;
      
      const fileType = file.type;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'application/pdf' || fileExtension === 'pdf') {
        console.log('[FileUpload] Processing PDF file using server-side API:', file.name);
        
        try {
          // Use the existing server-side PDF processing API
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chunkSize', config.chunkSize.toString());
          formData.append('chunkOverlap', config.chunkOverlap.toString());

          // Use current origin to ensure correct port
          const apiUrl = `${window.location.origin}/api/documents/knowledge/upload`;
          console.log('[FileUpload] Making request to:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.statusText}`);
          }

          const result = await response.json();
          
          if (!result.chunks || result.chunks.length === 0) {
            throw new Error('No text could be extracted from the PDF. It might be a scanned document or contain only images.');
          }
          
          // Combine all chunks into a single content string with better formatting
          content = result.chunks
            .map((chunk: any, index: number) => {
              const pageInfo = chunk.metadata?.pageNumber ? `Page ${chunk.metadata.pageNumber}` : `Section ${index + 1}`;
              return `${pageInfo}:\n${chunk.text}`;
            })
            .join('\n\n---\n\n');
            
          // Use PDF metadata for title if available
          if (result.metadata?.title) {
            title = `PDF Document - ${result.metadata.title}`;
          }
          
          console.log('[FileUpload] PDF processed successfully via server API, extracted text length:', content.length);
          
        } catch (pdfError) {
          console.error('[FileUpload] PDF processing failed:', pdfError);
          
          // Provide more helpful error messages based on the error type
          let errorMessage = 'Failed to process PDF';
          if (pdfError instanceof Error) {
            if (pdfError.message.includes('fetch')) {
              errorMessage = 'Network error while processing PDF. Please check your connection and try again.';
            } else if (pdfError.message.includes('Invalid PDF')) {
              errorMessage = 'The selected file appears to be corrupted or is not a valid PDF.';
            } else if (pdfError.message.includes('password')) {
              errorMessage = 'Password-protected PDFs are not currently supported.';
            } else {
              errorMessage = `Failed to process PDF: ${pdfError.message}`;
            }
          }
          throw new Error(errorMessage);
        }
        
      } else if (fileType === 'text/plain' || fileExtension === 'txt') {
        console.log('[FileUpload] Processing TXT file:', file.name);
        
        try {
          const rawContent = await file.text();
          
          if (!rawContent || rawContent.trim().length === 0) {
            throw new Error('The text file appears to be empty.');
          }
          
          // Process text through chunker for consistency and better formatting
          const chunks = TextChunker.chunkText(
            rawContent, 
            { 
              chunkSize: config.chunkSize, 
              chunkOverlap: config.chunkOverlap 
            },
            undefined,
            file.name
          );
          
          // Combine chunks with section markers for better readability
          content = chunks
            .map((chunk, index) => `Section ${index + 1}:\n${chunk.text}`)
            .join('\n\n---\n\n');
            
          title = `Text Document - ${file.name}`;
          
          console.log('[FileUpload] TXT processed successfully, text length:', content.length);
          
        } catch (txtError) {
          console.error('[FileUpload] TXT processing failed:', txtError);
          throw new Error(`Failed to process text file: ${txtError instanceof Error ? txtError.message : 'Unknown error'}`);
        }
      }

      // Ensure we have content
      if (!content.trim()) {
        throw new Error('No content could be extracted from the file.');
      }

      // Add to context queue
      const contextItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        type: 'upload' as const,
        title,
        content,
      };

      addItem(contextItem);
      
      console.log('[FileUpload] Successfully added file to context queue:', title);
      
      return { 
        success: true, 
        itemId: contextItem.id 
      };
      
    } catch (error) {
      console.error('[FileUpload] File processing error:', error);
      const uploadError: FileUploadError = {
        message: error instanceof Error ? error.message : 'An error occurred while processing the file.',
        type: 'processing'
      };
      setLastError(uploadError);
      return { 
        success: false, 
        error: uploadError 
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => {
    setLastError(null);
  };

  // Process multiple files
  const processFiles = async (files: FileList | File[]): Promise<FileUploadResult[]> => {
    const fileArray = Array.from(files);
    const results: FileUploadResult[] = [];
    
    for (const file of fileArray) {
      const result = await processFile(file);
      results.push(result);
    }
    
    return results;
  };

  return {
    isProcessing,
    lastError,
    processFile,
    processFiles,
    clearError,
    validateFile,
  };
}

export type { FileUploadError, FileUploadResult, UseFileUploadOptions }; 