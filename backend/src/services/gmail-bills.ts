import { google } from 'googleapis';

export interface GmailSearchRule {
  senderContains?: string;
  subjectContains?: string;
  hasAttachment?: boolean;
  dateRange?: { from?: string; to?: string };
  labelIds?: string[];
}

export interface GmailBillEmail {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  attachments: { filename: string; mimeType: string; attachmentId: string }[];
}

export async function searchBillEmails(
  rules: GmailSearchRule,
  oauth2Client: any
): Promise<GmailBillEmail[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const query = buildGmailQuery(rules);

  const messages: GmailBillEmail[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      pageToken,
      maxResults: 50,
    });

    if (!res.data.messages) break;

    for (const msg of res.data.messages) {
      if (!msg.id) continue;
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = full.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const attachments = extractAttachments(full.data.payload);
      const hasPdf = attachments.some((a) => a.mimeType === 'application/pdf');

      if (rules.hasAttachment && !hasPdf) continue;

      messages.push({
        messageId: msg.id,
        subject: getHeader('subject'),
        from: getHeader('from'),
        date: getHeader('date'),
        attachments: attachments.filter((a) => a.mimeType === 'application/pdf'),
      });
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return messages;
}

export async function downloadAttachment(
  messageId: string,
  attachmentId: string,
  oauth2Client: any
): Promise<Buffer> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const res = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  if (!res.data.data) {
    throw new Error('No attachment data');
  }

  return Buffer.from(res.data.data, 'base64url');
}

function buildGmailQuery(rules: GmailSearchRule): string {
  const parts: string[] = [];

  if (rules.senderContains) {
    parts.push(`from:${rules.senderContains}`);
  }
  if (rules.subjectContains) {
    parts.push(`subject:${rules.subjectContains}`);
  }
  if (rules.hasAttachment) {
    parts.push('has:attachment');
  }
  if (rules.dateRange?.from) {
    parts.push(`after:${rules.dateRange.from}`);
  }
  if (rules.dateRange?.to) {
    parts.push(`before:${rules.dateRange.to}`);
  }

  return parts.join(' ') || 'has:attachment';
}

function extractAttachments(
  payload: any
): { filename: string; mimeType: string; attachmentId: string }[] {
  const attachments: { filename: string; mimeType: string; attachmentId: string }[] = [];

  function walk(part: any) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        attachmentId: part.body.attachmentId,
      });
    }
    if (part.parts) {
      for (const child of part.parts) {
        walk(child);
      }
    }
  }

  if (payload) walk(payload);
  return attachments;
}
