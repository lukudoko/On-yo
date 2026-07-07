import { VocabTestService } from '@/services/tests/vocabService';

const service = new VocabTestService();

export default async function handler(req, res) {
  try {
    const userId = await service.validateRequest(req, res);
    const result = await service.getTestItemsWithLimit(userId, req.query);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid referer') {
      res.redirect(307, '/404');
    } else if (error.message === 'Authentication required') {
      res.status(401).json(service.formatError(error));
    } else {
      console.error('Vocab selection error:', error);
      res.status(500).json(service.formatError(error));
    }
  }
}