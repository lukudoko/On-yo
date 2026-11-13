"use server";

import { getSession } from "@/lib/auth";
import { ProgressUpdateService } from "@/services/progress/progressupdateService";

export async function submitReviewAnswer(kanjiId, isCorrect, clientLocalDate = null) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;
  const service = new ProgressUpdateService();

  await service.updateProgress(userId, kanjiId, isCorrect, "review", clientLocalDate);
}