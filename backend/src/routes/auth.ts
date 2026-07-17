import { Router, Request, Response } from 'express';
import { getAuthUrl, getTokensFromCode, saveTokens, getUserEmail } from '../services/google-auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/auth/google', (req: Request, res: Response) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/auth/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    const tokens = await getTokensFromCode(code);
    await saveTokens(tokens);

    const email = await getUserEmail();

    res.json({
      success: true,
      message: 'Google account connected successfully',
      email,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

router.get('/auth/status', async (req: Request, res: Response) => {
  try {
    const email = await getUserEmail();
    res.json({ connected: true, email });
  } catch {
    res.json({ connected: false });
  }
});

router.post('/auth/disconnect', async (req: Request, res: Response) => {
  try {
    await prisma.userSetting.deleteMany({
      where: { key: { in: ['google_access_token', 'google_refresh_token', 'google_token_expiry'] } },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
