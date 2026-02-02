/**
 * X API Proxy - Get Current User Profile
 * Proxies requests to GET /2/users/me
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const userFields = [
      'id',
      'name',
      'username',
      'created_at',
      'description',
      'profile_image_url',
      'public_metrics',
      'verified'
    ].join(',');

    const response = await fetch(
      `https://api.twitter.com/2/users/me?user.fields=${userFields}`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('X API error:', data);
      return res.status(response.status).json({
        error: 'X API request failed',
        details: data.detail || data.errors?.[0]?.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('X API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}
