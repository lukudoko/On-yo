import { ProgressService, getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = await getUserId(req, res);

    // Get all onyomi groups
    const onyomiGroupsData = await prisma.onyomiGroup.findMany({
      orderBy: {
        usefulness_score: 'desc'
      },
      select: {
        reading: true,
        usefulness_score: true,
        _count: {
          select: {
            kanji: true
          }
        }
      }
    });

    // Get progress data
    const progressByOnyomi = await ProgressService.getAllOnyomiGroupsProgress(userId);

    const onyomiGroupsWithProgress = onyomiGroupsData.map(group => {
      const totalKanji = group._count.kanji;
      const progress = progressByOnyomi.get(group.reading) || {
        mastered: 0,
        learning: 0,
        unlearned: 0
      };

      const calculatedUnlearned = totalKanji - progress.mastered - progress.learning;

      return {
        reading: group.reading,
        usefulness_score: group.usefulness_score,
        mastered: progress.mastered,
        learning: progress.learning,
        unlearned: Math.max(0, calculatedUnlearned),
        total: totalKanji
      };
    });

    res.status(200).json({
      success: true,
      data: onyomiGroupsWithProgress
    });

  } catch (error) {
    console.error('API Error in groups:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}