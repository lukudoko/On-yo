import { prisma } from '@/lib/prisma';

export async function getTestableKanji(userId, limit = 15) {
  const now = new Date();
  const learningCooldown = 12 * 60 * 60 * 1000; 
  const maintenanceCooldown = 45 * 24 * 60 * 60 * 1000; 

  const masteredKanji = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: 2,
      testStreak: 7,
      lastStudied: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
    }
  });

  for (const progress of masteredKanji) {
    await prisma.userProgress.update({
      where: { 
        userId_kanjiId: { userId, kanjiId: progress.kanjiId } 
      },
      data: { testStreak: 6 } 
    });
  }

  const allTestable = await prisma.userProgress.findMany({
    where: {
      userId,
      masteryLevel: { in: [1, 2] },
      OR: [

        {
          masteryLevel: 1,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - learningCooldown) }
        },

        {
          masteryLevel: 2,
          testStreak: { lt: 7 },
          lastStudied: { lte: new Date(now.getTime() - learningCooldown) }
        },

        {
          masteryLevel: 2,
          testStreak: 6, 
          lastStudied: { lte: new Date(now.getTime() - learningCooldown) }
        }
      ]
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

  const timeSinceLastStudy = Date.now() - progress.lastStudied.getTime();
  const daysSinceLastStudy = timeSinceLastStudy / (1000 * 60 * 60 * 24);

  let baseStreak = progress.testStreak;

  if (daysSinceLastStudy > 30 && progress.testStreak > 0) {
    const decayAmount = Math.min(progress.testStreak, Math.floor(daysSinceLastStudy / 30));
    baseStreak = Math.max(0, progress.testStreak - decayAmount);
  }

  let newStreak = isCorrect ? Math.min(7, baseStreak + 1) : Math.max(-3, baseStreak - 1);
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