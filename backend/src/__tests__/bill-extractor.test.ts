import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockChatCompletion = vi.fn();

vi.mock('../services/ai', () => ({
  chatCompletion: (...args: any[]) => mockChatCompletion(...args),
}));

import { extractBillData } from '../services/bill-extractor';

describe('extractBillData', () => {
  beforeEach(() => {
    mockChatCompletion.mockReset();
  });

  it('should parse valid AI response', async () => {
    mockChatCompletion.mockResolvedValue(JSON.stringify({
      vendor: 'Acme Corp',
      amount: 150.50,
      currency: 'USD',
      dueDate: '2026-08-15',
      category: 'utilities',
      invoiceNumber: 'INV-001',
      lineItems: [{ description: 'Service', amount: 150.50 }],
      confidence: 0.95,
    }));
    const result = await extractBillData('some bill text');
    expect(result.vendor).toBe('Acme Corp');
    expect(result.amount).toBe(150.50);
    expect(result.dueDate).toBe('2026-08-15');
  });

  it('should handle AI returning markdown-wrapped JSON', async () => {
    mockChatCompletion.mockResolvedValue('```json\n{"vendor": "Test Inc", "amount": 99.99}\n```');
    const result = await extractBillData('text');
    expect(result.vendor).toBe('Test Inc');
    expect(result.amount).toBe(99.99);
  });

  it('should return defaults on parse failure', async () => {
    mockChatCompletion.mockResolvedValue('not json at all');
    const result = await extractBillData('text');
    expect(result.vendor).toBe('Unknown');
    expect(result.amount).toBe(0);
    expect(result.confidence).toBe(0);
  });
});
