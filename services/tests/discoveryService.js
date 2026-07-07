import { BaseTestService } from '@/services/tests';
import { getDiscoveryKanji } from '@/utils/tests/discovery';
import { getUserJlptLevel } from '@/utils/jlpt';

export class DiscoveryTestService extends BaseTestService {
  constructor() {
    super('discovery');
  }

  async getTestItems(userId, track) {
    let computedJlptLevel = 5;

    if (track === 'jlpt') {
      computedJlptLevel = await getUserJlptLevel(userId);
    }

    const discoveryKanji = await getDiscoveryKanji(userId, track, computedJlptLevel, 7);

    if (discoveryKanji.length === 0) {
      const message = track === 'jlpt' 
        ? `You've discovered all kanji in JLPT N${computedJlptLevel}! Keep reviewing to unlock the next level.`
        : "You've discovered all available kanji! Master more kanji in your review tests to unlock new groups.";
      
      return { 
        success: false, 
        error: message, 
        kanji: [] 
      };
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
        jlpt: k.jlpt
      }
    }));

    return { success: true, kanji: formatted };
  }

  // Override the base method to include track in the workflow
  async getTestItemsWithTrack(userId) {
    const track = await this.getUserTrack(userId);
    return await this.getTestItems(userId, track);
  }
}