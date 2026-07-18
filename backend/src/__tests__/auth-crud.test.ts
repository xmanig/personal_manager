import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../middleware/auth', () => ({
  requireGoogleAuth: (_req: any, _res: any, next: any) => next(),
  requireOptionalAuth: (_req: any, _res: any, next: any) => next(),
}));

const mockPrisma = vi.hoisted(() => ({
  note: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
  folder: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  tag: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  bill: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  calendarEvent: { findMany: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('pdf-parse', () => ({ default: () => Promise.resolve({ text: '', numpages: 0 }) }));
vi.mock('googleapis', () => ({ google: { auth: { OAuth2: () => ({}) } } }));

import notesRoutes from '../routes/notes';
import foldersRoutes from '../routes/folders';
import tagsRoutes from '../routes/tags';
import billsRoutes from '../routes/bills';
import calendarRoutes from '../routes/calendar';

describe('CRUD routes without Google auth', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /api/bills returns 200 without Google account', async () => {
    const app = express();
    app.use('/api/bills', billsRoutes);
    const res = await request(app).get('/api/bills');
    expect(res.status).toBe(200);
  });

  it('GET /api/notes returns 200 without Google account', async () => {
    const app = express();
    app.use('/api', notesRoutes);
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(200);
  });

  it('GET /api/folders returns 200 without Google account', async () => {
    const app = express();
    app.use('/api', foldersRoutes);
    const res = await request(app).get('/api/folders');
    expect(res.status).toBe(200);
  });

  it('GET /api/tags returns 200 without Google account', async () => {
    const app = express();
    app.use('/api', tagsRoutes);
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
  });

  it('GET /api/calendar/events/local returns 200 without Google account', async () => {
    const app = express();
    app.use('/api', calendarRoutes);
    const res = await request(app).get('/api/calendar/events/local');
    expect(res.status).toBe(200);
  });
});
