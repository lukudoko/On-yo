// utils/groupStats.js
import { prisma } from '@/lib/prisma';

export async function getGroupStats(userId) {
  if (!userId) {
    return { completedGroups: 0, inProgressGroups: 0 };
  }

  try {
    const allGroups = await prisma.onyomiGroup.findMany({
      select: {
        reading: true,
        kanji: {
          select: {
            id: true,
            progress: {
              where: { userId: userId },
              select: { masteryLevel: true }
            }
          }
        }
      }
    });

    let completedGroups = 0;
    let inProgressGroups = 0;

    allGroups.forEach(group => {
      const totalKanji = group.kanji.length;
      if (totalKanji === 0) return;

      const masteredKanji = group.kanji.filter(k =>
        k.progress.some(p => p.masteryLevel === 2)
      ).length;

      const studiedKanji = group.kanji.filter(k =>
        k.progress.length > 0
      ).length;

      if (masteredKanji === totalKanji) {
        completedGroups++;
      } else if (studiedKanji > 0) {
        inProgressGroups++;
      }
    });

    return { completedGroups, inProgressGroups };
  } catch (error) {
    console.error("Error getting group stats:", error);
    return { completedGroups: 0, inProgressGroups: 0 };
  }
}
