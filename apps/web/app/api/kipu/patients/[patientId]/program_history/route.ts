import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuFetchProgramHistory } from '~/lib/kipu/service/medical-records-service';
import { KipuProgramHistory } from '~/lib/kipu/service/medical-records-service';

// Define the expected response type
interface ProgramHistoryResponse {
  success: boolean;
  data?: {
    programs: KipuProgramHistory[];
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
): Promise<NextResponse<ProgramHistoryResponse>> {
  try {
    // Await the params object before destructuring
    const resolvedParams = await params;
    const patientId = resolvedParams.patientId;
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'AUTH_REQUIRED',
            message: 'User not authenticated'
          }
        },
        { status: 401 }
      );
    }
    
    const ownerId = user?.id;
    if (!ownerId) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Unable to retrieve Supabase User ID'
          }
        },
        { status: 401 }
      );
    }

    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!kipuCredentials) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREDENTIALS_ERROR',
            message: 'KIPU API credentials not found'
          }
        },
        { status: 401 }
      );
    }
    
    // Decode the patient ID before passing to the service
    const decodedPatientId = decodeURIComponent(patientId);

    // Fetch program history from KIPU
    const response = await kipuFetchProgramHistory(
      kipuCredentials,
      decodedPatientId
    );

    if (!response.success || !response.data) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: response.error?.code || 'FETCH_ERROR',
            message: response.error?.message || 'Failed to fetch program history from KIPU',
            details: response.error?.details
          }
        },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Return the transformed response
    return NextResponse.json({
      success: true,
      data: {
        programs: response.data.programs,
        total: response.data.total
      }
    });
  } catch (error) {
    console.error('Error fetching program history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch program history',
          details: error instanceof Error ? error.message : error
        }
      },
      { status: 500 }
    );
  }
} 