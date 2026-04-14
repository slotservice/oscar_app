import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const checklistRouter = Router();

checklistRouter.use(authenticate);

// GET /api/rounds/:roundId/checklist — sections + items + entries
// Filters items by operator level: VETERAN sees fewest, TRAINEE sees all
checklistRouter.get('/:roundId/checklist', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.roundId },
      select: { plantId: true },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    // Get operator level for filtering
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
      select: { operatorLevel: true },
    });
    const level = user?.operatorLevel || 'TRAINEE';

    // Level hierarchy: TRAINEE sees all, EXPERIENCED sees EXPERIENCED+VETERAN, VETERAN sees VETERAN only
    const levelFilter: string[] = [];
    if (level === 'TRAINEE') levelFilter.push('TRAINEE', 'EXPERIENCED', 'VETERAN');
    else if (level === 'EXPERIENCED') levelFilter.push('EXPERIENCED', 'VETERAN');
    else levelFilter.push('VETERAN');

    const sections = await prisma.checklistSection.findMany({
      where: { plantId: round.plantId, active: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        items: {
          where: {
            active: true,
            minimumLevel: { in: levelFilter as any },
          },
          orderBy: { displayOrder: 'asc' },
          include: {
            entries: {
              where: { roundId: req.params.roundId },
              take: 1,
            },
          },
        },
      },
    });

    // Flatten entries for easier consumption
    const result = sections
      .filter((section) => section.items.length > 0) // Skip empty sections
      .map((section) => ({
        id: section.id,
        name: section.name,
        displayOrder: section.displayOrder,
        items: section.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          displayOrder: item.displayOrder,
          requiresNoteOnAttention: item.requiresNoteOnAttention,
          entry: item.entries[0] || null,
        })),
        // Section completion stats
        completed: section.items.filter((i) => i.entries.length > 0).length,
        total: section.items.length,
      }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Get checklist error:', err);
    res.status(500).json({ success: false, error: 'Failed to get checklist' });
  }
});

// PUT /api/rounds/:roundId/checklist/:itemId — save entry (auto-save)
checklistRouter.put('/:roundId/checklist/:itemId', async (req: Request, res: Response) => {
  try {
    const { status, note, imageUrl } = req.body;
    if (!status || !['OK', 'ATTENTION', 'NA'].includes(status)) {
      res.status(400).json({ success: false, error: 'Valid status required (OK, ATTENTION, NA)' });
      return;
    }

    const entry = await prisma.checklistEntry.upsert({
      where: {
        roundId_itemId: {
          roundId: req.params.roundId,
          itemId: req.params.itemId,
        },
      },
      update: {
        status,
        note: note ?? null,
        imageUrl: imageUrl ?? null,
        timestamp: new Date(),
      },
      create: {
        roundId: req.params.roundId,
        itemId: req.params.itemId,
        status,
        note: note ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    console.error('Save checklist entry error:', err);
    res.status(500).json({ success: false, error: 'Failed to save entry' });
  }
});
