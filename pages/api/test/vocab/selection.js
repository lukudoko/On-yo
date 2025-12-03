import { getUserId } from '@/utils/progress';
import { getVocabTestItems } from '@/utils/vocabtest';

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
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { limit = '20' } = req.query;
    const parsedLimit = parseInt(limit, 10);

    const validLimits = [10, 20, 30];
    const finalLimit = validLimits.includes(parsedLimit) ? parsedLimit : 20;

    const items = await getVocabTestItems(userId, finalLimit);

    if (items.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No vocab items available. Review more kanji to unlock vocab practice!',
        vocab: []
      });
    }

    res.status(200).json({ success: true, vocab: items });

  } catch (error) {
    console.error('Vocab selection error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
}