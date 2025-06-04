import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import {
  kipuGetPatientEvaluations,
} from '~/lib/kipu/service/patient-evaluation-service';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';
import { snakeToCamel } from '~/utils/case-converters';

// Define the expected structure from the Kipu service layer
interface KipuServiceResponseData {
  pagination?: {
    current_page?: string; // Kipu uses strings for these
    total_pages?: string;
    records_per_page?: string;
    total_records?: string;
  };
  patient_evaluations?: any[]; // Kipu evaluation objects in snake_case
}

// Define the target structure for the API response
interface TargetApiResponse {
  evaluations: any[]; // CamelCased evaluation objects
  pagination: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
}

/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId as a Promise
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {

  try {
    const resolvedParams = await params;
    const encodedPatientId = resolvedParams.patientId;

    // Decode and parse the patient ID to get chartId and patientMasterId components
    const decodedPatientId = decodeURIComponent(encodedPatientId);
   
    
    // Parse the patient ID to ensure it's in the correct format
    
      const { chartId, patientMasterId } = parsePatientId(decodedPatientId);
      
      if (!chartId || !patientMasterId) {
        return NextResponse.json(
          { error: 'Invalid patient ID format. Expected format: chartId:patientMasterId' },
          { status: 400 }
        );
      }
    
      const supabase = await createServer();
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id;
  
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
 
      const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
      if (!credentials) {
        return NextResponse.json(
          { error: 'No API credentials found for this user' },
          { status: 404 }
        );
      }

      const response = await kipuGetPatientEvaluations(decodedPatientId, credentials);
       
       if (!response.success || !response.data) {
        return NextResponse.json(
          { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
          { status: response.error?.code ? parseInt(response.error.code) : 500 }
        );
      }

 
      // Explicitly type the data from the service layer
      const responseData = response.data as KipuServiceResponseData;

      // Extract and default evaluations and pagination from Kipu response
      const rawEvaluations = responseData.patient_evaluations || [];
      const rawPagination = responseData.pagination || {}; // Default to empty object

      // Convert evaluations array to camelCase
      const camelCaseEvaluations = snakeToCamel(rawEvaluations);
      
      // Transform pagination to the target structure with numeric values
      const targetPagination = {
        page: parseInt(rawPagination.current_page || '1', 10), // Default to page 1
        pages: parseInt(rawPagination.total_pages || '1', 10),   // Default to 1 total page
        limit: parseInt(rawPagination.records_per_page || '0', 10), // Default limit if missing
        total: parseInt(rawPagination.total_records || '0', 10)   // Default total if missing
      };

      // Construct the final response object matching the old structure
      const finalResponse: TargetApiResponse = {
        evaluations: camelCaseEvaluations,
        pagination: targetPagination
      };
      
      return NextResponse.json(finalResponse);
      
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
/**
 * POST handler for creating a new patient evaluation
 * 
 * @param req - The incoming request with evaluation data
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the created evaluation or an error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    console.log('[API Route] POST /api/kipu/patients/[patientId]/evaluations - Starting');
    
    const patientId = params.patientId;
    const formData = await request.formData();

    // Extract the basic evaluation data
    const evaluationId = formData.get("evaluationId") as string;
    const notes = formData.get("notes") as string;

    console.log('[API Route] Extracted form data:', { evaluationId, patientId, notes: notes?.length || 0 });

    // Validate required fields
    if (!evaluationId) {
      console.log('[API Route] Missing evaluationId');
      return NextResponse.json({ error: "Evaluation ID is required" }, { status: 400 });
    }

    // Get credentials
    console.log('[API Route] Loading KIPU credentials...');
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[API Route] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const credentials = await serverLoadKipuCredentialsFromSupabase(user.id);
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
    }, files);

    console.log('[API Route] Service call successful:', { 
      id: result.id, 
      name: result.name, 
      status: result.status 
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Route] Error creating patient evaluation:", error);
    return NextResponse.json({ 
      error: "Failed to create patient evaluation",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}