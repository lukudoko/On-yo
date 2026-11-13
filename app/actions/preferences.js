"use server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function changeTrack(newTrack) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!['stat', 'jlpt'].includes(newTrack)) {
    throw new Error('Invalid track. Must be "stat" or "jlpt"');
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { track: newTrack },
  });
}

export async function changeGoalLevel(newGoalLevel) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validGoals = ['n5', 'n4', 'n3', 'n2', 'n1'];
  if (!validGoals.includes(newGoalLevel)) {
    throw new Error(`Invalid goal level. Must be one of: ${validGoals.join(', ')}`);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { goalLevel: newGoalLevel },
  });
}