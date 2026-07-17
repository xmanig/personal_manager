import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

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
    console.error('Error fetching notes:', error);
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
    console.error('Error fetching note:', error);
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
    console.error('Error creating note:', error);
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
    console.error('Error updating note:', error);
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
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
