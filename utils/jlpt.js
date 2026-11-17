import { prisma } from '@/lib/prisma';

const JLPT_LEVELS = [5, 4, 3, 2, 1];

export async function getUserJlptProgress(userId) {
  if (!userId) {
    console.error("getUserJlptProgress called without userId");
    return {};
  }

  try {
    const [jlptKanji, progressRows] = await Promise.all([
      prisma.kanji.findMany({
        where: { jlpt_new: { not: null } },
        select: { id: true, jlpt_new: true },
      }),
      prisma.userProgress.findMany({
        where: { userId },
        select: {
          masteryLevel: true,
          kanji: { select: { jlpt_new: true } },
        },
      }),
    ]);

    const totals = {};
    for (const kanji of jlptKanji) {
      totals[kanji.jlpt_new] = (totals[kanji.jlpt_new] ?? 0) + 1;
    }

    const levelProgress = {};

    for (const level of JLPT_LEVELS) {
      const totalKanji = totals[level] ?? 0;
      const rows = progressRows.filter(row => row.kanji?.jlpt_new === level);

      const mastered = rows.filter(row => row.masteryLevel >= 2).length;
      const learning = rows.filter(row => row.masteryLevel === 1).length;

      levelProgress[`n${level}`] = {
        level,
        totalKanji,
        mastered,
        learning,
        unlearned: Math.max(0, totalKanji - mastered - learning),
        percentage: totalKanji > 0
          ? Math.round(((mastered + learning * 0.5) / totalKanji) * 100)
          : 0,
        masteredPercentage: totalKanji > 0
          ? (mastered / totalKanji) * 100
          : 0,
      };
    }

    return levelProgress;
  } catch (error) {
    console.error("Error in getUserJlptProgress:", error);
    return {};
  }
}

export async function getUserJlptLevel(userId) {
  if (!userId) {
    console.error("getUserJlptLevel called without userId");
    return 5;
  }

  try {
    const progress = await getUserJlptProgress(userId);

    if (!progress || Object.keys(progress).length === 0) {
      return 5;
    }

    for (const level of JLPT_LEVELS) {
      const levelProgress = progress[`n${level}`];

      if (!levelProgress || levelProgress.totalKanji === 0) continue;

      const isComplete = levelProgress.mastered === levelProgress.totalKanji;

      if (!isComplete) {
        return level;
      }
    }

    return 1;
  } catch (error) {
    console.error("Error in getUserJlptLevel:", error);
    return 5;
  }
}