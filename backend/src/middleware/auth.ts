import { logger } from '../lib/logger';
import { Request, Response, NextFunction } from 'express';
import { getAuthenticatedClient, getDefaultAccount, loadAccount } from '../services/google-auth';

export async function requireGoogleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const accountId = req.headers['x-google-account-id'] as string | undefined;

    const client = await getAuthenticatedClient(accountId);

    let account;
    if (accountId) {
      account = await loadAccount(accountId);
    } else {
      account = await getDefaultAccount();
    }

    req.googleAuth = client;
    req.googleAccount = account;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication check failed';
    logger.error({ err: message }, 'Auth middleware error:');
    res.status(401).json({ error: message });
  }
}
