import { google } from 'googleapis';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/encryption';
import fs from 'fs';
import path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function loadGoogleConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../../google-credentials.json');

  if (fs.existsSync(credentialsPath)) {
    const raw = fs.readFileSync(credentialsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const web = parsed.web || parsed.installed;
    if (!web) throw new Error('Could not find "web" or "installed" key in credentials JSON');
    return {
      clientId: web.client_id,
      clientSecret: web.client_secret,
      redirectUri: web.redirect_uris?.[0] || 'http://localhost:3001/api/auth/callback',
    };
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback',
  };
}

const config = loadGoogleConfig();

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

export function getAuthUrl(state?: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

export async function getTokensFromCode(code: string): Promise<{
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function saveAccount(
  email: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  label?: string
) {
  const existing = await prisma.googleAccount.findUnique({ where: { email } });

  const data = {
    accessToken: encrypt(tokens.access_token || ''),
    refreshToken: encrypt(tokens.refresh_token || ''),
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
    scopes: SCOPES,
    label: label || null,
  };

  if (existing) {
    return prisma.googleAccount.update({
      where: { email },
      data,
    });
  }

  const accountCount = await prisma.googleAccount.count();

  return prisma.googleAccount.create({
    data: {
      email,
      ...data,
      isDefault: accountCount === 0,
    },
  });
}

export async function loadAccount(accountId: string) {
  const account = await prisma.googleAccount.findUnique({ where: { id: accountId } });
  if (!account) return null;

  return {
    ...account,
    accessToken: decrypt(account.accessToken),
    refreshToken: decrypt(account.refreshToken),
  };
}

export async function refreshAccountTokens(accountId: string): Promise<{ access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }> {
  const account = await prisma.googleAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Account not found');

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: decrypt(account.refreshToken),
    expiry_date: account.tokenExpiry.getTime(),
  });

  const { credentials } = await client.refreshAccessToken();

  await prisma.googleAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encrypt(credentials.access_token || ''),
      refreshToken: encrypt(credentials.refresh_token || decrypt(account.refreshToken)),
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : account.tokenExpiry,
    },
  });

  return credentials;
}

export async function getAccountByEmail(email: string) {
  return prisma.googleAccount.findUnique({ where: { email } });
}

export async function listAccounts() {
  return prisma.googleAccount.findMany({
    select: {
      id: true,
      email: true,
      label: true,
      isDefault: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function deleteAccount(accountId: string) {
  const account = await prisma.googleAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Account not found');

  await prisma.bill.updateMany({
    where: { googleAccountId: accountId },
    data: { googleAccountId: null },
  });

  await prisma.calendarEvent.updateMany({
    where: { googleAccountId: accountId },
    data: { googleAccountId: null },
  });

  await prisma.googleAccount.delete({ where: { id: accountId } });
}

export async function setDefaultAccount(accountId: string) {
  await prisma.googleAccount.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  return prisma.googleAccount.update({
    where: { id: accountId },
    data: { isDefault: true },
  });
}

export async function getDefaultAccount() {
  return prisma.googleAccount.findFirst({
    where: { isDefault: true },
  });
}

export async function getAuthenticatedClient(accountId?: string) {
  let account;

  if (accountId) {
    const loaded = await loadAccount(accountId);
    if (!loaded) throw new Error('Google account not found');
    account = loaded;
  } else {
    const defaultAccount = await getDefaultAccount();
    if (!defaultAccount) throw new Error('No Google account connected. Please authenticate first.');
    const loaded = await loadAccount(defaultAccount.id);
    if (!loaded) throw new Error('Failed to load default account');
    account = loaded;
  }

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpiry.getTime(),
  });

  if (account.tokenExpiry.getTime() < Date.now()) {
    try {
      const { credentials } = await client.refreshAccessToken();

      await prisma.googleAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encrypt(credentials.access_token || ''),
          refreshToken: encrypt(credentials.refresh_token || account.refreshToken),
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : account.tokenExpiry,
        },
      });

      client.setCredentials(credentials);
    } catch {
      throw new Error(`Failed to refresh tokens for account ${account.email}. Please re-authenticate.`);
    }
  }

  return client;
}

export async function getUserEmail(accountId?: string): Promise<string> {
  const auth = await getAuthenticatedClient(accountId);
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data.email || '';
}

export { SCOPES };
