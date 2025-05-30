import { tool as createTool } from 'ai';
import { z } from 'zod';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { createServer } from '~/utils/supabase/server';

// --- KIPU: Fetch Evaluation Templates ---
export const fetchEvaluationTemplatesTool = createTool({
  description: 'Fetch all available evaluation templates from KIPU.',
  parameters: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    per: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ page, per }) {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (per) params.append('limit', String(per));
    const res = await fetch(`/api/kipu/evaluations?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch evaluation templates: ${res.statusText}`);
    return await res.json();
  },
});

// --- KIPU: Fetch Patient Evaluations (instances) ---
export const fetchPatientEvaluationsTool = createTool({
  description: 'Fetch a list of patient evaluations from KIPU for a given patient ID. Optionally filter by date range or completion status.',
  parameters: z.object({
    patientId: z.string().describe('The KIPU patient ID to fetch evaluations for'),
    completedOnly: z.boolean().optional().describe('Whether to fetch only completed evaluations'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD) for filtering evaluations'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD) for filtering evaluations'),
    page: z.number().optional().describe('Page number for pagination'),
    per: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, completedOnly, startDate, endDate, page, per }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuGetPatientEvaluations } = await import('~/lib/kipu/service/patient-evaluation-service');
    return await kipuGetPatientEvaluations(
      patientId,
      credentials,
      { completedOnly, startDate, endDate, page, per }
    );
  },
});

// --- KIPU: Create Patient Evaluation ---
export const createPatientEvaluationTool = createTool({
  description: 'Create a new patient evaluation in KIPU.',
  parameters: z.object({
    evaluationId: z.string().min(1),
    patientId: z.string().min(1),
    notes: z.string().optional(),
    items: z.array(z.object({
      id: z.string(),
      fieldType: z.string(),
      value: z.any(),
    })).optional(),
  }),
  async execute({ evaluationId, patientId, notes, items }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { createPatientEvaluationInKipu } = await import('~/lib/kipu/service/create-patient-evaluation');
    // File handling not supported in tool calls (for now)
    return await createPatientEvaluationInKipu({ evaluationId, patientId, notes, items }, {});
  },
});

// --- KIPU: Fetch Patient Admissions ---
export const fetchPatientAdmissionsTool = createTool({
  description: 'Fetch a list of patient admissions from KIPU. Optionally filter by date range.',
  parameters: z.object({
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD) for filtering admissions'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD) for filtering admissions'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
    facilityId: z.number().optional().describe('Optional facility ID to filter admissions'),
  }),
  async execute(params) {
    console.log('🔧 [Tool] Starting patient admissions tool execution');
    console.log('📅 [Tool] Date range:', { startDate: params.startDate || '1990-01-01', endDate: params.endDate || '2030-12-31' });
    console.log('📊 [Tool] Pagination:', { page: params.page || 1, limit: params.limit || 20 });

    const startDate = params.startDate || '1990-01-01';
    const endDate = params.endDate || '2030-12-31';
    const page = params.page || 1;
    const limit = params.limit || 20;
    
    console.log('🔐 [Tool] Initializing Supabase connection');
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 [Tool] User authenticated:', user?.id ? 'Yes' : 'No');

    const ownerId = user?.id;
    console.log('🔑 [Tool] Loading KIPU credentials for owner:', ownerId);
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    
    if (!credentials) {
      console.error('❌ [Tool] No KIPU credentials found for user:', ownerId);
      throw new Error('No KIPU credentials found for this user/facility.');
    }
    
    console.log('📡 [Tool] Fetching patient admissions from KIPU');
    const { kipuGetPatientsAdmissions } = await import('~/lib/kipu/service/patient-service');
    const result = await kipuGetPatientsAdmissions(credentials, page, limit, startDate, endDate);
    console.log(`✅ [Tool] Successfully retrieved ${Array.isArray(result) ? result.length : 'unknown number of'} patient admissions`);
    return result;
  },
});

// --- KIPU: Fetch Patient Census ---
export const fetchPatientCensusTool = createTool({
  description: 'Fetch the current patient census from KIPU.',
  parameters: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ page = 1, limit = 20 }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuGetPatientsCensus } = await import('~/lib/kipu/service/patient-service');
    return await kipuGetPatientsCensus(credentials, page, limit);
  },
});

// --- KIPU: Fetch Patient Details ---
export const fetchPatientDetailsTool = createTool({
  description: 'Fetch detailed information for a specific patient from KIPU.',
  parameters: z.object({
    patientId: z.string().describe('The KIPU patient ID to fetch details for'),
    phiLevel: z.enum(['high', 'medium', 'low']).optional().describe('PHI level of detail to return'),
    insuranceDetail: z.literal('v121').optional().describe('Version of insurance details to include'),
    demographicsDetail: z.literal('v121').optional().describe('Version of demographics details to include'),
    patientStatusDetail: z.literal('v121').optional().describe('Version of patient status details to include'),
    patientContactsDetail: z.boolean().optional().describe('Whether to include patient contacts'),
  }),
  async execute({ patientId, phiLevel = 'high', ...options }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuGetPatient } = await import('~/lib/kipu/service/patient-service');
    return await kipuGetPatient(patientId, credentials, { phiLevel, ...options });
  },
});

// --- KIPU: Appointments ---
export const fetchAppointmentsTool = createTool({
  description: 'Fetch appointments from KIPU. Can filter by patient, provider, or user.',
  parameters: z.object({
    patientId: z.string().optional().describe('Filter appointments by patient ID'),
    providerId: z.string().optional().describe('Filter appointments by provider ID'),
    userId: z.string().optional().describe('Filter appointments by user ID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD) for filtering appointments'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD) for filtering appointments'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, providerId, userId, startDate, endDate, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListAppointments } = await import('~/lib/kipu/service/appointment-service');
    return await kipuListAppointments(credentials, { patientId, providerId, userId, startDate, endDate, page, limit });
  },
});

export const fetchAppointmentTypesTool = createTool({
  description: 'Fetch available appointment types from KIPU.',
  parameters: z.object({}),
  async execute() {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListAppointmentTypes } = await import('~/lib/kipu/service/appointment-service');
    return await kipuListAppointmentTypes(credentials);
  },
});

// --- KIPU: Clinical Assessments ---
export const fetchCiwaArsTool = createTool({
  description: 'Fetch CIWA-Ar assessments from KIPU.',
  parameters: z.object({
    patientId: z.string().optional().describe('Filter assessments by patient ID'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListCiwaArs } = await import('~/lib/kipu/service/clinical-assessment-service');
    return await kipuListCiwaArs(credentials, patientId, { page, limit });
  },
});

export const fetchCiwaBsTool = createTool({
  description: 'Fetch CIWA-B assessments from KIPU.',
  parameters: z.object({
    patientId: z.string().optional().describe('Filter assessments by patient ID'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListCiwaBs } = await import('~/lib/kipu/service/clinical-assessment-service');
    return await kipuListCiwaBs(credentials, patientId, { page, limit });
  },
});

export const fetchCowsTool = createTool({
  description: 'Fetch COWS assessments from KIPU.',
  parameters: z.object({
    patientId: z.string().optional().describe('Filter assessments by patient ID'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListCows } = await import('~/lib/kipu/service/clinical-assessment-service');
    return await kipuListCows(credentials, patientId, { page, limit });
  },
});

export const fetchVitalSignsTool = createTool({
  description: 'Fetch vital signs from KIPU.',
  parameters: z.object({
    patientId: z.string().optional().describe('Filter vital signs by patient ID'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ patientId, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListVitalSigns } = await import('~/lib/kipu/service/clinical-assessment-service');
    return await kipuListVitalSigns(credentials, patientId, { page, limit });
  },
});

// --- KIPU: Contacts ---
export const fetchContactsTool = createTool({
  description: 'Fetch contacts from KIPU.',
  parameters: z.object({
    referrersOnly: z.boolean().optional().describe('Filter to show only referrers'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ referrersOnly, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListContacts } = await import('~/lib/kipu/service/contact-service');
    return await kipuListContacts(credentials, { referrersOnly, page, limit });
  },
});

// --- KIPU: Medical Records ---
export const fetchConsentFormsTool = createTool({
  description: 'Fetch consent forms from KIPU.',
  parameters: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuFetchConsentForms } = await import('~/lib/kipu/service/medical-records-service');
    return await kipuFetchConsentForms(credentials, { page, limit });
  },
});

export const fetchPatientDiagnosisHistoryTool = createTool({
  description: 'Fetch diagnosis history for a patient from KIPU.',
  parameters: z.object({
    patientId: z.string().describe('The patient ID to fetch diagnosis history for'),
  }),
  async execute({ patientId }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuFetchDiagnosisHistory } = await import('~/lib/kipu/service/medical-records-service');
    return await kipuFetchDiagnosisHistory(credentials, patientId);
  },
});

// --- KIPU: Providers ---
export const fetchProvidersTool = createTool({
  description: 'Fetch providers from KIPU.',
  parameters: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListProviders } = await import('~/lib/kipu/service/provider-service');
    return await kipuListProviders(credentials, { page, limit });
  },
});

export const fetchUsersTool = createTool({
  description: 'Fetch users from KIPU.',
  parameters: z.object({
    roleId: z.string().optional().describe('Filter users by role ID'),
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of records per page'),
  }),
  async execute({ roleId, page, limit }) {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) throw new Error('No KIPU credentials found for this user/facility.');
    const { kipuListUsers } = await import('~/lib/kipu/service/provider-service');
    return await kipuListUsers(credentials, { roleId, page, limit });
  },
});

export const generatePDFTool = createTool({
  description: 'Generate a PDF for a patient. If a templateId is provided, use the structured evaluation template. Otherwise, generate a summary or narrative PDF.',
  parameters: z.object({
    patientId: z.string(),
    requestText: z.string(),
    templateId: z.string().optional(),
  }),
  async execute({ patientId, requestText, templateId }) {
    // --- FORK LOGIC ---
    if (templateId) {
      // Structured path: fetch evaluation, render template as markdown
      // TODO: Implement real evaluation fetching and markdown rendering
      return {
        previewMarkdown: `# Structured PDF Preview\n\nTemplate: ${templateId}\nPatient: ${patientId}\n\n`,
        type: 'structured',
        templateId,
        patientId,
      };
    } else {
      // Unstructured path: generate summary markdown
      // TODO: Implement real summary generation from patient chart/context
      return {
        previewMarkdown: `Patient: ${patientId}\n\nSummary of request: ${requestText}\n\n`,
        type: 'unstructured',
        patientId,
        requestText,
      };
    }
  }
});

// Central registry for all chat tools
export const toolRegistry = {
  fetchEvaluationTemplates: fetchEvaluationTemplatesTool,
  fetchPatientEvaluations: fetchPatientEvaluationsTool,
  createPatientEvaluation: createPatientEvaluationTool,
  fetchPatientAdmissions: fetchPatientAdmissionsTool,
  fetchPatientCensus: fetchPatientCensusTool,
  fetchPatientDetails: fetchPatientDetailsTool,
  fetchAppointments: fetchAppointmentsTool,
  fetchAppointmentTypes: fetchAppointmentTypesTool,
  fetchCiwaArs: fetchCiwaArsTool,
  fetchCiwaBs: fetchCiwaBsTool,
  fetchCows: fetchCowsTool,
  fetchVitalSigns: fetchVitalSignsTool,
  fetchContacts: fetchContactsTool,
  fetchConsentForms: fetchConsentFormsTool,
  fetchPatientDiagnosisHistory: fetchPatientDiagnosisHistoryTool,
  fetchProviders: fetchProvidersTool,
  fetchUsers: fetchUsersTool,
  generatePDF: generatePDFTool,
};
