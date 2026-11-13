"use server";

import { getSession } from "@/lib/auth";
import { ProgressUpdateService } from "@/services/progress/progressupdateService";

export async function submitDiscoveryAnswer(kanjiId, isCorrect, clientLocalDate = null) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;
  const service = new ProgressUpdateService();

  await service.updateProgress(userId, kanjiId, isCorrect, "discovery", clientLocalDate);
}