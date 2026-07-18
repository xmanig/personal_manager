import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../middleware/auth', () => ({
  requireGoogleAuth: (_req: any, _res: any, next: any) => next(),
}));

const mockPrisma = vi.hoisted(() => ({
  googleAccount: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  bill: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  calendarEvent: { updateMany: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

const mockOAuthClient = vi.hoisted(() => ({
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  default: () => Promise.resolve({ text: 'Mock invoice text', numpages: 1 }),
}));

vi.mock('googleapis', () => {
  function OAuth2Mock() { return mockOAuthClient; }
  return {
    google: {
      auth: { OAuth2: OAuth2Mock },
    },
  };
});

import billsRoutes from '../routes/bills';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bills', billsRoutes);
  return app;
}

describe('Bills routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/bills', () => {
    it('returns bill list', async () => {
      mockPrisma.bill.findMany.mockResolvedValue([{ id: '1', vendor: 'Test Corp', amount: 100 }]);
      const app = createApp();
      const res = await request(app).get('/api/bills');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].vendor).toBe('Test Corp');
    });
  });

  describe('GET /api/bills/:id', () => {
    it('returns a single bill', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue({ id: '1', vendor: 'Test Corp', amount: 100 });
      const app = createApp();
      const res = await request(app).get('/api/bills/1');
      expect(res.status).toBe(200);
      expect(res.body.vendor).toBe('Test Corp');
    });

    it('returns 404 for missing bill', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue(null);
      const app = createApp();
      const res = await request(app).get('/api/bills/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/bills/:id', () => {
    it('updates a bill', async () => {
      mockPrisma.bill.update.mockResolvedValue({ id: '1', vendor: 'Updated Corp', amount: 200 });
      const app = createApp();
      const res = await request(app).put('/api/bills/1').send({ vendor: 'Updated Corp', amount: 200 });
      expect(res.status).toBe(200);
      expect(res.body.vendor).toBe('Updated Corp');
    });
  });

  describe('DELETE /api/bills/:id', () => {
    it('deletes a bill', async () => {
      mockPrisma.bill.findUnique.mockResolvedValue({ id: '1', pdfUrl: null });
      mockPrisma.bill.delete.mockResolvedValue({});
      const app = createApp();
      const res = await request(app).delete('/api/bills/1');
      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/bills/parse', () => {
    it('rejects missing rawText', async () => {
      const now = Date.now();
      const encAT = '886664663d3641c0c4d3cd4925bf1aed:aa9ea78b6343f373ff6a224921d7d90a:b339bba105b224d51495ef2ddc42fa8d18';
      const encRT = 'e38d0c2142d7699c78ef3dc4da229196:19cd1ff7bbff6a36473d45c8df0ee4e8:ea57978f38c80e085b94c5dc137f64b20fbc';
      mockPrisma.googleAccount.findFirst.mockResolvedValue({ id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000), accessToken: encAT, refreshToken: encRT, isDefault: true });
      mockPrisma.googleAccount.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000), accessToken: encAT, refreshToken: encRT, isDefault: true });
      const app = createApp();
      const res = await request(app).post('/api/bills/parse').send({});
      expect(res.status).toBe(400);
    });
  });
});
