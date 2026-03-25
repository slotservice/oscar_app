import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';
import { evaluateRound } from '../engine/rules';

export const suggestionsRouter = Router();

suggestionsRouter.use(authenticate);

// POST /api/rounds/:roundId/evaluate — run rules engine
suggestionsRouter.post('/:roundId/evaluate', async (req: Request, res: Response) => {
  try {
    const round = await prisma.dailyRound.findUnique({
      where: { id: req.params.roundId },
    });

    if (!round) {
      res.status(404).json({ success: false, error: 'Round not found' });
      return;
    }

    const result = await evaluateRound(req.params.roundId, round.plantId);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Evaluate error:', err);
    res.status(500).json({ success: false, error: 'Failed to evaluate round' });
  }
});

// GET /api/rounds/:roundId/suggestions
suggestionsRouter.get('/:roundId/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = await prisma.suggestion.findMany({
      where: { roundId: req.params.roundId },
      orderBy: [{ severity: 'desc' }, { timestamp: 'asc' }],
    });

    res.json({ success: true, data: suggestions });
  } catch (err) {
    console.error('Get suggestions error:', err);
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
});

// PUT /api/rounds/:roundId/suggestions/:id/ack — acknowledge suggestion
suggestionsRouter.put('/:roundId/suggestions/:id/ack', async (req: Request, res: Response) => {
  try {
    const suggestion = await prisma.suggestion.update({
      where: { id: req.params.id },
      data: { acknowledged: true },
    });

    res.json({ success: true, data: suggestion });
  } catch (err) {
    console.error('Acknowledge suggestion error:', err);
    res.status(500).json({ success: false, error: 'Failed to acknowledge' });
  }
});
