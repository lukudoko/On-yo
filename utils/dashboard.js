import { prisma } from '@/lib/prisma';
import { ProgressService, getUserId } from '@/utils/progress';
import { getGroupStats } from '@/utils/groupstats';
import { findIntelligentNextGroup } from '@/utils/recommendation';
import { getUserJlptLevel, getUserJlptProgress } from '@/utils/jlpt';
import { getKanjiThisWeek } from '@/utils/weeklystats'; 

export async function getDashboardData(req, res) {
  try {
    const userId = await getUserId(req, res);

    if (!userId) {
      console.log("Dashboard data requested for unauthenticated user.");
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true, streak: true }
    });

    const userTrack = user?.track || 'stat';

    const [
      progress,
      totalGroups,
      intelligentNextGroup,
      groupStats,
      jlptLevel,
      jlptProgress,
      kanjiThisWeek
    ] = await Promise.all([
      ProgressService.getOverallProgress(userId),
      prisma.onyomiGroup.count(),
      findIntelligentNextGroup(userId, userTrack),
      getGroupStats(userId),
      getUserJlptLevel(userId),
      userTrack === 'jlpt' ? getUserJlptProgress(userId) : Promise.resolve(null),
      getKanjiThisWeek(userId) // Add the weekly count
    ]);

    // Track-specific stats
    let trackSpecificStats = {};
    
    if (userTrack === 'jlpt') {
      trackSpecificStats = jlptProgress;
    } else {
      trackSpecificStats = {
        totalGroups,
        completedGroups: groupStats.completedGroups,
        inProgressGroups: groupStats.inProgressGroups
      };
    }

    return {
      progress,
      nextGroup: intelligentNextGroup,
      track: userTrack,
      jlptLevel,
      trackSpecificStats,
      streak: user?.streak || 0,
      kanjiThisWeek 
    };

  } catch (error) {
    console.error("Error in getDashboardData utility:", error);
    return null;
  }
}