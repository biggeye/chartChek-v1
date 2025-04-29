import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { ComplianceMetricsResponse, ComplianceMetricsQueryParams } from '~/types/database';
import { getPatientEvaluationMetrics } from '~/lib/services/evaluationMetricsService';
import { ComplianceProtocol } from '~/types/evaluation';
import { KipuCredentials } from '~/types/kipu/kipuAdapter';
import { FacilityComplianceMetrics } from '~/types/database';
import { Evaluation, ProtocolRequirement } from '~/types/evaluation';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';

// Helper: create an empty FacilityComplianceMetrics object
function getEmptyFacilityComplianceMetrics(): FacilityComplianceMetrics {
  return {
    date: '',
    protocol_id: '',
    total_patients: 0,
    total_evaluations: 0,
    completed_evaluations: 0,
    missed_evaluations: 0,
    pending_evaluations: 0,
    average_completion_time: null,
    compliance_rate: 0
  };
}

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

   const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: ComplianceMetricsQueryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      protocolId: searchParams.get('protocolId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') as any || undefined
    };

    // Fetch the protocol and requirements
    let protocol: ComplianceProtocol | null = null;
    if (queryParams.protocolId) {
      const { data, error } = await supabase
        .from('compliance_protocols')
        .select('*, requirements:compliance_protocol_requirements(*)')
        .eq('id', queryParams.protocolId)
        .single();
      if (error || !data) {
        return NextResponse.json<ComplianceMetricsResponse>({
          success: false,
          error: 'Protocol not found',
        }, { status: 404 });
      }
      protocol = data as ComplianceProtocol;
    }

    // If both patientId and protocol, use the service to compute metrics
    if (queryParams.patientId && protocol) {
      // Fetch all evaluation definitions needed for ProtocolEvaluation[]
      const requirementIds = (protocol.requirements ?? []).map((r: ProtocolRequirement) => r.evaluation_id);
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluation_templates')
        .select('*')
        .in('id', requirementIds);

      if (evalError) {
        return NextResponse.json<ComplianceMetricsResponse>({
          success: false,
          error: 'Failed to fetch evaluation definitions',
        }, { status: 500 });
      }

      // Map requirements to ProtocolEvaluation[]
      const evalMap = new Map(evaluations.map((e: Evaluation) => [e.id, e]));
      const protocolEvaluations = (protocol.requirements ?? [])
      .map((r: ProtocolRequirement) => {
        const evalDef = evalMap.get(r.evaluation_id);
        if (!evalDef) {
          // Optionally log or handle missing evaluation definitions
          console.warn(`[api/compliance/metrics] No evaluation found for requirement id: ${r.evaluation_id}`);
          return null;
        }
        return {
          ...evalDef,
          requirement: r.requirement,
        };
      })
      .filter((e): e is Evaluation & { requirement: string } => !!e);

      // TODO: Replace with actual Kipu credentials logic
      const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
console.log('apiMetrics] patientId: ', queryParams.patientId);
console.log('apiMetrics] protocolEvaluations: ', protocolEvaluations);
console.log('apiMetrics] kipuCredentials: ', kipuCredentials);
      const metrics = await getPatientEvaluationMetrics(
        queryParams.patientId,
        kipuCredentials,
        protocolEvaluations
      );
      return NextResponse.json<ComplianceMetricsResponse>({
        success: true,
        data: {
          currentMetrics: getEmptyFacilityComplianceMetrics(),
          historicalMetrics: [],
          patientCompliance: [],
          ...metrics
        }
      });
    }

    // Fallback: return error if missing required params
    return NextResponse.json<ComplianceMetricsResponse>({
      success: false,
      error: 'Missing patientId or protocolId'
    }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json<ComplianceMetricsResponse>({
      success: false,
      error: error?.message || 'Internal Server Error',
    }, { status: 500 });
  }
}