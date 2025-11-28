// pages/api/debug/vocab.js
import { getUserId } from '@/utils/progress';
import { getVocabTestItems } from '@/utils/vocabtest';

export default async function handler(req, res) {
  // Use your real auth flow
  const userId = await getUserId(req, res);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const items = await getVocabTestItems(userId);
    res.json(items);
  } catch (error) {
    console.error('Debug vocab error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}