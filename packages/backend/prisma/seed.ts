import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding Oscar database...');

  // ─── Users ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@oscar.app' },
    update: {},
    create: {
      email: 'admin@oscar.app',
      name: 'Shad (Admin)',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@oscar.app' },
    update: {},
    create: {
      email: 'operator@oscar.app',
      name: 'John Operator',
      passwordHash: operatorPassword,
      role: 'OPERATOR',
    },
  });

  console.log('  Users created');

  // ─── Plant ──────────────────────────────────────────────
  const plant = await prisma.plant.create({
    data: {
      name: 'Greenfield WWTP',
      location: 'Greenfield, KS',
      plantType: 'Activated Sludge',
    },
  });

  // Assign users to plant
  await prisma.userPlant.createMany({
    data: [
      { userId: admin.id, plantId: plant.id },
      { userId: operator.id, plantId: plant.id },
    ],
  });

  console.log('  Plant created');

  // ─── Checklist Sections & Items ─────────────────────────

  const sections = [
    {
      name: 'Arrival / Grounds',
      order: 1,
      items: [
        'Gate and perimeter secure',
        'Parking area clear',
        'General grounds condition',
        'Any unusual odors on arrival',
        'Weather conditions noted',
        'Security lights operational',
      ],
    },
    {
      name: 'Mechanical Equipment',
      order: 2,
      items: [
        'Influent pump station operating',
        'Blowers running normally',
        'RAS pumps operating',
        'WAS pumps operating',
        'Aerators checked',
        'Belt press / dewatering equipment',
        'Chemical feed systems',
        'Standby equipment ready',
      ],
    },
    {
      name: 'Process Observations',
      order: 3,
      items: [
        'Headworks / screening',
        'Primary clarifier appearance',
        'Aeration basin color and activity',
        'Secondary clarifier appearance',
        'Effluent quality visual check',
        'Sludge blanket depth acceptable',
        'Disinfection system operating',
      ],
    },
    {
      name: 'Housekeeping',
      order: 4,
      items: [
        'Control room clean and organized',
        'Lab area clean',
        'Chemical storage area secured',
        'Walkways and handrails clear',
        'Spill kits available',
        'Safety equipment accessible',
        'Trash removed',
      ],
    },
  ];

  for (const section of sections) {
    const created = await prisma.checklistSection.create({
      data: {
        plantId: plant.id,
        name: section.name,
        displayOrder: section.order,
      },
    });

    await prisma.checklistItem.createMany({
      data: section.items.map((item, index) => ({
        sectionId: created.id,
        name: item,
        displayOrder: index + 1,
        requiresNoteOnAttention: true,
      })),
    });
  }

  console.log('  Checklist sections & items created (28 items)');

  // ─── Lab Fields ─────────────────────────────────────────

  const labFields = [
    { name: 'Flow', unit: 'MGD' },
    { name: 'DO', unit: 'mg/L' },
    { name: 'pH', unit: 'SU' },
    { name: 'Temperature', unit: '°F' },
    { name: 'MLSS', unit: 'mg/L' },
    { name: 'RAS', unit: 'mg/L' },
    { name: 'WAS', unit: 'gal' },
    { name: 'Ammonia', unit: 'mg/L' },
    { name: 'Settlometer', unit: 'mL/L' },
  ];

  const createdLabFields: Record<string, string> = {};

  for (let i = 0; i < labFields.length; i++) {
    const field = await prisma.labField.create({
      data: {
        plantId: plant.id,
        name: labFields[i].name,
        unit: labFields[i].unit,
        displayOrder: i + 1,
      },
    });
    createdLabFields[field.name] = field.id;
  }

  console.log('  Lab fields created (9 fields)');

  // ─── Threshold Rules ───────────────────────────────────

  const thresholds = [
    {
      field: 'DO',
      cautionLow: 1.5,
      cautionHigh: 6.0,
      criticalLow: 0.5,
      criticalHigh: 8.0,
      text: 'Check aeration performance. Adjust blower output.',
    },
    {
      field: 'pH',
      cautionLow: 6.5,
      cautionHigh: 8.5,
      criticalLow: 6.0,
      criticalHigh: 9.0,
      text: 'pH out of range. Review chemical feed and influent source.',
    },
    {
      field: 'Temperature',
      cautionLow: 50,
      cautionHigh: 85,
      criticalLow: 40,
      criticalHigh: 95,
      text: 'Temperature may affect biological performance. Monitor closely.',
    },
    {
      field: 'MLSS',
      cautionLow: 1500,
      cautionHigh: 4000,
      criticalLow: 1000,
      criticalHigh: 5000,
      text: 'Biomass inventory out of range. Review wasting and RAS rates.',
    },
    {
      field: 'Ammonia',
      cautionLow: null,
      cautionHigh: 5.0,
      criticalLow: null,
      criticalHigh: 10.0,
      text: 'Elevated ammonia. Review biomass condition, loading, and aeration.',
    },
    {
      field: 'Settlometer',
      cautionLow: 100,
      cautionHigh: 600,
      criticalLow: 50,
      criticalHigh: 800,
      text: 'Settling characteristics abnormal. Check sludge age and condition.',
    },
  ];

  for (const t of thresholds) {
    await prisma.thresholdRule.create({
      data: {
        plantId: plant.id,
        labFieldId: createdLabFields[t.field],
        cautionLow: t.cautionLow,
        cautionHigh: t.cautionHigh,
        criticalLow: t.criticalLow,
        criticalHigh: t.criticalHigh,
        suggestionText: t.text,
      },
    });
  }

  console.log('  Threshold rules created (6 rules)');

  // ─── Observation Tags & Tag Rules ──────────────────────

  const tagConfigs = [
    {
      name: 'Cloudy clarifier',
      category: 'Clarifier',
      suggestion: 'Review settling characteristics and RAS operation.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Solids carryover',
      category: 'Clarifier',
      suggestion: 'Check sludge blanket depth. Consider increasing RAS or wasting.',
      severity: 'CRITICAL' as const,
    },
    {
      name: 'Excess foam',
      category: 'Aeration',
      suggestion: 'May indicate young sludge or industrial discharge. Monitor.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Septic odor',
      category: 'General',
      suggestion: 'Low DO conditions possible. Check aeration and influent for septicity.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Light basin',
      category: 'Aeration',
      suggestion: 'MLSS may be low. Review wasting rates.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Dark basin',
      category: 'Aeration',
      suggestion: 'MLSS may be high or old sludge. Review sludge age.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Floating sludge',
      category: 'Clarifier',
      suggestion: 'Possible denitrification in clarifier. Review RAS rates and sludge age.',
      severity: 'CRITICAL' as const,
    },
    {
      name: 'Grease buildup',
      category: 'General',
      suggestion: 'Check grease removal equipment and headworks.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Unusual color',
      category: 'General',
      suggestion: 'Note color and location. May indicate industrial discharge.',
      severity: 'CAUTION' as const,
    },
    {
      name: 'Equipment noise',
      category: 'Mechanical',
      suggestion: 'Inspect equipment for bearing or alignment issues. Schedule maintenance.',
      severity: 'CAUTION' as const,
    },
  ];

  for (const tc of tagConfigs) {
    const tag = await prisma.observationTag.create({
      data: {
        plantId: plant.id,
        name: tc.name,
        category: tc.category,
      },
    });

    await prisma.tagRule.create({
      data: {
        plantId: plant.id,
        tagId: tag.id,
        suggestionText: tc.suggestion,
        severity: tc.severity,
      },
    });
  }

  console.log('  Observation tags & tag rules created (10 tags)');

  console.log('\nSeed complete!');
  console.log('─────────────────────────────────────');
  console.log('  Admin login:    admin@oscar.app / admin123');
  console.log('  Operator login: operator@oscar.app / operator123');
  console.log('  Plant:          Greenfield WWTP');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
