import { getUserId } from '@/utils/progress';
import { getDashboardData } from '@/utils/dashboard';

const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Token protection
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
    
    // Check cache (5 minute expiry)
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
      return res.status(200).json({ 
        success: true, 
        data: cached.data,
        fromCache: true 
      });
    }

    const fullData = await getDashboardData(req, res);

    if (fullData === null) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to load dashboard data' 
      });
    }

    let responseData;
    
    switch (type) {
      case 'header':
        responseData = {
          kanjiMastered: fullData.progress.mastered,
          totalKanji: fullData.progress.total,
          groupsCompleted: fullData.stats.completedGroups,
          totalGroups: fullData.stats.totalGroups
        };
        break;
        
      case 'full':
      default:
        responseData = fullData;
        break;
    }

    // Cache the result
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

// Function to invalidate user cache
export function invalidateUserCache(userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(userId)) {
      cache.delete(key);
    }
  }
}