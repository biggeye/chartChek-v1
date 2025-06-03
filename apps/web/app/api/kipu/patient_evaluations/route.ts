export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { kipuServerGet, serverLoadKipuCredentialsFromSupabase, kipuServerPost } from '~/lib/kipu/auth/server';
import { KipuEvaluationResponse } from '~/types/kipu/kipuAdapter';
import { snakeToCamel } from '~/utils/case-converters';
import { kipuListPatientEvaluations } from '~/lib/kipu/service/patient-evaluation-service';
/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;

    // Optional query parameters
    const evaluationId = searchParams.get('evaluationId');
    const completedOnly = searchParams.get('completedOnly') === 'true';
    const currentCensusOnly = searchParams.get('currentCensusOnly') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeStranded = searchParams.get('includeStranded') === 'true';
    const page = searchParams.get('page') || '1';
    const per = searchParams.get('per') || '20';
    const patientProcessId = searchParams.get('patientProcessId');
    const evaluationContent = searchParams.get('evaluationContent');

    const supabase = await createServer();

    // Get the user session to ensure they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID for cache key
    const userId = user.id;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (evaluationId) queryParams.append('evaluation_id', evaluationId);
    if (completedOnly) queryParams.append('completed_only', 'true');
    if (currentCensusOnly) queryParams.append('current_census_only', 'true');
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (includeStranded) queryParams.append('include_stranded', 'true');
    queryParams.append('page', page);
    queryParams.append('per', per);
    if (patientProcessId) queryParams.append('patient_process_id', patientProcessId);
    if (evaluationContent) queryParams.append('evaluation_content', evaluationContent);
    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
    if (!kipuCredentials) {
      throw new Error('KIPU API credentials not found');
    }
    // Call KIPU API using the standard utility
    const endpoint = `/api/patient_evaluations?${queryParams.toString()}`;
    const response = await kipuListPatientEvaluations<any>(kipuCredentials, {
      evaluationId: Number(evaluationId),
      page: Number(page),
      per: Number(per),
      patientProcessId: Number(patientProcessId),
    });

    if (!response.success || !response.data) {
      console.error('Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU evaluations to our format if needed
    const evaluations = response.data.patient_evaluations || [];
    const camelCaseEvaluationsData = snakeToCamel(evaluations);

    const pagination = response.data.pagination || {
      current_page: '1',
      total_pages: '1',
      records_per_page: '20',
      total_records: '0'
    };

    // Return the evaluations and pagination info
    return NextResponse.json({
      evaluations: camelCaseEvaluationsData,
      pagination: {
        page: parseInt(pagination.current_page),
        pages: parseInt(pagination.total_pages),
        limit: parseInt(pagination.records_per_page),
        total: parseInt(pagination.total_records)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/patient_evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}



/**
 * POST /api/patient-evaluations
 *
 * Creates a new patient evaluation in the KIPU API with file attachments if provided
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] POST /api/kipu/patient_evaluations - Starting');
    
    // For multipart form data, we need to parse it differently
    const formData = await request.formData()

    // Extract the basic evaluation data
    const evaluationId = formData.get("evaluationId") as string
    const patientId = formData.get("patientId") as string
    const notes = formData.get("notes") as string

    console.log('[API Route] Extracted form data:', { evaluationId, patientId, notes: notes?.length || 0 });

    // Validate required fields
    if (!evaluationId) {
      console.log('[API Route] Missing evaluationId');
      return NextResponse.json({ error: "Evaluation ID is required" }, { status: 400 })
    }

    if (!patientId) {
      console.log('[API Route] Missing patientId');
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    // Get credentials
    console.log('[API Route] Loading KIPU credentials...');
    const credentials = await serverLoadKipuCredentialsFromSupabase();
    if (!credentials) {
      console.log('[API Route] No KIPU credentials found');
      return NextResponse.json({ error: 'No KIPU credentials found for user/facility' }, { status: 500 });
    }

    // Parse items from formData if present
    let items: any[] = [];
    const itemsJson = formData.get('items');
    if (typeof itemsJson === 'string') {
      try {
        items = JSON.parse(itemsJson);
        console.log('[API Route] Parsed items:', { count: items.length, sample: items.slice(0, 2) });
      } catch (error) {
        console.warn('[API Route] Failed to parse items JSON:', error);
        items = [];
      }
    }

    // Extract files from formData (if any)
    const files: Record<string, File> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith('items.')) {
        files[key] = value;
      }
    }
    
    console.log('[API Route] Files extracted:', Object.keys(files));

    // Use the proper KIPU service function that has correct endpoint + document structure
    console.log('[API Route] Calling createPatientEvaluationInKipu service...');
    const { createPatientEvaluationInKipu } = await import('~/lib/kipu/service/create-patient-evaluation');
    
    const result = await createPatientEvaluationInKipu({
      evaluationId,
      patientId,
      notes,
      items,
    }, files, credentials);

    console.log('[API Route] Service call successful:', { 
      id: result.id, 
      name: result.name, 
      status: result.status 
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Route] Error creating patient evaluation:", error)
    return NextResponse.json({ 
      error: "Failed to create patient evaluation",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to convert FormData to string with proper boundary format
async function formDataToString(formData: FormData, boundary: string): Promise<string> {
  let result = ""

  // Iterate through all entries in the FormData
  for (const [key, value] of formData.entries()) {
    result += `--${boundary}\r\n`

    if (value instanceof File) {
      result += `Content-Disposition: form-data; name="${key}"; filename="${value.name}"\r\n`
      result += `Content-Type: ${value.type || "application/octet-stream"}\r\n\r\n`

      // For files, we'd need to read the binary data
      // This is a simplified version - in a real implementation, you'd need to handle binary data properly
      result += "[FILE BINARY DATA PLACEHOLDER]"
    } else {
      result += `Content-Disposition: form-data; name="${key}"\r\n\r\n`
      result += value
    }

    result += "\r\n"
  }

  // Add the final boundary
  result += `--${boundary}--\r\n`

  return result
}
