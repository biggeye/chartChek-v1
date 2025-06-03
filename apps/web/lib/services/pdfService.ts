import { z } from 'zod';

// Types for PDF generation
export interface PDFGenerationOptions {
  patientId: string;
  requestText: string;
  templateId?: string;
}

export interface PDFPreviewResult {
  previewMarkdown: string;
  type: 'structured' | 'unstructured';
  templateId?: string;
  patientId: string;
  requestText?: string;
}

export interface PDFGenerationState {
  isLoading: boolean;
  error: string | null;
  previewContent: string | null;
}

export interface ContextItem {
  id: string;
  title: string;
  content?: string;
  type: string;
}

// Schema for validation
const PDFGenerationOptionsSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  requestText: z.string().min(1, 'Request text is required'),
  templateId: z.string().optional(),
});

/**
 * PDF Service - handles all PDF generation operations
 * Following ChartChek service layer pattern
 */
export class PDFService {
  /**
   * Generate PDF preview based on context items
   */
  static async generatePreview(contextItems: ContextItem[]): Promise<PDFPreviewResult> {
    if (contextItems.length === 0) {
      throw new Error('No context items provided for PDF generation');
    }

    const options: PDFGenerationOptions = {
      patientId: contextItems[0]?.id || 'unknown',
      requestText: '',
      templateId: undefined,
    };

    // Determine generation path based on context items
    if (contextItems.length === 1 && contextItems[0]?.type === 'evaluation') {
      // Structured path: single evaluation
      options.requestText = contextItems[0].title;
      options.templateId = contextItems[0].id;
    } else {
      // Unstructured path: multiple items or summary
      options.requestText = contextItems
        .map(item => `## ${item.title}\n\n${item.content || ''}`)
        .join('\n\n');
    }

    // Validate options
    const validatedOptions = PDFGenerationOptionsSchema.parse(options);

    try {
      const response = await fetch('/api/chat/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'generatePDF',
          parameters: validatedOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF preview');
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No result returned from PDF preview generation');
      }

      return data.result as PDFPreviewResult;
    } catch (error) {
      console.error('PDF Service - Preview generation failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error during PDF preview generation');
    }
  }

  /**
   * Generate and download final PDF
   */
  static async generateAndDownload(
    previewContent: string,
    filename: string = 'chartchek-report.pdf'
  ): Promise<void> {
    if (!previewContent) {
      throw new Error('No preview content provided for PDF generation');
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: previewContent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      PDFService._downloadBlob(blob, filename);
    } catch (error) {
      console.error('PDF Service - Final generation failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error during PDF generation');
    }
  }

  /**
   * Generate PDF for direct download (bypassing preview)
   */
  static async generateDirectDownload(
    contextItems: ContextItem[],
    filename: string = 'chartchek-report.pdf'
  ): Promise<void> {
    const previewResult = await PDFService.generatePreview(contextItems);
    await PDFService.generateAndDownload(previewResult.previewMarkdown, filename);
  }

  /**
   * Get PDF as base64 for preview/embedding
   */
  static async generateBase64(previewContent: string): Promise<string> {
    if (!previewContent) {
      throw new Error('No preview content provided for PDF generation');
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: previewContent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (error) {
      console.error('PDF Service - Base64 generation failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error during PDF base64 generation');
    }
  }

  /**
   * Private helper to trigger file download
   */
  private static _downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate filename based on context
   */
  static generateFilename(contextItems: ContextItem[], patientId?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const prefix = patientId ? `patient-${patientId}` : 'chartchek';
    
    if (contextItems.length === 1 && contextItems[0]) {
      const sanitized = contextItems[0].title.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      return `${prefix}-${sanitized}-${timestamp}.pdf`;
    }
    
    return `${prefix}-summary-${timestamp}.pdf`;
  }
}

// Re-export the existing toolCallService functions for backward compatibility
export { downloadPDFClient, downloadPDFServer } from './toolCallService'; 