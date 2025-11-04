import { prisma } from '@/lib/prisma';
import { ProgressService, getUserId } from '@/utils/progress';
import { getGroupStats } from '@/utils/groupstats';
import { getUserJlptLevel, getUserJlptProgress } from '@/utils/jlpt';

import { findIntelligentNextGroup } from '@/utils/recommendation';

export async function getDashboardData(req, res) {
  try {
    const userId = await getUserId(req, res);

    if (!userId) {
      console.log("Dashboard data requested for unauthenticated user.");
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true }
    });

    const userTrack = user?.track || 'stat';

    const [
      progress,
      totalGroups,
      intelligentNextGroup,
      groupStats,
      jlptLevel,
      jlptProgress
    ] = await Promise.all([
      ProgressService.getOverallProgress(userId),
      prisma.onyomiGroup.count(),
      findIntelligentNextGroup(userId, userTrack),
      getGroupStats(userId),
      getUserJlptLevel(userId),
      userTrack === 'jlpt' ? getUserJlptProgress(userId) : Promise.resolve(null)
    ]);

    // Track-specific stats
    let trackSpecificStats = {};
    
    if (userTrack === 'jlpt') {
      trackSpecificStats = jlptProgress;
    } else {
      // Keep group stats for 'stat' track
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
     // streak: await calculateCurrentStreak(userId)
    };

  } catch (error) {
    console.error("Error in getDashboardData utility:", error);
    return null;
  }
}