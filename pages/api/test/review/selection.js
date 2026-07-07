import { ReviewTestService } from '@/services/tests/reviewService';

const service = new ReviewTestService();

export default async function handler(req, res) {
  try {
    const userId = await service.validateRequest(req, res);
    const result = await service.getTestItems(userId);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid referer') {
      res.redirect(307, '/404');
    } else if (error.message === 'Authentication required') {
      res.status(401).json(service.formatError(error));
    } else {
      console.error('API Error selecting test kanji:', error);
      res.status(500).json(service.formatError(error));
    }
  }
}