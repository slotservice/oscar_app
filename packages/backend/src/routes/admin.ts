import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole, prisma } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole('ADMIN'));

// ─── Plants ──────────────────────────────────────────────

adminRouter.get('/plants', async (_req: Request, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: plants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get plants' });
  }
});

adminRouter.post('/plants', async (req: Request, res: Response) => {
  try {
    const { name, location, plantType } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Plant name required' });
      return;
    }
    const plant = await prisma.plant.create({
      data: { name, location, plantType },
    });
    res.status(201).json({ success: true, data: plant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create plant' });
  }
});

adminRouter.put('/plants/:id', async (req: Request, res: Response) => {
  try {
    const { name, location, plantType, active } = req.body;
    const plant = await prisma.plant.update({
      where: { id: req.params.id },
      data: { name, location, plantType, active },
    });
    res.json({ success: true, data: plant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update plant' });
  }
});

adminRouter.delete('/plants/:id', async (req: Request, res: Response) => {
  try {
    await prisma.plant.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete plant. It may have linked data (rounds, users).' });
  }
});

// ─── Checklist Sections ─────────────────────────────────

adminRouter.get('/plants/:plantId/sections', async (req: Request, res: Response) => {
  try {
    const sections = await prisma.checklistSection.findMany({
      where: { plantId: req.params.plantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        items: { orderBy: { displayOrder: 'asc' } },
      },
    });
    res.json({ success: true, data: sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get sections' });
  }
});

adminRouter.post('/plants/:plantId/sections', async (req: Request, res: Response) => {
  try {
    const { name, displayOrder } = req.body;
    const section = await prisma.checklistSection.create({
      data: { plantId: req.params.plantId, name, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create section' });
  }
});

adminRouter.put('/sections/:id', async (req: Request, res: Response) => {
  try {
    const { name, displayOrder, active } = req.body;
    const section = await prisma.checklistSection.update({
      where: { id: req.params.id },
      data: { name, displayOrder, active },
    });
    res.json({ success: true, data: section });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update section' });
  }
});

adminRouter.delete('/sections/:id', async (req: Request, res: Response) => {
  try {
    await prisma.checklistSection.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete section' });
  }
});

// ─── Checklist Items ────────────────────────────────────

adminRouter.post('/sections/:sectionId/items', async (req: Request, res: Response) => {
  try {
    const { name, description, displayOrder, requiresNoteOnAttention } = req.body;
    const item = await prisma.checklistItem.create({
      data: {
        sectionId: req.params.sectionId,
        name,
        description,
        displayOrder: displayOrder ?? 0,
        requiresNoteOnAttention: requiresNoteOnAttention ?? true,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  }
});

adminRouter.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, displayOrder, requiresNoteOnAttention, active } = req.body;
    const item = await prisma.checklistItem.update({
      where: { id: req.params.id },
      data: { name, description, displayOrder, requiresNoteOnAttention, active },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

adminRouter.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    await prisma.checklistItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

// ─── Lab Fields ─────────────────────────────────────────

adminRouter.get('/plants/:plantId/lab-fields', async (req: Request, res: Response) => {
  try {
    const fields = await prisma.labField.findMany({
      where: { plantId: req.params.plantId },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: fields });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get lab fields' });
  }
});

adminRouter.post('/plants/:plantId/lab-fields', async (req: Request, res: Response) => {
  try {
    const { name, unit, displayOrder } = req.body;
    const field = await prisma.labField.create({
      data: { plantId: req.params.plantId, name, unit, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json({ success: true, data: field });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create lab field' });
  }
});

adminRouter.put('/lab-fields/:id', async (req: Request, res: Response) => {
  try {
    const { name, unit, displayOrder, active } = req.body;
    const field = await prisma.labField.update({
      where: { id: req.params.id },
      data: { name, unit, displayOrder, active },
    });
    res.json({ success: true, data: field });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update lab field' });
  }
});

adminRouter.delete('/lab-fields/:id', async (req: Request, res: Response) => {
  try {
    await prisma.labField.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete lab field. It may have linked threshold rules or entries.' });
  }
});

// ─── Threshold Rules ────────────────────────────────────

adminRouter.get('/plants/:plantId/thresholds', async (req: Request, res: Response) => {
  try {
    const rules = await prisma.thresholdRule.findMany({
      where: { plantId: req.params.plantId },
      include: { labField: true },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get thresholds' });
  }
});

adminRouter.post('/plants/:plantId/thresholds', async (req: Request, res: Response) => {
  try {
    const { labFieldId, cautionLow, cautionHigh, criticalLow, criticalHigh, suggestionText } = req.body;
    const rule = await prisma.thresholdRule.create({
      data: {
        plantId: req.params.plantId,
        labFieldId,
        cautionLow,
        cautionHigh,
        criticalLow,
        criticalHigh,
        suggestionText,
      },
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create threshold' });
  }
});

adminRouter.put('/thresholds/:id', async (req: Request, res: Response) => {
  try {
    const { cautionLow, cautionHigh, criticalLow, criticalHigh, suggestionText, active } = req.body;
    const rule = await prisma.thresholdRule.update({
      where: { id: req.params.id },
      data: { cautionLow, cautionHigh, criticalLow, criticalHigh, suggestionText, active },
    });
    res.json({ success: true, data: rule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update threshold' });
  }
});

adminRouter.delete('/thresholds/:id', async (req: Request, res: Response) => {
  try {
    await prisma.thresholdRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete threshold' });
  }
});

// ─── Observation Tags ───────────────────────────────────

adminRouter.get('/plants/:plantId/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.observationTag.findMany({
      where: { plantId: req.params.plantId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get tags' });
  }
});

adminRouter.post('/plants/:plantId/tags', async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body;
    const tag = await prisma.observationTag.create({
      data: { plantId: req.params.plantId, name, category },
    });
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create tag' });
  }
});

adminRouter.put('/tags/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, active } = req.body;
    const tag = await prisma.observationTag.update({
      where: { id: req.params.id },
      data: { name, category, active },
    });
    res.json({ success: true, data: tag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update tag' });
  }
});

adminRouter.delete('/tags/:id', async (req: Request, res: Response) => {
  try {
    await prisma.observationTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete tag. It may have linked rules or entries.' });
  }
});

// ─── Tag Rules ──────────────────────────────────────────

adminRouter.get('/plants/:plantId/tag-rules', async (req: Request, res: Response) => {
  try {
    const rules = await prisma.tagRule.findMany({
      where: { plantId: req.params.plantId },
      include: { tag: true },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get tag rules' });
  }
});

adminRouter.post('/plants/:plantId/tag-rules', async (req: Request, res: Response) => {
  try {
    const { tagId, suggestionText, severity } = req.body;
    const rule = await prisma.tagRule.create({
      data: {
        plantId: req.params.plantId,
        tagId,
        suggestionText,
        severity: severity || 'CAUTION',
      },
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create tag rule' });
  }
});

adminRouter.put('/tag-rules/:id', async (req: Request, res: Response) => {
  try {
    const { suggestionText, severity, active } = req.body;
    const rule = await prisma.tagRule.update({
      where: { id: req.params.id },
      data: { suggestionText, severity, active },
    });
    res.json({ success: true, data: rule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update tag rule' });
  }
});

adminRouter.delete('/tag-rules/:id', async (req: Request, res: Response) => {
  try {
    await prisma.tagRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete tag rule' });
  }
});

// ─── Users ──────────────────────────────────────────────

adminRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

adminRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      res.status(400).json({ success: false, error: 'Email, name, and password required' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: role || 'USER' },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

adminRouter.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, role, active } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
adminRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    // Remove plant assignments first
    await prisma.userPlant.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete user. User may have daily rounds linked.' });
  }
});

// Assign user to plant
adminRouter.post('/users/:userId/assign-plant', async (req: Request, res: Response) => {
  try {
    const { plantId } = req.body;
    if (!plantId) {
      res.status(400).json({ success: false, error: 'plantId required' });
      return;
    }
    // Check if already assigned
    const existing = await prisma.userPlant.findUnique({
      where: { userId_plantId: { userId: req.params.userId, plantId } },
    });
    if (existing) {
      res.status(409).json({ success: false, error: 'User is already assigned to this plant' });
      return;
    }
    const assignment = await prisma.userPlant.create({
      data: { userId: req.params.userId, plantId },
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to assign plant' });
  }
});

// Remove user from plant
adminRouter.delete('/users/:userId/plants/:plantId', async (req: Request, res: Response) => {
  try {
    await prisma.userPlant.delete({
      where: {
        userId_plantId: {
          userId: req.params.userId,
          plantId: req.params.plantId,
        },
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to remove plant assignment' });
  }
});
