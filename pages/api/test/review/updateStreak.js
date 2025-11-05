import { getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';
import { updateStreak } from '@/utils/streak';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { kanjiId, isCorrect } = req.body;

    if (!kanjiId || typeof isCorrect !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing kanjiId or isCorrect'
      });
    }

    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_kanjiId: { userId, kanjiId }
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress record not found'
      });
    }

    let newStreak = isCorrect
      ? Math.min(7, progress.testStreak + 1)
      : Math.max(-3, progress.testStreak - 1);

    let newMasteryLevel = progress.masteryLevel;

    if (progress.masteryLevel === 1 && newStreak >= 7) {
      newMasteryLevel = 2;
      newStreak = 0;
    } else if (progress.masteryLevel === 1 && newStreak <= -3) {
      newMasteryLevel = 0;
      newStreak = 0;
    } else if (progress.masteryLevel === 2 && newStreak >= 7) {
      newMasteryLevel = 2;
      newStreak = 7;
    } else if (progress.masteryLevel === 2 && newStreak <= -3) {
      newMasteryLevel = 1;
      newStreak = 0;
    }

    const updated = await prisma.userProgress.update({
      where: {
        userId_kanjiId: { userId, kanjiId }
      },
      data: {
        testStreak: newStreak,
        masteryLevel: newMasteryLevel,
        lastStudied: new Date()
      }
    });

    await updateStreak(userId);

    return res.status(200).json({
      success: true,
      updatedProgress: {
        ...updated,
        lastStudied: updated.lastStudied.toISOString()
      }
    });
  } catch (error) {
    console.error('API Error updating streak:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}