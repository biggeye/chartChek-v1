// lib/google/getAccessToken.ts
import { createServerService } from '@/utils/supabase/serverService';
import { refreshAccessToken } from './auth';
import { User } from '@supabase/supabase-js';

interface UserWithMetadata extends User {
    user_metadata: {
      google_access_token?: string;
      google_refresh_token?: string;
      google_token_expiry?: number;
      [key: string]: any;
    };
  }

export async function getGoogleAccessToken() {
  const supabase = await createServerService();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No session');
  }
  
  
  const { 
    google_access_token: accessToken,
    google_refresh_token: refreshToken,
    google_token_expiry: tokenExpiry
  } = user.user_metadata || {};
  
  // Check if we have tokens
  if (!accessToken || !refreshToken) {
    throw new Error('No Google tokens found');
  }
  console.log('Access token:', accessToken);
  // Check if token is expired
  if (!tokenExpiry || Date.now() >= tokenExpiry) {
    try {
      // Refresh the token
      const tokens = await refreshAccessToken(refreshToken);
      
      // Update tokens in user metadata
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          google_access_token: tokens.access_token,
          google_token_expiry: Date.now() + (tokens.expires_in * 1000)
        }
      });
      
      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }
  
  // Return the current token
  return accessToken;
}