import { Router, Request, Response } from 'express';
import { authenticate, prisma } from '../middleware/auth';

export const plantsRouter = Router();

plantsRouter.use(authenticate);

// GET /api/plants — user's assigned plants
plantsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.userPlant.findMany({
      where: { userId: req.user!.userId },
      include: {
        plant: {
          select: { id: true, name: true, location: true, plantType: true, active: true },
        },
      },
    });

    const plants = assignments.map((a) => a.plant).filter((p) => p.active);
    res.json({ success: true, data: plants });
  } catch (err) {
    console.error('Get plants error:', err);
    res.status(500).json({ success: false, error: 'Failed to get plants' });
  }
});

// GET /api/plants/:id
plantsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const plant = await prisma.plant.findUnique({
      where: { id: req.params.id },
      include: {
        checklistSections: {
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { active: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        labFields: {
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        },
        observationTags: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!plant) {
      res.status(404).json({ success: false, error: 'Plant not found' });
      return;
    }

    res.json({ success: true, data: plant });
  } catch (err) {
    console.error('Get plant error:', err);
    res.status(500).json({ success: false, error: 'Failed to get plant' });
  }
});
