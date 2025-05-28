import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { kipuGetPatientsOccupancy } from '~/lib/kipu/service/patient-service';
import { serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';


export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('[Occupancy API] User not authenticated:', authError, user);
      return NextResponse.json(
        { error: 'User not authenticated', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );    
    }
    const ownerId = user?.id;
    if (!ownerId) {
      console.log('[Occupancy API] Unable to retrieve Supabase User ID');
      return NextResponse.json(
        { error: 'Unable to retrieve Supabase User ID' },
        { status: 401 }
      );
    }
    console.log('[Occupancy API] Loading KIPU credentials for ownerId:', ownerId);
    const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
    if (!kipuCredentials) {
      console.log('[Occupancy API] KIPU API credentials not found for ownerId:', ownerId);
      throw new Error('KIPU API credentials not found');
    }

    console.log('[Occupancy API] Fetching occupancy from KIPU...');
    const response = await kipuGetPatientsOccupancy(kipuCredentials);
    console.log('[Occupancy API] KIPU occupancy response:', response);

    if (!response.success || !response.data) {
      console.log('[Occupancy API] Failed to fetch patients from KIPU:', response.error);
      return NextResponse.json( 
        { error: response.error?.message || 'Failed to fetch patients from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Normalize response to always include buildings, beds, and locations arrays
    const safeData: Record<string, any> = response.data || {};
    const normalizedData = {
      ...safeData,
      beds: Array.isArray(safeData.beds) ? safeData.beds : [],
      buildings: Array.isArray(safeData.buildings) ? safeData.buildings : [],
      locations: Array.isArray(safeData.locations) ? safeData.locations : [],
    };
    console.log('[Occupancy API] Returning normalized occupancy data:', normalizedData);
    return NextResponse.json(normalizedData);
    

  } catch (error) {
    console.error(`Error in kipuGetPatientsOccupancy:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch patients from KIPU' },
      { status: 500 }
    );
  }
}