import { prisma } from '@/lib/prisma';

export async function getUserJlptLevel(userId) {
  if (!userId) {
    console.error("getUserJlptLevel called without userId");
    return 5; 
  }

  try {
    const jlptLevels = [5, 4, 3, 2, 1]; 

    for (const level of jlptLevels) {

      const jlptKanji = await prisma.kanji.findMany({
        where: {
          jlpt_new: level
        },
        select: {
          id: true
        }
      });

      if (jlptKanji.length === 0) continue;

      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId: userId,
          kanjiId: {
            in: jlptKanji.map(k => k.id)
          }
        },
        select: {
          kanjiId: true,
          masteryLevel: true
        }
      });

      const mastered = userProgress.filter(p => p.masteryLevel >= 2).length;

      const totalKanji = jlptKanji.length;
      const masteryPercentage = totalKanji > 0 
        ? (mastered / totalKanji) * 100
        : 0;

      const completionThreshold = 99; 

      if (masteryPercentage < completionThreshold) {

        return level;
      }
    }

    return 1;

  } catch (error) {
    console.error("Error in getUserJlptLevel:", error);
    return 5; 
  }
}

export async function getUserJlptProgress(userId) {
  if (!userId) {
    console.error("getUserJlptProgress called without userId");
    return {};
  }

  try {
    const jlptLevels = [5, 4, 3, 2, 1];
    const levelProgress = {};

    for (const level of jlptLevels) {
      const jlptKanji = await prisma.kanji.findMany({
        where: {
          jlpt_new: level
        },
        select: {
          id: true
        }
      });

      if (jlptKanji.length === 0) {
        levelProgress[`n${level}`] = {
          level: level,
          totalKanji: 0,
          mastered: 0,
          learning: 0,
          unlearned: 0,
          percentage: 0
        };
        continue;
      }

      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId: userId,
          kanjiId: {
            in: jlptKanji.map(k => k.id)
          }
        },
        select: {
          kanjiId: true,
          masteryLevel: true
        }
      });

      const progressMap = {};
      userProgress.forEach(p => {
        progressMap[p.kanjiId] = p.masteryLevel;
      });

      let mastered = 0;
      let learning = 0;
      let unlearned = 0;

      jlptKanji.forEach(kanji => {
        const masteryLevel = progressMap[kanji.id];
        if (masteryLevel === undefined) {
          unlearned++;
        } else if (masteryLevel >= 2) {
          mastered++;
        } else if (masteryLevel === 1) {
          learning++;
        } else {
          unlearned++;
        }
      });

      const totalKanji = jlptKanji.length;
      const percentage = totalKanji > 0
        ? Math.round(((mastered + learning * 0.5) / totalKanji) * 100)
        : 0;

      levelProgress[`n${level}`] = {
        level: level,
        totalKanji: totalKanji,
        mastered: mastered,
        learning: learning,
        unlearned: unlearned,
        percentage: percentage
      };
    }

    return levelProgress;

  } catch (error) {
    console.error("Error in getUserJlptProgress:", error);
    return {};
  }
}