import { google } from 'googleapis';
import { getAuthenticatedClient } from '../services/google-auth';

export async function getCalendarClient(accountId?: string) {
  const auth = await getAuthenticatedClient(accountId);
  return google.calendar({ version: 'v3', auth });
}

export async function getDriveClient(accountId?: string) {
  const auth = await getAuthenticatedClient(accountId);
  return google.drive({ version: 'v3', auth });
}

export async function getGmailClient(accountId?: string) {
  const auth = await getAuthenticatedClient(accountId);
  return google.gmail({ version: 'v1', auth });
}

export async function getOAuth2Client(accountId?: string) {
  return getAuthenticatedClient(accountId);
}
