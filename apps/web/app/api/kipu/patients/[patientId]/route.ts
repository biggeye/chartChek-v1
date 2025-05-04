import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuGetPatient } from '~/lib/kipu/service/patient-service';
import { mapKipuPatientToPatientBasicInfo } from '~/lib/kipu/mapping';


/**
 * GET handler for retrieving a specific patient's details
 * 
 * @param req - The incoming request
 * @param params - The route params with patientId as a Promise
 * @returns NextResponse with the patient details or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    // Await the params object before destructuring
    const resolvedParams = await params;
    const patientId = resolvedParams.patientId;
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const ownerId = user?.id;


    if (!ownerId) {
      return NextResponse.json(
        { error: 'Unable to retrieve Supabase User ID' },
        { status: 401 }
      );
    }

    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!kipuCredentials) {
      throw new Error('KIPU API credentials not found');
    }
    
    // Decode the patient ID before passing to the service
    const decodedPatientId = decodeURIComponent(patientId);
  
    
    const response = await kipuGetPatient<{patient: any}>(decodedPatientId, kipuCredentials);
    if (!response.success || !response.data) {
      console.error('Failed to fetch patient from KIPU:', response.error);
       // Ensure we have a valid status code (between 200-599)
      let statusCode = 500;
      if (response.error?.code) {
        const parsedCode = parseInt(response.error.code);
        // Only use the parsed code if it's a valid HTTP status code
        if (!isNaN(parsedCode) && parsedCode >= 200 && parsedCode <= 599) {
          statusCode = parsedCode;
        }
      }
      
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient from KIPU' },
        { status: statusCode }
      );
    }
    
    // Map KIPU patient to our format
const patientData = response.data.patient || response.data;
const patient = mapKipuPatientToPatientBasicInfo(patientData);

// Return patient details in the format expected by patientStore
return NextResponse.json({
  success: true,
  data: patient
});
  } catch (error) {
    console.error('Error in GET /api/kipu/patients/[patientId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}