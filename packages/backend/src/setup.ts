import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

/**
 * Full reset: drops all tables and re-creates + re-seeds.
 */
export async function resetAndSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  try {
    console.log('[Reset] Dropping all tables...');
    await pool.query(`
      DROP TABLE IF EXISTS issues CASCADE;
      DROP TABLE IF EXISTS suggestions CASCADE;
      DROP TABLE IF EXISTS observation_entries CASCADE;
      DROP TABLE IF EXISTS lab_entries CASCADE;
      DROP TABLE IF EXISTS checklist_entries CASCADE;
      DROP TABLE IF EXISTS daily_rounds CASCADE;
      DROP TABLE IF EXISTS tag_rules CASCADE;
      DROP TABLE IF EXISTS threshold_rules CASCADE;
      DROP TABLE IF EXISTS observation_tags CASCADE;
      DROP TABLE IF EXISTS lab_fields CASCADE;
      DROP TABLE IF EXISTS checklist_items CASCADE;
      DROP TABLE IF EXISTS checklist_sections CASCADE;
      DROP TABLE IF EXISTS user_plants CASCADE;
      DROP TABLE IF EXISTS plants CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS _prisma_migrations CASCADE;
      DROP TYPE IF EXISTS "Role" CASCADE;
      DROP TYPE IF EXISTS "ChecklistStatus" CASCADE;
      DROP TYPE IF EXISTS "RoundStatus" CASCADE;
      DROP TYPE IF EXISTS "Condition" CASCADE;
      DROP TYPE IF EXISTS "Severity" CASCADE;
    `);
    console.log('[Reset] All tables dropped.');

    // Re-create tables
    console.log('[Reset] Creating tables...');
    const sql = fs.readFileSync(path.join(__dirname, '../prisma/init.sql'), 'utf8');
    await pool.query(sql);
    console.log('[Reset] Tables created.');

    // Seed data
    console.log('[Reset] Seeding data...');
    await seedData(pool);
    console.log('[Reset] Complete!');
  } catch (err) {
    console.error('[Reset] Error:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

/**
 * Auto-setup: creates tables and seeds data if database is empty.
 * Runs once on server startup. Safe to call multiple times.
 */
export async function autoSetup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  try {
    // Check if tables exist
    const check = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`
    );

    if (!check.rows[0].exists) {
      console.log('[Setup] Creating database tables...');
      const sql = fs.readFileSync(path.join(__dirname, '../prisma/init.sql'), 'utf8');
      await pool.query(sql);
      console.log('[Setup] Tables created.');
    }

    // Check if data exists
    const users = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(users.rows[0].count) === 0) {
      console.log('[Setup] Seeding demo data...');
      await seedData(pool);
      console.log('[Setup] Seed complete.');
    } else {
      console.log('[Setup] Database already has data. Skipping seed.');
    }
  } catch (err) {
    console.error('[Setup] Error:', err);
  } finally {
    await pool.end();
  }
}

async function seedData(pool: Pool) {
  const adminHash = await bcrypt.hash('admin123', 10);
  const operatorHash = await bcrypt.hash('operator123', 10);

  // Users
  const adminRes = await pool.query(
    `INSERT INTO users (id, email, name, password_hash, role) VALUES (gen_random_uuid()::text, $1, $2, $3, 'ADMIN') RETURNING id`,
    ['admin@oscar.app', 'Shad (Admin)', adminHash]
  );
  const adminId = adminRes.rows[0].id;

  const opRes = await pool.query(
    `INSERT INTO users (id, email, name, password_hash, role) VALUES (gen_random_uuid()::text, $1, $2, $3, 'USER') RETURNING id`,
    ['operator@oscar.app', 'John Operator', operatorHash]
  );
  const operatorId = opRes.rows[0].id;

  // Plant
  const plantRes = await pool.query(
    `INSERT INTO plants (id, name, location, plant_type) VALUES (gen_random_uuid()::text, $1, $2, $3) RETURNING id`,
    ['Greenfield WWTP', 'Greenfield, KS', 'Activated Sludge']
  );
  const plantId = plantRes.rows[0].id;

  // Assign users
  await pool.query(`INSERT INTO user_plants (user_id, plant_id) VALUES ($1, $2), ($3, $2)`, [adminId, plantId, operatorId]);

  // Checklist sections + items
  const sections = [
    { name: 'Arrival / Grounds', items: ['Gate and perimeter secure', 'Parking area clear', 'General grounds condition', 'Any unusual odors on arrival', 'Weather conditions noted', 'Security lights operational'] },
    { name: 'Mechanical Equipment', items: ['Influent pump station operating', 'Blowers running normally', 'RAS pumps operating', 'WAS pumps operating', 'Aerators checked', 'Belt press / dewatering equipment', 'Chemical feed systems', 'Standby equipment ready'] },
    { name: 'Process Observations', items: ['Headworks / screening', 'Primary clarifier appearance', 'Aeration basin color and activity', 'Secondary clarifier appearance', 'Effluent quality visual check', 'Sludge blanket depth acceptable', 'Disinfection system operating'] },
    { name: 'Housekeeping', items: ['Control room clean and organized', 'Lab area clean', 'Chemical storage area secured', 'Walkways and handrails clear', 'Spill kits available', 'Safety equipment accessible', 'Trash removed'] },
  ];

  for (let s = 0; s < sections.length; s++) {
    const secRes = await pool.query(
      `INSERT INTO checklist_sections (id, plant_id, name, display_order) VALUES (gen_random_uuid()::text, $1, $2, $3) RETURNING id`,
      [plantId, sections[s].name, s + 1]
    );
    const secId = secRes.rows[0].id;
    for (let i = 0; i < sections[s].items.length; i++) {
      await pool.query(
        `INSERT INTO checklist_items (id, section_id, name, display_order) VALUES (gen_random_uuid()::text, $1, $2, $3)`,
        [secId, sections[s].items[i], i + 1]
      );
    }
  }

  // Lab fields
  const labFields = [
    ['Flow', 'MGD'], ['DO', 'mg/L'], ['pH', 'SU'], ['Temperature', '°F'],
    ['MLSS', 'mg/L'], ['RAS', 'mg/L'], ['WAS', 'gal'], ['Ammonia', 'mg/L'], ['Settlometer', 'mL/L'],
  ];
  const labFieldIds: Record<string, string> = {};
  for (let i = 0; i < labFields.length; i++) {
    const res = await pool.query(
      `INSERT INTO lab_fields (id, plant_id, name, unit, display_order) VALUES (gen_random_uuid()::text, $1, $2, $3, $4) RETURNING id`,
      [plantId, labFields[i][0], labFields[i][1], i + 1]
    );
    labFieldIds[labFields[i][0]] = res.rows[0].id;
  }

  // Threshold rules
  const thresholds = [
    { field: 'DO', cL: 1.5, cH: 6.0, crL: 0.5, crH: 8.0, text: 'Check aeration performance. Adjust blower output.' },
    { field: 'pH', cL: 6.5, cH: 8.5, crL: 6.0, crH: 9.0, text: 'pH out of range. Review chemical feed and influent source.' },
    { field: 'Temperature', cL: 50, cH: 85, crL: 40, crH: 95, text: 'Temperature may affect biological performance. Monitor closely.' },
    { field: 'MLSS', cL: 1500, cH: 4000, crL: 1000, crH: 5000, text: 'Biomass inventory out of range. Review wasting and RAS rates.' },
    { field: 'Ammonia', cL: null, cH: 5.0, crL: null, crH: 10.0, text: 'Elevated ammonia. Review biomass condition, loading, and aeration.' },
    { field: 'Settlometer', cL: 100, cH: 600, crL: 50, crH: 800, text: 'Settling characteristics abnormal. Check sludge age and condition.' },
  ];
  for (const t of thresholds) {
    await pool.query(
      `INSERT INTO threshold_rules (id, plant_id, lab_field_id, caution_low, caution_high, critical_low, critical_high, suggestion_text) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)`,
      [plantId, labFieldIds[t.field], t.cL, t.cH, t.crL, t.crH, t.text]
    );
  }

  // Observation tags + tag rules
  const tags = [
    { name: 'Cloudy clarifier', cat: 'Clarifier', sug: 'Review settling characteristics and RAS operation.', sev: 'CAUTION' },
    { name: 'Solids carryover', cat: 'Clarifier', sug: 'Check sludge blanket depth. Consider increasing RAS or wasting.', sev: 'CRITICAL' },
    { name: 'Excess foam', cat: 'Aeration', sug: 'May indicate young sludge or industrial discharge. Monitor.', sev: 'CAUTION' },
    { name: 'Septic odor', cat: 'General', sug: 'Low DO conditions possible. Check aeration and influent for septicity.', sev: 'CAUTION' },
    { name: 'Light basin', cat: 'Aeration', sug: 'MLSS may be low. Review wasting rates.', sev: 'CAUTION' },
    { name: 'Dark basin', cat: 'Aeration', sug: 'MLSS may be high or old sludge. Review sludge age.', sev: 'CAUTION' },
    { name: 'Floating sludge', cat: 'Clarifier', sug: 'Possible denitrification in clarifier. Review RAS rates and sludge age.', sev: 'CRITICAL' },
    { name: 'Grease buildup', cat: 'General', sug: 'Check grease removal equipment and headworks.', sev: 'CAUTION' },
    { name: 'Unusual color', cat: 'General', sug: 'Note color and location. May indicate industrial discharge.', sev: 'CAUTION' },
    { name: 'Equipment noise', cat: 'Mechanical', sug: 'Inspect equipment for bearing or alignment issues. Schedule maintenance.', sev: 'CAUTION' },
  ];
  for (const t of tags) {
    const tagRes = await pool.query(
      `INSERT INTO observation_tags (id, plant_id, name, category) VALUES (gen_random_uuid()::text, $1, $2, $3) RETURNING id`,
      [plantId, t.name, t.cat]
    );
    await pool.query(
      `INSERT INTO tag_rules (id, plant_id, tag_id, suggestion_text, severity) VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"Severity")`,
      [plantId, tagRes.rows[0].id, t.sug, t.sev]
    );
  }

  console.log('[Setup] Demo data: admin@oscar.app/admin123, operator@oscar.app/operator123, Plant: Greenfield WWTP');
}
