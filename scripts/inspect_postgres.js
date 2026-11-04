const fs = require('fs');
const path = require('path');
const PostgresDB = require('../postgres_db');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let dbUrl = '';
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k === 'DATABASE_URL') dbUrl = v.join('=').trim();
});

async function main() {
  const db = new PostgresDB(dbUrl);
  const farmers = await db.getFarmers();
  const txs = await db.getAllRecentTransactions(100);
  const payables = await db.getFarmerPayables();
  const requests = await db.getTradeRequests();
  const complaints = await db.getComplaints();
  const products = await db.getProducts();
  const rates = await db.getRates();

  console.log('=== POSTGRES STATS ===');
  console.log('Farmers:', farmers.length, farmers.map(f => ({ id: f.id, name: f.name, phone: f.mobile })));
  console.log('Transactions:', txs.length);
  console.log('Payables:', payables.length, payables.map(p => ({ id: p.id, farmer: p.farmerName, crop: p.cropName, remaining: p.remainingAmount })));
  console.log('Requests:', requests.length, requests.map(r => ({ id: r.id, farmer: r.farmerName, crop: r.crop })));
  console.log('Complaints:', complaints.length);
  console.log('Products:', products.length);
  console.log('Rates:', rates.length);
  await db.pool.end();
}

main().catch(console.error);
