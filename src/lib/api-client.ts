import { secureSessionManager } from './secure-session'

/**
 * Make an authenticated API request with JWT token
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise with response
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = secureSessionManager.getToken()
  
  if (!token) {
    throw new Error('No authentication token found')
  }

  // Check if token is expired before making the request
  if (secureSessionManager.isTokenExpired()) {
    secureSessionManager.clearUser()
    throw new Error('Session expired - please sign in again')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If token is invalid, clear session
  if (response.status === 401) {
    secureSessionManager.clearUser()
    throw new Error('Authentication expired - please sign in again')
  }

  return response
}

/**
 * Make a GET request to an authenticated API endpoint
 * @param url - API endpoint URL
 * @returns Promise with parsed JSON response
 */
export async function authenticatedGet(url: string) {
  const response = await authenticatedFetch(url, { method: 'GET' })
  return response.json()
}

/**
 * Make a POST request to an authenticated API endpoint
 * @param url - API endpoint URL
 * @param data - Request body data
 * @returns Promise with parsed JSON response
 */
export async function authenticatedPost(url: string, data: any) {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * Make a PUT request to an authenticated API endpoint
 * @param url - API endpoint URL
 * @param data - Request body data
 * @returns Promise with parsed JSON response
 */
export async function authenticatedPut(url: string, data: any) {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * Make a DELETE request to an authenticated API endpoint
 * @param url - API endpoint URL
 * @returns Promise with parsed JSON response
 */
export async function authenticatedDelete(url: string) {
  const response = await authenticatedFetch(url, { method: 'DELETE' })
  return response.json()
}
