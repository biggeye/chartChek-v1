import { NextRequest, NextResponse } from 'next/server';
import { kipuListUtilizationReviews } from '~/lib/kipu/service/utilization-review-service';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { UtilizationReview } from '~/lib/kipu/service/utilization-review-service';

interface RouteParams {
  patientId: string;
}

export async function GET(req: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { patientId } = params;
    const credentials = await serverLoadKipuCredentialsFromSupabase();
    
    if (!credentials) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_CREDENTIALS',
          message: 'No KIPU credentials found'
        }
      }, { status: 401 });
    }
    
    const kipuResponse = await kipuListUtilizationReviews(patientId, credentials);

    // Transform the response to match what the frontend expects
    return NextResponse.json({
      success: true,
      data: kipuResponse.data
    });
  } catch (error) {
    console.error('Error fetching utilization reviews:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 