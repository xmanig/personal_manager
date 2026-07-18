import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('convertToLocal', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return null for same currency', async () => {
    const { convertToLocal } = await import('../services/forex');
    const result = await convertToLocal(100, 'EUR');
    expect(result).toBeNull();
  });

  it('should convert USD to EUR via API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { EUR: 0.92 } }),
    }));
    const { convertToLocal } = await import('../services/forex');
    const result = await convertToLocal(100, 'USD');
    expect(result).not.toBeNull();
    expect(result!.localAmount).toBe(92);
    expect(result!.localCurrency).toBe('EUR');
  });

  it('should fall back when API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { convertToLocal } = await import('../services/forex');
    const result = await convertToLocal(100, 'USD');
    expect(result).not.toBeNull();
    expect(result!.localAmount).toBe(92);
  });

  it('should return null for unknown currency fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { convertToLocal } = await import('../services/forex');
    const result = await convertToLocal(100, 'XYZ');
    expect(result).toBeNull();
  });
});
