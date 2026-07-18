import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPdfParse = vi.fn();

vi.mock('pdf-parse', () => ({
  default: (...args: any[]) => mockPdfParse(...args),
}));

import { parsePdf } from '../services/pdf-parser';

describe('parsePdf', () => {
  beforeEach(() => {
    mockPdfParse.mockReset();
  });

  it('should extract text from a PDF buffer', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Invoice #12345\nAmount: 100.00 EUR\nDate: 2026-08-15\nVendor: Acme Corp\nDescription: Monthly service fee for premium subscription', numpages: 1 });
    const result = await parsePdf(Buffer.from('fake-pdf'));
    expect(result.text).toContain('Invoice');
    expect(result.numPages).toBe(1);
    expect(result.isScanned).toBe(false);
  });

  it('should flag short text as scanned', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Hi', numpages: 3 });
    const result = await parsePdf(Buffer.from('scanned-pdf'));
    expect(result.isScanned).toBe(true);
  });

  it('should handle zero pages', async () => {
    mockPdfParse.mockResolvedValue({ text: '', numpages: 0 });
    const result = await parsePdf(Buffer.from('empty'));
    expect(result.isScanned).toBe(false);
    expect(result.text).toBe('');
  });
});
