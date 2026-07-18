import { logger } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/folders', async (req: Request, res: Response) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(folders);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching folders:');
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

router.get('/folders/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        _count: { select: { notes: true } },
      },
    });

    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    res.json(folder);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching folder:');
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

router.post('/folders', async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }

    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent) {
        res.status(404).json({ error: 'Parent folder not found' });
        return;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    logger.error({ err: error }, 'Error creating folder:');
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.put('/folders/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, parentId } = req.body;

    const existing = await prisma.folder.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({ error: 'Folder name cannot be empty' });
      return;
    }

    if (parentId === id) {
      res.status(400).json({ error: 'Folder cannot be its own parent' });
      return;
    }

    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent) {
        res.status(404).json({ error: 'Parent folder not found' });
        return;
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
    });

    res.json(folder);
  } catch (error) {
    logger.error({ err: error }, 'Error updating folder:');
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

router.delete('/folders/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.folder.findUnique({
      where: { id },
      include: { children: true, notes: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    await prisma.folder.updateMany({
      where: { parentId: id },
      data: { parentId: existing.parentId },
    });

    await prisma.note.updateMany({
      where: { folderId: id },
      data: { folderId: existing.parentId },
    });

    await prisma.folder.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Error deleting folder:');
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
