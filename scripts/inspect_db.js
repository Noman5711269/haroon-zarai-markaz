const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('=== LOCAL DB STATS ===');
console.log('Farmers count:', (db.farmers || []).length);
console.log('Farmers:', (db.farmers || []).map(f => ({ id: f.id, name: f.name, phone: f.mobile, balance: f.currentBalance })));
console.log('Transactions count:', (db.transactions || []).length);
console.log('Farmer Payables count:', (db.farmerPayables || []).length);
console.log('Trade requests count:', (db.tradeRequests || []).length);
console.log('Complaints count:', (db.complaints || []).length);
console.log('Farmer logins count:', (db.farmerLogins || []).length);
console.log('Products count:', (db.products || []).length);
console.log('Mandi Rates count:', (db.mandiRates || []).length);
