/**
 * KIPU API Configuration Endpoint
 * 
 * This endpoint allows for setting and retrieving KIPU API credentials.
 * It stores the credentials in Supabase for secure access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverSaveKipuCredentialsToSupabase, serverLoadKipuCredentialsFromSupabase } from '~/lib/kipu/auth/server';
import { KipuCredentials } from '~/types/kipu/kipuAdapter';

/**
 * GET handler to retrieve KIPU API credentials (masked)
 */
export async function GET(request: NextRequest) {
  try {
    // Load credentials from Supabase
    const credentials = await serverLoadKipuCredentialsFromSupabase();
    
    if (!credentials) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No KIPU credentials found' 
        },
        { status: 404 }
      );
    }
    
    // Mask sensitive information
    const maskedCredentials = {
      accessId: credentials.accessId ? credentials.accessId.substring(0, 4) + '...' : 'not set',
      secretKey: credentials.secretKey ? '********' : 'not set',
      appId: credentials.appId ? credentials.appId.substring(0, 4) + '...' : 'not set',
      baseUrl: credentials.baseUrl
    };
    
    return NextResponse.json({
      success: true,
      credentials: maskedCredentials
    });
  } catch (error) {
    console.error('Error retrieving KIPU credentials:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler to save KIPU API credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.accessId || !body.secretKey || !body.appId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required credentials' 
        },
        { status: 400 }
      );
    }
    
    // Create credentials object
    const credentials: KipuCredentials = {
      accessId: body.accessId,
      secretKey: body.secretKey,
      appId: body.appId,
      baseUrl: body.baseUrl || 'https://api.kipuapi.com'
    };
    
    // Save credentials to Supabase
    const success = await serverSaveKipuCredentialsToSupabase(credentials);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save credentials to database' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'KIPU credentials saved successfully'
    });
  } catch (error) {
    console.error('Error saving KIPU credentials:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
