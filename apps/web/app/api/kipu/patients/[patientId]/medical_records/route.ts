import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuFetchAllMedicalRecords } from '~/lib/kipu/service/medical-records-service';
import type { KipuApiResponse } from '~/lib/kipu/service/patient-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 1. Get authenticated user from Supabase
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Load KIPU credentials for the authenticated user
    const credentials = await serverLoadKipuCredentialsFromSupabase(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'Failed to load KIPU credentials', code: 'CREDENTIALS_ERROR' },
        { status: 401 }
      );
    }

    // 3. Fetch all medical records from KIPU
    const medicalRecords = await kipuFetchAllMedicalRecords(
      credentials,
      patientId
    );

    // 4. Check for any failed requests
    const failedRequests = Object.entries(medicalRecords)
      .filter(([_, response]) => !response.success)
      .map(([type, response]) => ({
        type,
        error: response.error?.message || 'Unknown error'
      }));

    if (failedRequests.length > 0) {
      // Some requests failed - return partial data with error information
      return NextResponse.json({
        success: false,
        data: medicalRecords,
        errors: failedRequests,
        code: 'PARTIAL_SUCCESS'
      }, { status: 207 }); // 207 Multi-Status
    }

    // 5. All requests succeeded - return complete data
    return NextResponse.json({
      success: true,
      data: {
        consentForms: medicalRecords.consentForms.data?.forms || [],
        consentRecords: medicalRecords.consentRecords.data?.records || [],
        diagnosisHistory: medicalRecords.diagnosisHistory.data?.diagnoses || [],
        programHistory: medicalRecords.programHistory.data?.programs || []
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}