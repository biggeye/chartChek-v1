export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { KipuApiResponse } from '~/types/kipu/kipuAdapter';
import { kipuServerGet } from '~/lib/kipu/auth/server';
import { createServer } from '~/utils/supabase/server';
import { snakeToCamel } from '~/utils/case-converters'; // Import the utility

/**
 * GET /api/kipu/evaluations/[id]
 *
 * Retrieves a specific evaluation template from KIPU by ID
 * This endpoint returns the complete template definition including all fields,
 * which can be used to render forms or map to ChartChek templates.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object before destructuring
    const resolvedParams = await params;
    const templateId: string = resolvedParams.id;
    
    console.log('[API] Fetching evaluation template:', templateId);
    
    const supabase = await createServer();

    // Get the user session to ensure they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      console.error('[API] Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    // Get user ID for cache key
    const userId = user.id;
    console.log('[API] User ID:', userId);
    
    // Get KIPU credentials
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);

    if (!credentials) {
      console.error('[API] No KIPU credentials found for user:', userId);
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }
    
    console.log('[API] KIPU credentials loaded, making request to:', `api/evaluations/${templateId}`);

    // Construct KIPU API URL path
    const apiPath = `api/evaluations/${templateId}`;

    // Make request to KIPU API using helper function
    const response = await kipuServerGet(apiPath, credentials);
    
    console.log('[API] KIPU response:', {
      success: response.success,
      hasData: !!response.data,
      error: response.error
    });
    
    if (!response.success) {
      console.error('[API] KIPU API error:', response.error);
      return NextResponse.json(
        { error: 'Failed to fetch evaluation template from KIPU', details: response.error },
        { status: 400 }
      );
    }
    
    const camelCaseData = snakeToCamel(response.data);
    console.log('[API] Returning camelCase data with keys:', Object.keys(camelCaseData));

    return NextResponse.json(camelCaseData);
  } catch (error: any) {
    console.error('[API] Unexpected error fetching evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}