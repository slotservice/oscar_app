import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? undefined : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding Oscar database...');

  // ─── Users ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const veteranPassword = await bcrypt.hash('veteran123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@oscar.app' },
    update: {},
    create: {
      email: 'admin@oscar.app',
      name: 'Shad (Admin)',
      passwordHash: adminPassword,
      role: 'ADMIN',
      operatorLevel: 'EXPERIENCED',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@oscar.app' },
    update: {},
    create: {
      email: 'operator@oscar.app',
      name: 'John Operator',
      passwordHash: operatorPassword,
      role: 'USER',
      operatorLevel: 'TRAINEE',
    },
  });

  const veteran = await prisma.user.upsert({
    where: { email: 'veteran@oscar.app' },
    update: {},
    create: {
      email: 'veteran@oscar.app',
      name: 'Mike Veteran',
      passwordHash: veteranPassword,
      role: 'USER',
      operatorLevel: 'VETERAN',
    },
  });

  console.log('  Users created (admin, operator, veteran)');

  // ─── Plant ──────────────────────────────────────────────
  const plant = await prisma.plant.create({
    data: {
      name: 'Greenfield WWTP',
      location: 'Greenfield, KS',
      plantType: 'Activated Sludge',
    },
  });

  await prisma.userPlant.createMany({
    data: [
      { userId: admin.id, plantId: plant.id },
      { userId: operator.id, plantId: plant.id },
      { userId: veteran.id, plantId: plant.id },
    ],
  });

  console.log('  Plant created');

  // ─── Checklist Sections & Items ─────────────────────────
  // minimumLevel: TRAINEE = all see it, EXPERIENCED = experienced+veteran, VETERAN = veteran only

  const sections = [
    {
      name: 'Arrival / Grounds',
      order: 1,
      items: [
        { name: 'Gate and perimeter secure', level: 'TRAINEE' as const },
        { name: 'Parking area clear', level: 'TRAINEE' as const },
        { name: 'General grounds condition', level: 'TRAINEE' as const },
        { name: 'Any unusual odors on arrival', level: 'EXPERIENCED' as const },
        { name: 'Weather conditions noted', level: 'TRAINEE' as const },
        { name: 'Security lights operational', level: 'TRAINEE' as const },
      ],
    },
    {
      name: 'Mechanical Equipment',
      order: 2,
      items: [
        { name: 'Influent pump station operating', level: 'TRAINEE' as const },
        { name: 'Blowers running normally', level: 'TRAINEE' as const },
        { name: 'RAS pumps operating', level: 'EXPERIENCED' as const },
        { name: 'WAS pumps operating', level: 'EXPERIENCED' as const },
        { name: 'Aerators checked', level: 'EXPERIENCED' as const },
        { name: 'Belt press / dewatering equipment', level: 'TRAINEE' as const },
        { name: 'Chemical feed systems', level: 'EXPERIENCED' as const },
        { name: 'Standby equipment ready', level: 'TRAINEE' as const },
      ],
    },
    {
      name: 'Process Observations',
      order: 3,
      items: [
        { name: 'Headworks / screening', level: 'TRAINEE' as const },
        { name: 'Primary clarifier appearance', level: 'TRAINEE' as const },
        { name: 'Aeration basin color and activity', level: 'TRAINEE' as const },
        { name: 'Secondary clarifier appearance', level: 'TRAINEE' as const },
        { name: 'Effluent quality visual check', level: 'TRAINEE' as const },
        { name: 'Sludge blanket depth acceptable', level: 'EXPERIENCED' as const },
        { name: 'Disinfection system operating', level: 'TRAINEE' as const },
      ],
    },
    {
      name: 'Housekeeping',
      order: 4,
      items: [
        { name: 'Control room clean and organized', level: 'TRAINEE' as const },
        { name: 'Lab area clean', level: 'TRAINEE' as const },
        { name: 'Chemical storage area secured', level: 'TRAINEE' as const },
        { name: 'Walkways and handrails clear', level: 'TRAINEE' as const },
        { name: 'Spill kits available', level: 'TRAINEE' as const },
        { name: 'Safety equipment accessible', level: 'TRAINEE' as const },
        { name: 'Trash removed', level: 'TRAINEE' as const },
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
        name: item.name,
        displayOrder: index + 1,
        requiresNoteOnAttention: true,
        minimumLevel: item.level,
      })),
    });
  }

  console.log('  Checklist sections & items created (28 items with operator levels)');

  // ─── Lab Fields ─────────────────────────────────────────
  // Per OSCAR Logic Matrix: 8 required daily, 4 optional

  const labFields = [
    // Required daily fields
    { name: 'Influent Flow', unit: 'MGD', isRequired: true, frequency: 'daily' },
    { name: 'MLSS', unit: 'mg/L', isRequired: true, frequency: 'daily' },
    { name: 'DO', unit: 'mg/L', isRequired: true, frequency: 'daily' },
    { name: 'Temperature', unit: '°F', isRequired: true, frequency: 'daily' },
    { name: 'RAS Rate', unit: 'GPM', isRequired: true, frequency: 'daily' },
    { name: 'RAS Concentration', unit: 'mg/L', isRequired: true, frequency: 'daily' },
    { name: 'WAS Rate', unit: 'gal', isRequired: true, frequency: 'daily' },
    { name: 'Blanket Depth', unit: 'ft', isRequired: true, frequency: 'daily' },
    // Optional fields
    { name: 'pH', unit: 'SU', isRequired: false, frequency: '2x_week' },
    { name: 'Ammonia', unit: 'mg/L', isRequired: false, frequency: '2x_week' },
    { name: 'Settleability', unit: 'mL/L', isRequired: false, frequency: '2x_week' },
    { name: 'WAS Concentration', unit: 'mg/L', isRequired: false, frequency: 'weekly' },
  ];

  const createdLabFields: Record<string, string> = {};

  for (let i = 0; i < labFields.length; i++) {
    const field = await prisma.labField.create({
      data: {
        plantId: plant.id,
        name: labFields[i].name,
        unit: labFields[i].unit,
        displayOrder: i + 1,
        isRequired: labFields[i].isRequired,
        recommendedFrequency: labFields[i].frequency,
      },
    });
    createdLabFields[field.name] = field.id;
  }

  console.log('  Lab fields created (8 required + 4 optional = 12 fields)');

  // ─── Threshold Rules ───────────────────────────────────

  const thresholds = [
    { field: 'DO', cautionLow: 1.5, cautionHigh: 6.0, criticalLow: 0.5, criticalHigh: 8.0, text: 'Check aeration performance. Adjust blower output.' },
    { field: 'pH', cautionLow: 6.5, cautionHigh: 8.5, criticalLow: 6.0, criticalHigh: 9.0, text: 'pH out of range. Review chemical feed and influent source.' },
    { field: 'Temperature', cautionLow: 50, cautionHigh: 85, criticalLow: 40, criticalHigh: 95, text: 'Temperature may affect biological performance. Monitor closely.' },
    { field: 'MLSS', cautionLow: 1500, cautionHigh: 4000, criticalLow: 1000, criticalHigh: 5000, text: 'Biomass inventory out of range. Review wasting and RAS rates.' },
    { field: 'Ammonia', cautionLow: null, cautionHigh: 5.0, criticalLow: null, criticalHigh: 10.0, text: 'Elevated ammonia. Review biomass condition, loading, and aeration.' },
    { field: 'Settleability', cautionLow: 100, cautionHigh: 600, criticalLow: 50, criticalHigh: 800, text: 'Settling characteristics abnormal. Check sludge age and condition.' },
    { field: 'Influent Flow', cautionLow: null, cautionHigh: null, criticalLow: null, criticalHigh: null, text: 'Flow conditions outside normal range.' },
    { field: 'Blanket Depth', cautionLow: null, cautionHigh: 2.5, criticalLow: null, criticalHigh: 4.0, text: 'Blanket depth elevated. Review RAS rate and clarifier performance.' },
  ];

  for (const t of thresholds) {
    if (createdLabFields[t.field]) {
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
  }

  console.log('  Threshold rules created (8 rules)');

  // ─── Observation Tags & Tag Rules ──────────────────────
  // Updated per OSCAR Logic Matrix operator observation flags

  const tagConfigs = [
    // Required operator concern flags (per newchat.md)
    { name: 'Foam increase', category: 'Process', suggestion: 'May indicate young sludge or industrial discharge. Monitor.', severity: 'CAUTION' as const },
    { name: 'Pin floc observed', category: 'Process', suggestion: 'Settling quality may be declining. Review sludge age.', severity: 'CAUTION' as const },
    { name: 'Cloudy effluent', category: 'Clarifier', suggestion: 'Review settling characteristics and clarifier performance.', severity: 'CAUTION' as const },
    { name: 'Septic odor', category: 'Process', suggestion: 'Low DO conditions possible. Check aeration and influent for septicity.', severity: 'CAUTION' as const },
    { name: 'Dark sludge', category: 'Process', suggestion: 'MLSS may be high or old sludge. Review sludge age and wasting.', severity: 'CAUTION' as const },
    { name: 'Poor visible settling', category: 'Clarifier', suggestion: 'Settling quality reduced. Review sludge blanket and RAS operation.', severity: 'CAUTION' as const },
    { name: 'Unusual flow condition', category: 'Hydraulic', suggestion: 'Note flow conditions. May indicate I/I or unusual discharge.', severity: 'CAUTION' as const },
    { name: 'Equipment issue', category: 'Mechanical', suggestion: 'Inspect equipment for bearing or alignment issues. Schedule maintenance.', severity: 'CRITICAL' as const },
    { name: 'Other concern', category: 'General', suggestion: 'Operator notes a concern. Review details and take appropriate action.', severity: 'CAUTION' as const },
    // Additional useful tags
    { name: 'Solids carryover', category: 'Clarifier', suggestion: 'Check sludge blanket depth. Consider increasing RAS or wasting.', severity: 'CRITICAL' as const },
    { name: 'Floating sludge', category: 'Clarifier', suggestion: 'Possible denitrification in clarifier. Review RAS rates and sludge age.', severity: 'CRITICAL' as const },
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

  console.log('  Observation tags & rules created (11 tags — 9 OSCAR flags + 2 critical)');

  console.log('\nSeed complete!');
  console.log('─────────────────────────────────────');
  console.log('  Admin login:    admin@oscar.app / admin123');
  console.log('  Operator login: operator@oscar.app / operator123  (TRAINEE)');
  console.log('  Veteran login:  veteran@oscar.app / veteran123    (VETERAN)');
  console.log('  Plant:          Greenfield WWTP');
  console.log('  Lab fields:     8 required + 4 optional = 12');
  console.log('  Obs flags:      11 operator concern tags');
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
