'use server'
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { kipuListFacilities } from '~/lib/kipu/service/facility-service';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';

// Cache duration in seconds (12 hours)
const CACHE_DURATION = 12 * 60 * 60;
// Additional time to use stale data while revalidating (1 hour)
const STALE_WHILE_REVALIDATE = 60 * 60;

// In your facilities route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();

    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    const ownerId = user?.id;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Unable to retrieve Supabase User ID' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!kipuCredentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    // Make KIPU API call with credentials
    const response = await kipuListFacilities(kipuCredentials);

    // Return successful response with caching headers
    return NextResponse.json(response, {
      headers: {
        // Cache for 12 hours, allow serving stale data for 1 hour while revalidating
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
        // Add ETag for validation
        'ETag': `"facilities-${ownerId}-${Date.now()}"`,
        // Add Vary header to ensure proper caching per user
        'Vary': 'Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}