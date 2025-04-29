import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuServerGet } from '~/lib/kipu/auth/server';
import { createServer } from '~/utils/supabase/server';
import { syncKipuEvaluationTemplates } from '~/lib/services/kipuEvaluationSyncService';

interface KipuEvaluationsData {
  evaluations: any[];
  [key: string]: unknown;
}
export async function POST(request: Request) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);
    if (!credentials) {
      return NextResponse.json({ error: 'KIPU API credentials not found' }, { status: 404 });
    }
    // Fetch all templates from KIPU
    console.log('Attempting to fetch all evaluation templates from KIPU for user', userId);
    const response = await kipuServerGet('api/evaluations', credentials);
    console.log('Response from KIPU:', response);

    // Type guard for items
    const data = response.data as KipuEvaluationsData;

    if (
      !response.success ||
      !data ||
      !Array.isArray(data.evaluations)
    ) {
      return NextResponse.json({ error: 'Failed to fetch evaluation templates from KIPU', details: response.error }, { status: 400 });
    }
    await syncKipuEvaluationTemplates(userId, data.evaluations);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
