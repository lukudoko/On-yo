import { prisma } from '@/lib/prisma';

export async function getTestableKanji(userId, limit = 15) {
  const COOLDOWN_HOURS = 12; 

  const now = new Date();

  const allTestable = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] }, 
      testStreak: { lt: 7 }, 
      lastStudied: { lte: new Date(now.getTime() - COOLDOWN_HOURS * 60 * 60 * 1000) }
    },
    include: {
      kanji: true
    },
    orderBy: [
      { masteryLevel: 'asc' }, 
      { lastStudied: 'asc' }   
    ]

  });

  return allTestable;
}

export async function handleTestResult(userId, kanjiId, isCorrect) {
  const progress = await prisma.userProgress.findUnique({
    where: { 
      userId_kanjiId: { userId, kanjiId } 
    }
  });

  if (!progress) throw new Error('Progress not found');

  let newStreak = isCorrect ? Math.min(7, progress.testStreak + 1) : Math.max(-3, progress.testStreak - 1);
  let newMasteryLevel = progress.masteryLevel;

  if (progress.masteryLevel === 1 && newStreak >= 7) { 
    newMasteryLevel = 2;
    newStreak = 0; 
  } else if (progress.masteryLevel === 1 && newStreak <= -3) { 
    newMasteryLevel = 0;
    newStreak = 0; 
  } else if (progress.masteryLevel === 2 && newStreak >= 7) { 

    newMasteryLevel = 2;
    newStreak = 7; 
  } else if (progress.masteryLevel === 2 && newStreak <= -3) { 
    newMasteryLevel = 1;
    newStreak = 0; 
  }

  const updated = await prisma.userProgress.update({
    where: { 
      userId_kanjiId: { userId, kanjiId } 
    },
    data: {
      testStreak: newStreak,
      masteryLevel: newMasteryLevel,
      lastStudied: new Date() 
    }
  });

  return updated;
}