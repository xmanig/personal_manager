import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt } from '../lib/encryption';

process.env.ENCRYPTION_KEY = '71b88f1b2f4bda08d2262918e825f9b04ad68b820bc8a54c34abcf864d0dec86';

const mockPrisma = vi.hoisted(() => ({
  googleAccount: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  bill: { updateMany: vi.fn() },
  calendarEvent: { updateMany: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

const mockOAuth2Client = {
  generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?...'),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
};

vi.mock('googleapis', () => {
  function OAuth2Mock() { return mockOAuth2Client; }
  return {
    google: {
      auth: { OAuth2: OAuth2Mock },
      oauth2: vi.fn(() => ({
        userinfo: { get: vi.fn().mockResolvedValue({ data: { email: 'test@gmail.com' } }) },
      })),
    },
  };
});

import { saveAccount, listAccounts, deleteAccount, setDefaultAccount, getDefaultAccount, getAuthUrl, createOAuth2Client } from '../services/google-auth';

describe('google-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('returns a Google OAuth URL', () => {
      const url = getAuthUrl();
      expect(url).toContain('accounts.google.com');
    });

    it('accepts optional state parameter', () => {
      getAuthUrl('my-label');
      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'my-label' })
      );
    });
  });

  describe('saveAccount', () => {
    it('creates a new account with isDefault=true when first account', async () => {
      mockPrisma.googleAccount.findUnique.mockResolvedValue(null);
      mockPrisma.googleAccount.count.mockResolvedValue(0);
      mockPrisma.googleAccount.create.mockResolvedValue({ id: '1', email: 'test@gmail.com', isDefault: true });

      const result = await saveAccount('test@gmail.com', {
        access_token: 'at',
        refresh_token: 'rt',
        expiry_date: Date.now() + 3600000,
      });

      expect(mockPrisma.googleAccount.create).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });

    it('creates a new account without isDefault when accounts exist', async () => {
      mockPrisma.googleAccount.findUnique.mockResolvedValue(null);
      mockPrisma.googleAccount.count.mockResolvedValue(1);
      mockPrisma.googleAccount.create.mockResolvedValue({ id: '2', email: 'test2@gmail.com', isDefault: false });

      const result = await saveAccount('test2@gmail.com', {
        access_token: 'at2',
        refresh_token: 'rt2',
      });

      expect(result.isDefault).toBe(false);
    });

    it('updates existing account by email', async () => {
      mockPrisma.googleAccount.findUnique.mockResolvedValue({ id: '1', email: 'test@gmail.com' });
      mockPrisma.googleAccount.update.mockResolvedValue({ id: '1', email: 'test@gmail.com' });

      const result = await saveAccount('test@gmail.com', {
        access_token: 'new-at',
        refresh_token: 'new-rt',
      });

      expect(mockPrisma.googleAccount.update).toHaveBeenCalled();
      expect(mockPrisma.googleAccount.create).not.toHaveBeenCalled();
    });
  });

  describe('listAccounts', () => {
    it('returns accounts with selected fields', async () => {
      mockPrisma.googleAccount.findMany.mockResolvedValue([
        { id: '1', email: 'a@b.com', label: 'Work', isDefault: true, createdAt: new Date() },
      ]);

      const accounts = await listAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].email).toBe('a@b.com');
      expect(accounts[0].accessToken).toBeUndefined();
    });
  });

  describe('deleteAccount', () => {
    it('nullifies FKs and deletes account', async () => {
      mockPrisma.googleAccount.findUnique.mockResolvedValue({ id: '1', email: 'test@gmail.com' });
      mockPrisma.googleAccount.delete.mockResolvedValue({});

      await deleteAccount('1');

      expect(mockPrisma.bill.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { googleAccountId: '1' }, data: { googleAccountId: null } })
      );
      expect(mockPrisma.calendarEvent.updateMany).toHaveBeenCalled();
      expect(mockPrisma.googleAccount.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws on missing account', async () => {
      mockPrisma.googleAccount.findUnique.mockResolvedValue(null);
      await expect(deleteAccount('nonexistent')).rejects.toThrow('Account not found');
    });
  });

  describe('setDefaultAccount', () => {
    it('unsets previous default and sets new one', async () => {
      mockPrisma.googleAccount.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.googleAccount.update.mockResolvedValue({ id: '2', isDefault: true });

      const result = await setDefaultAccount('2');

      expect(mockPrisma.googleAccount.updateMany).toHaveBeenCalledWith(
        { where: { isDefault: true }, data: { isDefault: false } }
      );
      expect(mockPrisma.googleAccount.update).toHaveBeenCalledWith(
        { where: { id: '2' }, data: { isDefault: true } }
      );
      expect(result.isDefault).toBe(true);
    });
  });

  describe('getDefaultAccount', () => {
    it('returns the default account', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue({ id: '1', email: 'default@test.com' });

      const result = await getDefaultAccount();
      expect(result?.email).toBe('default@test.com');
    });

    it('returns null when no default', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue(null);
      const result = await getDefaultAccount();
      expect(result).toBeNull();
    });
  });
});
