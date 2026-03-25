import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const historyRouter = Router();

historyRouter.use(authenticate);

// GET /api/history?plantId=xxx&startDate=xxx&endDate=xxx&page=1&limit=20
historyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { plantId, startDate, endDate } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!plantId) {
      res.status(400).json({ success: false, error: 'plantId required' });
      return;
    }

    const where: Record<string, unknown> = { plantId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      where.date = dateFilter;
    }

    const [rounds, total] = await Promise.all([
      prisma.dailyRound.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          operator: { select: { id: true, name: true } },
          _count: {
            select: {
              checklistEntries: true,
              suggestions: true,
              issues: true,
            },
          },
        },
      }),
      prisma.dailyRound.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        rounds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// GET /api/history/:roundId — full historical round
historyRouter.get('/:roundId', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.roundId },
      include: {
        operator: { select: { id: true, name: true, email: true } },
        plant: { select: { id: true, name: true, location: true } },
        checklistEntries: {
          include: { item: { include: { section: true } } },
          orderBy: { timestamp: 'asc' },
        },
        labEntries: {
          include: { labField: true },
          orderBy: { labField: { displayOrder: 'asc' } },
        },
        observationEntries: {
          include: { tag: true },
          orderBy: { timestamp: 'asc' },
        },
        suggestions: { orderBy: { severity: 'desc' } },
        issues: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    res.json({ success: true, data: round });
  } catch (err) {
    console.error('Get historical round error:', err);
    res.status(500).json({ success: false, error: 'Failed to get round' });
  }
});
