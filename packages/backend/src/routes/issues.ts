import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const issuesRouter = Router();

issuesRouter.use(authenticate);

// GET /api/rounds/:roundId/issues
issuesRouter.get('/:roundId/issues', async (req: Request, res: Response) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { roundId: req.params.roundId },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ success: true, data: issues });
  } catch (err) {
    console.error('Get issues error:', err);
    res.status(500).json({ success: false, error: 'Failed to get issues' });
  }
});

// POST /api/rounds/:roundId/issues
issuesRouter.post('/:roundId/issues', async (req: Request, res: Response) => {
  try {
    const { description, actionTaken, supervisorFlag } = req.body;
    if (!description) {
      res.status(400).json({ success: false, error: 'Description required' });
      return;
    }

    const issue = await prisma.issue.create({
      data: {
        roundId: req.params.roundId,
        description,
        actionTaken: actionTaken ?? null,
        supervisorFlag: supervisorFlag ?? false,
      },
    });

    res.status(201).json({ success: true, data: issue });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
});

// PUT /api/rounds/:roundId/issues/:id
issuesRouter.put('/:roundId/issues/:id', async (req: Request, res: Response) => {
  try {
    const { description, actionTaken, supervisorFlag, resolved } = req.body;

    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description;
    if (actionTaken !== undefined) updateData.actionTaken = actionTaken;
    if (supervisorFlag !== undefined) updateData.supervisorFlag = supervisorFlag;
    if (resolved !== undefined) updateData.resolved = resolved;

    const issue = await prisma.issue.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: issue });
  } catch (err) {
    console.error('Update issue error:', err);
    res.status(500).json({ success: false, error: 'Failed to update issue' });
  }
});
