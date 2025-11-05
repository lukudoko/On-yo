// utils/simpleStreak.js
import { prisma } from '@/lib/prisma';
import { format, addDays, isSameDay } from 'date-fns';

export async function updateStreak(userId) {
  if (!userId) return 0;

  // Get the most recent study time
  const latestStudy = await prisma.userProgress.findFirst({
    where: { userId },
    orderBy: { lastStudied: 'desc' },
    select: { lastStudied: true }
  });

  if (!latestStudy) return 0;

  // Get current streak and last study date from user record
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStudyDate: true }
  });

  // Format dates as YYYY-MM-DD strings for comparison
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastStudyDate = format(new Date(latestStudy.lastStudied), 'yyyy-MM-dd');

  let newStreak = 1; // Default to 1

  if (user?.lastStudyDate) {
    const lastRecordedDate = format(new Date(user.lastStudyDate), 'yyyy-MM-dd');
    
    if (lastStudyDate === today) {
      // They studied today - keep same streak
      newStreak = user.streak;
    } else if (isConsecutiveDay(lastRecordedDate, today)) {
      // They studied yesterday (last recorded), studying today - increment streak
      newStreak = user.streak + 1;
    }
    // If not consecutive, newStreak stays 1 (streak resets)
  } else {
    // First time tracking
    newStreak = 1;
  }

  // Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      lastStudyDate: new Date() // Store full date for comparison next time
    }
  });

  return newStreak;
}

function isConsecutiveDay(previousDate, currentDate) {
  const previous = new Date(previousDate);
  const expectedNextDay = addDays(previous, 1);
  const current = new Date(currentDate);
  
  return isSameDay(expectedNextDay, current);
}