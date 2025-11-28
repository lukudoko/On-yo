import { prisma } from '@/lib/prisma';
import { getUserId } from '@/utils/progress';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const referer = req.headers.referer || req.headers.origin;
  if (!referer || !referer.includes(req.headers.host)) {
    return res.redirect(307, '/404');
  }

  try {
    const { jlptLevel } = req.query;
    const jlptNum = jlptLevel ? parseInt(jlptLevel) : 5;

    const userId = await getUserId(req, res);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const onyomiGroups = await prisma.onyomiGroup.findMany({
      where: {
        kanji: {
          some: {
            jlpt_new: jlptNum
          }
        }
      },
      select: {
        reading: true,
        usefulness_score: true,
        kanji: {
          where: {
            jlpt_new: jlptNum
          },
          select: {
            id: true,
            character: true
          }
        }
      },
      orderBy: {
        usefulness_score: 'desc'
      }
    });

    const userProgress = await prisma.UserProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true
      }
    });


    const progressMap = new Map();
    userProgress.forEach(progress => {

      let status = 'unlearned';
      if (progress.masteryLevel === 2) {
        status = 'mastered';
      } else if (progress.masteryLevel === 1) {
        status = 'learning';
      }
      progressMap.set(progress.kanjiId, status);
    });

    const formattedGroups = onyomiGroups.map(group => {
      const jlptKanji = group.kanji;
      const totalKanji = jlptKanji.length;

      let mastered = 0;
      let learning = 0;
      let unlearned = 0;

      jlptKanji.forEach(kanji => {
        const status = progressMap.get(kanji.id);
        if (status === 'mastered') {
          mastered++;
        } else if (status === 'learning') {
          learning++;
        } else {
          unlearned++;
        }
      });

      return {
        reading: group.reading,
        usefulness_score: group.usefulness_score,
        kanjiCount: totalKanji,
        jlptLevel: jlptNum,

        mastered,
        learning,
        unlearned,
        total: totalKanji
      };
    });

    res.status(200).json({
      success: true,
      data: {
        groups: formattedGroups,
        currentJlptLevel: jlptNum,
        totalGroups: formattedGroups.length
      }
    });

  } catch (error) {
    console.error('API Error in JLPT:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}