const fs = require('fs');
const path = require('path');
const PostgresDB = require('../postgres_db');
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let u = '';
env.split('\n').forEach(l => {
  const [k, ...v] = l.trim().split('=');
  if (k === 'DATABASE_URL') u = v.join('=').trim();
});

const db = new PostgresDB(u);
async function run() {
  await db.query('DELETE FROM transactions');
  await db.query('DELETE FROM farmers');
  console.log('Cleaned farmers and transactions.');
  await db.pool.end();
}
run().catch(console.error);
