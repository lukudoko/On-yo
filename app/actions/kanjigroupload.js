"use server";

import { getSession } from "@/lib/auth";
import { getGroupsData } from "@/lib/groups";
import { prisma } from "@/lib/prisma";

export async function loadMoreGroups(skip, take, jlptLevel) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { track: true },
  });
  const track = user?.track || "stat";

  const groups = await getGroupsData(session.user.id, track, jlptLevel, {
    skip,
    take,
  });
  return groups;
}