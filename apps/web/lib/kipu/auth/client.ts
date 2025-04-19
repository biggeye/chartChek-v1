'use client';

/**
 * KIPU API Client
 * 
 * This module provides a client for making authenticated requests to the KIPU API.
 */

import { KipuCredentials, KipuApiResponse } from 'types/kipu/kipuAdapter';
import { generateKipuAuthHeaders } from './signature';

/**
 * KIPU API Client class for making authenticated requests
 */
export class KipuClient {
  private credentials: KipuCredentials;
  
  /**
   * Creates a new KIPU API client
   * @param credentials - KIPU API credentials
   */
  constructor(credentials: KipuCredentials) {
    this.credentials = credentials;
  }
  
  /**
   * Makes a GET request to the KIPU API
   * @param endpoint - API endpoint (without base URL)
   * @returns Promise resolving to the API response
   */
  async get<T>(endpoint: string): Promise<KipuApiResponse<T>> {
    try {
      // Ensure endpoint starts with a slash
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Generate authentication headers
      const headers = generateKipuAuthHeaders('GET', formattedEndpoint, this.credentials);
      
      // Make the request
      const response = await fetch(`${this.credentials.baseUrl}${formattedEndpoint}`, {
        method: 'GET',
        headers,
      });
      
      // Parse the response
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: response.statusText,
            details: data
          }
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('KIPU API GET request failed:', error);
      return {
        success: false,
        error: {
          code: 'client_error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Makes a POST request to the KIPU API
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @returns Promise resolving to the API response
   */
  async post<T>(endpoint: string, body: any): Promise<KipuApiResponse<T>> {
    try {
      // Ensure endpoint starts with a slash
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Convert body to string
      const bodyString = JSON.stringify(body);
      
      // Generate authentication headers
      const headers = generateKipuAuthHeaders('POST', formattedEndpoint, this.credentials, bodyString);
      
      // Make the request
      const response = await fetch(`${this.credentials.baseUrl}${formattedEndpoint}`, {
        method: 'POST',
        headers,
        body: bodyString
      });
      
      // Parse the response
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: response.statusText,
            details: data
          }
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('KIPU API POST request failed:', error);
      return {
        success: false,
        error: {
          code: 'client_error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

/**
 * Creates a new KIPU API client with the provided credentials
 * @param credentials - KIPU API credentials
 * @returns New KIPU API client instance
 */
export function createKipuClient(credentials: KipuCredentials): KipuClient {
  return new KipuClient(credentials);
}
