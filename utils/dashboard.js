import { prisma } from '@/lib/prisma';
import { ProgressService, getUserId } from '@/utils/progress';
import { getGroupStats } from '@/utils/groupstats';

export async function findIntelligentNextGroup(userId) {
  if (!userId) {
    console.error("findIntelligentNextGroup called without userId");
    return null;
  }

  try {

    const allGroups = await prisma.onyomiGroup.findMany({
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

    const userProgress = await prisma.UserProgress.findMany({
      where: {
        userId: userId
      },
      select: {
        kanjiId: true,
        masteryLevel: true,
        kanji: {
          select: {
            primary_onyomi: true
          }
        }
      }
    });

    const progressByGroup = new Map();
    userProgress.forEach(progress => {
      const group = progress.kanji?.primary_onyomi;
      if (!group) return;

      if (!progressByGroup.has(group)) {
        progressByGroup.set(group, { mastered: 0, learning: 0 });
      }

      const stats = progressByGroup.get(group);
      if (progress.masteryLevel === 2) stats.mastered++;
      else if (progress.masteryLevel === 1) stats.learning++;

    });

    let bestGroup = null;
    let bestPriorityScore = -1;

    for (const group of allGroups) {
      const totalKanji = group._count.kanji;

      if (totalKanji === 0) continue;

      const progress = progressByGroup.get(group.reading) || {
        mastered: 0,
        learning: 0
      };

      const actualUnlearned = totalKanji - progress.mastered - progress.learning;

      const totalPoints = (progress.mastered * 2) + (progress.learning * 1) + (actualUnlearned * 0);
      const maxPossiblePoints = totalKanji * 2;

      const normalizedScore = maxPossiblePoints > 0
        ? (totalPoints / maxPossiblePoints) * 100
        : 0;

      let priorityScore;
      if (normalizedScore >= 95) {

        priorityScore = 0;
      } else {

        priorityScore = (normalizedScore * 10) + (group.usefulness_score * 0.1);
      }

      if (priorityScore > bestPriorityScore) {
        bestPriorityScore = priorityScore;
        bestGroup = {
          reading: group.reading,
          usefulness_score: group.usefulness_score,
          priority_score: priorityScore
        };
      }
    }

    return bestGroup;

  } catch (error) {
    console.error("Error in findIntelligentNextGroup:", error);

    return null;
  }
}

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
      intelligentNextGroup,
      groupStats,
      recentActivity,
      weeklyStats
    ] = await Promise.all([
      ProgressService.getOverallProgress(userId),
      prisma.onyomiGroup.count(),
      findIntelligentNextGroup(userId),
      getGroupStats(userId),
      getRecentActivity(userId),
      getWeeklyStats(userId)
    ]);

    const nextGroupToUse = intelligentNextGroup || { reading: 'にち', usefulness_score: 100 };

    return {

      progress: progress,

      nextGroup: nextGroupToUse,

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