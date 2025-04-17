import { create } from "zustand";
import { KipuPatientEvaluation } from "~/types/kipu/kipuAdapter";
import { adaptKipuEvaluation } from "~/types/kipu/kipuEvaluationEnhanced";
import { PatientEvaluationParserService } from "~/lib/kipu/mapping/parse-evaluation";
import { useEvaluationsStore } from "../patient/evaluationsStore";
import { useContextQueueStore } from "~/store/chat/contextQueueStore"; // To add to the UI queue after successful API calls
import { getCurrentUserId } from "~/utils/supabase/user";
import type { PatientBasicInfo } from "~/types/kipu/kipuAdapter";
import { useChatStore } from "./chatStore"; // To potentially get the current session ID
import { fetchEvaluationDetails } from '~/lib/services/evaluationsService';

// --- Types ---

interface ContextProcessorState {
  isProcessing: boolean;
  error: string | null;
  processedCount: number;

  // --- Actions ---
  processAndAddKipuEvaluations: (
    patient: PatientBasicInfo,
    evaluationIds: string[],
    sessionId?: string // Optional: Explicitly pass session ID if needed
  ) => Promise<{ success: boolean; processedCount: number; error?: string }>; // Return status
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

export const useContextProcessorStore = create<ContextProcessorState>()(
  (set, get) => ({
    isProcessing: false,
    error: null,
    processedCount: 0,

    processAndAddKipuEvaluations: async (patient, evaluationIds, sessionId) => {
      set({ isProcessing: true, error: null });
      let successCount = 0;
      const successfullyProcessedItemsForLocalQueue: { type: 'document', title: string, content: string }[] = [];

      try {
     
        // 1. Fetch, Adapt, Parse (KIPU Specific Logic)
        const processedResults = await Promise.allSettled( // Use Promise.allSettled to handle individual failures
          evaluationIds.map(async (evaluationId) => {
          
            // Retrieve the evaluation from the already fetched list in the evaluations store
            const allEvaluations = useEvaluationsStore.getState().patientEvaluations;
       
            // Fetch detailed evaluation data
            const rawEvaluation = await fetchEvaluationDetails(evaluationId);
            console.log(`Detailed evaluation data for ID ${evaluationId}:`, rawEvaluation);

            const adaptedEvaluation = adaptKipuEvaluation(rawEvaluation);
            console.log(
              `[ContextProcessor] Adapted evaluation ${evaluationId}:`,
              adaptedEvaluation
            );
            const { title, content } = parserService.parseEvaluation(adaptedEvaluation);
            console.log(
              `[ContextProcessor] Parsed evaluation ${evaluationId}: Title - ${title}, Content length - ${content.length}`
            );

            return {
              id: evaluationId,
              title,
              content,
              patientName: `${patient.firstName} ${patient.lastName}`,
              patientId: patient.patientId,
            };
          })
        );

        // Filter out failures from parsing/fetching stage
        const validResults = processedResults
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value);

        const fetchParseErrors = processedResults
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown fetch/parse error');

        if (validResults.length === 0) {
          const combinedError = `No KIPU evaluations could be fetched or parsed. Errors: ${fetchParseErrors.join(', ')}`;
          throw new Error(combinedError);
        }
        if (fetchParseErrors.length > 0) {
          console.warn(`[ContextProcessor] Some KIPU evaluations failed fetch/parse: ${fetchParseErrors.join(', ')}`);
          // Optionally bubble this warning up, but proceed with valid ones
        }

        console.log(`[ContextProcessor] Successfully fetched/parsed ${validResults.length} KIPU evaluations. Proceeding to API calls.`);

        // 2. API Calls: Create Context Item and Attach (Generic Logic)
        const userId = await getCurrentUserId();
        const currentSessionId = sessionId || useChatStore.getState().getCurrentSession()?.id; // Use provided or get from chat store

        const apiResults = await Promise.allSettled(
          validResults.map(async (result) => {
            // --- Metadata specific to KIPU evaluations ---
            const metadata = {
              patientId: result.patientId,
              evaluationId: result.id,
              source: "kipu_evaluation", // More specific source
              patientName: result.patientName,
              // Add sessionId directly to metadata if it exists
              ...(currentSessionId && { sessionId: currentSessionId })
            };
            // ---------------------------------------------
            const itemTitle = `${result.patientName} - ${result.title}`;

            // API Call 1: Create Context Item (Now includes session info if available)
             try {
              const response = await fetch('/api/llm/context/items', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: "document",
                  title: itemTitle,
                  content: result.content,
                  metadata: metadata, // Metadata now contains sessionId if available
                  userId: userId,
                }),
              });
              if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
              }
              const data = await response.json();
               // Add to local UI queue after successful API call
              successfullyProcessedItemsForLocalQueue.push({
                type: 'document',
                title: itemTitle,
                content: result.content,
              });
              return { id: data.id, title: itemTitle }; // Return minimal info about success
            } catch (apiError) {
              console.error(`Failed to add context item for evaluation ${result.id}:`, apiError);
              throw apiError;
            }
          })
        );

        // 3. Update State and Add to UI Queue
        const successfulApiItems = apiResults
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<{ id: string; title: string }>).value);

        const apiErrors = apiResults
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown API error');

        successCount = successfulApiItems.length;
        set({ processedCount: successCount });

        if (apiErrors.length > 0) {
          console.error(`[ContextProcessor] Errors during API calls for KIPU items: ${apiErrors.join(', ')}`);
          set({ error: `Partial failure: ${apiErrors.length} KIPU items failed during API operations. Errors: ${apiErrors.join(', ')}` })
        }

        if (successCount > 0) {
          successfullyProcessedItemsForLocalQueue.forEach(item => {
            useContextQueueStore.getState().addItem(item);
          });

              return { success: true, processedCount: successCount };
        } else {
          const finalError = `All ${validResults.length} parsed KIPU evaluations failed during API operations. Errors: ${apiErrors.join(', ')}`;
          throw new Error(finalError);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during KIPU context processing";
        console.error("[ContextProcessor] KIPU processing error:", errorMessage);
        set({ error: errorMessage });
        return { success: false, processedCount: 0, error: errorMessage };
      } finally {
        set({ isProcessing: false });
      }
    },
    // Placeholder for future actions:
    // processAndAddUserDocument: async (documentId, sessionId) => { /* ... */ },
    // processAndAddUploadedFile: async (file, sessionId) => { /* ... */ },
  })
);

// Renamed selector hooks
export const useIsProcessingContext = () => useContextProcessorStore((state) => state.isProcessing);
export const useProcessingContextError = () => useContextProcessorStore((state) => state.error);
export const useProcessedCount = () => useContextProcessorStore((state) => state.processedCount);
