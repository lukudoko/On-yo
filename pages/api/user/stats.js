import { getUserId } from '@/services/user';

import { getUserStats } from '@/services/user/statsService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const expectedToken = process.env.API_TOKEN || 'fallback-token-for-dev';
  const providedToken = req.headers['x-api-token'];

  if (providedToken !== expectedToken) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid API token'
    });
  }

  try {
    const userId = await getUserId(req, res);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const statsData = await getUserStats(userId);

   return res.status(200).json({
      success: true,
       data: statsData  
    });
  } catch (error) {
    console.error('API Error in user stats:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}