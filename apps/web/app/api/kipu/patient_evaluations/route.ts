import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { kipuServerGet, serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { KipuEvaluationResponse } from '~/types/kipu/kipuAdapter';
import { snakeToCamel } from '~/utils/case-converters';
import { kipuListPatientEvaluations } from '~/lib/kipu/service/patient-evaluation-service';
/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;

    // Optional query parameters
    const evaluationId = searchParams.get('evaluationId');
    const completedOnly = searchParams.get('completedOnly') === 'true';
    const currentCensusOnly = searchParams.get('currentCensusOnly') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeStranded = searchParams.get('includeStranded') === 'true';
    const page = searchParams.get('page') || '1';
    const per = searchParams.get('per') || '20';
    const patientProcessId = searchParams.get('patientProcessId');
    const evaluationContent = searchParams.get('evaluationContent');

    const supabase = await createServer();

    // Get the user session to ensure they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID for cache key
    const userId = user.id;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (evaluationId) queryParams.append('evaluation_id', evaluationId);
    if (completedOnly) queryParams.append('completed_only', 'true');
    if (currentCensusOnly) queryParams.append('current_census_only', 'true');
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (includeStranded) queryParams.append('include_stranded', 'true');
    queryParams.append('page', page);
    queryParams.append('per', per);
    if (patientProcessId) queryParams.append('patient_process_id', patientProcessId);
    if (evaluationContent) queryParams.append('evaluation_content', evaluationContent);
    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
    if (!kipuCredentials) {
      throw new Error('KIPU API credentials not found');
    }
    // Call KIPU API using the standard utility
    const endpoint = `/api/patient_evaluations?${queryParams.toString()}`;
    const response = await kipuListPatientEvaluations<any>(kipuCredentials, {
      evaluationId: Number(evaluationId),
      page: Number(page),
      per: Number(per),
      patientProcessId: Number(patientProcessId),
    });

    if (!response.success || !response.data) {
      console.error('Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU evaluations to our format if needed
    const evaluations = response.data.patient_evaluations || [];
    const camelCaseEvaluationsData = snakeToCamel(evaluations);

    const pagination = response.data.pagination || {
      current_page: '1',
      total_pages: '1',
      records_per_page: '20',
      total_records: '0'
    };

    // Return the evaluations and pagination info
    return NextResponse.json({
      evaluations: camelCaseEvaluationsData,
      pagination: {
        page: parseInt(pagination.current_page),
        pages: parseInt(pagination.total_pages),
        limit: parseInt(pagination.records_per_page),
        total: parseInt(pagination.total_records)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/patient_evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}