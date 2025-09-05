// pages/api/test/recommendations.js
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/utils/progress';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserId(req, res);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all onyomi groups
    const allGroups = await prisma.onyomiGroup.findMany({
      select: {
        reading: true,
        usefulness_score: true,
        _count: {
          select: {
            kanji: true
          }
        }
      },
      orderBy: {
        usefulness_score: 'desc'
      }
    });

    // Get user's progress
    const userProgress = await prisma.UserProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
       data: {
        groups: allGroups,
        userProgress: userProgress
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}