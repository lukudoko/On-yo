import { getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';
import { getTestableKanji } from '@/utils/reviewtest';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const referer = req.headers.referer || req.headers.origin;
  if (!referer || !referer.includes(req.headers.host)) {
    return res.redirect(307, '/404');
  }

  try {
    const userId = await getUserId(req, res);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const allTestable = await getTestableKanji(userId);

    if (allTestable.length < 15) {
      return res.status(200).json({
        success: false,
        error: 'Not enough kanji available for testing. Please wait for cooldowns to expire.',
        availableCount: allTestable.length,
        kanji: []
      });
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

    return res.status(200).json({
      success: true,
      kanji: kanjiWithOptions.map(k => ({
        ...k,
        lastStudied: k.lastStudied.toISOString(),
        createdAt: k.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('API Error selecting test kanji:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}