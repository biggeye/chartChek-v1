import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { completeEvaluationWithAI } from '~/lib/ai/evaluation-completion-service';

/**
 * POST handler for AI-powered evaluation completion
 * 
 * @param req - The incoming request with evaluationId, patientId, and options
 * @returns NextResponse with completion results or error
 */
export async function POST(req: NextRequest) {
  console.log('[AI API] POST request received');
  
  try {
    const body = await req.json();
    console.log('[AI API] Request body:', body);
    
    const { evaluationId, patientId, contextSummary, reviewMode = true } = body;

    if (!evaluationId || !patientId) {
      console.log('[AI API] Missing required fields');
      return NextResponse.json(
        { error: 'evaluationId and patientId are required' },
        { status: 400 }
      );
    }

    console.log('[AI API] Getting authenticated user...');
    // Get authenticated user
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[AI API] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const ownerId = user.id;
    console.log('[AI API] User authenticated:', ownerId);

    // Get KIPU credentials
    console.log('[AI API] Loading KIPU credentials...');
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!credentials) {
      console.log('[AI API] No KIPU credentials found');
      return NextResponse.json(
        { error: 'KIPU credentials not found' },
        { status: 401 }
      );
    }

    console.log('[AI API] KIPU credentials loaded, calling AI service...');
    
    // Call the AI completion service
    const { completeEvaluationWithAI } = await import('~/lib/ai/evaluation-completion-service');
    
    const result = await completeEvaluationWithAI({
      evaluationId,
      patientId,
      contextSummary,
      reviewMode,
      credentials,
      ownerId
    });

    console.log('[AI API] AI service result:', { success: result.success, fieldCount: Object.keys(result.fieldCompletions || {}).length });

    if (!result.success) {
      console.log('[AI API] AI completion failed:', result.errors);
      return NextResponse.json(
        { error: 'AI completion failed', details: result.errors },
        { status: 500 }
      );
    }

    console.log('[AI API] Returning success response');
    return NextResponse.json({
      success: true,
      data: {
        fieldCompletions: result.fieldCompletions,
        draftResponse: result.draftResponse,
        reviewNotes: result.reviewNotes,
        evaluationData: result.evaluationData
      }
    });

  } catch (error) {
    console.error('[AI API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 