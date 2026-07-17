import { Router, Request, Response } from 'express';
import {
  getAuthUrl,
  getTokensFromCode,
  saveAccount,
  getUserEmail,
  listAccounts,
  deleteAccount,
  setDefaultAccount,
  getDefaultAccount,
} from '../services/google-auth';
import { requireGoogleAuth } from '../middleware/auth';

const router = Router();

router.get('/auth/google', (req: Request, res: Response) => {
  const state = req.query.state as string | undefined;
  const url = getAuthUrl(state);
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

    const client = (await import('../services/google-auth')).createOAuth2Client();
    client.setCredentials(tokens);
    const oauth2 = (await import('googleapis')).google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();
    const email = data.email || '';

    const label = (req.query.state as string) || null;
    await saveAccount(email, tokens, label || undefined);

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
    const defaultAccount = await getDefaultAccount();
    if (!defaultAccount) {
      res.json({ connected: false });
      return;
    }
    res.json({ connected: true, email: defaultAccount.email });
  } catch {
    res.json({ connected: false });
  }
});

router.post('/auth/disconnect', async (req: Request, res: Response) => {
  try {
    const defaultAccount = await getDefaultAccount();
    if (defaultAccount) {
      await deleteAccount(defaultAccount.id);
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.get('/auth/accounts', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const accounts = await listAccounts();
    res.json({ accounts });
  } catch (error) {
    console.error('Failed to list accounts:', error);
    res.status(500).json({ error: 'Failed to list accounts' });
  }
});

router.delete('/auth/accounts/:id', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    await deleteAccount(String(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.put('/auth/accounts/:id/default', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    await setDefaultAccount(String(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to set default account:', error);
    res.status(500).json({ error: 'Failed to set default account' });
  }
});

router.put('/auth/accounts/:id/label', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const { label } = req.body;
    const { prisma } = await import('../lib/prisma');
    await prisma.googleAccount.update({
      where: { id: String(req.params.id) },
      data: { label },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update account label:', error);
    res.status(500).json({ error: 'Failed to update account label' });
  }
});

export default router;
