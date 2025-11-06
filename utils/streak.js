import { prisma } from '@/lib/prisma';
import { format, subDays } from 'date-fns';

export async function updateStreak(userId) {
  if (!userId) return 0;

  const latestStudy = await prisma.userProgress.findFirst({
    where: { userId },
    orderBy: { lastStudied: 'desc' },
    select: { lastStudied: true }
  });

  if (!latestStudy) return 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStudyDate: true }
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const lastStudyDate = format(new Date(latestStudy.lastStudied), 'yyyy-MM-dd');

  let newStreak = 1; 

  if (user?.lastStudyDate) {
    const lastRecordedDate = format(new Date(user.lastStudyDate), 'yyyy-MM-dd');

    if (lastRecordedDate === today) {
      newStreak = user.streak;
    } else {

      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      if (lastRecordedDate === yesterday) {

        newStreak = user.streak + 1;
      }

    }
  } else {

    newStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
     data:{
      streak: newStreak,
      lastStudyDate: new Date() 
    }
  });

  return newStreak;
}