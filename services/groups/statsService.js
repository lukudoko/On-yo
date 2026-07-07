import { prisma } from '@/lib/prisma';
import { ProgressService } from '@/services/progress';

export async function getAllGroups(userId) {
  const onyomiGroupsData = await prisma.onyomiGroup.findMany({
    orderBy: {
      usefulness_score: 'desc'
    },
    select: {
      reading: true,
      usefulness_score: true,
      _count: {
        select: { kanji: true }
      }
    }
  });

  let progressByOnyomi = new Map();
  if (userId) {
    progressByOnyomi = await ProgressService.getAllOnyomiGroupsProgress(userId);
  }

  const groups = onyomiGroupsData.map(group => {
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

  return {
    groups
  };
}

export async function getJLPTSpecificGroups(userId, jlptLevel) {
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

  let userProgressMap = new Map();
  if (userId) {
    const allUserProgress = await prisma.userProgress.findMany({
      where: { userId },
      select: { kanjiId: true, masteryLevel: true }
    });

    userProgressMap = new Map();
    allUserProgress.forEach(progress => {
      let status = 'unlearned';
      if (progress.masteryLevel === 2) status = 'mastered';
      else if (progress.masteryLevel === 1) status = 'learning';
      userProgressMap.set(progress.kanjiId, status);
    });
  }

  const groups = onyomiGroupsData.map(group => {
    const jlptKanji = group.kanji;
    const totalKanji = jlptKanji.length;

    let mastered = 0;
    let learning = 0;
    let unlearned = 0;

    jlptKanji.forEach(kanji => {
      const status = userProgressMap.get(kanji.id);
      if (status === 'mastered') mastered++;
      else if (status === 'learning') learning++;
      else unlearned++;
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

  return {
    groups
  };
}