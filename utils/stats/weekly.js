import { prisma } from '@/lib/prisma';
import { startOfWeek, isSameWeek } from 'date-fns';

export async function getKanjiThisWeek(userId) {
  if (!userId) return 0;

  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); 

  const count = await prisma.userProgress.count({
    where: {
      userId,
      lastStudied: {
        gte: startOfCurrentWeek
      }
    }
  });

  return count;
}