import { google } from 'googleapis';
import { getAuthenticatedClient } from '../services/google-auth';

export async function getCalendarClient() {
  const auth = await getAuthenticatedClient();
  return google.calendar({ version: 'v3', auth });
}

export async function getDriveClient() {
  const auth = await getAuthenticatedClient();
  return google.drive({ version: 'v3', auth });
}

export async function getGmailClient() {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: 'v1', auth });
}

export async function getOAuth2Client() {
  return getAuthenticatedClient();
}
