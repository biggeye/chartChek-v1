import { createServer } from '~/utils/supabase/server';
import { ComplianceMetricsResponse, ComplianceMetricsQueryParams } from '~/types/database';
import { ComplianceProtocol } from '~/types/evaluation';
import { FacilityComplianceMetrics } from '~/types/database';
import { ProtocolRequirement } from '~/types/evaluation';

export async function getPatientComplianceMetrics(queryParams: ComplianceMetricsQueryParams, userId: string): Promise<ComplianceMetricsResponse> {
  const supabase = await createServer();

  // Fetch the protocol and requirements
  let protocol: ComplianceProtocol | null = null;
  if (queryParams.protocolId) {
    const { data, error } = await supabase
      .from('compliance_protocols')
      .select('*, requirements:compliance_protocol_requirements(*)')
      .eq('id', queryParams.protocolId)
      .single();
    if (error || !data) {
      return {
        success: false,
        error: 'Protocol not found',
      };
    }
    protocol = data as ComplianceProtocol;
  }

  if (queryParams.patientId && protocol) {
    // Fetch all evaluation definitions needed for ProtocolEvaluation[]
    const requirementIds = (protocol.requirements ?? []).map((r: ProtocolRequirement) => r.evaluation_id);
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluation_templates')
      .select('*')
      .in('id', requirementIds);

    if (evalError) {
      return {
        success: false,
        error: 'Failed to fetch evaluation definitions',
      };
    }

    // Map requirements to ProtocolEvaluation[]
    const evalMap = new Map(evaluations.map((e: any) => [e.id, e]));
    const protocolEvaluations = (protocol.requirements ?? [])
      .map((r: ProtocolRequirement) => {
        const evalDef = evalMap.get(r.evaluation_id);
        if (!evalDef) {
          return null;
        }
        return {
          ...evalDef,
          requirement: r.requirement,
        };
      })
      .filter((e): e is any => !!e);

    // Here you would aggregate metrics from Supabase data only
    // For now, return a placeholder
    return {
      success: true,
      data: {
        currentMetrics: {
          id: '',
          created_at: '',
          updated_at: '',
          created_by: '',
          updated_by: '',
          date: '',
          protocol_id: protocol.id,
          total_patients: 0,
          total_evaluations: 0,
          completed_evaluations: 0,
          missed_evaluations: 0,
          pending_evaluations: 0,
          average_completion_time: null,
          compliance_rate: 0
        },
        historicalMetrics: [],
        patientCompliance: [],
      },
    };
  }

  return {
    success: false,
    error: 'Missing patientId or protocolId',
  };
} 