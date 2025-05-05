import { create } from "zustand";
import { KipuPatientEvaluation } from "types/kipu/kipuAdapter";
import { adaptKipuEvaluation } from "types/kipu/kipuEvaluationEnhanced";
import { PatientEvaluationParserService } from "~/lib/parse-evaluation";
import { useEvaluationsStore } from "../patient/evaluationsStore";
import { useContextQueueStore } from "~/store/chat/contextQueueStore"; // To add to the UI queue after successful API calls
import { getCurrentUserId } from "~/utils/supabase/user";
import type { PatientBasicInfo } from "types/kipu/kipuAdapter";
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
        // First, add patient basic info as context
        const patientInfo: { type: 'document', title: string, content: string } = {
          type: 'document',
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

        // Add patient info to the queue first
        successfullyProcessedItemsForLocalQueue.push(patientInfo);

        // Create context item for patient info
        const userId = await getCurrentUserId();
        const currentSessionId = sessionId || useChatStore.getState().currentSessionId;

        try {
          const patientInfoResponse = await fetch('/api/llm/context/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: "document" as const,
              title: patientInfo.title,
              content: patientInfo.content,
              metadata: {
                patientId: patient.patientId,
                source: "patient_info",
                patientName: `${patient.firstName} ${patient.lastName}`,
                ...(currentSessionId && { sessionId: currentSessionId })
              },
              userId: userId,
            }),
          });

          if (!patientInfoResponse.ok) {
            console.warn('Failed to add patient info to context, but continuing with evaluations');
          }
        } catch (error) {
          console.warn('Error adding patient info to context, but continuing with evaluations:', error);
        }

        // Now process evaluations as before
        const processedResults = await Promise.allSettled(
          evaluationIds.map(async (evaluationId) => {
            try {
              // Directly fetch the evaluation details - we know this works
              const rawEvaluation = await fetchEvaluationDetails(evaluationId);

              if (!rawEvaluation) {
                throw new Error(`Failed to get evaluation data for ID ${evaluationId}`);
              }

              const adaptedEvaluation = adaptKipuEvaluation(rawEvaluation);
              console.log(
                `[ContextProcessor] Adapted evaluation ${evaluationId}:`,
                JSON.stringify(adaptedEvaluation, null, 2)
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
            } catch (error) {
              console.error(`Error processing evaluation ${evaluationId}:`, error);
              throw error;
            }
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
        }

        console.log(`[ContextProcessor] Successfully fetched/parsed ${validResults.length} KIPU evaluations. Proceeding to API calls.`);

        // 2. API Calls: Create Context Item and Attach (Generic Logic)
        const apiResults = await Promise.allSettled(
          validResults.map(async (result) => {
            // --- Metadata specific to KIPU evaluations ---
            const metadata = {
              patientId: result.patientId,
              evaluationId: result.id,
              source: result.name, //
              patientName: result.patientName,
              // Add sessionId directly to metadata if it exists
              ...(currentSessionId && { sessionId: currentSessionId })
            };
            // ---------------------------------------------
            const itemTitle = `${result.patientName} - ${result.name}`;

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
