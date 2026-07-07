import { prisma } from '@/lib/prisma';

export async function getUserPreferences(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      track: true, 
      goalLevel: true 
    }
  });

  return {
    track: user?.track || 'stat',
    goalLevel: user?.goalLevel || null
  };
}

export async function updateUserPreferences(userId, preferences) {
  const { track, goalLevel } = preferences;

  // Validate inputs
  if (track && !['stat', 'jlpt'].includes(track)) {
    throw new Error('Invalid track. Must be "stat" or "jlpt"');
  }

  if (goalLevel && !['n5', 'n4', 'n3', 'n2', 'n1'].includes(goalLevel)) {
    throw new Error('Invalid goal level. Must be one of: n5, n4, n3, n2, n1');
  }

  const updateData = {};
  if (track !== undefined) updateData.track = track;
  if (goalLevel !== undefined) updateData.goalLevel = goalLevel;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { track: true, goalLevel: true }
  });

  return {
    track: updatedUser.track,
    goalLevel: updatedUser.goalLevel
  };
}