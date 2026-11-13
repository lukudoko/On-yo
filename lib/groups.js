import { prisma } from '@/lib/prisma';
import { ProgressService } from '@/services/progress';

export async function getGroupsData(userId, track, jlptLevel, options = {}) {
  if (track === 'jlpt') {
    return await getJlptGroups(userId, jlptLevel, options);
  }
  if (jlptLevel) {
    return await getJLPTSpecificGroups(userId, parseInt(jlptLevel, 10), options);
  }
  return await getAllGroups(userId, options);
}

async function getAllGroups(userId, { skip, take } = {}) {
  const onyomiGroupsData = await prisma.onyomiGroup.findMany({
    orderBy: { usefulness_score: 'desc' },
    skip,
    take,
    select: {
      reading: true,
      usefulness_score: true,
      _count: { select: { kanji: true } }
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

async function getJLPTSpecificGroups(userId, jlptLevel, { skip, take } = {}) {
  const onyomiGroupsData = await prisma.onyomiGroup.findMany({
    where: {
      kanji: {
        some: { jlpt_new: jlptLevel }
      }
    },
    skip,
    take,
    select: {
      reading: true,
      usefulness_score: true,
      kanji: {
        where: { jlpt_new: jlptLevel },
        select: { id: true, character: true }
      }
    }
  });

  const allUserProgress = await prisma.UserProgress.findMany({
    where: { userId },
    select: { kanjiId: true, masteryLevel: true }
  });

  const userProgressMap = new Map();
  for (const p of allUserProgress) {
    let status = 'unlearned';
    if (p.masteryLevel === 2) status = 'mastered';
    else if (p.masteryLevel === 1) status = 'learning';
    userProgressMap.set(p.kanjiId, status);
  }

  return onyomiGroupsData.map(group => {
    const jlptKanji = group.kanji;
    const total = jlptKanji.length;
    let mastered = 0, learning = 0, unlearned = 0;
    for (const kanji of jlptKanji) {
      const status = userProgressMap.get(kanji.id) || 'unlearned';
      if (status === 'mastered') mastered++;
      else if (status === 'learning') learning++;
      else unlearned++;
    }
    return {
      reading: group.reading,
      usefulness_score: group.usefulness_score,
      mastered,
      learning,
      unlearned,
      total,
      kanjiCount: total
    };
  });
}

async function getJlptGroups(userId, jlptLevel, options) {
  const levelNum = parseInt(jlptLevel || '5', 10);
  return await getJLPTSpecificGroups(userId, levelNum, options);
}

export async function getAggregatedStats(userId, track, jlptLevel) {
  const groups = await getGroupsData(userId, track, jlptLevel);
  const totalGroups = groups.length;
  let totalKanji = 0, mastered = 0, learning = 0;
  for (const g of groups) {
    totalKanji += g.total;
    mastered += g.mastered;
    learning += g.learning;
  }
  return { totalGroups, totalKanji, mastered, learning };
}