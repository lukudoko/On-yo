import { getDashboardData } from '@/utils/dashboard';
import { getUserJlptLevel } from '@/utils/jlpt';

export async function getUserStats(userId) {
  const fullData = await getDashboardData(userId);
  if (!fullData) {
    throw new Error('Failed to load dashboard data');
  }

  const jlptLevel = await getUserJlptLevel(userId);

  const fullDashboardData = {
    ...fullData,
    jlptLevel: jlptLevel
  };

  return fullDashboardData;
}