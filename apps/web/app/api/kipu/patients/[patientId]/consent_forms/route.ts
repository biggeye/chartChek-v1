import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuFetchConsentFormRecords } from '~/lib/kipu/service/medical-records-service';
import { parsePatientId } from '~/lib/kipu/auth/config';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const resolvedParams = await params;
    const encodedPatientId = resolvedParams.patientId;
    
    // Decode and parse the patient ID
    const decodedPatientId = decodeURIComponent(encodedPatientId);
    const { chartId, patientMasterId } = parsePatientId(decodedPatientId);
      
    if (!chartId || !patientMasterId) {
      return NextResponse.json(
        { error: 'Invalid patient ID format. Expected format: chartId:patientMasterId' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Load KIPU credentials for the authenticated user
    const credentials = await serverLoadKipuCredentialsFromSupabase(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'Failed to load KIPU credentials', code: 'CREDENTIALS_ERROR' },
        { status: 401 }
      );
    }

    // Fetch consent form records from KIPU
    const response = await kipuFetchConsentFormRecords(
      credentials,
      decodedPatientId
    );

    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch consent form records from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching consent form records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent form records' },
      { status: 500 }
    );
  }
} 