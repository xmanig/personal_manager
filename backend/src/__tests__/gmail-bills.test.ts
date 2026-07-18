import { describe, it, expect } from 'vitest';
import { buildGmailQuery, extractAttachments } from '../services/gmail-bills';

describe('buildGmailQuery', () => {
  it('should return has:attachment with empty rules', () => {
    expect(buildGmailQuery({})).toBe('has:attachment');
  });

  it('should include sender filter', () => {
    const q = buildGmailQuery({ senderContains: 'billing@example.com' });
    expect(q).toContain('from:billing@example.com');
  });

  it('should include subject filter', () => {
    const q = buildGmailQuery({ subjectContains: 'invoice' });
    expect(q).toContain('subject:invoice');
  });

  it('should include attachment flag', () => {
    const q = buildGmailQuery({ hasAttachment: true });
    expect(q).toContain('has:attachment');
  });

  it('should include date range', () => {
    const q = buildGmailQuery({ dateRange: { from: '2026/01/01', to: '2026/06/30' } });
    expect(q).toContain('after:2026/01/01');
    expect(q).toContain('before:2026/06/30');
  });

  it('should combine multiple filters with spaces', () => {
    const q = buildGmailQuery({
      senderContains: 'billing@co.com',
      subjectContains: 'invoice',
      hasAttachment: true,
    });
    const parts = q.split(' ');
    expect(parts).toContain('from:billing@co.com');
    expect(parts).toContain('subject:invoice');
    expect(parts).toContain('has:attachment');
  });
});

describe('extractAttachments', () => {
  it('should extract attachments from payload', () => {
    const payload = {
      parts: [
        {
          filename: 'bill.pdf',
          mimeType: 'application/pdf',
          body: { attachmentId: 'abc123' },
        },
      ],
    };
    const result = extractAttachments(payload);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('bill.pdf');
    expect(result[0].mimeType).toBe('application/pdf');
    expect(result[0].attachmentId).toBe('abc123');
  });

  it('should return empty array for payload without attachments', () => {
    expect(extractAttachments(null)).toEqual([]);
    expect(extractAttachments({})).toEqual([]);
  });

  it('should walk nested parts recursively', () => {
    const payload = {
      parts: [
        {
          parts: [
            {
              filename: 'nested.pdf',
              mimeType: 'application/pdf',
              body: { attachmentId: 'nested123' },
            },
          ],
        },
      ],
    };
    const result = extractAttachments(payload);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('nested.pdf');
  });
});
