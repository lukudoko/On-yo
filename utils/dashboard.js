import { prisma } from '@/lib/prisma';
import { getGroupStats } from '@/utils/stats/group';
import { findIntelligentNextGroup } from '@/utils/recommendation';
import { getUserJlptLevel, getUserJlptProgress } from '@/utils/jlpt';
import { getKanjiThisWeek } from '@/utils/stats/weekly'; 
import { getGoalProgress } from '@/utils/progress';

export async function getDashboardData(userId) {
  if (!userId) {
    console.log("Dashboard data requested for unauthenticated user.");
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true, streak: true, goalLevel: true }
    });

    const userTrack = user?.track || 'stat';
    const userGoalLevel = user?.goalLevel;

    const [
      totalGroups,
      intelligentNextGroup,
      groupStats,
      jlptLevel,
      jlptProgress,
      kanjiThisWeek
    ] = await Promise.all([
      prisma.onyomiGroup.count(),
      findIntelligentNextGroup(userId, userTrack),
      getGroupStats(userId),
      getUserJlptLevel(userId),
      userTrack === 'jlpt' ? getUserJlptProgress(userId) : Promise.resolve(null),
      getKanjiThisWeek(userId)
    ]);

    const progress = await getGoalProgress(userId, userTrack, userGoalLevel);

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