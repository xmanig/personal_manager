import { logger } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireGoogleAuth } from '../middleware/auth';

const router = Router();
router.use(requireGoogleAuth);

router.get('/notes', async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const search = req.query.search ? String(req.query.search) : undefined;
    const folderId = req.query.folderId ? String(req.query.folderId) : undefined;
    const tagId = req.query.tagId ? String(req.query.tagId) : undefined;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (folderId) {
      where.folderId = folderId;
    }

    if (tagId) {
      where.tags = { some: { id: tagId } };
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: { tags: true, folder: true },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.note.count({ where }),
    ]);

    res.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching notes:');
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const note = await prisma.note.findUnique({
      where: { id },
      include: { tags: true, folder: true },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching note:');
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { title, content, folderId, tagIds } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || null,
        folderId: folderId || null,
        tags: tagIds ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { tags: true, folder: true },
    });

    res.status(201).json(note);
  } catch (error) {
    logger.error({ err: error }, 'Error creating note:');
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, content, folderId, tagIds } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      res.status(400).json({ error: 'Title cannot be empty' });
      return;
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(tagIds !== undefined && {
          tags: { set: tagIds.map((id: string) => ({ id })) },
        }),
      },
      include: { tags: true, folder: true },
    });

    res.json(note);
  } catch (error) {
    logger.error({ err: error }, 'Error updating note:');
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await prisma.note.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Error deleting note:');
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.get('/notes/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const limit = parseInt(String(req.query.limit || '20'), 10);

    if (!q.trim()) {
      res.json({ notes: [] });
      return;
    }

    const searchTerm = q
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `${term}:*`)
      .join(' & ');

    const notes = await prisma.$queryRaw`
      SELECT 
        n.id,
        n.title,
        n.content,
        n."folderId",
        n.summary,
        n."createdAt",
        n."updatedAt",
        ts_rank(
          to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, '')),
          to_tsquery('english', ${searchTerm})
        ) as rank
      FROM "Note" n
      WHERE to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, '')) 
            @@ to_tsquery('english', ${searchTerm})
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    res.json({ notes });
  } catch (error) {
    logger.error({ err: error }, 'Error searching notes:');
    res.status(500).json({ error: 'Failed to search notes' });
  }
});

router.post('/notes/:id/summarize', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (!note.content) {
      res.status(400).json({ error: 'Note has no content to summarize' });
      return;
    }

    const { summarizeNote } = await import('../services/ai');
    const summary = await summarizeNote(note.content);

    const updated = await prisma.note.update({
      where: { id },
      data: { summary },
    });

    res.json(updated);
  } catch (error) {
    logger.error({ err: error }, 'Error summarizing note:');
    res.status(500).json({ error: 'Failed to summarize note' });
  }
});

router.post('/notes/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const notes = await prisma.note.findMany({
      include: { tags: true, folder: true },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    if (notes.length === 0) {
      res.json({ notes: [], method: 'empty' });
      return;
    }

    try {
      const { chatCompletion } = await import('../services/ai');

      const notesContext = notes
        .map(
          (n, i) =>
            `[${i}] Title: "${n.title}"\nContent: "${(n.content || '').substring(0, 200)}"`
        )
        .join('\n\n');

      const response = await chatCompletion([
        {
          role: 'system',
          content: `You are a search assistant. Given a user query and a list of notes, return the indices of the most relevant notes, ranked by relevance. Return ONLY a JSON array of indices, e.g. [0, 2, 5]. If no notes are relevant, return [].`,
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nNotes:\n${notesContext}`,
        },
      ]);

      const indices: number[] = JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
      const rankedNotes = indices.map((i) => notes[i]).filter(Boolean);

      res.json({ notes: rankedNotes, method: 'ai' });
    } catch (aiError) {
      logger.warn({ err: aiError }, 'AI search failed, falling back to text search:');

      const searchTerm = query
        .split(/\s+/)
        .filter(Boolean)
        .map((t: string) => `${t}:*`)
        .join(' & ');

      const results = await prisma.$queryRaw`
        SELECT n.*
        FROM "Note" n
        WHERE to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.content, '')) 
              @@ to_tsquery('english', ${searchTerm})
        LIMIT 20
      `;

      res.json({ notes: results, method: 'fallback' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error in smart search:');
    res.status(500).json({ error: 'Failed to perform smart search' });
  }
});

export default router;
