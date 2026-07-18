import { logger } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireOptionalAuth } from '../middleware/auth';

const router = Router();
router.use(requireOptionalAuth);

router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { notes: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching tags:');
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.post('/tags', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }

    const existing = await prisma.tag.findUnique({ where: { name: name.trim() } });
    if (existing) {
      res.status(409).json({ error: 'Tag already exists' });
      return;
    }

    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });

    res.status(201).json(tag);
  } catch (error) {
    logger.error({ err: error }, 'Error creating tag:');
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.put('/tags/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    const duplicate = await prisma.tag.findUnique({ where: { name: name.trim() } });
    if (duplicate && duplicate.id !== id) {
      res.status(409).json({ error: 'Tag name already exists' });
      return;
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { name: name.trim() },
    });

    res.json(tag);
  } catch (error) {
    logger.error({ err: error }, 'Error updating tag:');
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    await prisma.tag.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Error deleting tag:');
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
