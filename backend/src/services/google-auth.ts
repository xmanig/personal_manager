import { google } from 'googleapis';
import { prisma } from '../lib/prisma';
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

const oauth2Client = new google.auth.OAuth2(
  config.clientId,
  config.clientSecret,
  config.redirectUri
);

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string): Promise<{ access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null; token_type?: string | null; scope?: string }> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function saveTokens(tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }) {
  if (tokens.access_token) {
    await prisma.userSetting.upsert({
      where: { key: 'google_access_token' },
      update: { value: tokens.access_token },
      create: { key: 'google_access_token', value: tokens.access_token },
    });
  }

  if (tokens.refresh_token) {
    await prisma.userSetting.upsert({
      where: { key: 'google_refresh_token' },
      update: { value: tokens.refresh_token },
      create: { key: 'google_refresh_token', value: tokens.refresh_token },
    });
  }

  if (tokens.expiry_date) {
    await prisma.userSetting.upsert({
      where: { key: 'google_token_expiry' },
      update: { value: tokens.expiry_date.toString() },
      create: { key: 'google_token_expiry', value: tokens.expiry_date.toString() },
    });
  }
}

export async function getStoredTokens() {
  const [accessToken, refreshToken, expiry] = await Promise.all([
    prisma.userSetting.findUnique({ where: { key: 'google_access_token' } }),
    prisma.userSetting.findUnique({ where: { key: 'google_refresh_token' } }),
    prisma.userSetting.findUnique({ where: { key: 'google_token_expiry' } }),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
    expiry_date: expiry ? parseInt(expiry.value, 10) : null,
  };
}

export async function getAuthenticatedClient() {
  const tokens = await getStoredTokens();

  if (!tokens) {
    throw new Error('No Google tokens found. Please authenticate first.');
  }

  oauth2Client.setCredentials(tokens);

  oauth2Client.on('tokens', async (newTokens) => {
    await saveTokens(newTokens);
  });

  return oauth2Client;
}

export async function getUserEmail(): Promise<string> {
  const auth = await getAuthenticatedClient();
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data.email || '';
}

export { SCOPES };
