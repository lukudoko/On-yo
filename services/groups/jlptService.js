import { prisma } from '@/lib/prisma';

export async function getJLPTGroups(userId, jlptLevel = 5) {
  const jlptNum = parseInt(jlptLevel);

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

  let progressMap = new Map();
  if (userId) {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      select: { kanjiId: true, masteryLevel: true }
    });

    progressMap = new Map();
    userProgress.forEach(progress => {
      let status = 'unlearned';
      if (progress.masteryLevel === 2) status = 'mastered';
      else if (progress.masteryLevel === 1) status = 'learning';
      progressMap.set(progress.kanjiId, status);
    });
  }

  const groups = onyomiGroups.map(group => {
    const jlptKanji = group.kanji;
    const totalKanji = jlptKanji.length;

    let mastered = 0;
    let learning = 0;
    let unlearned = 0;

    jlptKanji.forEach(kanji => {
      const status = progressMap.get(kanji.id);
      if (status === 'mastered') mastered++;
      else if (status === 'learning') learning++;
      else unlearned++;
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

  return {
    groups,
    currentJlptLevel: jlptNum,
    totalGroups: groups.length
  };
}