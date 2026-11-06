const fs = require('fs');
const path = require('path');
const PostgresDB = require('../postgres_db');
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let u = '';
env.split('\n').forEach(l => {
  const [k, ...v] = l.trim().split('=');
  if (k === 'DATABASE_URL') u = v.join('=').trim();
});

async function main() {
  const db = new PostgresDB(u);
  await db.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS urdu_font TEXT DEFAULT 'gulzar'`);
  await db.query(`UPDATE settings SET urdu_font = 'gulzar' WHERE id = 'main'`);
  const s = await db.getSettings();
  console.log('✅ Supabase settings urdu_font updated:', s.urduFont);
  await db.pool.end();
}

main().catch(console.error);
