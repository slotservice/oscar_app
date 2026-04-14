import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const labsRouter = Router();

labsRouter.use(authenticate);

// GET /api/rounds/:roundId/labs — lab fields with entries
labsRouter.get('/:roundId/labs', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.roundId },
      select: { plantId: true },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    const labFields = await prisma.labField.findMany({
      where: { plantId: round.plantId, active: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        entries: {
          where: { roundId: req.params.roundId },
          take: 1,
        },
      },
    });

    const result = labFields.map((field) => ({
      id: field.id,
      name: field.name,
      unit: field.unit,
      displayOrder: field.displayOrder,
      isRequired: field.isRequired,
      recommendedFrequency: field.recommendedFrequency,
      entry: field.entries[0] || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Get labs error:', err);
    res.status(500).json({ success: false, error: 'Failed to get lab data' });
  }
});

// PUT /api/rounds/:roundId/labs/:fieldId — save lab value (auto-save)
labsRouter.put('/:roundId/labs/:fieldId', async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    if (value === undefined || value === null || isNaN(Number(value))) {
      res.status(400).json({ success: false, error: 'Numeric value required' });
      return;
    }

    const entry = await prisma.labEntry.upsert({
      where: {
        roundId_labFieldId: {
          roundId: req.params.roundId,
          labFieldId: req.params.fieldId,
        },
      },
      update: {
        value: Number(value),
        timestamp: new Date(),
      },
      create: {
        roundId: req.params.roundId,
        labFieldId: req.params.fieldId,
        value: Number(value),
      },
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    console.error('Save lab entry error:', err);
    res.status(500).json({ success: false, error: 'Failed to save lab value' });
  }
});
