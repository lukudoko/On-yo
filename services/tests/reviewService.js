import { BaseTestService } from '@/services/tests';
import { getTestableKanji } from '@/utils/tests/review';
import { prisma } from '@/lib/prisma';

export class ReviewTestService extends BaseTestService {
  constructor() {
    super('review');
  }

  async getTestItems(userId) {
    const allTestable = await getTestableKanji(userId);

    if (allTestable.length < 15) {
      return {
        success: false,
        error: 'Not enough kanji available for testing. Please wait for cooldowns to expire.',
        availableCount: allTestable.length,
        kanji: []
      };
    }

    const selectedKanji = allTestable;

    const allGroups = await prisma.onyomiGroup.findMany({
      select: {
        reading: true
      }
    });
    const allReadings = allGroups.map(g => g.reading);

    const kanjiWithOptions = await Promise.all(selectedKanji.map(async (progress) => {
      const isWriteIn = Math.random() < 0.5;

      let multipleChoiceOptions = [];
      if (!isWriteIn) {
        const wrongReadings = allReadings
          .filter(r => r !== progress.kanji.primary_onyomi)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        multipleChoiceOptions = [
          progress.kanji.primary_onyomi,
          ...wrongReadings
        ].sort(() => 0.5 - Math.random());
      }

      let hints = [];
      if (progress.masteryLevel === 1) {
        const sameGroupKanji = await prisma.kanji.findMany({
          where: {
            primary_onyomi: progress.kanji.primary_onyomi
          },
          include: {
            progress: {
              where: {
                userId: userId
              }
            }
          }
        });

        const knownInGroup = sameGroupKanji
          .filter(k => k.progress.length > 0 && k.progress[0].masteryLevel === 2)
          .map(k => k.character);

        hints = knownInGroup.slice(0, 2);
      }

      return {
        ...progress,
        testType: isWriteIn ? 'write-in' : 'multiple-choice',
        multipleChoiceOptions: multipleChoiceOptions,
        correctAnswer: progress.kanji.primary_onyomi,
        hints: hints
      };
    }));

    let multipleChoiceCount = kanjiWithOptions.filter(k => k.testType === 'multiple-choice').length;
    let writeInCount = kanjiWithOptions.filter(k => k.testType === 'write-in').length;

    if (multipleChoiceCount < 5) {
      const writeIns = kanjiWithOptions.filter(k => k.testType === 'write-in');
      const toConvert = Math.min(writeIns.length, 5 - multipleChoiceCount);

      for (let i = 0; i < toConvert; i++) {
        const wrongReadings = allReadings
          .filter(r => r !== writeIns[i].kanji.primary_onyomi)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        writeIns[i].testType = 'multiple-choice';
        writeIns[i].multipleChoiceOptions = [
          writeIns[i].kanji.primary_onyomi,
          ...wrongReadings
        ].sort(() => 0.5 - Math.random());
      }
    }

    if (writeInCount < 3) {
      const multipleChoices = kanjiWithOptions.filter(k => k.testType === 'multiple-choice');
      const toConvert = Math.min(multipleChoices.length, 3 - writeInCount);

      for (let i = 0; i < toConvert; i++) {
        multipleChoices[i].testType = 'write-in';
        multipleChoices[i].multipleChoiceOptions = [];
      }
    }

    return {
      success: true,
      kanji: kanjiWithOptions.map(k => ({
        ...k,
        lastStudied: k.lastStudied.toISOString(),
        createdAt: k.createdAt.toISOString()
      }))
    };
  }
}