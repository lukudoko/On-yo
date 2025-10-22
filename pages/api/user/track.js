import { getUserId } from '@/utils/progress';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
    // Handle PUT requests to update track
    if (req.method === 'PUT') {
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

            const { track } = req.body;

            if (!track || !['stat', 'jlpt'].includes(track)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid track. Must be "stat" or "jlpt"'
                });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { track },
                select: { track: true }
            });

            return res.status(200).json({
                success: true,
                track: updatedUser.track
            });
        } catch (error) {
            console.error('API Error updating track:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Handle GET requests to read track
    if (req.method === 'GET') {
        const expectedToken = process.env.API_TOKEN;
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

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { track: true }
            });

            return res.status(200).json({
                success: true,
                data: {
                    track: user?.track || 'stat'
                }
            });
        } catch (error) {
            console.error('API Error getting track:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}