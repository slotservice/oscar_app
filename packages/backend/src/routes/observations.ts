import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const observationsRouter = Router();

observationsRouter.use(authenticate);

// GET /api/rounds/:roundId/observations — available tags + selected entries
observationsRouter.get('/:roundId/observations', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.roundId },
      select: { plantId: true },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    const [tags, entries] = await Promise.all([
      prisma.observationTag.findMany({
        where: { plantId: round.plantId, active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.observationEntry.findMany({
        where: { roundId: req.params.roundId },
        include: { tag: true },
      }),
    ]);

    res.json({
      success: true,
      data: { tags, entries },
    });
  } catch (err) {
    console.error('Get observations error:', err);
    res.status(500).json({ success: false, error: 'Failed to get observations' });
  }
});

// POST /api/rounds/:roundId/observations — add observation entry
observationsRouter.post('/:roundId/observations', async (req: Request, res: Response) => {
  try {
    const { tagId, area, note } = req.body;
    if (!tagId) {
      res.status(400).json({ success: false, error: 'tagId required' });
      return;
    }

    const entry = await prisma.observationEntry.create({
      data: {
        roundId: req.params.roundId,
        tagId,
        area: area ?? null,
        note: note ?? null,
      },
      include: { tag: true },
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('Add observation error:', err);
    res.status(500).json({ success: false, error: 'Failed to add observation' });
  }
});

// DELETE /api/rounds/:roundId/observations/:id
observationsRouter.delete('/:roundId/observations/:id', async (req: Request, res: Response) => {
  try {
    await prisma.observationEntry.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete observation error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete observation' });
  }
});
