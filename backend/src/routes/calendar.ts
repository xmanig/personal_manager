import { logger } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireGoogleAuth } from '../middleware/auth';
import { validate, createEventSchema, updateEventSchema } from '../lib/validation';

const router = Router();

router.get('/calendar/events', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to
      ? new Date(String(req.query.to))
      : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calendar = req.googleAuth!;
    const googleAccount = req.googleAccount;

    const { google } = await import('googleapis');
    const calendarApi = google.calendar({ version: 'v3', auth: calendar });

    const response = await calendarApi.events.list({
      calendarId: 'primary',
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const googleEvents = response.data.items || [];

    for (const event of googleEvents) {
      if (!event.id) continue;

      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;

      if (!start || !end) continue;

      await prisma.calendarEvent.upsert({
        where: { googleEventId: event.id },
        update: {
          title: event.summary || 'Untitled',
          description: event.description || null,
          startTime: new Date(start),
          endTime: new Date(end),
          location: event.location || null,
          recurrenceRule: event.recurrence?.join('\n') || null,
          isAllDay: !!event.start?.date,
          lastGoogleEdit: event.updated ? new Date(event.updated) : null,
          syncedAt: new Date(),
          googleAccountId: googleAccount?.id || undefined,
        },
        create: {
          googleEventId: event.id,
          title: event.summary || 'Untitled',
          description: event.description || null,
          startTime: new Date(start),
          endTime: new Date(end),
          location: event.location || null,
          recurrenceRule: event.recurrence?.join('\n') || null,
          isAllDay: !!event.start?.date,
          lastGoogleEdit: event.updated ? new Date(event.updated) : null,
          googleAccountId: googleAccount?.id || null,
        },
      });
    }

    const cachedEvents = await prisma.calendarEvent.findMany({
      where: {
        startTime: { gte: from },
        endTime: { lte: to },
        ...(req.query.accountId ? { googleAccountId: String(req.query.accountId) } : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ events: cachedEvents, synced: googleEvents.length });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching calendar events:');
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

router.get('/calendar/events/local', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to
      ? new Date(String(req.query.to))
      : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startTime: { gte: from },
        endTime: { lte: to },
        ...(req.query.accountId ? { googleAccountId: String(req.query.accountId) } : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ events });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching local calendar events:');
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

router.post('/calendar/events', requireGoogleAuth, validate(createEventSchema), async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, isAllDay, googleAccountId } = req.body;

    const calendar = req.googleAuth!;
    const googleAccount = req.googleAccount;
    const { google } = await import('googleapis');
    const calendarApi = google.calendar({ version: 'v3', auth: calendar });

    const eventBody: any = {
      summary: title,
      description: description || null,
      location: location || null,
    };

    if (isAllDay) {
      eventBody.start = { date: new Date(startTime).toISOString().split('T')[0] };
      eventBody.end = { date: new Date(endTime).toISOString().split('T')[0] };
    } else {
      eventBody.start = { dateTime: new Date(startTime).toISOString() };
      eventBody.end = { dateTime: new Date(endTime).toISOString() };
    }

    const response = await calendarApi.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
    });

    const googleEvent = response.data;

    const effectiveAccountId = googleAccountId || googleAccount?.id || null;

    const localEvent = await prisma.calendarEvent.create({
      data: {
        googleEventId: googleEvent.id!,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        isAllDay: isAllDay || false,
        lastLocalEdit: new Date(),
        googleAccountId: effectiveAccountId,
      },
    });

    res.status(201).json(localEvent);
  } catch (error) {
    logger.error({ err: error }, 'Error creating calendar event:');
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

router.put('/calendar/events/:id', requireGoogleAuth, validate(updateEventSchema), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, description, startTime, endTime, location } = req.body;

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const calendar = (req as any).googleAuth;
    const { google } = await import('googleapis');
    const calendarApi = google.calendar({ version: 'v3', auth: calendar });

    const updateBody: any = {};
    if (title) updateBody.summary = title;
    if (description !== undefined) updateBody.description = description;
    if (location !== undefined) updateBody.location = location;
    if (startTime) updateBody.start = { dateTime: new Date(startTime).toISOString() };
    if (endTime) updateBody.end = { dateTime: new Date(endTime).toISOString() };

    await calendarApi.events.update({
      calendarId: 'primary',
      eventId: existing.googleEventId,
      requestBody: updateBody,
    });

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(location !== undefined && { location }),
        lastLocalEdit: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error({ err: error }, 'Error updating calendar event:');
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

router.delete('/calendar/events/:id', requireGoogleAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const calendar = req.googleAuth!;
    const { google } = await import('googleapis');
    const calendarApi = google.calendar({ version: 'v3', auth: calendar });

    await calendarApi.events.update({
      calendarId: 'primary',
      eventId: existing.googleEventId,
    });

    await prisma.calendarEvent.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Error deleting calendar event:');
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

export default router;
