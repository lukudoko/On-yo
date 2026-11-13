import { prisma } from '@/lib/prisma';

export async function getUserTrack(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { track: true },
  });

  if (!user) throw new Error('User not found');
  return user.track;
}