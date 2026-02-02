/**
 * X OAuth 2.0 Authorization Endpoint
 * Returns the authorization URL for the OAuth flow
 */

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code_challenge, state } = req.query;

  if (!code_challenge || !state) {
    return res.status(400).json({ error: 'Missing code_challenge or state' });
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/callback`;

  if (!clientId) {
    return res.status(500).json({ error: 'X_CLIENT_ID not configured' });
  }

  const scopes = ['tweet.read', 'users.read', 'offline.access'].join(' ');

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', code_challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.json({ authUrl: authUrl.toString() });
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
