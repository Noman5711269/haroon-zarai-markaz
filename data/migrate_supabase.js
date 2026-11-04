const PostgresDB = require('../postgres_db');
const db = new PostgresDB('postgresql://postgres:NOMAN5711%40%40@db.jsqqvfaayafevnombsau.supabase.co:5432/postgres');

async function migrate() {
  console.log('Migrating Supabase tables for complaints and password recovery...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id VARCHAR(50) PRIMARY KEY,
      farmer_id VARCHAR(50),
      farmer_name VARCHAR(150),
      mobile VARCHAR(50),
      category VARCHAR(100),
      message TEXT,
      image_url TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS password_requests (
      id VARCHAR(50) PRIMARY KEY,
      farmer_id VARCHAR(50),
      farmer_name VARCHAR(150),
      mobile VARCHAR(50),
      message TEXT,
      current_password TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('Complaints & Password Requests tables ready in Supabase!');
}

migrate().catch(console.error).finally(() => process.exit(0));
