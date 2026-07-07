import { getUserId } from '@/services/user';
import { getUserPreferences, updateUserPreferences } from '@/services/user/preferencesService';

export default async function handler(req, res) {
  const expectedToken = process.env.API_TOKEN || 'fallback-token-for-dev';
  const providedToken = req.headers['x-api-token'];

  if (providedToken !== expectedToken) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid API token'
    });
  }

  const userId = await getUserId(req, res);
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.method === 'GET') {
    try {
      const preferences = await getUserPreferences(userId);
      return res.status(200).json({
        success: true,
         preferences
      });
    } catch (error) {
      console.error('API Error getting preferences:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { track, goalLevel } = req.body;
      
      // At least one field must be provided
      if (track === undefined && goalLevel === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Must provide either track or goalLevel'
        });
      }

      const updatedPreferences = await updateUserPreferences(userId, { track, goalLevel });
      
      return res.status(200).json({
        success: true,
         updatedPreferences
      });
    } catch (error) {
      console.error('API Error updating preferences:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}