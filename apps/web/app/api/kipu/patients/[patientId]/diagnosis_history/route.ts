export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { createServer } from '~/utils/supabase/server';
import { kipuServerGet } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';

/**
 * GET handler for retrieving patient diagnosis history
 * 
 * @param request - The incoming request
 * @param params - The route parameters, including patientId as a Promise
 * @returns NextResponse with the diagnosis history or an error
 */
export async function GET(
  request: NextRequest,
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

    // Get the current user from Supabase
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is authenticated
    if (!user) {
      console.error("No authenticated user found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = user.id;

    // Load KIPU credentials from Supabase
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 401 }
      );
    }

    // Make the API call to KIPU
    const response = await kipuServerGet(`/api/patients/${chartId}/diagnosis_history?patient_master_id=${patientMasterId}`, credentials);
      
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient diagnosis history from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    /*
    this is how the response will be structured:

    {
      "patient": {
        "casefile_id": "string",
        "first_name": "string",
        "middle_name": "string",
        "last_name": "string",
        "dob": "string",
        "diagnosis_history": [
          {
            "diagnosis": "string",
            "start_date": "string",
            "logged_by": "string",
            "logged_at": "string"
          }
        ]
      }
    }

    please return as finalResponse
    */
      
    // Return the response data directly
    return NextResponse.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Error fetching patient diagnosis history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient diagnosis history' },
      { status: 500 }
    );
  }
}
