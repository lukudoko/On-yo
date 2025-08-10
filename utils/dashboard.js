import { prisma } from '@/lib/prisma'; 
import { ProgressService, getUserId } from '@/utils/progress'; 
import { getGroupStats } from '@/utils/groupstats'; // new import

export async function getDashboardData(req, res) {
  try {

    const userId = await getUserId(req, res); 

    if (!userId) {
      console.log("Dashboard data requested for unauthenticated user.");
      return null;
    }
  const [
    progress,
    totalGroups,
    nextGroup,
    groupStats,
    recentActivity,
    weeklyStats
  ] = await Promise.all([
    ProgressService.getOverallProgress(userId),
    prisma.onyomiGroup.count(),
    findNextGroup(userId),
    getGroupStats(userId), // now using shared util
    getRecentActivity(userId),
    getWeeklyStats(userId)
  ]);

    
    return {

      progress: progress,

      nextGroup: nextGroup || { reading: 'にち', usefulness_score: 100 }, 

      stats: {
        totalKanji: progress.total,
        masteredKanji: progress.mastered,
        totalGroups: totalGroups,
        completedGroups: groupStats.completedGroups,
        inProgressGroups: groupStats.inProgressGroups
      },

      recentActivity: recentActivity,
      weeklyStats: weeklyStats
    };

  } catch (error) {

    console.error("Error in getDashboardData utility:", error);

    return null; 
  }
}

async function findNextGroup(userId) {
  if (!userId) return null;

  try {

    const nextGroup = await prisma.onyomiGroup.findFirst({
      where: {
        kanji: {
          some: {
            progress: {
              none: {
                userId: userId,
                masteryLevel: 2 
              }
            }
          }
        }
      },
      orderBy: { usefulness_score: 'desc' },
      select: { reading: true, usefulness_score: true }
    });

    return nextGroup;
  } catch (error) {
    console.error("Error finding next group:", error);
    return null; 
  }
}


async function getRecentActivity(userId, limit = 5) {
  if (!userId) return [];

  try {
    const recentProgress = await prisma.userProgress.findMany({
      where: { userId: userId },
      orderBy: { lastStudied: 'desc' },
      take: limit,
      select: {
        kanji: {
          select: {
            character: true,
            primary_onyomi: true,
            jlpt_new: true 
          }
        },
        masteryLevel: true,
        lastStudied: true
      }
    });

    return recentProgress.map(item => ({
      kanji: item.kanji.character,
      onyomi: item.kanji.primary_onyomi,
      jlptLevel: item.kanji.jlpt_new,
      masteryLevel: item.masteryLevel,
      lastStudied: item.lastStudied ? item.lastStudied.toISOString() : null
    }));
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return []; 
  }
}

async function getWeeklyStats(userId) {
  if (!userId) {
    return { thisWeek: 0, lastWeek: 0 };
  }

  try {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const [thisWeekCount, lastWeekCount] = await Promise.all([
      prisma.userProgress.count({
        where: {
          userId: userId,
          lastStudied: { gte: startOfWeek },
          masteryLevel: { in: [1, 2] } 
        }
      }),
      prisma.userProgress.count({
        where: {
          userId: userId,
          lastStudied: {
            gte: startOfLastWeek,
            lt: startOfWeek
          },
          masteryLevel: { in: [1, 2] }
        }
      })
    ]);

    return { thisWeek: thisWeekCount, lastWeek: lastWeekCount };
  } catch (error) {
    console.error("Error getting weekly stats:", error);
    return { thisWeek: 0, lastWeek: 0 }; 
  }
}