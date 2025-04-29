// Service for handling KIPU patient evaluations API integration
import { z } from 'zod';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';

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
 * Handles creation of a patient evaluation in KIPU with file attachments.
 * @param input - Validated form fields (evaluationId, patientId, notes, items)
 * @param files - Map of files, key is the field name (e.g., items.0.value)
 * @returns Normalized patient evaluation or throws on error
 */
export async function createPatientEvaluationInKipu(input: CreatePatientEvaluationInput, files: Record<string, File | undefined>) {
  // Load KIPU credentials from Supabase (facility/user context)
 
  const credentials = await serverLoadKipuCredentialsFromSupabase();
  if (!credentials) throw new Error('No KIPU credentials found for user/facility');

  // Parse patientId for chartId
  const { chartId } = parsePatientId(input.patientId);

  // Build FormData for KIPU API
  const kipuFormData = new FormData();
  kipuFormData.append('document[data][evaluation_id]', input.evaluationId);
  kipuFormData.append('document[data][patient_id]', chartId);
  kipuFormData.append('document[data][notes]', input.notes || '');

  let attachmentIndex = 0;
  if (input.items) {
    input.items.forEach((item, index) => {
      kipuFormData.append(`document[data][patient_evaluation_items_attributes][${index}][evaluation_item_id]`, item.id);
      if ((item.fieldType === 'file' || item.fieldType === 'attachment') && files[`items.${index}.value`] instanceof File) {
        const file = files[`items.${index}.value`] as File;
        kipuFormData.append(`document[attachments_attributes][${attachmentIndex}][attachment_name]`, 'patient_evaluation_item');
        kipuFormData.append(`document[attachments_attributes][${attachmentIndex}][attachment_evaluation_item_id]`, item.id);
        kipuFormData.append(`document[attachments_attributes][${attachmentIndex}][attachment]`, file);
        attachmentIndex++;
      } else {
        kipuFormData.append(`document[data][patient_evaluation_items_attributes][${index}][value]`, item.value !== undefined ? String(item.value) : '');
      }
    });
  }

  // Generate boundary for multipart
  const boundary = `MultipartBoundary${Math.random().toString(36).substring(2)}`;
  async function formDataToString(formData: FormData, boundary: string): Promise<string> {
    let result = '';
    for (const [key, value] of formData.entries()) {
      result += `--${boundary}\r\n`;
      if (value instanceof File) {
        result += `Content-Disposition: form-data; name=\"${key}\"; filename=\"${value.name}\"\r\n`;
        result += `Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`;
        result += '[FILE BINARY DATA PLACEHOLDER]';
      } else {
        result += `Content-Disposition: form-data; name=\"${key}\"\r\n\r\n`;
        result += value;
      }
      result += '\r\n';
    }
    result += `--${boundary}--\r\n`;
    return result;
  }
  const formDataString = await formDataToString(kipuFormData, boundary);

  // Use kipuServerPost for the API call
  const endpoint = '/api/patient_evaluations';
  // NOTE: kipuServerPost expects JSON, but KIPU API requires multipart. If kipuServerPost supports FormData, use it; otherwise, fallback to fetch.
  // For now, replicate the fetch logic but use credentials from Supabase.
  const response = await fetch(`${credentials.baseUrl}${endpoint}?app_id=${credentials.appId}`, {
    method: 'POST',
    headers: {
      // Use the same auth header logic as before
      // If kipuServerPost has a way to generate headers for multipart, use that
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: kipuFormData,
  });

  if (!response.ok) {
    const errorText = await response.text();
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
