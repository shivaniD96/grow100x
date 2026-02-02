/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Used for secure authorization without exposing client secrets
 */

/**
 * Generate a cryptographically random code verifier
 * Must be 43-128 characters from [A-Za-z0-9-._~]
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 * @param {string} verifier - The code verifier
 * @returns {Promise<string>} The code challenge
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Base64 URL encode (RFC 4648)
 * @param {Uint8Array} buffer
 * @returns {string}
 */
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Store PKCE values in sessionStorage for the OAuth flow
 */
export function storePkceValues(codeVerifier, state) {
  sessionStorage.setItem('x_code_verifier', codeVerifier);
  sessionStorage.setItem('x_oauth_state', state);
}

/**
 * Retrieve and clear PKCE values from sessionStorage
 */
export function retrievePkceValues() {
  const codeVerifier = sessionStorage.getItem('x_code_verifier');
  const state = sessionStorage.getItem('x_oauth_state');

  // Clear after retrieval for security
  sessionStorage.removeItem('x_code_verifier');
  sessionStorage.removeItem('x_oauth_state');

  return { codeVerifier, state };
}

/**
 * Verify the state parameter matches what we stored
 */
export function verifyState(receivedState) {
  const storedState = sessionStorage.getItem('x_oauth_state');
  return storedState === receivedState;
}
