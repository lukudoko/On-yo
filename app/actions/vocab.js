"use server";

import { getSession } from "@/lib/auth";
import { ProgressUpdateService } from "@/services/progress/progressupdateService";
import { getVocabTestItems } from "@/utils/tests/kanjitests";

const VALID_LIMITS = [10, 20, 30];

export async function getVocabTestData(limit = 20) {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;

  const finalLimit = VALID_LIMITS.includes(Number(limit)) ? Number(limit) : 20;

  try {
    const vocabItems = await getVocabTestItems(userId, finalLimit);

    if (vocabItems.length === 0) {
      return {
        success: false,
        error: "No vocab items available. Review more kanji to unlock vocab practice!",
        vocab: [],
      };
    }

    return { success: true, vocab: vocabItems };
  } catch (error) {
    return { success: false, error: error.message, vocab: [] };
  }
}

export async function submitVocabAnswer(kanjiId, isCorrect, clientLocalDate = null) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;
  const service = new ProgressUpdateService();

  await service.updateProgress(userId, kanjiId, isCorrect, "vocab", clientLocalDate);
}