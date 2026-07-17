import { Request, Response, NextFunction } from 'express';
import { getStoredTokens, saveTokens, createOAuth2Client } from '../services/google-auth';

export async function requireGoogleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await getStoredTokens();

    if (!tokens) {
      res.status(401).json({ error: 'Google account not connected. Please authenticate first.' });
      return;
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await saveTokens(credentials);
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        res.status(401).json({ error: 'Failed to refresh Google tokens. Please re-authenticate.' });
        return;
      }
    }

    (req as any).googleAuth = oauth2Client;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}
