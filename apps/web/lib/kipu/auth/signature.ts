/**
 * KIPU API Authentication Signature Generator
 * 
 * This module provides utilities for generating authentication signatures
 * required by the KIPU API. It follows the HMAC SHA-1 signature generation
 * process as specified in the KIPU API documentation.
 */

import crypto from 'crypto';

interface KipuCredentials {
  accessId: string;
  secretKey: string;
  appId: string; // Also referred to as recipient_id
}

/**
 * Generates a Content-MD5 header value for POST requests
 * @param body - The request body as a string
 * @returns Base64 encoded MD5 digest of the request body
 */
export function generateContentMD5(body: string): string {
  const md5Hash = crypto.createHash('md5').update(body).digest('base64');
  return md5Hash;
}

/**
 * Builds a canonical string for signature generation
 * @param method - HTTP method (GET or POST)
 * @param contentType - Content-Type header (for POST requests)
 * @param contentMD5 - Content-MD5 header (for POST requests)
 * @param requestUri - Request URI including query parameters
 * @param date - Date in RFC 1123 format (e.g., 'Wed, 06 Nov 2019 15:38:34 GMT')
 * @returns Canonical string for signature generation
 */
export function buildCanonicalString(
  method: 'GET' | 'POST',
  contentType: string,
  contentMD5: string,
  requestUri: string,
  date: string
): string {
  if (method === 'POST') {
    return `${contentType},${contentMD5},${requestUri},${date}`;
  } else {
    // For GET requests, the first two components are empty
    return `,,${requestUri},${date}`;
  }
}

/**
 * Generates an HMAC SHA-1 signature for KIPU API authentication
 * @param canonicalString - The canonical string to sign
 * @param secretKey - The secret key for HMAC generation
 * @returns Base64 encoded HMAC SHA-1 signature
 */
export function generateSignature(canonicalString: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(canonicalString);
  return hmac.digest('base64');
}

/**
 * Formats the Authorization header value
 * @param accessId - The API access ID
 * @param signature - The generated signature
 * @returns Formatted Authorization header value
 */
export function formatAuthorizationHeader(accessId: string, signature: string): string {
  return `APIAuth ${accessId}:${signature}`;
}

/**
 * Generates the current date in RFC 1123 format for the Date header
 * @returns Current date in RFC 1123 format
 */
export function getCurrentRFC1123Date(): string {
  return new Date().toUTCString();
}

/**
 * Generates all required authentication headers for a KIPU API request
 * @param method - HTTP method (GET or POST)
 * @param requestUri - Request URI including query parameters
 * @param credentials - KIPU API credentials
 * @param body - Request body (for POST requests)
 * @param contentType - Content-Type header (for POST requests)
 * @returns Object containing all required headers
 */
export function generateKipuAuthHeaders(
  method: 'GET' | 'POST',
  requestUri: string,
  credentials: KipuCredentials,
  body?: string,
  contentType: string = 'application/json'
): Record<string, string> {
  const date = getCurrentRFC1123Date();
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.kipusystems+json; version=3',
    'Date': date,  // This is the correct header name according to KIPU API docs
  };

  let contentMD5 = '';
  
  // Add Content-Type and Content-MD5 for POST requests
  if (method === 'POST' && body) {
    headers['Content-Type'] = contentType;
    contentMD5 = generateContentMD5(body);
    headers['Content-MD5'] = contentMD5;
  }

  // Include app_id in the requestUri for GET requests if it doesn't already have it
  let fullRequestUri = requestUri;
  if (method === 'GET' && !fullRequestUri.includes('app_id=')) {
    const separator = fullRequestUri.includes('?') ? '&' : '?';
    fullRequestUri = `${fullRequestUri}${separator}app_id=${credentials.appId}`;
  }

  // Build canonical string and generate signature
  const canonicalString = buildCanonicalString(
    method,
    contentType,
    contentMD5,
    fullRequestUri,
    date
  );
  
  const signature = generateSignature(canonicalString, credentials.secretKey);
  headers['Authorization'] = formatAuthorizationHeader(credentials.accessId, signature);

  return headers;
}

/**
 * Creates a complete fetch request configuration for KIPU API calls
 * @param method - HTTP method (GET or POST)
 * @param endpoint - API endpoint (without base URL)
 * @param credentials - KIPU API credentials
 * @param body - Request body (for POST requests)
 * @returns Fetch request configuration
 */
export function createKipuRequestConfig(
  method: 'GET' | 'POST',
  endpoint: string,
  credentials: KipuCredentials,
  body?: any
): RequestInit {
  const bodyString = body ? JSON.stringify(body) : undefined;
  const headers = generateKipuAuthHeaders(method, endpoint, credentials, bodyString);

  return {
    method,
    headers,
    body: bodyString,
  };
}
