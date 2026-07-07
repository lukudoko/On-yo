import { BaseTestService } from '@/services/tests';
import { getVocabTestItems } from '@/utils/tests/vocab';

export class VocabTestService extends BaseTestService {
  constructor() {
    super('vocab');
  }

  async getTestItems(userId, limit = 20) {
    const validLimits = [10, 20, 30];
    const finalLimit = validLimits.includes(limit) ? limit : 20;

    const items = await getVocabTestItems(userId, finalLimit);

    if (items.length === 0) {
      return {
        success: false,
        error: 'No vocab items available. Review more kanji to unlock vocab practice!',
        vocab: []
      };
    }

    return { success: true, vocab: items };
  }

  async getTestItemsWithLimit(userId, query) {
    const { limit = '20' } = query;
    const parsedLimit = parseInt(limit, 10);
    return await this.getTestItems(userId, parsedLimit);
  }
}