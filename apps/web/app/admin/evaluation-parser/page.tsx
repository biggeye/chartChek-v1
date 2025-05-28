'use client';

import { useState, useEffect } from 'react';
import { useEvaluationsStore } from '~/store/patient/evaluationsStore';
import { KipuFieldTypes } from 'types/kipu/kipuAdapter';
import { 
  KipuPatientEvaluationEnhanced, 
  KipuPatientEvaluationItemEnhanced,
  adaptKipuEvaluation,
  adaptKipuEvaluationItem
} from 'types/kipu/kipuEvaluationEnhanced';
import { PatientEvaluationParserService } from '~/lib/parse-evaluation';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kit/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Separator } from '@kit/ui/separator';
import { ScrollArea } from '@kit/ui/scroll-area';
import { usePatientStore } from '~/store/patient/patientStore';
import { Badge } from '@kit/ui/badge';
import { RefreshCcw } from 'lucide-react';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import { fetchPatients } from '~/lib/services/patientService';

export default function EvaluationParserTestPage() {
  const { patientEvaluations, selectPatientEvaluation, clearSelectedPatientEvaluation, fetchEvaluations } = usePatientEvaluations();
  const { patients, setPatients } = usePatientStore();
  
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<KipuPatientEvaluationEnhanced | null>(null);
  const [selectedItem, setSelectedItem] = useState<KipuPatientEvaluationItemEnhanced | null>(null);
  const [parsedResult, setParsedResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the parser service
  const parserService = new PatientEvaluationParserService();
  // Fetch patients on initial load
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await fetchPatients();
        setPatients(patientsData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
        setError(errorMessage);
      }
    };
    
    loadPatients();
  }, [setPatients]);
  
  // Fetch evaluations when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setLoading(true);
      fetchEvaluations(selectedPatient)
        .then((data) => {
          setLoading(false);
          
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evaluations';
          setError(errorMessage);
          setLoading(false);
        });
    }
  }, [selectedPatient]);
  
  // Function to reset the state
  const resetState = () => {
    setSelectedEvaluation(null);
    setSelectedItem(null);
    setParsedResult('');
    clearSelectedPatientEvaluation();
  };
  
  // Function to fetch a complete evaluation
  const handleEvaluationSelect = async (evaluation: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset state first to avoid stale data
      setSelectedEvaluation(null);
      setSelectedItem(null);
      setParsedResult('');
      
      // Fetch the complete evaluation with items
        const rawEvaluation = await selectPatientEvaluation(evaluation.id);
     
      // Adapt the raw evaluation to our enhanced interface
      const adaptedEvaluation = adaptKipuEvaluation(rawEvaluation);
      setSelectedEvaluation(adaptedEvaluation);
      selectPatientEvaluation(evaluation.id);
      
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluation details';
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  
  // Function to parse the entire evaluation
  const parseFullEvaluation = () => {
    if (!selectedEvaluation) return;
    
    try {
      const result = parserService.parseEvaluation(selectedEvaluation);
      setParsedResult(result.content);
      setSelectedItem(null); // Reset selected item since we're parsing the full evaluation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse evaluation';
      setError(errorMessage);
      setParsedResult('');
    }
  };

  // Function to get a color for field type badges
  const getFieldTypeColor = (fieldType: KipuFieldTypes): string => {
    const typeMap: Record<string, string> = {
      'string': 'bg-blue-500',
      'text': 'bg-blue-700',
      'formatted_text': 'bg-blue-900',
      'check_box': 'bg-yellow-500',
      'checkbox': 'bg-yellow-700',
      'radio_buttons': 'bg-yellow-700',
      'drop_down_list': 'bg-orange-500',
      'matrix': 'bg-red-500',
      'points_item': 'bg-pink-500',
      'points_total': 'bg-pink-700',
      'patient_drug_of_choice': 'bg-indigo-500',
      'patient_diagnosis_code': 'bg-indigo-700',
      'problem_list': 'bg-teal-500',
      'title': 'bg-gray-500',
      'evaluation_date': 'bg-purple-500',
      'evaluation_datetime': 'bg-purple-700',
      'datestamp': 'bg-purple-900',
    };
    
    return typeMap[fieldType as string] || 'bg-gray-700';
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-xl font-bold mb-6">Patient Evaluation Parser Testing</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
            <CardDescription>Choose a patient to view their evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {patients.length === 0 ? (
                <p className="text-gray-500">No patients available</p>
              ) : (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <Button
                      key={patient.patientId}
                      variant={selectedPatient === patient.patientId ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        resetState();
                        setSelectedPatient(patient.patientId);
                      }}
                    >
                      {patient.firstName} {patient.lastName}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Evaluations List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Evaluations</CardTitle>
              <CardDescription>
                {selectedPatient 
                  ? `Select an evaluation to parse` 
                  : `Select a patient first`}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetState}
              title="Reset"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loading ? (
                <p className="text-gray-500">Loading evaluations...</p>
              ) : patientEvaluations.length === 0 ? (
                <p className="text-gray-500">No evaluations available</p>
              ) : (
                <div className="space-y-2">
                  {patientEvaluations.map((evaluation: KipuPatientEvaluationEnhanced) => (
                    <Button
                      key={evaluation.id}
                      variant={selectedEvaluation?.id === evaluation.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => handleEvaluationSelect(evaluation)}
                    >
                      <div className="truncate">{evaluation.name}</div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Evaluation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Details</CardTitle>
            <CardDescription>
              {selectedEvaluation 
                ? `${selectedEvaluation.name}` 
                : `Select an evaluation to view details`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loading ? (
                <p className="text-gray-500">Loading evaluation details...</p>
              ) : !selectedEvaluation ? (
                <p className="text-gray-500">No evaluation selected</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Evaluation Type</h3>
                    <p>{selectedEvaluation.evaluationType || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-1">Items</h3>
                    <p className="text-sm">{selectedEvaluation.patientEvaluationItems?.length || 0} items available</p>
                    
                    <Button 
                      onClick={parseFullEvaluation} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      Parse Full Evaluation
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Parsed Results */}
      {parsedResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Parsed Results</CardTitle>
            <CardDescription>
              {selectedItem 
                ? `Showing parsed result for: ${selectedItem.name || selectedItem.label || 'Unnamed Item'}` 
                : `Showing parsed result for full evaluation`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {parsedResult}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
