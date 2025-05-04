import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { kipuFetchConsentForms } from '~/lib/kipu/service/medical-records-service';

export async function GET(req: NextRequest) {
  try {
    // 1. Get authenticated user from Supabase
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Load KIPU credentials for the authenticated user
    const credentials = await serverLoadKipuCredentialsFromSupabase(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'Failed to load KIPU credentials', code: 'CREDENTIALS_ERROR' },
        { status: 401 }
      );
    }

    // 3. Fetch consent forms from KIPU
    const response = await kipuFetchConsentForms(credentials);
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch consent forms from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching consent forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent forms' },
      { status: 500 }
    );
  }
} 