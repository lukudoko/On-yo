"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMastery(kanjiId, newLevel) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  await prisma.userProgress.upsert({
    where: {
      userId_kanjiId: { userId, kanjiId },
    },
    update: { masteryLevel: newLevel },
    create: {
      userId,
      kanjiId,
      masteryLevel: newLevel,
    },
  });

  revalidatePath("/groups/[group]", "page");
}