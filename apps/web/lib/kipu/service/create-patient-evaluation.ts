// Service for handling KIPU patient evaluations API integration
import { z } from 'zod';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';
import { generateSignature, buildCanonicalString } from '~/lib/kipu/auth/signature';

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
 * Handles creation of a patient evaluation in KIPU with file attachments.
 * @param input - Validated form fields (evaluationId, patientId, notes, items)
 * @param files - Map of files, key is the field name (e.g., items.0.value)
 * @returns Normalized patient evaluation or throws on error
 */
export async function createPatientEvaluationInKipu(input: CreatePatientEvaluationInput, files: Record<string, File | undefined>) {
  // Load KIPU credentials from Supabase (facility/user context)
  const credentials = await serverLoadKipuCredentialsFromSupabase();
  if (!credentials) throw new Error('No KIPU credentials found for user/facility');

  console.log('[KIPU Create] Starting patient evaluation creation:', {
    evaluationId: input.evaluationId,
    patientId: input.patientId,
    itemCount: input.items?.length || 0
  });

  // Parse patientId for chartId
  const { chartId, patientMasterId } = parsePatientId(input.patientId);

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
  
  const requestBody = {
    document: {
      recipient_id: credentials.appId,
      sending_app_name: 'ChartChek',
      data: {
        ext_username: credentials.accessId,
        patient_master_id: patientMasterId,
        evaluation_id: isValidEvaluationId ? evaluationIdValue : String(input.evaluationId),
        evaluationId: input.evaluationId,
        evaluation_template_id: isValidEvaluationId ? evaluationIdValue : String(input.evaluationId),
        notes: input.notes ? [{ note: input.notes, evaluation_item_id: null }] : [],
        ...fieldCategories
      }
    }
  };

  // Log the complete request body for debugging
  console.log('[KIPU Create] Complete request body:', JSON.stringify(requestBody, null, 2));

  // Generate authentication headers
  const date = new Date().toUTCString();
  const queryParams = new URLSearchParams({
    app_id: credentials.appId,
    patient_master_id: patientMasterId
  });

  const endpoint = `/api/patients/${chartId}/patient_evaluations`;
  const contentType = 'application/json';

  const headers = {
    'Accept': 'application/vnd.kipusystems+json; version=3',
    'Date': date,
    'Content-Type': contentType,
    'Authorization': `APIAuth ${credentials.accessId}:${generateSignature(
      buildCanonicalString(
        'POST',
        contentType,
        '', // No Content-MD5 for JSON
        `${endpoint}?${queryParams.toString()}`,
        date
      ),
      credentials.secretKey
    )}`
  };

  // Log the final request details
  console.log('[KIPU Service] Making request to KIPU:', {
    url: `${credentials.baseUrl}${endpoint}?${queryParams.toString()}`,
    method: 'POST',
    headers: {
      ...headers,
      Authorization: 'APIAuth [REDACTED]'
    }
  });

  const response = await fetch(`${credentials.baseUrl}${endpoint}?${queryParams.toString()}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[KIPU Service] Error response from KIPU:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(errorText || 'Failed to create patient evaluation in KIPU API');
  }

  const data = await response.json();
  return {
    id: data.patient_evaluation?.id?.toString(),
    name: data.patient_evaluation?.name,
    status: data.patient_evaluation?.status,
    patientId: data.patient_evaluation?.patient_id,
    evaluationId: data.patient_evaluation?.evaluation_id,
    createdAt: data.patient_evaluation?.created_at,
    createdBy: data.patient_evaluation?.created_by,
    attachments: data.patient_evaluation?.attachments || [],
  };
}
