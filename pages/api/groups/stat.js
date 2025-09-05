import { ProgressService, getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = await getUserId(req, res);
    const { jlpt } = req.query; 

    let onyomiGroupsWithProgress;

    if (jlpt) {

      onyomiGroupsWithProgress = await getJLPTSpecificGroups(userId, jlpt);
    } else {

      onyomiGroupsWithProgress = await getAllGroups(userId);
    }

    res.status(200).json({
      success: true,
      data: onyomiGroupsWithProgress
    });

  } catch (error) {
    console.error('API Error in groups:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getAllGroups(userId) {

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

  const progressByOnyomi = await ProgressService.getAllOnyomiGroupsProgress(userId);

  return onyomiGroupsData.map(group => {
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
}

async function getJLPTSpecificGroups(userId, jlptLevel) {
  // Fix: use jlpt_new instead of jlpt_level
  const onyomiGroupsData = await prisma.onyomiGroup.findMany({
    where: {
      kanji: {
        some: {
          jlpt_new: jlptLevel
        }
      }
    },
    select: {
      reading: true,
      usefulness_score: true,
      kanji: {
        where: {
          jlpt_new: jlptLevel
        },
        select: {
          id: true,
          character: true
        }
      }
    }
  });

  // Fix: use UserProgress instead of userKanjiProgress
  const allUserProgress = await prisma.UserProgress.findMany({
    where: {
      userId: userId
    },
    select: {
      kanjiId: true,
      masteryLevel: true
    }
  });

  const userProgressMap = new Map();
  allUserProgress.forEach(progress => {
    // Fix: convert masteryLevel to status
    let status = 'unlearned';
    if (progress.masteryLevel === 2) {
      status = 'mastered';
    } else if (progress.masteryLevel === 1) {
      status = 'learning';
    }
    userProgressMap.set(progress.kanjiId, status);
  });

  return onyomiGroupsData.map(group => {
    const jlptKanji = group.kanji;
    const totalKanji = jlptKanji.length;

    let mastered = 0;
    let learning = 0;
    let unlearned = 0;

    jlptKanji.forEach(kanji => {
      const status = userProgressMap.get(kanji.id);
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
      mastered,
      learning,
      unlearned,
      total: totalKanji,
      kanjiCount: totalKanji 
    };
  });
}