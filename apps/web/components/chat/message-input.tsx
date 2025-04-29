"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@kit/ui/button"
import { Textarea } from "@kit/ui/textarea"
import { Send } from "lucide-react"
import { cn } from "@kit/ui/utils"
import useSidebarStores from "~/store/sidebarStore"
import { FileUp, User, FileText } from "lucide-react"
import { STATUS_CODES } from "http"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Input } from "@kit/ui/input"
import { Loader2, Search, User as UserIcon, FileText as FileTextIcon, CheckCircle2, X, ChevronDown, ChevronUp, ClipboardList, Upload } from "lucide-react"
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
import { Badge } from "@kit/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@kit/ui/dialog"

interface MessageInputProps {
  input: string,
  handleInputChange: any,
  handleSubmit: any
}

export function MessageInput() {

  
  const { isDesktopSidebarCollapsed } = useSidebarStores();
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // --- Patient/Evaluation/Context Modal State ---
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"patients" | "evaluations">("patients")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])

  // Patient/Evaluation/Context state/hooks
  const { isLoadingPatients, setIsLoadingPatients } = usePatientStore((state: PatientStore) => state);
  const selectedPatient = usePatientStore((state: PatientStore) => state.selectedPatient);
  const selectPatientAction = usePatientStore((state: PatientStore) => state.selectPatient);
  const patients = usePatientStore((state: PatientStore) => state.patients);
  const { currentFacilityId } = useFacilityStore();
  useFetchPatients(currentFacilityId);
  const { patientEvaluations, isLoadingEvaluations, error: evaluationsError, fetchEvaluations } = usePatientEvaluations();
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);
  const currentSessionId = useChatStore(state => state.currentSessionId);
  const { addItem, items: contextItems, toggleItem, removeItem, toggleEvaluationItemDetail, clearQueue } = useContextQueueStore();
  const { processAndAddKipuEvaluations, isProcessing: isProcessingFromStore, error: processingError } = useContextProcessorStore();

  // --- Patient/Evaluation Modal Logic ---
  const filteredPatients = useMemo(() => patients.filter((patient: PatientBasicInfo) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ), [patients, searchQuery]);

  const handlePatientSelect = (patient: PatientBasicInfo) => {
    selectPatientAction(patient);
    setActiveTab("evaluations");
  };

  const toggleEvaluationSelection = (id: string | number) => {
    const idString = String(id);
    setSelectedEvaluations(prev => prev.includes(idString) ? prev.filter(evalId => evalId !== idString) : [...prev, idString]);
  };

  const handleProcessButtonClick = async () => {
    if (!selectedPatient || selectedEvaluations.length === 0) return;
    if (!currentSessionId) return;
    await processAndAddKipuEvaluations(selectedPatient, selectedEvaluations, currentSessionId);
  };

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

  // --- Context Queue State for Expansive Panel ---
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { input, handleInputChange, handleSubmit } = useChat({
    id: 'test23',
    maxSteps: 5,
      });

  // --- UI ---
  return (
    <div className={cn(
      "fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out",
      "left-4 right-4",
      "lg:left-4 lg:right-4",
      isDesktopSidebarCollapsed ? "lg:left-24" : "lg:left-[calc(18rem+1rem)]",
      "xl:right-[calc(24rem+1rem)]"
    )}>
      <div className="flex items-center">
        {/* Context Panel Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8 hover:bg-accent/50"
          onClick={() => setIsContextPanelOpen((v) => !v)}
          aria-label="Open Patient/Evaluation Context"
        >
          <ClipboardList className="h-4 w-4" />
        </Button>
        {/* Magic Icons (existing) */}
        <div className="flex items-center pl-2 gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/50">
            <FileUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/50">
            <UserIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/50">
            <FileTextIcon className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          rows={1}
          className={cn(
            "text-sm relative w-full resize-none overflow-hidden min-h-[40px] max-h-[120px] px-2 py-2 rounded-md border border-input focus:border-primary focus:ring-1 focus-visible:outline-none"
          )}
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          className="h-8 w-8 bg-primary text-primary-foreground hover:bg-accent mr-2"
        >
          <Send />
        </Button>
        </form>
      </div>

      {/* Patient/Evaluation Context Modal (Toggled) */}
      {isContextPanelOpen && (
        <div className="w-full max-w-3xl mx-auto p-1 mt-4 bg-background border rounded-lg shadow-lg">
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
                  <button className="absolute right-1 top-1" onClick={() => setSearchQuery("")}> <X className="h-2 w-2 text-muted-foreground" /> </button>
                )}
              </div>
              <ScrollArea className="h-[300px] rounded-md border p-2">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-3 text-muted-foreground">
                    <UserIcon className="h-7 w-7 mx-auto mb-2 opacity-20" />
                    <p>No patients found</p>
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
                          <UserIcon className="h-3 w-3 text-muted-foreground" />
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
                    <FileTextIcon className="h-7 w-7 mx-auto mb-2 opacity-20" />
                    <p>No evaluations found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patientEvaluations.map((evaluation: KipuPatientEvaluation) => (
                      <div key={evaluation.id} className="flex items-center p-3 rounded-md border hover:bg-muted">
                        <Checkbox
                          id={`eval-${evaluation.id}`}
                          checked={selectedEvaluations.includes(evaluation.id.toString())}
                          onCheckedChange={() => toggleEvaluationSelection(evaluation.id.toString())}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <label htmlFor={`eval-${evaluation.id}`} className="font-sms cursor-pointer">
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

          {/* Expansive Context Queue Panel Toggle */}
          <div className="flex justify-end mt-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsQueueExpanded(v => !v)}>
              {isQueueExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {isQueueExpanded ? "Hide Context Queue" : "Show Context Queue"}
            </Button>
          </div>
          {isQueueExpanded && (
            <Card className="w-full mt-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedPatient?.firstName} {selectedPatient?.lastName}</CardTitle>
                  <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                    {contextItems.filter((item) => item.selected).length} selected
                  </Badge>
                </div>
                <CardDescription>Add documents, uploads, and evaluations to provide context for your chat</CardDescription>
              </CardHeader>
              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid grid-cols-3 mb-2 mx-4">
                  <TabsTrigger value="documents" className="flex items-center gap-1">
                    <FileTextIcon className="h-4 w-4" />
                    <span>Documents</span>
                    {contextItems.filter((item) => item.type === "document").length > 0 && (
                      <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                        {contextItems.filter((item) => item.type === "document").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="uploads" className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    <span>Uploads</span>
                    {contextItems.filter((item) => item.type === "upload").length > 0 && (
                      <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                        {contextItems.filter((item) => item.type === "upload").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="evaluations" className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>Evaluations</span>
                    {contextItems.filter((item) => item.type === "evaluation").length > 0 && (
                      <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                        {contextItems.filter((item) => item.type === "evaluation").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="documents" className="m-0">
                  <ScrollArea className="h-[350px] px-4">
                    <div className="space-y-2 pb-4">
                      {contextItems.filter((item) => item.type === "document").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No documents added</div>
                      ) : (
                        contextItems.filter((item) => item.type === "document").map((item) => (
                          <div key={item.id} className="border rounded-md p-2 flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{item.title}</div>
                              <div className="text-xs text-muted-foreground">{item.type}</div>
                            </div>
                            <div className="flex gap-2">
                              <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id, !item.selected)} />
                              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="uploads" className="m-0">
                  <ScrollArea className="h-[350px] px-4">
                    <div className="space-y-2 pb-4">
                      {contextItems.filter((item) => item.type === "upload").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No uploads added</div>
                      ) : (
                        contextItems.filter((item) => item.type === "upload").map((item) => (
                          <div key={item.id} className="border rounded-md p-2 flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{item.title}</div>
                              <div className="text-xs text-muted-foreground">{item.type}</div>
                            </div>
                            <div className="flex gap-2">
                              <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id, !item.selected)} />
                              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="evaluations" className="m-0">
                  <ScrollArea className="h-[350px] px-4">
                    <div className="space-y-2 pb-4">
                      {contextItems.filter((item) => item.type === "evaluation").length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">No evaluations added</div>
                      ) : (
                        contextItems.filter((item) => item.type === "evaluation").map((item) => (
                          <div key={item.id} className="border rounded-md p-2 flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{item.title}</div>
                              <div className="text-xs text-muted-foreground">{item.type}</div>
                            </div>
                            <div className="flex gap-2">
                              <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(item.id, !item.selected)} />
                              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              <CardFooter className="flex justify-between pt-0">
                <Button className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1.5 text-sm" onClick={clearQueue} disabled={contextItems.length === 0}>Clear All</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
