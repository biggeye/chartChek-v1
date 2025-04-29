import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';

interface EvaluationMetricsRequest {
  patientId: string;
  protocolId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    const body: EvaluationMetricsRequest = await request.json();
    
    if (!body.patientId || !body.protocolId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Fetch the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('compliance_protocols')
      .select('*')
      .eq('id', body.protocolId)
      .single();

    if (protocolError) throw protocolError;
    if (!protocol) {
      return NextResponse.json({
        success: false,
        error: 'Protocol not found'
      }, { status: 404 });
    }
    console.log('devMetrics]  protocol fetched: ', protocol)
    // Fetch patient's evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from('patient_evaluations')
      .select('*')
      .eq('patient_id', body.patientId);
console.log('devMetrics] evals fetched: ', evaluations)
    if (evalError) throw evalError;

    // Calculate metrics
    const requiredEvaluations = [
      ...protocol.admission_evaluations,
      ...protocol.daily_evaluations,
      ...protocol.cyclic_evaluations
    ];

    const metrics = {
      totalRequired: requiredEvaluations.length,
      completed: 0,
      inProgress: 0,
      completionPercentage: 0,
      byCategory: {} as Record<string, any[]>
    };

    // Process evaluations
    (evaluations || []).forEach(evaluation => {
      if (evaluation.status === 'completed') {
        metrics.completed++;
      } else if (evaluation.status === 'in_progress') {
        metrics.inProgress++;
      }

      // Group by category
      if (!metrics.byCategory[evaluation.category]) {
        metrics.byCategory[evaluation.category] = [];
      }
      metrics.byCategory[evaluation.category].push({
        name: evaluation.name,
        status: evaluation.status,
        dueDate: evaluation.due_date
      });
    });

    metrics.completionPercentage = (metrics.completed / metrics.totalRequired) * 100;

    return NextResponse.json({
      success: true,
      data: {
        raw: {
          protocol,
          evaluations
        },
        metrics
      }
    });
  } catch (error) {
    console.error('Error calculating evaluation metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate metrics'
    }, { status: 500 });
  }
} 