import { logger } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import {
  getAuthUrl,
  getTokensFromCode,
  saveAccount,
  getUserEmail,
  listAccounts,
  deleteAccount,
  setDefaultAccount,
  getDefaultAccount,
  createOAuth2Client,
} from '../services/google-auth';
import { requireGoogleAuth, requireOptionalAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { validate, updateLabelSchema } from '../lib/validation';

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

    const client = createOAuth2Client();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
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
    logger.error({ err: error }, 'OAuth callback error:');
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

router.get('/auth/status', async (req: Request, res: Response) => {
  // Intentionally no auth middleware — used to check if connected
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

router.get('/auth/accounts', requireOptionalAuth, async (req: Request, res: Response) => {
  try {
    const accounts = await listAccounts();
    res.json({ accounts });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list accounts:');
    res.status(500).json({ error: 'Failed to list accounts' });
  }
});

router.delete('/auth/accounts/:id', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    await deleteAccount(String(req.params.id));
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete account:');
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.put('/auth/accounts/:id/default', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    await setDefaultAccount(String(req.params.id));
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to set default account:');
    res.status(500).json({ error: 'Failed to set default account' });
  }
});

router.put('/auth/accounts/:id/label', requireGoogleAuth, validate(updateLabelSchema), async (req: Request, res: Response) => {
  try {
    const { label } = req.body;
    await prisma.googleAccount.update({
      where: { id: String(req.params.id) },
      data: { label },
    });
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update account label:');
    res.status(500).json({ error: 'Failed to update account label' });
  }
});

router.post('/auth/accounts/:id/reconnect', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const accountId = String(req.params.id);
    const account = await prisma.googleAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    const url = getAuthUrl(account.label || account.email);
    res.json({ url, accountId });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate reconnect URL:');
    res.status(500).json({ error: 'Failed to generate reconnect URL' });
  }
});

router.get('/auth/accounts/:id/status', async (req: Request, res: Response) => {
  try {
    const accountId = String(req.params.id);
    const account = await prisma.googleAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json({
      id: accountId,
      email: account.email,
      label: account.label,
      isDefault: account.isDefault,
      needsReconnect: false,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to check account status:');
    res.status(500).json({ error: 'Failed to check account status' });
  }
});

export default router;
