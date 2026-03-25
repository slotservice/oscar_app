import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const roundsRouter = Router();

roundsRouter.use(authenticate);

// POST /api/rounds — start a new daily round
roundsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { plantId } = req.body;
    if (!plantId) {
      res.status(400).json({ success: false, error: 'plantId required' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for existing round today
    const existing = await prisma.dailyRound.findUnique({
      where: {
        plantId_operatorId_date: {
          plantId,
          operatorId: req.user!.userId,
          date: today,
        },
      },
    });

    if (existing) {
      // Return existing in-progress round
      res.json({ success: true, data: existing });
      return;
    }

    const round = await prisma.dailyRound.create({
      data: {
        plantId,
        operatorId: req.user!.userId,
        date: today,
      },
    });

    res.status(201).json({ success: true, data: round });
  } catch (err) {
    console.error('Create round error:', err);
    res.status(500).json({ success: false, error: 'Failed to create round' });
  }
});

// GET /api/rounds/:id
roundsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.id },
      include: {
        operator: { select: { id: true, name: true, email: true, role: true } },
        plant: { select: { id: true, name: true, location: true } },
      },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    res.json({ success: true, data: round });
  } catch (err) {
    console.error('Get round error:', err);
    res.status(500).json({ success: false, error: 'Failed to get round' });
  }
});

// PUT /api/rounds/:id — update notes, sign off
roundsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { notes, signedOff } = req.body;

    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData.notes = notes;
    if (signedOff !== undefined) {
      updateData.signedOff = signedOff;
      if (signedOff) {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }
    }

    const round = await prisma.dailyRound.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: round });
  } catch (err) {
    console.error('Update round error:', err);
    res.status(500).json({ success: false, error: 'Failed to update round' });
  }
});

// GET /api/rounds/:id/summary — full round summary
roundsRouter.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.id },
      include: {
        operator: { select: { id: true, name: true } },
        plant: { select: { id: true, name: true } },
        checklistEntries: { include: { item: true } },
        labEntries: { include: { labField: true } },
        observationEntries: { include: { tag: true } },
        suggestions: true,
        issues: true,
      },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    // Compute summary stats
    const totalItems = round.checklistEntries.length;
    const okCount = round.checklistEntries.filter((e) => e.status === 'OK').length;
    const attentionCount = round.checklistEntries.filter((e) => e.status === 'ATTENTION').length;

    res.json({
      success: true,
      data: {
        ...round,
        stats: {
          totalItems,
          okCount,
          attentionCount,
          naCount: totalItems - okCount - attentionCount,
          labEntriesCount: round.labEntries.length,
          observationsCount: round.observationEntries.length,
          suggestionsCount: round.suggestions.length,
          issuesCount: round.issues.length,
        },
      },
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});
