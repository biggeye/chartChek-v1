// Service for handling KIPU patient evaluations API integration
import { z } from 'zod';
import { kipuServerPost } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';
import type { KipuCredentials } from '~/types/kipu/kipuAdapter';

// Inline type for patient evaluation creation (migrate to /types as needed)
export const CreatePatientEvaluationSchema = z.object({
  evaluationId: z.string().min(1),
  patientId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    fieldType: z.string(),
    value: z.any(),
  })).optional(),
});

export type CreatePatientEvaluationInput = z.infer<typeof CreatePatientEvaluationSchema>;

/**
 * Maps field types to KIPU's expected field value arrays
 */
function categorizeFieldsByType(items: CreatePatientEvaluationInput['items'] = []) {
  const stringValues: Array<{ evaluation_item_id: string; value: string }> = [];
  const textValues: Array<{ evaluation_item_id: string; value: string; optional_checkbox?: boolean }> = [];
  const radioButtonValues: Array<{ evaluation_item_id: string; value: string }> = [];
  const checkBoxValues: Array<{ evaluation_item_id: string; values: Array<{ label: string; description?: string }> }> = [];
  const dropDownValues: Array<{ evaluation_item_id: string; value: string }> = [];
  const datestampValues: Array<{ evaluation_item_id: string; value: string }> = [];
  
  items.forEach(item => {
    const { id, fieldType, value } = item;
    
    if (value === undefined || value === null || value === '') {
      return; // Skip empty values
    }
    
    switch (fieldType) {
      case 'text':
      case 'textarea':
        textValues.push({
          evaluation_item_id: id,
          value: String(value),
          optional_checkbox: false
        });
        break;
        
      case 'string':
      case 'number':
        stringValues.push({
          evaluation_item_id: id,
          value: String(value)
        });
        break;
        
      case 'radio_buttons':
      case 'radio':
        radioButtonValues.push({
          evaluation_item_id: id,
          value: String(value)
        });
        break;
        
      case 'check_box':
      case 'check_box_first_value_none':
      case 'checkbox':
        // Handle checkbox values - could be array or single value
        const values = Array.isArray(value) ? value : [value];
        checkBoxValues.push({
          evaluation_item_id: id,
          values: values.map(v => ({
            label: String(v),
            description: ''
          }))
        });
        break;
        
      case 'select':
        dropDownValues.push({
          evaluation_item_id: id,
          value: String(value)
        });
        break;
        
      case 'date':
      case 'datetime':
      case 'evaluation_datetime':
        datestampValues.push({
          evaluation_item_id: id,
          value: String(value)
        });
        break;
        
      case 'file':
      case 'attachment':
        // Files are handled separately in item_attachment_attributes
        break;
        
      default:
        // Default to string value for unknown types
        stringValues.push({
          evaluation_item_id: id,
          value: String(value)
        });
        break;
    }
  });
  
  return {
    string_values: stringValues,
    text_values: textValues,
    radio_button_values: radioButtonValues,
    check_box_values: checkBoxValues,
    drop_down_values: dropDownValues,
    datestamp_values: datestampValues
  };
}

/**
 * Handles creation of a patient evaluation in KIPU with proper API structure.
 * @param input - Validated form fields (evaluationId, patientId, notes, items)
 * @param files - Map of files, key is the field name (e.g., items.0.value)
 * @param credentials - KIPU API credentials
 * @returns Normalized patient evaluation or throws on error
 */
export async function createPatientEvaluationInKipu(
  input: CreatePatientEvaluationInput, 
  files: Record<string, File | undefined>,
  credentials: KipuCredentials
) {
  console.log('[KIPU Create] Starting patient evaluation creation:', {
    evaluationId: input.evaluationId,
    patientId: input.patientId,
    itemCount: input.items?.length || 0
  });

  // Debug the evaluation ID specifically
  console.log('[KIPU Create] Evaluation ID debugging:', {
    rawEvaluationId: input.evaluationId,
    typeofEvaluationId: typeof input.evaluationId,
    parsedEvaluationId: parseInt(input.evaluationId),
    isNaN: isNaN(parseInt(input.evaluationId)),
    stringValue: String(input.evaluationId)
  });

  // Parse patientId for chartId and patientMasterId
  const { chartId, patientMasterId } = parsePatientId(input.patientId);
  
  console.log('[KIPU Create] Parsed patient IDs:', { chartId, patientMasterId });

  // Categorize fields by type according to KIPU API structure
  const fieldCategories = categorizeFieldsByType(input.items);
  
  console.log('[KIPU Create] Field categories:', {
    stringValues: fieldCategories.string_values.length,
    textValues: fieldCategories.text_values.length,
    radioButtonValues: fieldCategories.radio_button_values.length,
    checkBoxValues: fieldCategories.check_box_values.length,
    dropDownValues: fieldCategories.drop_down_values.length,
    datestampValues: fieldCategories.datestamp_values.length
  });

  // Build KIPU API request body according to their specification
  const evaluationIdValue = parseInt(input.evaluationId);
  const isValidEvaluationId = !isNaN(evaluationIdValue);
  
  console.log('[KIPU Create] Evaluation ID validation:', {
    originalValue: input.evaluationId,
    parsedValue: evaluationIdValue,
    isValid: isValidEvaluationId,
    willUseString: !isValidEvaluationId
  });
  
  const requestBody = {
    document: {
      recipient_id: credentials.appId, // Required by KIPU
      sending_app_name: 'ChartChek',
      data: {
        ext_username: 'chartchek_user', // Required
        patient_master_id: patientMasterId, // Required
        // Try both integer and string versions, and alternative field names
        evaluation_id: isValidEvaluationId ? evaluationIdValue : String(input.evaluationId),
        evaluationId: input.evaluationId, // Alternative field name
        evaluation_template_id: isValidEvaluationId ? evaluationIdValue : String(input.evaluationId), // Another alternative
        evaluation_name: '', // Optional
        notes: input.notes ? [{ note: input.notes, evaluation_item_id: null }] : [],
        ...fieldCategories
      }
    }
  } as any; // Use 'as any' to bypass strict typing for debugging

  // Debug the final request body focusing on evaluation_id
  console.log('[KIPU Create] Request body evaluation_id details:', {
    evaluation_id: requestBody.document.data.evaluation_id,
    typeofEvaluationId: typeof requestBody.document.data.evaluation_id,
    isNaN: isNaN(requestBody.document.data.evaluation_id),
    dataKeys: Object.keys(requestBody.document.data)
  });

  // Log the complete request body for debugging
  console.log('[KIPU Create] Complete request body:', JSON.stringify(requestBody, null, 2));

  // Use the correct KIPU endpoint: /api/patients/{patient_id}/patient_evaluations
  const endpoint = `/api/patients/${chartId}/patient_evaluations`;
  
  console.log('[KIPU Create] Making API request to:', endpoint);
  
  try {
    // Use kipuServerPost with proper authentication and MD5 hash
    const response = await kipuServerPost(endpoint, requestBody, credentials);

    console.log('[KIPU Create] API response:', {
      success: response.success,
      hasData: !!response.data,
      error: response.error
    });

    if (!response.success) {
      console.error('[KIPU Create] API error:', response.error);
      throw new Error(`KIPU API error: ${response.error?.message || 'Unknown error'}`);
    }

    const data = response.data as any;
    
    console.log('[KIPU Create] Success! Created evaluation:', {
      id: data?.patient_evaluation?.id,
      status: data?.status
    });

    // Return normalized response
    return {
      id: data?.patient_evaluation?.id?.toString() || data?.id?.toString(),
      name: data?.patient_evaluation?.name || 'Patient Evaluation',
      status: data?.status || data?.patient_evaluation?.status || 'created',
      patientId: chartId,
      evaluationId: input.evaluationId,
      createdAt: data?.patient_evaluation?.created_at || new Date().toISOString(),
      createdBy: data?.patient_evaluation?.created_by || 'ChartChek AI',
      attachments: data?.patient_evaluation?.attachments || [],
    };
  } catch (error) {
    console.error('[KIPU Create] Error creating patient evaluation:', error);
    throw new Error(`Failed to create patient evaluation in KIPU: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
