import { useState, useCallback } from 'react';
import { PDFService, type ContextItem, type PDFGenerationState, type PDFPreviewResult } from '~/lib/services/pdfService';

interface UsePdfGenerationReturn {
  // State
  state: PDFGenerationState;
  
  // Actions
  generatePreview: (contextItems: ContextItem[]) => Promise<PDFPreviewResult | null>;
  generateAndDownload: (previewContent: string, filename?: string) => Promise<void>;
  generateDirectDownload: (contextItems: ContextItem[], filename?: string) => Promise<void>;
  generateBase64: (previewContent: string) => Promise<string | null>;
  generateFilename: (contextItems: ContextItem[], patientId?: string) => string;
  reset: () => void;
}

/**
 * Custom hook for PDF generation operations
 * Follows the ChartChek service->hook pattern
 * 
 * @returns PDF generation state and actions
 */
export const usePdfGeneration = (): UsePdfGenerationReturn => {
  const [state, setState] = useState<PDFGenerationState>({
    isLoading: false,
    error: null,
    previewContent: null,
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      previewContent: null,
    });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setPreviewContent = useCallback((previewContent: string | null) => {
    setState(prev => ({ ...prev, previewContent }));
  }, []);

  const generatePreview = useCallback(async (contextItems: ContextItem[]): Promise<PDFPreviewResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await PDFService.generatePreview(contextItems);
      setPreviewContent(result.previewMarkdown);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF preview generation';
      setError(errorMessage);
      setPreviewContent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setPreviewContent]);

  const generateAndDownload = useCallback(async (previewContent: string, filename?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await PDFService.generateAndDownload(previewContent, filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF generation';
      setError(errorMessage);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const generateDirectDownload = useCallback(async (contextItems: ContextItem[], filename?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await PDFService.generateDirectDownload(contextItems, filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during direct PDF generation';
      setError(errorMessage);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const generateBase64 = useCallback(async (previewContent: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      return await PDFService.generateBase64(previewContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF base64 generation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const generateFilename = useCallback((contextItems: ContextItem[], patientId?: string): string => {
    return PDFService.generateFilename(contextItems, patientId);
  }, []);

  return {
    state,
    generatePreview,
    generateAndDownload,
    generateDirectDownload,
    generateBase64,
    generateFilename,
    reset,
  };
}; 