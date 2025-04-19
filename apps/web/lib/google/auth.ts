
// Google OAuth credentials
export const GOOGLE_CREDENTIALS = {
  web: {
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    project_id: process.env.GOOGLE_PROJECT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uris: [
      'http://localhost:3000/api/auth/google/callback',
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    ],
    javascript_origins: [
      'http://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL || ''
    ]
  }
};

// Scopes for Google OAuth
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/generative-language.retriever'
];

// Generate authorization URL
export function getAuthUrl(redirectUri: string, state?: string) {
  const url = new URL(GOOGLE_CREDENTIALS.web.auth_uri);
  url.searchParams.append('client_id', GOOGLE_CREDENTIALS.web.client_id);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', SCOPES.join(' '));
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent');
  
  if (state) {
    url.searchParams.append('state', state);
  }
  
  return url.toString();
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  try {
    console.log('[exchangeCodeForTokens]: Starting token exchange with code', code.substring(0, 5) + '...');
    
    const response = await fetch(GOOGLE_CREDENTIALS.web.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CREDENTIALS.web.client_id,
        client_secret: GOOGLE_CREDENTIALS.web.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[exchangeCodeForTokens]: Token exchange failed', errorData);
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(GOOGLE_CREDENTIALS.web.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CREDENTIALS.web.client_id,
        client_secret: GOOGLE_CREDENTIALS.web.client_secret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Verify token and get user info
export async function getUserInfo(accessToken: string) {
  try {
    console.log('[getUserInfo]: Getting user info with token', accessToken.substring(0, 5) + '...');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('[getUserInfo]: Failed to get user info', errorData);
      throw new Error(`Failed to get user info: ${errorData}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}