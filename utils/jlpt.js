import { prisma } from '@/lib/prisma';

// Combined function: calculates progress and returns the user's level
export async function getUserJlptLevel(userId) {
  if (!userId) {
    console.error("getUserJlptLevel called without userId");
    return 5; // Default to N5
  }

  try {
    const jlptLevels = [5, 4, 3, 2, 1]; // N5 to N1
    let highestPercentage = -1;
    let currentLevel = 5; // Default to N5
    const levelProgress = {}; // For logging purposes

    for (const level of jlptLevels) {
      // Get all kanji for this JLPT level
      const jlptKanji = await prisma.kanji.findMany({
        where: {
          jlpt_new: level
        },
        select: {
          id: true
        }
      });

      if (jlptKanji.length === 0) {
        levelProgress[`N${level}`] = {
          level: level,
          totalKanji: 0,
          mastered: 0,
          learning: 0,
          percentage: 0
        };
        continue;
      }

      // Get user's progress for these kanji
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

      // Calculate stats
      const mastered = userProgress.filter(p => p.masteryLevel === 2).length;
      const learning = userProgress.filter(p => p.masteryLevel === 1).length;
      
      const totalKanji = jlptKanji.length;
      const percentage = totalKanji > 0 
        ? Math.round(((mastered + learning * 0.5) / totalKanji) * 100)
        : 0;

      levelProgress[`N${level}`] = {
        level: level,
        totalKanji: totalKanji,
        mastered: mastered,
        learning: learning,
        percentage: percentage
      };

      // Update the current level if this level has the highest percentage
      if (percentage > highestPercentage) {
        highestPercentage = percentage;
        currentLevel = level;
      }
    }

    return currentLevel;

  } catch (error) {
    console.error("Error in getUserJlptLevel:", error);
    return 5; // Default to N5 if there's an error
  }
}