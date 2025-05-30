export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { kipuGetPatientsCensus } from '~/lib/kipu/service/patient-service';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { mapKipuPatientToPatientBasicInfo } from '~/lib/kipu/mapping';

/**
 * GET handler for listing patients in a facility
 * 
 * @param req - The incoming request
 * @returns NextResponse with the list of patients or an error
 */
export async function GET(request: NextRequest) {

  try {
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

    const response = await kipuGetPatientsCensus(kipuCredentials, 1, 20, );

    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patients from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU patients to our format
    const patients = Array.isArray((response.data as any).patients)
      ? (response.data as any).patients.map((patient: any) => mapKipuPatientToPatientBasicInfo(patient))
      : [];
   
    const result = JSON.stringify({
      success: true,
      data: {
        patients: patients,
        total: patients.length
      }
    });

    return new NextResponse(result, { headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Failure' },
      { status: 500 }
    );
  }
}
