/**
 * X OAuth 2.0 Callback Handler
 * Exchanges authorization code for access token
 */

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle GET request from X redirect
  if (req.method === 'GET') {
    const { code, state, error, error_description } = req.query;

    if (error) {
      // Redirect to frontend with error
      return res.redirect(`/?auth_error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.redirect('/?auth_error=Missing+authorization+code');
    }

    // Redirect to frontend with code and state for exchange
    return res.redirect(`/?code=${code}&state=${state}`);
  }

  // Handle POST request to exchange code for token
  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: 'Missing code or code_verifier' });
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'X API credentials not configured' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(400).json({
        error: 'Token exchange failed',
        details: tokenData.error_description || tokenData.error
      });
    }

    // Return tokens to frontend
    // Note: In production, consider storing refresh_token server-side
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
