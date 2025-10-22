import { getUserId } from '@/utils/progress';
import { getUserJlptLevel } from '@/utils/jlpt';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const expectedToken = process.env.API_TOKEN;
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

    const jlptLevel = await getUserJlptLevel(userId);

    return res.status(200).json({
      success: true,
      data: {
        jlptLevel: jlptLevel
      }
    });
  } catch (error) {
    console.error('API Error getting JLPT level:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}