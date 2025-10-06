import { getUserId } from '@/utils/progress';
import { getDashboardData } from '@/utils/dashboard';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cache = new Map();

export default async function handler(req, res) {

  if (req.method === 'PUT') {

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

      const { track } = req.body;

      if (!track || !['stat', 'jlpt'].includes(track)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid track. Must be "stat" or "jlpt"' 
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { track },
        select: { track: true }
      });

      for (const key of cache.keys()) {
        if (key.startsWith(userId)) {
          cache.delete(key);
        }
      }

      return res.status(200).json({ 
        success: true, 
        track: updatedUser.track 
      });
    } catch (error) {
      console.error('API Error updating track:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

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

    const { type = 'full' } = req.query;
    const cacheKey = `${userId}-${type}`;
    const now = Date.now();

    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
      return res.status(200).json({ 
        success: true, 
        data: cached.data,
        fromCache: true 
      });
    }

    let responseData;

    switch (type) {
      case 'track':

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { track: true }
        });

        responseData = {
          track: user?.track || 'stat'
        };
        break;

      case 'header':
        const fullData = await getDashboardData(req, res);
        if (fullData === null) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to load dashboard data' 
          });
        }

        const userForHeader = await prisma.user.findUnique({
          where: { id: userId },
          select: { track: true }
        });

        responseData = {
          kanjiMastered: fullData.progress.mastered,
          totalKanji: fullData.progress.total,
          groupsCompleted: fullData.stats.completedGroups,
          totalGroups: fullData.stats.totalGroups,
          track: userForHeader?.track || 'stat'
        };
        break;

      case 'full':
      default:
        const fullDataDefault = await getDashboardData(req, res);
        if (fullDataDefault === null) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to load dashboard data' 
          });
        }

        const userForFull = await prisma.user.findUnique({
          where: { id: userId },
          select: { track: true }
        });

        responseData = {
          ...fullDataDefault,
          track: userForFull?.track || 'stat'
        };
        break;
    }

    cache.set(cacheKey, {
      data: responseData,
      timestamp: now
    });

    res.status(200).json({ 
      success: true, 
      data: responseData,
      fromCache: false
    });
  } catch (error) {
    console.error('API Error in dashboard:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function invalidateUserCache(userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(userId)) {
      cache.delete(key);
    }
  }
}