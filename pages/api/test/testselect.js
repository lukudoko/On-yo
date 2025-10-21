import { getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';
import { getTestableKanji } from '@/utils/test';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const expectedToken = process.env.API_TOKEN || 'fallback-token-for-dev';
  const providedToken = req.headers['x-api-token'];

  if (providedToken !== expectedToken) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid API token'
    });
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

    const allGroups = await prisma.onyomiGroup.findMany({
      select: {
        reading: true
      }
    });
    const allReadings = allGroups.map(g => g.reading);

    const learningKanji = allTestable.filter(k => k.masteryLevel === 1);
    const knownKanji = allTestable.filter(k => k.masteryLevel === 2);

    const minKnown = 2;
    const maxKnown = 5;
    const targetKnown = Math.min(
      knownKanji.length,
      Math.max(minKnown, Math.floor(Math.random() * (maxKnown - minKnown + 1)) + minKnown)
    );

    const targetLearning = Math.min(
      learningKanji.length,
      15 - targetKnown
    );

    const shuffledLearning = [...learningKanji].sort(() => 0.5 - Math.random());
    const shuffledKnown = [...knownKanji].sort(() => 0.5 - Math.random());

    const selectedKanji = [
      ...shuffledLearning.slice(0, targetLearning),
      ...shuffledKnown.slice(0, targetKnown)
    ].sort(() => 0.5 - Math.random());

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
    } else if (writeInCount < 3) {

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