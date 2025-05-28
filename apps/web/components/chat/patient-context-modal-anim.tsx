"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Input } from "@kit/ui/input"
import { Button } from "@kit/ui/button"
import { Loader2, Search, User, FileText, CheckCircle2, X, ChevronDown, ChevronRight } from "lucide-react"
import { usePatientContextActions } from '~/hooks/usePatientContextActions'
import { KipuPatientEvaluation, PatientBasicInfo } from "types/kipu/kipuAdapter"
import { Checkbox } from "@kit/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@kit/ui/utils"
import { ScrollArea } from "@kit/ui/scroll-area"
import { groupPatientsByMasterId } from '~/lib/utils/patientGrouping'
import { Badge } from "@kit/ui/badge"

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

  // --- Use new hook for State and Actions ---
  const contextActions = usePatientContextActions();
  const { 
    patients, selectedPatient, selectPatient, isLoadingPatients, 
    patientEvaluations, isLoadingEvaluations, fetchEvaluations, clearEvaluationsStore,
    addItem, items: contextItems,
    processAndAddKipuEvaluations, isProcessingEvaluations, processingEvaluationsError,
    setIsLoadingEvaluations
  } = contextActions;

  // Filter patients based on search query
  const filteredPatients = useMemo(() => patients.filter((patient: PatientBasicInfo) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ), [patients, searchQuery]);

  // Group patients by master ID for display
  const groupedPatients = useMemo(() => groupPatientsByMasterId(filteredPatients), [filteredPatients]);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  // Handle patient selection
  const handlePatientSelect = (patient: PatientBasicInfo) => {
    setIsLoadingEvaluations(true);
    selectPatient(patient);
    setActiveTab("evaluations");
    // fetchEvaluations will be triggered by the effect when selectedPatient changes
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
      // Set error in zustand for now, could be local state
      // contextActions.error = "Please navigate to a chat session before adding context.";
      return;
    }

    try {
      const result = await processAndAddKipuEvaluations(
        selectedPatient,
        selectedEvaluations,
        currentSessionId.toString()
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
      // Optionally set a local error state here if desired
    }
  };

  // Consistent tab change handler
  const handleTabChange = (tab: "patients" | "evaluations") => {
    setActiveTab(tab);
    if (tab === "evaluations" && selectedPatient?.patientId) {
      setIsLoadingEvaluations(true);
      fetchEvaluations(selectedPatient.patientId.toString());
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

  // When a chart is selected, fetch evaluations for that chart
  useEffect(() => {
    if (selectedChartId) {
      fetchEvaluations(selectedChartId);
    }
  }, [selectedChartId, fetchEvaluations]);


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
                <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "patients" | "evaluations")} className="p-2"> 
                  <TabsList className="grid w-full grid-cols-2 h-8 text-xs">
                    <TabsTrigger value="patients">Patients</TabsTrigger>
                    <TabsTrigger value="evaluations" disabled={!selectedChartId}>Evaluations</TabsTrigger>
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
                        ) : groupedPatients.length === 0 ? (
                          <div className="text-center py-2 text-muted-foreground">
                            <User className="h-5 w-5 mx-auto mb-1 opacity-20" />
                            <p className="text-xs">No patients found</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {groupedPatients.map((group) => (
                              <div key={group.patientMasterId} className="border rounded-md mb-2">
                                <div
                                  className={`flex items-center justify-between p-2 cursor-pointer ${expandedPatientId === group.patientMasterId ? 'bg-primary/10' : 'hover:bg-muted'}`}
                                  onClick={() => setExpandedPatientId(expandedPatientId === group.patientMasterId ? null : group.patientMasterId)}
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-xs">{group.currentChart.lastName}, {group.currentChart.firstName}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">MRN: {group.currentChart.mrn || 'N/A'}</span>
                                  </div>
                                  {expandedPatientId === group.patientMasterId ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </div>
                                {expandedPatientId === group.patientMasterId && (
                                  <div className="pl-6 pr-2 pb-2">
                                    <div className="space-y-1">
                                      {group.allCharts.map((chart) => (
                                        <div
                                          key={chart.patientId}
                                          className={`flex items-center justify-between p-1 rounded-md cursor-pointer transition-colors ${selectedChartId === chart.patientId ? 'bg-primary/20' : 'hover:bg-muted'}`}
                                          onClick={() => {
                                            setSelectedChartId(chart.patientId);
                                            setActiveTab('evaluations');
                                            selectPatient(chart); // Set selectedPatient for downstream logic
                                          }}
                                        >
                                          <div>
                                            <span className="font-sm text-xs font-medium">{chart.program || 'Unknown Program'}</span>
                                            <span className="ml-2 text-[10px] text-muted-foreground">{chart.admissionDate} - {chart.dischargeDate || 'Present'}</span>
                                          </div>
                                          <Badge variant={chart.dischargeDate ? "secondary" : "success"}>
                                            {chart.dischargeDate ? "Completed" : "Active"}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
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
                                  <label htmlFor={`eval-${evaluation.id}`} className="font-sm cursor-pointer text-xs truncate" title={evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`}> {evaluation.name || evaluation.evaluationType || `Evaluation ${String(evaluation.id)}`} </label>
                                </div>
                                <p className="text-[10px] text-muted-foreground flex-shrink-0"> {new Date(evaluation.createdAt || Date.now()).toLocaleDateString()} </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleProcessButtonClick}
                        disabled={selectedEvaluations.length === 0 || isProcessingEvaluations}
                        className="h-7 px-3 text-xs"
                      >
                        {isProcessingEvaluations ? (
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
                  <StatusMessage error={processingEvaluationsError} isProcessing={isProcessingEvaluations} />
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
