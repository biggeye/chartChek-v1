import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server'; 
import { kipuGetPatientEvaluation } from '~/lib/kipu/service/patient-evaluation-service'; 
import { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter'; 
import { snakeToCamel } from '~/utils/case-converters'; 

/**
 * GET handler for retrieving a specific patient evaluation by ID
 * 
 * @param req - The incoming request
 * @param params - The route params with evaluationId as a Promise
 * @returns NextResponse with the evaluation or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    // Await the params object before destructuring
    const resolvedParams = await params;
    const evaluationId = resolvedParams.evaluationId;
    
    if (!evaluationId || isNaN(Number(evaluationId))) {
      return NextResponse.json(
        { error: 'Invalid evaluation ID' },
        { status: 400 }
      );
    }
   // Create Supabase client
    const supabase = await createServer();
    
    // Get the user session to ensure they're authenticated
    const { data: { user } } = await supabase.auth.getUser(); // Assume user exists if credentials are found later

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const userId = user.id;
    
    
    // Get KIPU API credentials for the current user
    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
    if (!kipuCredentials) {
      // Throwing an error here will be caught by the main try/catch
      // Or return a specific response:
       return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 } // Or 401/403 depending on desired behavior
      ); 
    }

    // Fetch directly using the service function
    const response = await kipuGetPatientEvaluation<any>(evaluationId, kipuCredentials, true); // Using <any> for now based on previous code

    // Check the success flag from KipuApiResponse
    if (!response.success) {
      // Check if the error code indicates 'Not Found'
      if (response.error?.code === '404') {
         // Return a 404 Not Found response
         return NextResponse.json(
          { 
            success: false,
            error: 'Evaluation not found',
            message: response.error.message || 'The requested evaluation could not be found in KIPU.'
          },
          { status: 404 }
        );
      }
      // Handle other KIPU API errors
      console.error('KIPU API Error:', response.error); 
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch evaluation from KIPU',
          message: response.error?.message || 'An error occurred while communicating with the KIPU API.'
        },
        // Use the status code from the error if available, otherwise default to 500
        { status: response.error?.code ? parseInt(response.error.code, 10) || 500 : 500 }
      ); 
    }

    // Ensure data structure exists (optional, but good practice)
    if (!response.data || !response.data.patient_evaluation) {
        console.error('Unexpected KIPU API response structure:', response.data);
        throw new Error('Invalid data structure received from KIPU API for patient evaluation.');
    }


    // Transform the KIPU evaluation data to our KipuPatientEvaluation format
    const kipuData = response.data.patient_evaluation;
    const evaluation = snakeToCamel(kipuData); // Assign directly to evaluation
    
    
    // Use JSON.parse(JSON.stringify(...)) for deep cloning to prevent potential issues with Next.js serialization
    const safeEvaluation = JSON.parse(JSON.stringify(evaluation));
    return NextResponse.json(safeEvaluation);

  } catch (error) {
      
     // Catch errors thrown within the try block (e.g., credential loading, JSON parsing, unexpected structure)
     console.error('Internal Server Error fetching patient evaluation:', error);
     return NextResponse.json(
       { 
         success: false,
         error: 'Internal server error',
         message: error instanceof Error ? error.message : 'An unexpected error occurred.'
       },
       { status: 500 }
     );
  }
}