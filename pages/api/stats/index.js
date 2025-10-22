import { getUserId } from '@/utils/progress';
import { getDashboardData } from '@/utils/dashboard';
import { getUserJlptLevel } from '@/utils/jlpt';
import { prisma } from '@/lib/prisma';

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

    const fullData = await getDashboardData(req, res);
    if (fullData === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true }
    });

    const jlptLevel = await getUserJlptLevel(userId);

    const fullDashboardData = {
      ...fullData,
      track: user?.track || 'stat',
      jlptLevel: jlptLevel
    };

    return res.status(200).json({
      success: true,
      data: fullDashboardData
    });
  } catch (error) {
    console.error('API Error in full dashboard:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}