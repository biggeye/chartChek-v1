export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { KipuApiResponse } from '~/types/kipu/kipuAdapter';
import { kipuServerGet } from '~/lib/kipu/auth/server';
import { createServer } from '~/utils/supabase/server';
/**
 * GET /api/kipu/evaluations
 * 
 * Retrieves a list of evaluation templates from KIPU
 * These are the form templates used to create patient evaluations,
 * not the completed evaluation data itself.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '200';
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
       // Add console logging for debugging
       console.log('🔍 KIPU Evaluations Request:', { page, limit, userId });
    
    // Get KIPU credentials
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Add any additional search params from the original request
    searchParams.forEach((value, key) => {
      if (!['page', 'limit'].includes(key)) {
        queryParams.append(key, value);
      }
    });
    
    // Construct API path with query parameters
    const apiPath = `api/evaluations?${queryParams.toString()}`;
    
    // Make request to KIPU API using helper function
    const response = await kipuServerGet(apiPath, credentials);
    console.log('🔍 KIPU Evaluations Response:', response);
     if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to fetch evaluation templates from KIPU', details: response.error },
        { status: 400 }
      );
    }
    console.log('🔍 KIPU Evaluations Response Structure:', {
      responseKeys: Object.keys(response),
      dataType: typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
      firstItem: Array.isArray(response.data) && response.data.length > 0 ? 
        { keys: Object.keys(response.data[0]), sample: JSON.stringify(response.data[0]).substring(0, 500) + '...' } : 
        'no items'
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ KIPU Evaluations Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KIPU evaluations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}