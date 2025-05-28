import { create } from "zustand";
import { KipuPatientEvaluation } from "types/kipu/kipuAdapter";
import { adaptKipuEvaluation } from "types/kipu/kipuEvaluationEnhanced";
import { PatientEvaluationParserService } from "~/lib/parse-evaluation";
import { useContextQueueStore } from "~/store/chat/contextQueueStore";
import { getCurrentUserId } from "~/utils/supabase/user";
import type { PatientBasicInfo } from "types/kipu/kipuAdapter";
import { useChatStore } from "./chatStore";
import { fetchEvaluationDetails } from '~/lib/services/evaluationsService';
// Add import for uuid if crypto.randomUUID is not available
// import { v4 as uuidv4 } from 'uuid';

// --- Types ---

interface ContextProcessorState {
  isProcessing: boolean;
  error: string | null;
  processedCount: number;

  // --- Actions ---
  processAndAddKipuEvaluations: (
    patient: PatientBasicInfo,
    evaluationIds: string[],
    sessionId?: string
  ) => Promise<{ success: boolean; processedCount: number; error?: string }>;
  // Future actions for other sources can be added here:
  // processAndAddUserDocument: (documentId: string, sessionId?: string) => Promise<...>;
  // processAndAddUploadedFile: (file: File, sessionId?: string) => Promise<...>;
}

// --- Helper Function for API Calls ---

// Centralized helper to make fetch requests to our API routes
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // Attempt to parse JSON regardless of status code for better error details
  let errorData = { message: `HTTP error ${response.status}` };
  try {
    const responseBody = await response.json();
    if (!response.ok) {
      // Use message from response body if available, otherwise stick to HTTP status
      errorData.message = responseBody.message || responseBody.error || errorData.message;
    } else {
      // Successful response
      return responseBody;
    }
  } catch (e) {
    // Ignore JSON parsing errors if response wasn't ok and didn't have JSON body
    if (!response.ok) {
      console.warn(`API ${options.method || 'GET'} ${endpoint} failed with status ${response.status}, but response body was not valid JSON.`);
    } else {
      // This case is less likely for successful responses but handle defensively
      console.error(`API ${options.method || 'GET'} ${endpoint} succeeded but failed to parse JSON response.`);
      throw new Error("Failed to parse successful API response.");
    }
  }

  // If we reach here, it means the response was not ok
  throw new Error(errorData.message);
}

// --- Store Implementation ---

const parserService = new PatientEvaluationParserService(); // Instantiate parser once

export const useContextProcessorStore = create<ContextProcessorState>()((set, get) => ({
  isProcessing: false,
  error: null,
  processedCount: 0,

  processAndAddKipuEvaluations: async (patient, evaluationIds, sessionId) => {
    set({ isProcessing: true, error: null });
    let successCount = 0;
    const successfullyProcessedItemsForLocalQueue: Array<{ type: 'context' | 'evaluation'; title: string; content: string }> = [];

    try {
      // Add patient info as context
      const patientInfo = {
        type: 'context',
        title: `Patient Information - ${patient.firstName} ${patient.lastName}`,
        content: `
Patient ID: ${patient.patientId}
Name: ${patient.firstName} ${patient.lastName}
Date of Birth: ${patient.dateOfBirth || 'Not provided'}
Gender: ${patient.gender || 'Not provided'}
Status: ${patient.status || 'Not provided'}
MRN: ${patient.mrn || 'Not provided'}

Admission Details:
- Admission Date: ${patient.admissionDate || 'Not provided'}
- Level of Care: ${patient.levelOfCare || 'Not provided'}
- Next Level of Care: ${patient.nextLevelOfCare || 'Not provided'}
- Next Level of Care Date: ${patient.nextLevelOfCareDate || 'Not provided'}
- Program: ${patient.program || 'Not provided'}

Location:
- Building: ${patient.buildingName || 'Not provided'}
- Room: ${patient.roomName || 'Not provided'}
- Bed: ${patient.bedName || 'Not provided'}

Insurance Information:
- Provider: ${patient.insuranceProvider || 'Not provided'}
- Insurance Plans: ${JSON.stringify(patient.insurances || [], null, 2)}

Clinical Information:
- Discharge Type: ${patient.dischargeType || 'Not provided'}
- Sobriety Date: ${patient.sobrietyDate || 'Not provided'}
- Patient Statuses: ${JSON.stringify(patient.patient_statuses || [], null, 2)}
- Patient Contacts: ${JSON.stringify(patient.patient_contacts || [], null, 2)}
`.trim()
      };
      successfullyProcessedItemsForLocalQueue.push(patientInfo as { type: 'context'; title: string; content: string });

      const userId = await getCurrentUserId();
      const currentSessionId = sessionId || useChatStore.getState().currentSessionId;

      // Process evaluations
      const processedResults = await Promise.allSettled(
        evaluationIds.map(async (evaluationId) => {
          try {
            const rawEvaluation = await fetchEvaluationDetails(evaluationId);
            if (!rawEvaluation) throw new Error(`Failed to get evaluation data for ID ${evaluationId}`);
            const adaptedEvaluation = adaptKipuEvaluation(rawEvaluation);
            const { title, content } = parserService.parseEvaluation(adaptedEvaluation);
            return {
              id: evaluationId,
              title,
              content,
              patientName: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.patientId,
            };
          } catch (error) {
            console.error(`Error processing evaluation ${evaluationId}:`, error);
            throw error;
          }
        })
      );

      const validResults = processedResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);
      const fetchParseErrors = processedResults
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown fetch/parse error');

      if (validResults.length === 0) {
        throw new Error(`No KIPU evaluations could be fetched or parsed. Errors: ${fetchParseErrors.join(', ')}`);
      }
      if (fetchParseErrors.length > 0) {
        console.warn(`[ContextProcessor] Some KIPU evaluations failed fetch/parse: ${fetchParseErrors.join(', ')}`);
      }

      // Create context items for valid evaluations
      const apiResults = await Promise.allSettled(
        validResults.map(async (result) => {
          const metadata = {
            patientId: result.patientId,
            evaluationId: result.id,
            source: result.title,
            patientName: result.patientName,
            ...(currentSessionId && { sessionId: currentSessionId })
          };
          const itemTitle = `${result.patientName} - ${result.title}`;
          try {
            successfullyProcessedItemsForLocalQueue.push({
              type: 'context' as 'context',
              title: itemTitle,
              content: result.content,
            });
            return { id: result.id, title: itemTitle };
          } catch (apiError) {
            console.error(`Failed to add context item for evaluation ${result.id}:`, apiError);
            throw apiError;
          }
        })
      );

      const successfulApiItems = apiResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<{ id: string; title: string }>));
      const apiErrors = apiResults
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown API error');

      successCount = successfulApiItems.length;
      set({ processedCount: successCount });

      if (apiErrors.length > 0) {
        set({ error: `Partial failure: ${apiErrors.length} KIPU items failed during API operations. Errors: ${apiErrors.join(', ')}` })
      }

      if (successCount > 0) {
        successfullyProcessedItemsForLocalQueue.forEach(item => {
          useContextQueueStore.getState().addItem({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            type: 'context' as 'context',
            title: item.title,
            content: item.content,
          });
        });
        return { success: true, processedCount: successCount };
      } else {
        throw new Error(`All ${validResults.length} parsed KIPU evaluations failed during API operations. Errors: ${apiErrors.join(', ')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during KIPU context processing";
      set({ error: errorMessage });
      return { success: false, processedCount: 0, error: errorMessage };
    } finally {
      set({ isProcessing: false });
    }
  },
  // Placeholder for future actions:
  // processAndAddUserDocument: async (documentId, sessionId) => { /* ... */ },
  // processAndAddUploadedFile: async (file, sessionId) => { /* ... */ },
}));

// Renamed selector hooks
export const useIsProcessingContext = () => useContextProcessorStore((state) => state.isProcessing);
export const useProcessingContextError = () => useContextProcessorStore((state) => state.error);
export const useProcessedCount = () => useContextProcessorStore((state) => state.processedCount);
