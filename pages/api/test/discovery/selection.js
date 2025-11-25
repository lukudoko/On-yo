import { getUserId } from '@/utils/progress';
import { getDiscoveryKanji } from '@/utils/discoverytest';
import { getUserJlptLevel } from '@/utils/jlpt';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const expectedToken = process.env.API_TOKEN || 'fallback-token-for-dev';
  const providedToken = req.headers['x-api-token'];

  if (providedToken !== expectedToken) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid API token' });
  }

  try {
    const userId = await getUserId(req, res);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // ✅ ONLY select `track` — jlptLevel is computed, not stored
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { track } = user;
    let computedJlptLevel = 5; // default

    if (track === 'jlpt') {
      computedJlptLevel = await getUserJlptLevel(userId);
    }

    const discoveryKanji = await getDiscoveryKanji(userId, track, computedJlptLevel, 7);

    if (discoveryKanji.length === 0) {
      let message;
      if (track === 'jlpt') {
        message = `You've discovered all kanji in JLPT N${computedJlptLevel}! Keep reviewing to unlock the next level.`;
      } else {
        message = "You've discovered all available kanji! Master more kanji in your review tests to unlock new groups.";
      }
      return res.status(200).json({
        success: false,
        error: message,
        kanji: []
      });
    }

    const formatted = discoveryKanji.map(k => ({
      kanjiId: k.id,
      testType: 'write-in',
      correctAnswer: k.onyomi,
      hints: k.knownPeers,
      masteryLevel: 0,
      kanji: {
        character: k.character,
        primary_onyomi: k.onyomi,
        jlpt: k.jlpt // this comes from kanji.jlpt_new (handled in discoverytest.js)
      }
    }));

    return res.status(200).json({
      success: true,
      kanji: formatted
    });

  } catch (error) {
    console.error('Discovery test error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}