import { prisma } from '@/lib/prisma';
import { startOfWeek, startOfDay } from 'date-fns';

export async function getKanji(userId) {
  if (!userId) return 0;

  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const count = await prisma.userProgress.count({
    where: {
      userId,
      OR: [
        { lastStudiedKanji: { gte: startOfCurrentWeek } },
        { lastStudiedVocab: { gte: startOfCurrentWeek } }
      ]
    }
  });

  return count;
}

export async function getKanjiToday(userId) {
  if (!userId) return 0;

  const startOfToday = startOfDay(new Date());
  const count = await prisma.userProgress.count({
    where: {
      userId,
      OR: [
        { lastStudiedKanji: { gte: startOfToday } },
        { lastStudiedVocab: { gte: startOfToday } }
      ]
    }
  });

  return count;
}