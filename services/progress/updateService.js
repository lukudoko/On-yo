import { ProgressService } from '@/services/progress';
import { updateStreak } from '@/utils/streak';

export async function updateKanjiProgress(userId, kanji, masteryLevel) {

  if (!kanji || masteryLevel === undefined) {
    throw new Error('Kanji and masteryLevel are required');
  }

  if (![0, 1, 2].includes(masteryLevel)) {
    throw new Error('Invalid mastery level. Must be 0, 1, or 2');
  }

  const result = await ProgressService.updateKanjiMastery(userId, kanji, masteryLevel);

  await updateStreak(userId);

  return result;
}