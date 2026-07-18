import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';


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
  userSetting: { deleteMany: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

const mockOAuthClient = vi.hoisted(() => ({
  generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?test=1'),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock('googleapis', () => {
  function OAuth2Mock() { return mockOAuthClient; }
  return {
    google: {
      auth: { OAuth2: OAuth2Mock },
      oauth2: vi.fn(() => ({
        userinfo: { get: vi.fn().mockResolvedValue({ data: { email: 'migrated@test.com' } }) },
      })),
    },
  };
});

import authRoutes from '../routes/auth';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', authRoutes);
  return app;
}

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/google', () => {
    it('redirects to Google OAuth URL', async () => {
      const app = createApp();
      const res = await request(app).get('/api/auth/google');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
    });
  });

  describe('GET /api/auth/status', () => {
    it('returns connected=true when default account exists', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue({ email: 'test@test.com' });
      const app = createApp();
      const res = await request(app).get('/api/auth/status');
      expect(res.body).toEqual({ connected: true, email: 'test@test.com' });
    });

    it('returns connected=false when no account', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue(null);
      const app = createApp();
      const res = await request(app).get('/api/auth/status');
      expect(res.body).toEqual({ connected: false });
    });
  });

  describe('POST /api/auth/disconnect', () => {
    it('deletes default account', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue({ id: '1', email: 'test@test.com' });
      mockPrisma.googleAccount.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      const app = createApp();
      const res = await request(app).post('/api/auth/disconnect');
      expect(res.status).toBe(200);
      expect(mockPrisma.googleAccount.delete).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/accounts', () => {
    it('returns account list', async () => {
      const now = Date.now();
      const encAT = '886664663d3641c0c4d3cd4925bf1aed:aa9ea78b6343f373ff6a224921d7d90a:b339bba105b224d51495ef2ddc42fa8d18';
      const encRT = 'e38d0c2142d7699c78ef3dc4da229196:19cd1ff7bbff6a36473d45c8df0ee4e8:ea57978f38c80e085b94c5dc137f64b20fbc';
      mockPrisma.googleAccount.findFirst.mockResolvedValue({ id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000), accessToken: encAT, refreshToken: encRT, isDefault: true });
      mockPrisma.googleAccount.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000), accessToken: encAT, refreshToken: encRT, isDefault: true });
      mockPrisma.googleAccount.findMany.mockResolvedValue([
        { id: '1', email: 'test@test.com', label: null, isDefault: true, createdAt: new Date() },
      ]);
      mockPrisma.googleAccount.update.mockResolvedValue({});
      const app = createApp();
      const res = await request(app).get('/api/auth/accounts');
      expect(res.status).toBe(200);
      expect(res.body.accounts).toHaveLength(1);
    });
  });
});
