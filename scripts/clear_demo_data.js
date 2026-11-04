const fs = require('fs');
const path = require('path');
const PostgresDB = require('../postgres_db');

const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k === 'DATABASE_URL') dbUrl = v.join('=').trim();
});

async function clearPostgres() {
  if (!dbUrl) {
    console.log('No DATABASE_URL found in .env, skipping Postgres.');
    return;
  }
  console.log('Connecting to Postgres via pooler...');
  const db = new PostgresDB(dbUrl);

  const tablesToClear = [
    'transactions',
    'farmer_payables',
    'trade_requests',
    'complaints',
    'farmer_logins',
    'password_requests',
    'farmers'
  ];

  for (const table of tablesToClear) {
    try {
      const res = await db.pool.query(`DELETE FROM ${table}`);
      console.log(`Cleared Postgres table "${table}": ${res.rowCount} rows removed.`);
    } catch (err) {
      console.error(`Error clearing Postgres table "${table}":`, err.message);
    }
  }

  // Delete test products
  try {
    const res = await db.pool.query(
      `DELETE FROM products WHERE id = 'prod-1793387470922' OR name_urdu LIKE '%ٹیسٹ%' OR LOWER(name_en) LIKE '%test%'`
    );
    console.log(`Deleted test products from Postgres: ${res.rowCount} rows removed.`);
  } catch (err) {
    console.error('Error deleting test products from Postgres:', err.message);
  }

  await db.pool.end();
  console.log('Postgres cleanup complete.');
}

function clearLocalJson() {
  const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');
  if (!fs.existsSync(dbJsonPath)) {
    console.log('data/db.json does not exist, skipping.');
    return;
  }

  const raw = fs.readFileSync(dbJsonPath, 'utf8');
  const data = JSON.parse(raw);

  // Backup first
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'db.json.bak'), raw, 'utf8');
  console.log('Backed up data/db.json to data/db.json.bak');

  // Reset operational demo data
  data.farmers = [];
  data.farmerPayables = [];
  data.tradeRequests = [];
  data.complaints = [];
  data.farmerLogins = [];
  data.passwordRequests = [];
  if (data.transactions) data.transactions = [];
  if (data.posSales) data.posSales = [];
  if (data.bookings) data.bookings = [];

  // Filter test and duplicate products
  const beforeCount = (data.products || []).length;
  data.products = (data.products || []).filter(p => {
    if (p.id === 'prod-1793387470922') return false;
    if (p.id === 'prod-1793690384912') return false; // remove duplicate
    if (p.nameUrdu && p.nameUrdu.includes('ٹیسٹ')) return false;
    if (p.nameEn && p.nameEn.toLowerCase().includes('test')) return false;
    return true;
  });
  console.log(`Filtered products in db.json: ${beforeCount} -> ${data.products.length}`);

  fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated data/db.json successfully.');
}

async function run() {
  console.log('================ CLEAR DEMO DATA ================');
  await clearPostgres();
  clearLocalJson();
  console.log('================ ALL DEMO DATA CLEARED ================');
}

run().catch(console.error);
