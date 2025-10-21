import { getUserId } from '@/utils/progress';
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

    // Get ALL user progress for debugging view
    const allProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        masteryLevel: { in: [0, 1, 2] } // Include all levels
      },
      include: {
        kanji: true
      },
      orderBy: [
        { masteryLevel: 'asc' },
        { testStreak: 'desc' },
        { lastStudied: 'desc' }
      ]
    });

    return res.status(200).json({
      success: true,
      allProgress: allProgress.map(p => ({
        ...p,
        lastStudied: p.lastStudied.toISOString(),
        createdAt: p.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('API Error in test debug:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}