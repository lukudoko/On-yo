import { prisma } from '@/lib/prisma';
import { getUserId } from '@/services/user';

export class BaseTestService {
  constructor(testType) {
    this.testType = testType;
  }

  async validateRequest(req, res) {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    const referer = req.headers.referer || req.headers.origin;
    if (!referer || !referer.includes(req.headers.host)) {
      throw new Error('Invalid referer');
    }

    const userId = await getUserId(req, res);
    if (!userId) {
      throw new Error('Authentication required');
    }

    return userId;
  }

  async getUserTrack(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { track: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.track;
  }

  formatSuccess(data) {
    return { success: true, ...data };
  }

  formatError(error, extraData = {}) {
    return { success: false, error: error.message, ...extraData };
  }
}