'use server'
import { NextRequest, NextResponse } from 'next/server';
import { kipuListFacilities } from '~/lib/kipu/service/facility-service';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';


// In your facilities route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();

    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const ownerId = user?.id;


    if (!ownerId) {
      return NextResponse.json(
        { error: 'Unable to retrieve Supabase User ID' },
        { status: 401 }
      );
    }

    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!kipuCredentials) {
      throw new Error('KIPU API credentials not found');
    }
    // Make KIPU API call with credentials
    const response = await kipuListFacilities(kipuCredentials);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}