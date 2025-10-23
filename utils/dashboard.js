import { prisma } from '@/lib/prisma';
import { ProgressService, getUserId } from '@/utils/progress';
import { getGroupStats } from '@/utils/groupstats';
import { findIntelligentNextGroup } from '@/utils/recommendation';

export async function getDashboardData(req, res) {
  try {
    const userId = await getUserId(req, res);

    if (!userId) {
      console.log("Dashboard data requested for unauthenticated user.");
      return null;
    }

    // Fetch the user's track preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true }
    });

    const userTrack = user?.track || 'stat'; // Default to 'stat' if not set

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
      findIntelligentNextGroup(userId, userTrack), // Use the user's track preference
      getGroupStats(userId),
      getRecentActivity(userId),
      getWeeklyStats(userId)
    ]);

    const nextGroupToUse = intelligentNextGroup;

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

// Keep your helper functions in this file
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
    return [];
  }
  
  try {
    // Get all progress from the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentProgress = await prisma.userProgress.findMany({
      where: {
        userId: userId,
        lastStudied: { gte: fourteenDaysAgo },
        masteryLevel: { in: [1, 2] }
      },
      select: {
        lastStudied: true
      }
    });
    
    return recentProgress.map(p => p.lastStudied.toISOString());
  } catch (error) {
    console.error("Error getting weekly stats:", error);
    return [];
  }
}