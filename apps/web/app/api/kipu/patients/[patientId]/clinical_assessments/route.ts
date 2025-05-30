export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ patientId: string }> }
  ) {
    try {
      // Await the params object before destructuring
      const resolvedParams = await params;
      const patientId = resolvedParams.patientId;
      const supabase = await createServer();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
  
      if (authError || !user) {
        return NextResponse.json(
          { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
{
        
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
        { status: 500 }
      );
    }
  }