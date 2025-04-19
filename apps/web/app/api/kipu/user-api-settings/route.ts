/**
 * User API Settings API Route
 * 
 * This API route handles updating the user_api_settings table with KIPU credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { UserApiSettings } from '~/lib/kipu/service/user-settings';

/**
 * POST handler for updating user API settings
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.facility_id) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prepare the data for the user_api_settings table
    const userApiSettings: UserApiSettings = {
      user_id: user.id,
      kipu_access_id: body.kipu_access_id || '',
      kipu_secret_key: body.kipu_secret_key || '',
      kipu_app_id: body.kipu_app_id || '',
      kipu_api_endpoint: body.kipu_base_url || '',
      has_api_key_configured: Boolean(
        body.kipu_access_id && 
        body.kipu_secret_key && 
        body.kipu_app_id && 
        body.kipu_base_url
      )
    };

    // Update or insert the user API settings
    const { data, error } = await supabase
      .from('user_api_settings')
      .upsert({
        ...userApiSettings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user API settings:', error);
      return NextResponse.json(
        { error: 'Failed to update user API settings' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User API settings updated successfully',
      data
    });
  } catch (error) {
    console.error('Error in user API settings endpoint:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while updating user API settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
