import { prisma } from '@/lib/prisma';

export async function updateStreak(userId, clientLocalDate) {
  if (!userId) return 0;

  const isValidDate = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d ?? '') &&
    Math.abs(Date.parse(d) - Date.now()) < 2 * 86_400_000;

  const today = isValidDate(clientLocalDate)
    ? clientLocalDate
    : new Date().toISOString().split('T')[0];

  const [year, month, day] = today.split('-').map(Number);
  const todayDate = new Date(year, month - 1, day);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStudyDate: true, studyDates: true }
  });

  if (!user) return 0;

  let newStreak = user.streak ?? 0;
  let needsUpdate = false;

  if (!user.lastStudyDate) {
    newStreak = 1;
    needsUpdate = true;
  } else {
    if (user.lastStudyDate === today) {
      return user.streak;
    } else {
      const yesterdayDate = new Date(year, month - 1, day - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

      if (user.lastStudyDate === yesterdayStr) {
        newStreak = (user.streak ?? 0) + 1;
        needsUpdate = true;
      } else {
        newStreak = 1;
        needsUpdate = true;
      }
    }
  }

  let updatedDates = user.studyDates || [];

  const isMonday = todayDate.getDay() === 1;

  if (isMonday && !updatedDates.includes(today)) {
    updatedDates = [];
  }

  if (!updatedDates.includes(today)) {
    updatedDates.push(today);
    needsUpdate = true;

    if (updatedDates.length > 7) {
      updatedDates = updatedDates.slice(-7);
    }
  }

  if (needsUpdate) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastStudyDate: today,
        studyDates: updatedDates,
      }
    });
  }

  return newStreak;
}