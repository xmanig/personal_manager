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
  calendarEvent: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  bill: { updateMany: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

const mockOAuthClient = vi.hoisted(() => ({
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

const mockEventsList = vi.hoisted(() => vi.fn());
const mockEventsInsert = vi.hoisted(() => vi.fn());
const mockEventsUpdate = vi.hoisted(() => vi.fn());
const mockEventsDelete = vi.hoisted(() => vi.fn());

vi.mock('googleapis', () => {
  function OAuth2Mock() { return mockOAuthClient; }
  return {
    google: {
      auth: { OAuth2: OAuth2Mock },
      calendar: vi.fn(() => ({
        events: {
          list: mockEventsList,
          insert: mockEventsInsert,
          update: mockEventsUpdate,
          delete: mockEventsDelete,
        },
      })),
    },
  };
});

import calendarRoutes from '../routes/calendar';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', calendarRoutes);
  return app;
}

const encAT = '886664663d3641c0c4d3cd4925bf1aed:aa9ea78b6343f373ff6a224921d7d90a:b339bba105b224d51495ef2ddc42fa8d18';
const encRT = 'e38d0c2142d7699c78ef3dc4da229196:19cd1ff7bbff6a36473d45c8df0ee4e8:ea57978f38c80e085b94c5dc137f64b20fbc';

function mockAuth() {
  const now = Date.now();
  mockPrisma.googleAccount.findFirst.mockResolvedValue({
    id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000),
    accessToken: encAT, refreshToken: encRT, isDefault: true,
  });
  mockPrisma.googleAccount.findUnique.mockResolvedValue({
    id: '1', email: 'test@test.com', tokenExpiry: new Date(now + 3600000),
    accessToken: encAT, refreshToken: encRT, isDefault: true,
  });
}

describe('Calendar routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/calendar/events/local', () => {
    it('returns local events', async () => {
      mockPrisma.calendarEvent.findMany.mockResolvedValue([{ id: '1', title: 'Test Event' }]);
      const app = createApp();
      const res = await request(app).get('/api/calendar/events/local');
      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
    });
  });

  describe('POST /api/calendar/events', () => {
    it('creates an event', async () => {
      mockAuth();
      mockOAuthClient.refreshAccessToken.mockResolvedValue({ credentials: { access_token: 'new' } });
      mockEventsInsert.mockResolvedValue({ data: { id: 'google-123' } });
      mockPrisma.calendarEvent.create.mockResolvedValue({ id: 'local-1', title: 'Meeting', googleEventId: 'google-123' });

      const app = createApp();
      const res = await request(app)
        .post('/api/calendar/events')
        .send({ title: 'Meeting', startTime: '2026-08-01T10:00:00Z', endTime: '2026-08-01T11:00:00Z' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Meeting');
    });

    it('rejects missing required fields', async () => {
      const app = createApp();
      const res = await request(app).post('/api/calendar/events').send({});
      expect(res.status).toBe(400);
    });
  });
});
