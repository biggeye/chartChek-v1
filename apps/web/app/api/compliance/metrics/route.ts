import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { ComplianceMetricsResponse, ComplianceMetricsQueryParams } from '~/types/database';
import { getPatientComplianceMetrics } from '~/lib/server/statistics/complianceMetricsService';
import { ComplianceProtocol } from '~/types/evaluation';
import { KipuCredentials } from '~/types/kipu/kipuAdapter';
import { FacilityComplianceMetrics } from '~/types/database';
import { ProtocolRequirement } from '~/types/evaluation';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json<ComplianceMetricsResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;
    if (!userId) {
      return NextResponse.json<ComplianceMetricsResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams: ComplianceMetricsQueryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      protocolId: searchParams.get('protocolId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') as any || undefined
    };

    // Call the new internal metrics service
    const metrics = await getPatientComplianceMetrics(queryParams, userId);
    if (metrics.success) {
      return NextResponse.json<ComplianceMetricsResponse>(metrics);
    } else {
      return NextResponse.json<ComplianceMetricsResponse>(metrics, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json<ComplianceMetricsResponse>({
      success: false,
      error: error?.message || 'Internal Server Error',
    }, { status: 500 });
  }
}