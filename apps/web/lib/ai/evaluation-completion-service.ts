// AI-powered evaluation completion service
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { logger } from '~/lib/logger';
import type { KipuCredentials } from '~/types/kipu/kipuAdapter';

interface EvaluationCompletionParams {
  evaluationId: string;
  patientId: string;
  contextSummary?: string;
  reviewMode: boolean;
  credentials: KipuCredentials;
  ownerId: string;
}

interface EvaluationCompletionResult {
  success: boolean;
  evaluationData?: any;
  draftResponse?: string;
  fieldCompletions?: Record<string, any>;
  errors?: string[];
  reviewNotes?: string;
}

export async function completeEvaluationWithAI(params: EvaluationCompletionParams): Promise<EvaluationCompletionResult> {
  const { evaluationId, patientId, contextSummary, reviewMode, credentials, ownerId } = params;
  
  try {
    logger.info('[AI Evaluation] Starting AI evaluation completion', { 
      evaluationId, 
      patientId, 
      reviewMode 
    });

    // 1. Fetch evaluation template
    const { kipuGetEvaluationTemplate } = await import('~/lib/kipu/service/evaluation-template-service');
    const evaluationResponse = await kipuGetEvaluationTemplate(Number(evaluationId), credentials);
    
    if (!evaluationResponse.success || !evaluationResponse.data) {
      throw new Error(`Evaluation template ${evaluationId} not found`);
    }

    const evaluationTemplate = evaluationResponse.data;

    // 2. Gather comprehensive patient context
    const patientContext = await gatherPatientContext(patientId, credentials);
    
    // 3. Generate field completions using AI
    const fieldCompletions = await generateFieldCompletions({
      evaluationTemplate,
      patientContext,
      contextSummary
    });

    if (reviewMode) {
      // Return draft for review
      return {
        success: true,
        draftResponse: `Generated draft completion for evaluation "${evaluationTemplate.evaluation?.name || 'Unknown'}" with ${Object.keys(fieldCompletions).length} fields completed.`,
        fieldCompletions,
        reviewNotes: 'Please review the AI-generated responses before submitting. Verify accuracy and completeness.'
      };
    } else {
      // Actually create the evaluation
      const { createPatientEvaluationInKipu } = await import('~/lib/kipu/service/create-patient-evaluation');
      
      // Transform field completions to the format expected by createPatientEvaluationInKipu
      const items = Object.entries(fieldCompletions).map(([fieldId, value]) => ({
        id: fieldId,
        fieldType: getFieldTypeForId(evaluationTemplate, fieldId),
        value
      }));

      const evaluationData = await createPatientEvaluationInKipu({
        evaluationId,
        patientId,
        notes: `AI-completed evaluation${contextSummary ? ` with context: ${contextSummary}` : ''}`,
        items
      }, {}, credentials);

      return {
        success: true,
        evaluationData,
        fieldCompletions
      };
    }

  } catch (error) {
    logger.error('[AI Evaluation] Error completing evaluation', { error, evaluationId, patientId });
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

// Gather comprehensive patient context from multiple sources
async function gatherPatientContext(patientId: string, credentials: KipuCredentials): Promise<string> {
  const contextSections: string[] = [];

  try {
    // Fetch patient details
    const { kipuGetPatient } = await import('~/lib/kipu/service/patient-service');
    const patientResponse = await kipuGetPatient(patientId, credentials, { phiLevel: 'high' });
    
    if (patientResponse.success && patientResponse.data) {
      const patientData = (patientResponse.data as any).patient || patientResponse.data;
      
      contextSections.push(`
## Patient Information
- ID: ${patientData.casefile_id || patientData.patient_id || patientId}
- Name: ${patientData.first_name || ''} ${patientData.last_name || ''}
- DOB: ${patientData.dob || patientData.date_of_birth || ''}
- Gender: ${patientData.gender || patientData.sex || ''}
- MRN: ${patientData.mr_number || patientData.medical_record_number || ''}
- Admission Date: ${patientData.admission_date || ''}
- Level of Care: ${patientData.level_of_care || ''}
- Program: ${patientData.program || ''}
      `.trim());
    } else {
      logger.warn('[AI Evaluation] Failed to fetch patient details', { patientId, error: patientResponse.error });
      // Add basic context with patient ID
      contextSections.push(`
## Patient Information
- ID: ${patientId}
- Note: Full patient details not available
      `.trim());
    }

    // Fetch recent patient evaluations for context
    const { kipuGetPatientEvaluations } = await import('~/lib/kipu/service/patient-evaluation-service');
    const evaluationsResponse = await kipuGetPatientEvaluations(patientId, credentials, { 
      completedOnly: true, 
      per: 5 
    });
    
    if (evaluationsResponse.success && evaluationsResponse.data) {
      const evaluationsData = (evaluationsResponse.data as any).patient_evaluations || (evaluationsResponse.data as any).data || [];
      
      if (evaluationsData.length > 0) {
        const evaluationSummary = evaluationsData
          .slice(0, 5) // Latest 5 evaluations
          .map((evaluation: any) => `- ${evaluation.evaluation_name || evaluation.name} (${evaluation.completion_date || evaluation.date})`)
          .join('\n');
        
        contextSections.push(`
## Recent Evaluations
${evaluationSummary}
        `.trim());
      }
    } else {
      logger.warn('[AI Evaluation] Failed to fetch patient evaluations', { patientId });
    }

    // Fetch diagnosis history
    const { kipuFetchDiagnosisHistory } = await import('~/lib/kipu/service/medical-records-service');
    const diagnosisResponse = await kipuFetchDiagnosisHistory(credentials, patientId);
    
    if (diagnosisResponse.success && diagnosisResponse.data) {
      const diagnosisData = (diagnosisResponse.data as any).diagnoses || (diagnosisResponse.data as any).data || [];
      
      if (diagnosisData.length > 0) {
        const diagnosisSummary = diagnosisData
          .slice(0, 3) // Latest 3 diagnoses
          .map((diag: any) => `- ${diag.code}: ${diag.description || diag.name}`)
          .join('\n');
        
        contextSections.push(`
## Diagnosis History
${diagnosisSummary}
        `.trim());
      }
    } else {
      logger.warn('[AI Evaluation] Failed to fetch diagnosis history', { patientId });
    }

  } catch (error) {
    logger.warn('[AI Evaluation] Error gathering some patient context', { error, patientId });
  }

  const context = contextSections.join('\n\n');
  
  // If no context was gathered, provide a minimal fallback
  if (context.trim().length === 0) {
    logger.warn('[AI Evaluation] No patient context available, using minimal fallback');
    return `
## Patient Information
- ID: ${patientId}
- Note: Limited patient information available
- Status: Requires clinical assessment
    `.trim();
  }

  return context;
}

// Generate field completions using AI
async function generateFieldCompletions(params: {
  evaluationTemplate: any;
  patientContext: string;
  contextSummary?: string;
}): Promise<Record<string, any>> {
  const { evaluationTemplate, patientContext, contextSummary } = params;
  
  // Add comprehensive debugging
  console.log('[AI Service] generateFieldCompletions called');
  console.log('[AI Service] evaluationTemplate keys:', Object.keys(evaluationTemplate));
  console.log('[AI Service] evaluationTemplate.evaluation keys:', evaluationTemplate.evaluation ? Object.keys(evaluationTemplate.evaluation) : 'no evaluation object');
  console.log('[AI Service] Full template structure:', JSON.stringify(evaluationTemplate, null, 2));
  
  // Extract evaluation items (handle nested structure)
  const evaluationItems = evaluationTemplate.evaluation?.evaluationItems || 
                         evaluationTemplate.evaluationItems || 
                         [];

  console.log('[AI Service] Extracted evaluationItems:', {
    source: evaluationTemplate.evaluation?.evaluationItems ? 'evaluation.evaluationItems' : 
            evaluationTemplate.evaluationItems ? 'evaluationItems' : 'none',
    count: evaluationItems.length,
    firstItemSample: evaluationItems[0] ? {
      id: evaluationItems[0].id,
      label: evaluationItems[0].label,
      fieldType: evaluationItems[0].fieldType
    } : null
  });

  if (evaluationItems.length === 0) {
    // Try alternative property names
    const alternativeItems = evaluationTemplate.evaluation?.items || 
                           evaluationTemplate.evaluation?.fields || 
                           evaluationTemplate.evaluation?.questions || 
                           evaluationTemplate.items || 
                           evaluationTemplate.fields || 
                           evaluationTemplate.questions || 
                           [];
                           
    console.log('[AI Service] Trying alternative item properties:', {
      'evaluation.items': evaluationTemplate.evaluation?.items?.length || 0,
      'evaluation.fields': evaluationTemplate.evaluation?.fields?.length || 0,
      'evaluation.questions': evaluationTemplate.evaluation?.questions?.length || 0,
      'items': evaluationTemplate.items?.length || 0,
      'fields': evaluationTemplate.fields?.length || 0,
      'questions': evaluationTemplate.questions?.length || 0,
      alternativeCount: alternativeItems.length
    });
    
    if (alternativeItems.length > 0) {
      console.log('[AI Service] Found items in alternative property, using those');
      // Replace evaluationItems with the found alternative
      return generateFieldCompletions({
        evaluationTemplate: {
          ...evaluationTemplate,
          evaluation: {
            ...evaluationTemplate.evaluation,
            evaluationItems: alternativeItems
          }
        },
        patientContext,
        contextSummary
      });
    }
    
    logger.warn('[AI Evaluation] No evaluation items found in template');
    console.error('[AI Service] No evaluation items found! Template structure:', {
      hasEvaluation: !!evaluationTemplate.evaluation,
      evaluationKeys: evaluationTemplate.evaluation ? Object.keys(evaluationTemplate.evaluation) : [],
      rootKeys: Object.keys(evaluationTemplate),
      templateSample: JSON.stringify(evaluationTemplate, null, 2).substring(0, 1000) + '...'
    });
    return {};
  }

  // Build comprehensive prompt
  const systemPrompt = `
You are a clinical documentation specialist helping to complete a patient evaluation. Your task is to analyze the patient context and provide appropriate responses for evaluation fields.

Guidelines:
- Base responses on the provided patient context
- Use clinical terminology appropriately  
- For yes/no questions, provide clear boolean responses
- For text fields, provide concise, professional clinical language
- For checkbox/radio fields, select the most appropriate option(s)
- If information is not available, respond with "Information not available" or "Not assessed"
- Ensure responses are consistent with standard clinical practice

Patient Context:
${patientContext}

${contextSummary ? `Additional Context: ${contextSummary}` : ''}
`;

  const userPrompt = `
Please complete the following evaluation: "${evaluationTemplate.evaluation?.name || evaluationTemplate.name || 'Unknown Evaluation'}"

For each field, provide an appropriate response based on the patient context. Return your response as a JSON object where keys are field IDs and values are the completed responses.

Evaluation Fields:
${evaluationItems.map((item: any) => `
Field ID: ${item.id}
Label: ${item.label}
Type: ${item.fieldType}
${item.recordNames ? `Options: ${item.recordNames}` : ''}
${item.placeholder ? `Placeholder: ${item.placeholder}` : ''}
`).join('\n')}

Return only the JSON object with field completions.
`;

  console.log('[AI Service] Generated prompts:', {
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
    fieldsInPrompt: evaluationItems.length
  });

  try {
    const result = await generateText({
      model: google('gemini-2.5-pro-exp-03-25'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent clinical responses
      maxTokens: 8000,
    });

    console.log('[AI Service] LLM response received:', {
      responseLength: result.text.length,
      responseSample: result.text.substring(0, 200) + '...'
    });

    // Parse the JSON response
    const completions = JSON.parse(result.text);
    
    console.log('[AI Service] Parsed completions:', {
      completionKeys: Object.keys(completions),
      completionCount: Object.keys(completions).length,
      firstCompletion: Object.entries(completions)[0] || null
    });
    
    logger.info('[AI Evaluation] Generated field completions', { 
      templateName: evaluationTemplate.evaluation?.name || evaluationTemplate.name,
      fieldCount: Object.keys(completions).length 
    });

    return completions;

  } catch (error) {
    console.error('[AI Service] Error in generateFieldCompletions:', error);
    logger.error('[AI Evaluation] Error generating field completions', { error });
    throw new Error('Failed to generate AI completions for evaluation fields');
  }
}

// Helper to get field type for a given field ID
function getFieldTypeForId(evaluationTemplate: any, fieldId: string): string {
  const evaluationItems = evaluationTemplate.evaluation?.evaluationItems || 
                         evaluationTemplate.evaluationItems || 
                         [];
  
  const field = evaluationItems.find((item: any) => item.id === fieldId);
  return field?.fieldType || 'text';
} 