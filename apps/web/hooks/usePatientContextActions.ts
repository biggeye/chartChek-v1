import { useState } from "react";
import { useUser } from "@kit/supabase/hooks/use-user";
import { usePatientStore } from "~/store/patient/patientStore";
import { usePatientEvaluations } from "~/hooks/useEvaluations";
import { useEvaluationsStore } from "~/store/patient/evaluationsStore";
import { useContextQueueStore } from "~/store/chat/contextQueueStore";
import { useContextProcessorStore } from '~/store/chat/contextProcessorStore';

export function usePatientContextActions() {
  // Patient and evaluation state
  const patientStore = usePatientStore();
  const { patientEvaluations, isLoadingEvaluations, fetchEvaluations, setIsLoadingEvaluations } = usePatientEvaluations();
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);

  // Context queue
  const contextQueue = useContextQueueStore();

  // Context processor (for KIPU evaluation ingestion)
  const {
    processAndAddKipuEvaluations,
    isProcessing,
    error: processingEvaluationsError,
  } = useContextProcessorStore();

  const getSelectedContent = () => contextQueue.items.filter(item => item.selected).map(item => ({
    ...item,
    content: item.content ?? '', // Ensure content is present for persistence
  }));

  return {
    ...patientStore,
    patientEvaluations,
    isLoadingEvaluations,
    fetchEvaluations,
    setIsLoadingEvaluations,
    clearEvaluationsStore,
    ...contextQueue,
    // Expose evaluation processing
    processAndAddKipuEvaluations,
    isProcessingEvaluations: isProcessing,
    processingEvaluationsError,
    getSelectedContent,
  };
} 