"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Input } from "@kit/ui/input"
import { Button } from "@kit/ui/button"
import { Loader2, Search, User, FileText, CheckCircle2, X } from "lucide-react"
import { usePatientStore, PatientStore } from "~/store/patient/patientStore"; 
import { usePatientEvaluations } from "~/hooks/useEvaluations"; 
import { useEvaluationsStore } from "~/store/patient/evaluationsStore" 
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { useFacilityStore } from "~/store/patient/facilityStore"
import { useChatStore } from "~/store/chat/chatStore"
import { useContextProcessorStore } from "~/store/chat/contextProcessorStore"
import { ScrollArea } from "@kit/ui/scroll-area"
import { KipuPatientEvaluation, PatientBasicInfo } from "types/kipu/kipuAdapter"
import { Checkbox } from "@kit/ui/checkbox"; 
import { useFetchPatients } from "~/hooks/usePatients"
 
interface PatientContextModalProps {
  onClose: () => void;
}

export function PatientContextModal({ onClose }: PatientContextModalProps) {
  const [activeTab, setActiveTab] = useState<"patients" | "evaluations">("patients")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]) 
  
  // --- Use Hooks for State and Actions ---
  // Get patient state and actions from patient store
  const { isLoadingPatients, setIsLoadingPatients } = usePatientStore((state: PatientStore) => state);
  const selectedPatient = usePatientStore((state: PatientStore) => state.selectedPatient);
  const selectPatientAction = usePatientStore((state: PatientStore) => state.selectPatient);

  const patients = usePatientStore((state: PatientStore) => state.patients); 
  const { currentFacilityId } = useFacilityStore(); 
  
  // Call hook unconditionally - it handles fetching based on currentFacilityId
  useFetchPatients(currentFacilityId);
  
  // Use the dedicated hook for evaluations state and fetch trigger
  const { 
    patientEvaluations, 
    isLoadingEvaluations, 
    error: evaluationsError, 
    fetchEvaluations 
  } = usePatientEvaluations();
  // Get clear action directly from the store
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);
    
  // Get current session ID from chat store using the hook selector
  const currentSessionId = useChatStore(state => state.currentSessionId);

  // Context queue store
  const { addItem, items: contextItems } = useContextQueueStore();
  
  // Context processor store
  const {
    processAndAddKipuEvaluations,
    isProcessing: isProcessingFromStore,
    error: processingError,
  } = useContextProcessorStore();

  // Filter patients based on search query
  const filteredPatients = useMemo(() => patients.filter((patient: PatientBasicInfo) =>
    `${patient.firstName} ${patient.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  ), [patients, searchQuery]); 
 
  // Handle patient selection
  const handlePatientSelect = (patient: PatientBasicInfo) => {
    selectPatientAction(patient);
    setActiveTab("evaluations");
  };

  // Toggle evaluation selection
  const toggleEvaluationSelection = (id: string | number) => {
    const idString = String(id);
    setSelectedEvaluations(prev => {
      if (prev.includes(idString)) {
        return prev.filter(evalId => evalId !== idString);
      } else {
        return [...prev, idString];
      }
    });
  };

  // Process selected evaluations and add to context queue
  const handleProcessButtonClick = async () => {
    if (!selectedPatient || selectedEvaluations.length === 0) {
      console.error("No patient selected or no evaluations selected");
      return;
    }

    if (!currentSessionId) {
      console.error("No active chat session");
      return;
    }

    console.log("[PatientContextModal] Calling store action processAndAddKipuEvaluations...");
    processAndAddKipuEvaluations(
      selectedPatient,
      selectedEvaluations,
      currentSessionId
    ).then(result => {
      console.log("[PatientContextModal] Store action finished.", result);
      // Optionally handle success/failure UI feedback here based on result
      if (result.success && result.processedCount > 0) {
        // Maybe close the modal or show success message?
      }
    }).catch(error => {
      console.error("[PatientContextModal] Error during processing:", error);
      // Show error message to the user
    });
  };

  // --- Effects --- 
  
  // Effect to fetch evaluations when the selected patient changes
  useEffect(() => {
    if (selectedPatient?.patientId) {
      console.log(`[PatientContextModal] Selected patient changed: ${selectedPatient.patientId}. Fetching evaluations.`);
      fetchEvaluations(selectedPatient.patientId.toString());
    } else {
      // Clear evaluations if no patient is selected or patient is deselected
      console.log('[PatientContextModal] No patient selected. Clearing evaluations.');
      clearEvaluationsStore();
    }
    // Reset local selected evaluations when patient changes
    setSelectedEvaluations([]); 
  }, [selectedPatient, fetchEvaluations, clearEvaluationsStore]);

  // Effect to switch tab when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setActiveTab("evaluations");
    }
  }, [selectedPatient]);

  return (
    <div className="w-full max-w-3xl mx-auto p-1">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "patients" | "evaluations")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="evaluations" disabled={!selectedPatient}>Evaluations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patients" className="mt-2">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-1 top-1"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-2 w-2 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <ScrollArea className="h-[300px] rounded-md border p-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-3 text-muted-foreground">
                <User className="h-7 w-7 mx-auto mb-2 opacity-20" />
                <p>No patients found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPatients.map((patient: PatientBasicInfo) => (
                  <div
                    key={patient.patientId}
                    className={`flex items-center justify-between p-1 rounded-md cursor-pointer transition-colors ${
                      selectedPatient?.patientId === patient.patientId ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="font-sm">{patient.firstName} {patient.lastName}</p>
                        <p className="text-xs text-muted-foreground">ID: {patient.patientId}</p>
                      </div>
                    </div>
                    {selectedPatient?.patientId === patient.patientId && (
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="evaluations" className="mt-2">
          <ScrollArea className="h-[300px] rounded-md border p-2">
            {isLoadingEvaluations ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : patientEvaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-7 w-7 mx-auto mb-2 opacity-20" />
                <p>No evaluations found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {patientEvaluations.map((evaluation: KipuPatientEvaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center p-3 rounded-md border hover:bg-muted"
                  >
                    <Checkbox 
                      id={`eval-${evaluation.id}`}
                      checked={selectedEvaluations.includes(evaluation.id.toString())}
                      onCheckedChange={() => toggleEvaluationSelection(evaluation.id.toString())}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`eval-${evaluation.id}`}
                        className="font-sms cursor-pointer"
                      >
                        {evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluation.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleProcessButtonClick} 
              disabled={selectedEvaluations.length === 0 || isProcessingFromStore}
            >
              {isProcessingFromStore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Process {selectedEvaluations.length} Selection(s)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {(isProcessingFromStore || processingError) && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-center">
          {isProcessingFromStore && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{processingError || "Processing..."}</span>
        </div>
      )}
    </div>
  );
}
