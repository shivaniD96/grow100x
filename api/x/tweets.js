/**
 * X API Proxy - Get User Tweets with Metrics
 * Proxies requests to GET /2/users/:id/tweets
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const { user_id, max_results, start_time, end_time, pagination_token } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    const tweetFields = [
      'id',
      'text',
      'created_at',
      'public_metrics',
      'conversation_id',
      'in_reply_to_user_id',
      'referenced_tweets'
    ].join(',');

    const params = new URLSearchParams({
      'tweet.fields': tweetFields,
      'max_results': max_results || '100',
      'exclude': 'retweets,replies'
    });

    if (start_time) params.set('start_time', start_time);
    if (end_time) params.set('end_time', end_time);
    if (pagination_token) params.set('pagination_token', pagination_token);

    const response = await fetch(
      `https://api.twitter.com/2/users/${user_id}/tweets?${params}`,
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

    // Add rate limit info to response
    res.json({
      ...data,
      _rateLimit: {
        remaining: response.headers.get('x-rate-limit-remaining'),
        reset: response.headers.get('x-rate-limit-reset')
      }
    });
  } catch (error) {
    console.error('X API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
}
