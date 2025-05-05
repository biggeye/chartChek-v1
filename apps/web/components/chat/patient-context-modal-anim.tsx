"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Input } from "@kit/ui/input"
import { Button } from "@kit/ui/button"
import { Loader2, Search, User, FileText, CheckCircle2, X } from "lucide-react"
import { usePatientStore, PatientStore } from "~/store/patient/patientStore"
import { usePatientEvaluations } from "~/hooks/useEvaluations"
import { useEvaluationsStore } from "~/store/patient/evaluationsStore"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { useContextProcessorStore } from "~/store/chat/contextProcessorStore"
import { ScrollArea } from "@kit/ui/scroll-area"
import { KipuPatientEvaluation, PatientBasicInfo } from "types/kipu/kipuAdapter"
import { Checkbox } from "@kit/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@kit/ui/utils"

interface PatientContextModalAnimProps {
  onClose: () => void;
  isOpen: boolean;
  onProcessed?: () => void;
}

// Status message component
function StatusMessage({ error, isProcessing }: { error: string | null, isProcessing: boolean }) {
  if (!error && !isProcessing) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "text-sm px-3 py-2 rounded-md mt-2",
        error ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      )}
    >
      {error || (isProcessing ? "Processing evaluations..." : null)}
    </motion.div>
  );
}

export function PatientContextModalAnim({ onClose, isOpen, onProcessed }: PatientContextModalAnimProps) {
  const [activeTab, setActiveTab] = useState<"patients" | "evaluations">("patients")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])

  // Get session ID from URL params instead of store
  const { id: currentSessionId } = useParams();

  // --- Use Hooks for State and Actions ---
  const { isLoadingPatients, setIsLoadingPatients } = usePatientStore((state: PatientStore) => state);
  const selectedPatient = usePatientStore((state: PatientStore) => state.selectedPatient);
  const selectPatientAction = usePatientStore((state: PatientStore) => state.selectPatient);
  const patients = usePatientStore((state: PatientStore) => state.patients); 
  const { patientEvaluations, isLoadingEvaluations, error: evaluationsError, fetchEvaluations } = usePatientEvaluations();
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);
  const { addItem, items: contextItems } = useContextQueueStore();
  const {
    processAndAddKipuEvaluations,
    isProcessing: isProcessingFromStore,
    error: processingError,
  } = useContextProcessorStore();

  // Filter patients based on search query
  const filteredPatients = useMemo(() => patients.filter((patient: PatientBasicInfo) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ), [patients, searchQuery]);

  // Handle patient selection
  const handlePatientSelect = (patient: PatientBasicInfo) => {
    selectPatientAction(patient);
    setActiveTab("evaluations");
  };

  // Toggle evaluation selection
  const toggleEvaluationSelection = (id: string | number) => {
    const idString = String(id);
    setSelectedEvaluations(prev => prev.includes(idString) ? prev.filter(evalId => evalId !== idString) : [...prev, idString]);
  };

  // Process selected evaluations and add to context queue
  const handleProcessButtonClick = async () => {
    if (!selectedPatient || selectedEvaluations.length === 0) {
      return;
    }

    if (!currentSessionId) {
      useContextProcessorStore.setState({ 
        error: "Please navigate to a chat session before adding context." 
      });
      return;
    }

    try {
      const result = await processAndAddKipuEvaluations(
        selectedPatient,
        selectedEvaluations,
        currentSessionId.toString() // Ensure it's a string
      );
      
      if (result.success && result.processedCount > 0) {
        setSelectedEvaluations([]);
        if (onProcessed) {
          onProcessed();
        }
        onClose();
      } else if (result.error) {
        console.error("[PatientContextModal] Processing failed:", result.error);
      }
    } catch (error) {
      console.error("[PatientContextModal] Unexpected error during processing:", error);
      useContextProcessorStore.setState({ 
        error: "An unexpected error occurred while processing evaluations. Please try again." 
      });
    }
  };

  // --- Effects --- 
  useEffect(() => {
    if (selectedPatient?.patientId) {
      fetchEvaluations(selectedPatient.patientId.toString());
    } else {
      clearEvaluationsStore();
    }
    setSelectedEvaluations([]);
  }, [selectedPatient, fetchEvaluations, clearEvaluationsStore]);

  useEffect(() => {
    if (selectedPatient) {
      setActiveTab("evaluations");
    }
  }, [selectedPatient]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/60"
            onClick={onClose}
          />
          {/* Panel expanding from context queue */}
          <motion.div
            initial={{ height: "32px", opacity: 0.5 }}
            animate={{ 
              height: "auto",
              opacity: 1,
            }}
            exit={{ 
              height: "32px",
              opacity: 0.5,
            }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 40,
              mass: 1
            }}
            className="fixed bottom-[100px] left-0 right-0 z-50 flex justify-center"
            style={{ 
              maxHeight: "calc(100vh - 180px)"
            }}
          >
            <div className="w-full max-w-xl bg-background border rounded-lg shadow-lg overflow-hidden">
              <div className="flex flex-col">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "patients" | "evaluations")} className="p-2"> 
                  <TabsList className="grid w-full grid-cols-2 h-8 text-xs">
                    <TabsTrigger value="patients">Patients</TabsTrigger>
                    <TabsTrigger value="evaluations" disabled={!selectedPatient}>Evaluations</TabsTrigger>
                  </TabsList>
                  <TabsContent value="patients" className="mt-1">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search patients..."
                        className="pl-7 py-1 h-7 text-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button className="absolute right-1 top-1" onClick={() => setSearchQuery("")}> 
                          <X className="h-2 w-2 text-muted-foreground" /> 
                        </button>
                      )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-320px)] overflow-y-auto rounded-md border p-1" style={{ contain: 'strict' }}>
                      <div className="space-y-1">
                        {isLoadingPatients ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredPatients.length === 0 ? (
                          <div className="text-center py-2 text-muted-foreground">
                            <User className="h-5 w-5 mx-auto mb-1 opacity-20" />
                            <p className="text-xs">No patients found</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredPatients.map((patient: PatientBasicInfo) => (
                              <div
                                key={patient.patientId}
                                className={`flex items-center justify-between p-1 rounded-md cursor-pointer transition-colors ${selectedPatient?.patientId === patient.patientId ? "bg-primary/10" : "hover:bg-muted"}`}
                                onClick={() => handlePatientSelect(patient)}
                              >
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <div>
                                    <p className="font-sm text-xs">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-[10px] text-muted-foreground">ID: {patient.patientId}</p>
                                  </div>
                                </div>
                                {selectedPatient?.patientId === patient.patientId && (
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="evaluations" className="mt-1">
                    <ScrollArea className="h-[calc(100vh-320px)] overflow-y-auto rounded-md border p-1" style={{ contain: 'strict' }}>
                      <div className="space-y-1">
                        {isLoadingEvaluations ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : patientEvaluations.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="h-5 w-5 mx-auto mb-1 opacity-20" />
                            <p className="text-xs">No evaluations found</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {patientEvaluations.map((evaluation: KipuPatientEvaluation) => (
                              <div key={evaluation.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted">
                                <div className="flex items-center flex-1 mr-2">
                                   <Checkbox
                                     id={`eval-${evaluation.id}`}
                                     checked={selectedEvaluations.includes(evaluation.id.toString())}
                                     onCheckedChange={() => toggleEvaluationSelection(evaluation.id.toString())}
                                     className="mr-2 h-3 w-3 flex-shrink-0"
                                   />
                                  <label htmlFor={`eval-${evaluation.id}`} className="font-sm cursor-pointer text-xs truncate" title={evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`}>
                                     {evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`}
                                   </label>
                                </div>
                                <p className="text-[10px] text-muted-foreground flex-shrink-0">
                                   {new Date(evaluation.createdAt || Date.now()).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleProcessButtonClick}
                        disabled={selectedEvaluations.length === 0 || isProcessingFromStore}
                        className="h-7 px-3 text-xs"
                      >
                        {isProcessingFromStore ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-3 w-3" />
                        )}
                        Process {selectedEvaluations.length} Selection(s)
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Status message */}
                <AnimatePresence>
                  <StatusMessage error={processingError} isProcessing={isProcessingFromStore} />
                </AnimatePresence>

                {/* Close button */}
                <div className="flex justify-end p-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
