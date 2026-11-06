const fs = require('fs');
const path = require('path');
const PostgresDB = require('../postgres_db');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let dbUrl = '';
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k === 'DATABASE_URL') dbUrl = v.join('=').trim();
});

const localData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf8'));

async function main() {
  const db = new PostgresDB(dbUrl);
  console.log('Syncing products to Postgres...');
  
  // Ensure columns exist in products
  try {
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS active_ingredient TEXT DEFAULT ''`);
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS suitable_crops TEXT DEFAULT ''`);
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS target_pests TEXT DEFAULT ''`);
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage TEXT DEFAULT ''`);
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS precautions TEXT DEFAULT ''`);
  } catch (e) {
    console.warn('Column add note:', e.message);
  }

  const prods = localData.products || [];
  console.log(`Found ${prods.length} products in local db.json.`);

  for (const p of prods) {
    try {
      await db.query(`
        INSERT INTO products (id, name_urdu, name_en, category, category_urdu, company, pack_size, price, stock, description, image, featured, active_ingredient, suitable_crops, target_pests, dosage, precautions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          name_urdu = EXCLUDED.name_urdu,
          name_en = EXCLUDED.name_en,
          category = EXCLUDED.category,
          category_urdu = EXCLUDED.category_urdu,
          company = EXCLUDED.company,
          pack_size = EXCLUDED.pack_size,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          description = EXCLUDED.description,
          image = EXCLUDED.image,
          featured = EXCLUDED.featured,
          active_ingredient = EXCLUDED.active_ingredient,
          suitable_crops = EXCLUDED.suitable_crops,
          target_pests = EXCLUDED.target_pests,
          dosage = EXCLUDED.dosage,
          precautions = EXCLUDED.precautions
      `, [
        p.id,
        p.nameUrdu,
        p.nameEn || '',
        p.category,
        p.categoryUrdu || '',
        p.company || '',
        p.packSize || '',
        Number(p.price) || 0,
        Number(p.stock) || 0,
        p.description || '',
        p.image || '',
        Boolean(p.featured),
        p.activeIngredient || '',
        p.suitableCrops || '',
        p.targetPests || '',
        p.dosage || '',
        p.precautions || ''
      ]);
      console.log(`Synced product: ${p.id} - ${p.nameUrdu}`);
    } catch (err) {
      console.error(`Error syncing product ${p.id}:`, err.message);
    }
  }

  const res = await db.query('SELECT count(*) FROM products');
  console.log(`Total products in Postgres now: ${res.rows[0].count}`);
  await db.pool.end();
}

main().catch(console.error);
