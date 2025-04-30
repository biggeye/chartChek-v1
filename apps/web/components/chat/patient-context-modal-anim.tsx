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
import { motion, AnimatePresence } from "framer-motion"

interface PatientContextModalAnimProps {
  onClose: () => void;
  isOpen: boolean;
  onProcessed?: () => void;
}

export function PatientContextModalAnim({ onClose, isOpen, onProcessed }: PatientContextModalAnimProps) {
  const [activeTab, setActiveTab] = useState<"patients" | "evaluations">("patients")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])

  // --- Use Hooks for State and Actions ---
  const { isLoadingPatients, setIsLoadingPatients } = usePatientStore((state: PatientStore) => state);
  const selectedPatient = usePatientStore((state: PatientStore) => state.selectedPatient);
  const selectPatientAction = usePatientStore((state: PatientStore) => state.selectPatient);
  const patients = usePatientStore((state: PatientStore) => state.patients); 
  const { currentFacilityId } = useFacilityStore(); 
  useFetchPatients(currentFacilityId);
  const { patientEvaluations, isLoadingEvaluations, error: evaluationsError, fetchEvaluations } = usePatientEvaluations();
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);
  const currentSessionId = useChatStore(state => state.currentSessionId);
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
    if (!selectedPatient || selectedEvaluations.length === 0) return;
    if (!currentSessionId) return;
    await processAndAddKipuEvaluations(selectedPatient, selectedEvaluations, currentSessionId);
    if (onProcessed) onProcessed();
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
    if (selectedPatient) setActiveTab("evaluations");
  }, [selectedPatient]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 right-0 bottom-0 z-50 flex justify-center items-end pointer-events-auto"
          style={{ minHeight: '0', height: 'auto' }}
        >
          <div className="w-full max-w-xl mx-auto bg-background border rounded-lg shadow-lg p-2 mt-2" style={{ fontSize: '0.95rem' }}>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "patients" | "evaluations")}> 
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
                    <button className="absolute right-1 top-1" onClick={() => setSearchQuery("")}> <X className="h-2 w-2 text-muted-foreground" /> </button>
                  )}
                </div>
                <ScrollArea className="h-[180px] rounded-md border p-1">
                  {filteredPatients.length === 0 ? (
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
                </ScrollArea>
              </TabsContent>
              <TabsContent value="evaluations" className="mt-1">
                <ScrollArea className="h-[140px] rounded-md border p-1">
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
                        <div key={evaluation.id} className="flex items-center p-2 rounded-md border hover:bg-muted">
                          <Checkbox
                            id={`eval-${evaluation.id}`}
                            checked={selectedEvaluations.includes(evaluation.id.toString())}
                            onCheckedChange={() => toggleEvaluationSelection(evaluation.id.toString())}
                            className="mr-2 h-3 w-3"
                          />
                          <div className="flex-1">
                            <label htmlFor={`eval-${evaluation.id}`} className="font-sms cursor-pointer text-xs">
                              {evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`}
                            </label>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(evaluation.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
            {(isProcessingFromStore || processingError) && (
              <div className="mt-2 flex items-center justify-center space-x-2 text-center">
                {isProcessingFromStore && <Loader2 className="h-3 w-3 animate-spin" />}
                <span className="text-xs">{processingError || "Processing..."}</span>
              </div>
            )}
            <div className="flex justify-end mt-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
