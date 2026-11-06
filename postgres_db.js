/**
 * PostgreSQL / Supabase Database Adapter for Haroon Zarai Markaz
 * Connects directly to Supabase PostgreSQL using 'pg' (node-postgres)
 * Supports connection pooling and auto-fallback to Supabase IPv4 Pooler
 */

const { Pool } = require('pg');
const localDb = require('./database');

class PostgresDB {
  constructor(connectionString) {
    this.rawConnString = connectionString || process.env.DATABASE_URL || '';
    this.pool = null;
    this.initPool();
  }

  initPool() {
    let conn = this.rawConnString;

    // Supabase direct connection host: db.<ref>.supabase.co
    // On systems without IPv6 routing, fall back to the IPv4 pooler
    const directMatch = conn.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
    
    // Default config using provided connection string
    let poolConfig = {
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };

    if (directMatch) {
      const user = directMatch[1];
      const pass = directMatch[2];
      const projectRef = directMatch[3];
      const dbName = directMatch[5];

      // Use the verified Supabase pooler for this project (ap-northeast-2)
      // which supports both IPv4 and IPv6
      const poolerHost = 'aws-0-ap-northeast-2.pooler.supabase.com';
      const poolerUser = `${user}.${projectRef}`;
      const poolerConn = `postgresql://${poolerUser}:${pass}@${poolerHost}:5432/${dbName}`;

      console.log(`🔌 Initializing Supabase PostgreSQL connection via Pooler: ${poolerHost}`);
      poolConfig.connectionString = poolerConn;
    }

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      console.error('Unexpected Supabase PG client error:', err.message);
    });
  }

  async query(text, params = []) {
    try {
      return await this.pool.query(text, params);
    } catch (err) {
      const msg = (err && err.message) || '';
      if (msg.includes('Connection terminated') || msg.includes('timeout') || msg.includes('ECONNRESET') || msg.includes('closed')) {
        console.warn('Supabase PG transient error, retrying query once...', msg);
        return await this.pool.query(text, params);
      }
      throw err;
    }
  }

  // --- 1. Settings ---
  async getSettings() {
    try {
      const res = await this.query('SELECT * FROM settings WHERE id = $1', ['main']);
      if (res.rows.length > 0) {
        const s = res.rows[0];
        return {
          businessName: s.business_name,
          businessNameEn: s.business_name_en,
          tagline: s.tagline,
          ownerName: s.owner_name,
          phone: s.phone,
          whatsapp: s.whatsapp,
          address: s.address,
          adminPin: s.admin_pin,
          adminPassword: s.admin_password || 'admin123',
          announcement: s.announcement
        };
      }
    } catch (err) {
      console.error('getSettings error:', err.message);
    }
    return {
      businessName: "ہارون زرعی مرکز",
      businessNameEn: "HAROON ZARAI MARKAZ",
      tagline: "کسان کی خوشحالی، ہماری اولین ترجیح",
      ownerName: "میاں ہارون رشید",
      phone: "0300-7654321",
      whatsapp: "923007654321",
      address: "پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)",
      adminPin: "1234",
      adminPassword: "admin123",
      announcement: "🌾 خوشخبری: گندم، سفید تل اور سورج مکھی کی بہترین نرخوں پر نقد خریداری جاری ہے! تصدیق شدہ بیج اور معیاری ادویات رعایت پر دستیاب ہیں۔"
    };
  }

  async updateSettings(data) {
    try {
      await this.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT 'admin123';`);
    } catch (e) {}

    const current = await this.getSettings();
    const updated = { ...current, ...data };
    await this.query(`
      INSERT INTO settings (id, business_name, business_name_en, tagline, owner_name, phone, whatsapp, address, admin_pin, admin_password, announcement, updated_at)
      VALUES ('main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_name_en = EXCLUDED.business_name_en,
        tagline = EXCLUDED.tagline,
        owner_name = EXCLUDED.owner_name,
        phone = EXCLUDED.phone,
        whatsapp = EXCLUDED.whatsapp,
        address = EXCLUDED.address,
        admin_pin = EXCLUDED.admin_pin,
        admin_password = EXCLUDED.admin_password,
        announcement = EXCLUDED.announcement,
        updated_at = NOW()
    `, [
      updated.businessName,
      updated.businessNameEn,
      updated.tagline,
      updated.ownerName,
      updated.phone,
      updated.whatsapp,
      updated.address,
      updated.adminPin,
      updated.adminPassword || 'admin123',
      updated.announcement
    ]);
    return this.getSettings();
  }

  // --- 2. Mandi Rates ---
  async getRates() {
    const res = await this.query('SELECT * FROM mandi_rates ORDER BY created_at ASC');
    return res.rows.map(r => ({
      id: r.id,
      cropNameUrdu: r.crop_name_urdu,
      cropNameEn: r.crop_name_en,
      unit: r.unit,
      buyPrice: Number(r.buy_price),
      sellPrice: Number(r.sell_price),
      trend: r.trend,
      lastUpdated: r.last_updated,
      notes: r.notes
    }));
  }

  async getRateById(id) {
    const res = await this.query('SELECT * FROM mandi_rates WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      cropNameUrdu: r.crop_name_urdu,
      cropNameEn: r.crop_name_en,
      unit: r.unit,
      buyPrice: Number(r.buy_price),
      sellPrice: Number(r.sell_price),
      trend: r.trend,
      lastUpdated: r.last_updated,
      notes: r.notes
    };
  }

  async addRate(rateData) {
    const id = "rate-" + Date.now();
    const today = new Date().toISOString().split('T')[0];
    await this.query(`
      INSERT INTO mandi_rates (id, crop_name_urdu, crop_name_en, unit, buy_price, sell_price, trend, last_updated, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      id,
      rateData.cropNameUrdu || "نئی فصل",
      rateData.cropNameEn || "New Crop",
      rateData.unit || "فی 40 کلوگرام (من)",
      Number(rateData.buyPrice) || 0,
      Number(rateData.sellPrice) || 0,
      rateData.trend || "stable",
      today,
      rateData.notes || ""
    ]);
    return this.getRateById(id);
  }

  async updateRate(id, rateData) {
    const current = await this.getRateById(id);
    if (!current) return null;
    const updated = { ...current, ...rateData };
    const today = new Date().toISOString().split('T')[0];
    await this.query(`
      UPDATE mandi_rates SET
        crop_name_urdu = $1,
        crop_name_en = $2,
        unit = $3,
        buy_price = $4,
        sell_price = $5,
        trend = $6,
        last_updated = $7,
        notes = $8
      WHERE id = $9
    `, [
      updated.cropNameUrdu,
      updated.cropNameEn,
      updated.unit,
      Number(updated.buyPrice) || 0,
      Number(updated.sellPrice) || 0,
      updated.trend,
      today,
      updated.notes,
      id
    ]);
    return this.getRateById(id);
  }

  async deleteRate(id) {
    await this.query('DELETE FROM mandi_rates WHERE id = $1', [id]);
    return true;
  }

  // --- 3. Products ---
  async getProducts(category, search) {
    let sql = 'SELECT * FROM products';
    const params = [];
    if (category && category !== 'all') {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';

    const res = await this.query(sql, params);
    let prods = res.rows.map(p => ({
      id: p.id,
      nameUrdu: p.name_urdu,
      nameEn: p.name_en,
      category: p.category,
      categoryUrdu: p.category_urdu,
      company: p.company,
      packSize: p.pack_size,
      price: Number(p.price),
      stock: Number(p.stock),
      description: p.description,
      image: p.image,
      featured: Boolean(p.featured),
      activeIngredient: p.active_ingredient || "",
      suitableCrops: p.suitable_crops || "",
      targetPests: p.target_pests || "",
      dosage: p.dosage || "",
      precautions: p.precautions || ""
    }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      prods = prods.filter(p => 
        (p.nameUrdu && p.nameUrdu.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.company && p.company.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return prods;
  }

  async getProductById(id) {
    const res = await this.query('SELECT * FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const p = res.rows[0];
    return {
      id: p.id,
      nameUrdu: p.name_urdu,
      nameEn: p.name_en,
      category: p.category,
      categoryUrdu: p.category_urdu,
      company: p.company,
      packSize: p.pack_size,
      price: Number(p.price),
      stock: Number(p.stock),
      description: p.description,
      image: p.image,
      featured: Boolean(p.featured),
      activeIngredient: p.active_ingredient || "",
      suitableCrops: p.suitable_crops || "",
      targetPests: p.target_pests || "",
      dosage: p.dosage || "",
      precautions: p.precautions || ""
    };
  }

  async addProduct(prodData) {
    const id = "prod-" + Date.now();
    try {
      await this.query(`
        INSERT INTO products (id, name_urdu, name_en, category, category_urdu, company, pack_size, price, stock, description, image, featured, active_ingredient, suitable_crops, target_pests, dosage, precautions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        id,
        prodData.nameUrdu || prodData.name || "",
        prodData.nameEn || "",
        prodData.category || "pesticide",
        prodData.categoryUrdu || "زرعی دوا",
        prodData.company || "",
        prodData.packSize || "",
        Number(prodData.price) || 0,
        Number(prodData.stock) || 0,
        prodData.description || "",
        prodData.image || "https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80",
        Boolean(prodData.featured),
        prodData.activeIngredient || "",
        prodData.suitableCrops || "",
        prodData.targetPests || "",
        prodData.dosage || "",
        prodData.precautions || ""
      ]);
    } catch (e) {
      await this.query(`
        INSERT INTO products (id, name_urdu, name_en, category, category_urdu, company, pack_size, price, stock, description, image, featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        id,
        prodData.nameUrdu || prodData.name || "",
        prodData.nameEn || "",
        prodData.category || "pesticide",
        prodData.categoryUrdu || "زرعی دوا",
        prodData.company || "",
        prodData.packSize || "",
        Number(prodData.price) || 0,
        Number(prodData.stock) || 0,
        prodData.description || "",
        prodData.image || "https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80",
        Boolean(prodData.featured)
      ]);
    }
    return this.getProductById(id);
  }

  async updateProduct(id, prodData) {
    const current = await this.getProductById(id);
    if (!current) return null;
    const updated = { ...current, ...prodData };
    try {
      await this.query(`
        UPDATE products SET
          name_urdu = $1,
          name_en = $2,
          category = $3,
          category_urdu = $4,
          company = $5,
          pack_size = $6,
          price = $7,
          stock = $8,
          description = $9,
          image = $10,
          featured = $11,
          active_ingredient = $12,
          suitable_crops = $13,
          target_pests = $14,
          dosage = $15,
          precautions = $16
        WHERE id = $17
      `, [
        updated.nameUrdu,
        updated.nameEn,
        updated.category,
        updated.categoryUrdu,
        updated.company,
        updated.packSize,
        Number(updated.price) || 0,
        Number(updated.stock) || 0,
        updated.description,
        updated.image,
        Boolean(updated.featured),
        updated.activeIngredient || "",
        updated.suitableCrops || "",
        updated.targetPests || "",
        updated.dosage || "",
        updated.precautions || "",
        id
      ]);
    } catch (e) {
      await this.query(`
        UPDATE products SET
          name_urdu = $1,
          name_en = $2,
          category = $3,
          category_urdu = $4,
          company = $5,
          pack_size = $6,
          price = $7,
          stock = $8,
          description = $9,
          image = $10,
          featured = $11
        WHERE id = $12
      `, [
        updated.nameUrdu,
        updated.nameEn,
        updated.category,
        updated.categoryUrdu,
        updated.company,
        updated.packSize,
        Number(updated.price) || 0,
        Number(updated.stock) || 0,
        updated.description,
        updated.image,
        Boolean(updated.featured),
        id
      ]);
    }
    return this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }

  // --- 4. Farmers & Khata Management ---
  async getFarmers(search) {
    const fRes = await this.query('SELECT * FROM farmers ORDER BY id DESC');
    const tRes = await this.query('SELECT * FROM transactions ORDER BY date ASC, created_at ASC');

    const txMap = {};
    for (const t of tRes.rows) {
      if (!txMap[t.farmer_id]) txMap[t.farmer_id] = [];
      txMap[t.farmer_id].push({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        productName: t.product_name,
        quantity: t.quantity,
        unitPrice: Number(t.unit_price) || 0,
        description: t.description,
        amount: Number(t.amount) || 0,
        balanceAfter: Number(t.balance_after) || 0,
        addedBy: t.added_by,
        proofImage: t.proof_image || ""
      });
    }

    let farmers = fRes.rows.map(f => ({
      id: f.id,
      name: f.name,
      nameEn: f.name_en,
      fatherName: f.father_name,
      mobile: f.mobile,
      cnic: f.cnic,
      email: f.email || "",
      password: f.password || "",
      registered: Boolean(f.registered),
      village: f.village,
      landAcres: Number(f.land_acres) || 0,
      currentBalance: Number(f.current_balance) || 0,
      notes: f.notes,
      createdAt: f.created_at,
      transactions: txMap[f.id] || []
    }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      farmers = farmers.filter(f => 
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.nameEn && f.nameEn.toLowerCase().includes(q)) ||
        (f.mobile && f.mobile.includes(q)) ||
        (f.village && f.village.toLowerCase().includes(q)) ||
        (f.id && f.id.toLowerCase().includes(q))
      );
    }
    return farmers;
  }

  async getFarmerById(id) {
    const fRes = await this.query('SELECT * FROM farmers WHERE id = $1', [id]);
    if (fRes.rows.length === 0) return null;
    const f = fRes.rows[0];

    const tRes = await this.query('SELECT * FROM transactions WHERE farmer_id = $1 ORDER BY date ASC, created_at ASC', [id]);
    const transactions = tRes.rows.map(t => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      productName: t.product_name,
      quantity: t.quantity,
      unitPrice: Number(t.unit_price) || 0,
      description: t.description,
      amount: Number(t.amount) || 0,
      balanceAfter: Number(t.balance_after) || 0,
      addedBy: t.added_by,
      proofImage: t.proof_image || ""
    }));

    return {
      id: f.id,
      name: f.name,
      nameEn: f.name_en,
      fatherName: f.father_name,
      mobile: f.mobile,
      cnic: f.cnic,
      email: f.email || "",
      password: f.password || "",
      registered: Boolean(f.registered),
      village: f.village,
      landAcres: Number(f.land_acres) || 0,
      currentBalance: Number(f.current_balance) || 0,
      notes: f.notes,
      createdAt: f.created_at,
      transactions
    };
  }

  // Helper: Strictly and safely match farmer by ID, Mobile, CNIC or Email
  matchFarmer(farmer, query) {
    if (!farmer || !query) return false;
    const qStr = query.toString().trim();
    const qLower = qStr.toLowerCase();

    // 1. Exact ID Match (e.g. HZM-101)
    if (farmer.id && farmer.id.trim().toLowerCase() === qLower) return true;

    // 2. Exact Email Match
    if (qStr.includes('@') && farmer.email && farmer.email.trim().toLowerCase() === qLower) return true;

    // 3. Digits Match for Mobile / CNIC
    const qDigits = qStr.replace(/\D/g, '');
    if (!qDigits) return false;

    const fMobile = (farmer.mobile || '').replace(/\D/g, '');
    const fCnic = (farmer.cnic || '').replace(/\D/g, '');

    // Mobile matching (requires at least 7 digits to prevent accidental empty matching)
    if (fMobile && fMobile.length >= 7) {
      if (qDigits === fMobile) return true;
      if (qDigits.length >= 9 && fMobile.length >= 9) {
        if (qDigits.slice(-9) === fMobile.slice(-9)) return true;
      }
    }

    // CNIC matching (requires at least 7 digits)
    if (fCnic && fCnic.length >= 7) {
      if (qDigits === fCnic) return true;
      if (qDigits.length >= 11 && fCnic.length >= 11) {
        if (qDigits.slice(-11) === fCnic.slice(-11)) return true;
      }
    }

    return false;
  }

  async findFarmerByPhoneOrId(query) {
    if (!query) return null;
    const farmers = await this.getFarmers();
    return farmers.find(f => this.matchFarmer(f, query)) || null;
  }

  async addFarmer(farmerData) {
    const farmers = await this.getFarmers();
    const highestNum = farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;
    const initialBal = Number(farmerData.initialBalance) || 0;
    const today = new Date().toISOString().split('T')[0];

    const pass = farmerData.password ? farmerData.password.trim() : null;
    const isReg = Boolean(pass);

    await this.query(`
      INSERT INTO farmers (id, name, name_en, father_name, mobile, cnic, village, land_acres, current_balance, notes, password, registered, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      newId,
      farmerData.name || "کسان",
      farmerData.nameEn || "",
      farmerData.fatherName || "",
      farmerData.mobile || "",
      farmerData.cnic || "",
      farmerData.village || "",
      Number(farmerData.landAcres) || 0,
      initialBal,
      farmerData.notes || "",
      pass,
      isReg,
      today
    ]);

    if (initialBal !== 0) {
      const txId = "TX-" + Date.now().toString().slice(-6);
      await this.query(`
        INSERT INTO transactions (id, farmer_id, date, type, category, product_name, quantity, unit_price, description, amount, balance_after, added_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        txId,
        newId,
        today,
        initialBal > 0 ? "debit" : "credit",
        "سابقہ بقایا",
        "سابقہ بقایا رقم",
        "1 اندراج",
        Math.abs(initialBal),
        "کھاتہ کھولتے وقت سابقہ بقایا رقم درج کی گئی",
        Math.abs(initialBal),
        initialBal,
        "ایڈمن"
      ]);
    }

    return this.getFarmerById(newId);
  }

  async updateFarmer(id, farmerData) {
    const current = await this.getFarmerById(id);
    if (!current) return null;
    const updated = { ...current, ...farmerData };

    const newPass = farmerData.password !== undefined 
      ? (farmerData.password ? farmerData.password.trim() : null) 
      : (current.password || null);
    const isReg = newPass ? true : (farmerData.registered !== undefined ? Boolean(farmerData.registered) : current.registered);

    await this.query(`
      UPDATE farmers SET
        name = $1,
        name_en = $2,
        father_name = $3,
        mobile = $4,
        cnic = $5,
        village = $6,
        land_acres = $7,
        notes = $8,
        password = $9,
        registered = $10
      WHERE id = $11
    `, [
      updated.name,
      updated.nameEn,
      updated.fatherName,
      updated.mobile,
      updated.cnic,
      updated.village,
      Number(updated.landAcres) || 0,
      updated.notes,
      newPass,
      isReg,
      id
    ]);

    return this.getFarmerById(id);
  }

  async deleteFarmer(id) {
    try {
      await this.query('DELETE FROM transactions WHERE farmer_id = $1', [id]);
      await this.query('DELETE FROM farmer_logins WHERE farmer_id = $1', [id]);
      await this.query('DELETE FROM farmers WHERE id = $1', [id]);
    } catch (e) {
      await this.query('DELETE FROM farmers WHERE id = $1', [id]);
    }
    return true;
  }

  async deregisterFarmer(id) {
    await this.query('UPDATE farmers SET password = NULL, registered = FALSE WHERE id = $1', [id]);
    return this.getFarmerById(id);
  }

  // --- 5. Transactions (Khata Ledger) ---
  async addTransaction(farmerId, txData) {
    const farmer = await this.getFarmerById(farmerId);
    if (!farmer) return null;

    const amount = Number(txData.amount);
    if (isNaN(amount) || amount <= 0) return null;

    const type = txData.type === 'credit' ? 'credit' : 'debit';
    const currentBal = Number(farmer.currentBalance) || 0;
    const newBalance = type === 'debit' ? (currentBal + amount) : (currentBal - amount);

    const productName = txData.productName || (type === 'credit' ? "نقد ادائیگی / فصل جمع" : "زرعی مال و ادویات");
    const quantity = txData.quantity || "";
    const unitPrice = Number(txData.unitPrice) || 0;
    let description = txData.description || "";
    if (!description) {
      if (quantity && unitPrice) {
        description = `${productName} (${quantity} @ Rs. ${unitPrice.toLocaleString()})`;
      } else if (quantity) {
        description = `${productName} (${quantity})`;
      } else {
        description = productName;
      }
    }

    const txId = "TX-" + Date.now().toString().slice(-6);
    const today = txData.date || new Date().toISOString().split('T')[0];
    const proofImage = txData.proofImage || txData.receiptImage || "";

    // Insert transaction
    try {
      await this.query(`
        INSERT INTO transactions (id, farmer_id, date, type, category, product_name, quantity, unit_price, description, amount, balance_after, added_by, proof_image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        txId,
        farmerId,
        today,
        type,
        txData.category || (type === 'debit' ? "ادھار مال و ادویات" : "نقد ادائیگی"),
        productName,
        quantity,
        unitPrice,
        description,
        amount,
        newBalance,
        txData.addedBy || "ایڈمن ہارون",
        proofImage
      ]);
    } catch (e) {
      await this.query(`
        INSERT INTO transactions (id, farmer_id, date, type, category, product_name, quantity, unit_price, description, amount, balance_after, added_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        txId,
        farmerId,
        today,
        type,
        txData.category || (type === 'debit' ? "ادھار مال و ادویات" : "نقد ادائیگی"),
        productName,
        quantity,
        unitPrice,
        description,
        amount,
        newBalance,
        txData.addedBy || "ایڈمن ہارون"
      ]);
    }

    // Update farmer balance
    await this.query(`
      UPDATE farmers SET current_balance = $1 WHERE id = $2
    `, [newBalance, farmerId]);

    const updatedFarmer = await this.getFarmerById(farmerId);
    const savedTx = (updatedFarmer.transactions || []).find(t => t.id === txId);
    return { farmer: updatedFarmer, transaction: savedTx };
  }

  // Record Farmer Login Activity for Admin
  async recordFarmerLogin(loginData) {
    try {
      await this.query(`
        INSERT INTO farmer_logins (farmer_id, farmer_name, mobile, login_time, ip_address, method)
        VALUES ($1, $2, $3, NOW(), $4, $5)
      `, [
        loginData.farmerId,
        loginData.farmerName,
        loginData.mobile || '',
        loginData.ip || 'Local Client',
        loginData.method || 'Password'
      ]);
      await this.query(`UPDATE farmers SET last_login = NOW() WHERE id = $1`, [loginData.farmerId]);
    } catch (e) {
      console.warn('recordFarmerLogin DB warning:', e.message);
    }
  }

  async getFarmerLogins(limit = 30) {
    try {
      const res = await this.query(`
        SELECT l.*, 
               COALESCE(NULLIF(l.mobile, ''), f.mobile, f.cnic, '') as clean_mobile,
               COALESCE(f.password, '') as farmer_password,
               COALESCE(NULLIF(l.farmer_name, ''), f.name, 'کسان بھائی') as clean_farmer_name,
               f.current_balance as current_balance, 
               f.village as village,
               f.registered as is_registered
        FROM farmer_logins l
        LEFT JOIN farmers f ON f.id = l.farmer_id
        ORDER BY l.login_time DESC
        LIMIT $1
      `, [limit]);
      return res.rows.map(r => ({
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.clean_farmer_name,
        mobile: r.clean_mobile || '-',
        password: r.farmer_password || '',
        registered: Boolean(r.is_registered || r.farmer_password),
        loginTime: r.login_time,
        method: r.method,
        currentBalance: Number(r.current_balance) || 0,
        village: r.village || 'پل 88، کوٹ ادو'
      }));
    } catch (e) {
      console.warn('getFarmerLogins DB warning:', e.message);
      return [];
    }
  }

  async farmerSignUp(data) {
    const name = (data.name || '').trim();
    const rawId = (data.identifier || data.mobile || data.cnic || '').trim();
    const password = (data.password || '').trim();
    const email = (data.email || data.gmail || '').trim();

    if (!name || !rawId || !password) {
      return { error: 'نام، موبائل نمبر/شناختی کارڈ اور پاس ورڈ درج کرنا لازمی ہے۔' };
    }

    const cleanDigits = rawId.replace(/\D/g, '');
    const isCnic = cleanDigits.length === 13 || rawId.includes('-');

    const farmers = await this.getFarmers();
    const existing = farmers.find(f => this.matchFarmer(f, rawId));

    if (existing) {
      if (existing.password && existing.registered) {
        return { error: 'اس موبائل نمبر یا شناختی کارڈ پر اکاؤنٹ پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔' };
      }
      try {
        await this.query(`
          UPDATE farmers SET name = $1, password = $2, email = $3, registered = TRUE, last_login = NOW() WHERE id = $4
        `, [name || existing.name, password, email || existing.email, existing.id]);
      } catch (e) {
        await this.query(`UPDATE farmers SET name = $1, password = $2 WHERE id = $3`, [name || existing.name, password, existing.id]);
      }
      const updated = await this.getFarmerById(existing.id);
      await this.recordFarmerLogin({ farmerId: existing.id, farmerName: existing.name, mobile: existing.mobile || existing.cnic || rawId, password: password, method: 'New Registration' });
      return { success: true, farmer: updated, isNew: false, message: 'کھاتہ کامیابی سے رجسٹر ہو گیا!' };
    }

    // New farmer
    const highestNum = farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;

    try {
      await this.query(`
        INSERT INTO farmers (id, name, mobile, cnic, email, password, village, land_acres, current_balance, registered, last_login, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, TRUE, NOW(), NOW())
      `, [
        newId,
        name,
        isCnic ? '' : rawId,
        isCnic ? rawId : '',
        email,
        password,
        'پل 88، کوٹ ادو'
      ]);
    } catch (e) {
      await this.query(`
        INSERT INTO farmers (id, name, mobile, cnic, email, password, village, land_acres, current_balance, registered, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, TRUE, NOW())
      `, [
        newId,
        name,
        isCnic ? '' : rawId,
        isCnic ? rawId : '',
        email,
        password,
        'پل 88، کوٹ ادو'
      ]);
    }
    const created = await this.getFarmerById(newId);
    await this.recordFarmerLogin({ farmerId: newId, farmerName: name, mobile: rawId, password: password, method: 'New Registration' });
    return { success: true, farmer: created, isNew: true, message: 'نیا کسان اکاؤنٹ کامیابی سے بن گیا!' };
  }

  async farmerLogin(identifier, password) {
    if (!identifier || !password) {
      return { error: 'موبائل نمبر / شناختی کارڈ اور پاس ورڈ درج کرنا لازمی ہے۔' };
    }
    const farmer = await this.findFarmerByPhoneOrId(identifier);
    if (!farmer) {
      return { error: 'اس نمبر یا شناختی کارڈ پر کوئی کسان رجسٹرڈ نہیں ہے۔ براہ کرم پہلے "نیا اکاؤنٹ بنائیں" پر کلک کر کے سائن اپ کریں۔' };
    }

    if (!farmer.password) {
      return { error: 'آپ کا کھاتہ سسٹم میں موجود ہے لیکن آن لائن پاس ورڈ سیٹ نہیں ہے۔ برائے مہربانی "نیا اکاؤنٹ بنائیں" منتخب کر کے پاس ورڈ سیٹ کریں۔' };
    }

    if (farmer.password.trim() !== password.trim()) {
      return { error: 'درج کردہ پاس ورڈ درست نہیں ہے۔ دوبارہ چیک کر کے کوشش کریں۔' };
    }

    let totalDebit = 0;
    let totalCredit = 0;
    (farmer.transactions || []).forEach(t => {
      if (t.type === 'debit') totalDebit += t.amount;
      else totalCredit += t.amount;
    });

    const safeFarmer = {
      id: farmer.id,
      name: farmer.name,
      nameEn: farmer.nameEn,
      fatherName: farmer.fatherName,
      mobile: farmer.mobile,
      cnic: farmer.cnic,
      email: farmer.email || '',
      village: farmer.village,
      landAcres: farmer.landAcres,
      currentBalance: farmer.currentBalance,
      lastLogin: new Date().toISOString(),
      totalDebit,
      totalCredit,
      transactions: farmer.transactions || []
    };

    await this.recordFarmerLogin({
      farmerId: farmer.id,
      farmerName: farmer.name,
      mobile: farmer.mobile || farmer.cnic || identifier,
      password: farmer.password || password,
      method: 'Password'
    });

    return {
      success: true,
      farmer: safeFarmer,
      token: `FARMER_${farmer.id}_${Date.now()}`
    };
  }

  async googleAuth(data) {
    const email = (data.email || '').trim().toLowerCase();
    const name = (data.name || '').trim();
    if (!email) return { error: 'گوگل ای میل ایڈریس ضروری ہے۔' };

    const farmers = await this.getFarmers();
    let farmer = farmers.find(f => f.email && f.email.toLowerCase() === email);

    if (farmer) {
      try {
        await this.query(`UPDATE farmers SET last_login = NOW() WHERE id = $1`, [farmer.id]);
      } catch (e) {}
      await this.recordFarmerLogin({ farmerId: farmer.id, farmerName: farmer.name, mobile: farmer.mobile || email, password: farmer.password || 'گوگل تصدیق شدہ', method: 'Google' });
      return {
        success: true,
        farmer,
        token: `FARMER_${farmer.id}_${Date.now()}`,
        message: 'گوگل کے ذریعے لاگ ان کامیاب!'
      };
    }

    // Register new farmer with Google
    const highestNum = farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;

    try {
      await this.query(`
        INSERT INTO farmers (id, name, mobile, email, password, village, land_acres, current_balance, registered, last_login, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0, TRUE, NOW(), NOW())
      `, [newId, name || 'کسان بھائی', data.mobile || '', email, 'گوگل تصدیق شدہ', 'پل 88، کوٹ ادو']);
    } catch (e) {
      console.warn('googleAuth insert warning:', e.message);
    }

    const created = await this.getFarmerById(newId);
    await this.recordFarmerLogin({ farmerId: newId, farmerName: name || 'کسان بھائی', mobile: data.mobile || email, password: 'گوگل تصدیق شدہ', method: 'Google' });
    return {
      success: true,
      farmer: created || { id: newId, name: name || 'کسان بھائی', email, currentBalance: 0, transactions: [] },
      token: `FARMER_${newId}_${Date.now()}`,
      message: 'گوگل کے ذریعے نیا اکاؤنٹ بن گیا اور لاگ ان ہو گئے!'
    };
  }

  async deleteTransaction(farmerId, txId) {
    const farmer = await this.getFarmerById(farmerId);
    if (!farmer) return null;

    await this.query('DELETE FROM transactions WHERE id = $1 AND farmer_id = $2', [txId, farmerId]);

    // Recalculate balance and update balance_after for each remaining transaction
    const remainingFarmer = await this.getFarmerById(farmerId);
    let runningBalance = 0;
    for (const t of (remainingFarmer.transactions || [])) {
      if (t.type === 'debit') runningBalance += t.amount;
      else runningBalance -= t.amount;
      await this.query('UPDATE transactions SET balance_after = $1 WHERE id = $2', [runningBalance, t.id]);
    }

    await this.query('UPDATE farmers SET current_balance = $1 WHERE id = $2', [runningBalance, farmerId]);
    return this.getFarmerById(farmerId);
  }

  async updateTransaction(farmerId, txId, updateData) {
    const farmer = await this.getFarmerById(farmerId);
    if (!farmer) return null;

    const amount = Number(updateData.amount);
    const type = updateData.type === 'credit' ? 'credit' : 'debit';
    const date = updateData.date || new Date().toISOString().split('T')[0];
    const category = updateData.category || (type === 'debit' ? "ادھار مال و ادویات" : "نقد ادائیگی");
    const productName = updateData.productName || "";
    const quantity = updateData.quantity || "";
    const unitPrice = Number(updateData.unitPrice) || 0;
    const description = updateData.description || "";
    const proofImage = updateData.proofImage !== undefined ? updateData.proofImage : "";

    try {
      await this.query(`
        UPDATE transactions
        SET date = $1, type = $2, category = $3, product_name = $4, quantity = $5, unit_price = $6, description = $7, amount = $8, proof_image = $9
        WHERE id = $10 AND farmer_id = $11
      `, [date, type, category, productName, quantity, unitPrice, description, amount, proofImage, txId, farmerId]);
    } catch (e) {
      await this.query(`
        UPDATE transactions
        SET date = $1, type = $2, category = $3, product_name = $4, quantity = $5, unit_price = $6, description = $7, amount = $8
        WHERE id = $9 AND farmer_id = $10
      `, [date, type, category, productName, quantity, unitPrice, description, amount, txId, farmerId]);
    }

    // Recalculate balances and update balance_after for all transactions
    const updatedFarmer = await this.getFarmerById(farmerId);
    let runningBalance = 0;
    for (const t of (updatedFarmer.transactions || [])) {
      if (t.type === 'debit') runningBalance += t.amount;
      else runningBalance -= t.amount;
      await this.query('UPDATE transactions SET balance_after = $1 WHERE id = $2', [runningBalance, t.id]);
    }

    await this.query('UPDATE farmers SET current_balance = $1 WHERE id = $2', [runningBalance, farmerId]);
    const finalFarmer = await this.getFarmerById(farmerId);
    const updatedTx = (finalFarmer.transactions || []).find(t => t.id === txId);
    return { farmer: finalFarmer, transaction: updatedTx };
  }

  // --- Get All Recent Transactions Across All Farmers ---
  async getAllRecentTransactions(limit = 30) {
    try {
      const res = await this.query(`
        SELECT t.*, f.name as farmer_name, f.mobile as farmer_mobile, f.village as farmer_village
        FROM transactions t
        LEFT JOIN farmers f ON f.id = t.farmer_id
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT $1
      `, [limit]);
      return res.rows.map(r => ({
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name || r.farmer_id,
        farmerMobile: r.farmer_mobile || '',
        farmerVillage: r.farmer_village || '',
        date: r.date,
        type: r.type,
        category: r.category,
        productName: r.product_name,
        quantity: r.quantity,
        unitPrice: Number(r.unit_price) || 0,
        description: r.description,
        amount: Number(r.amount) || 0,
        balanceAfter: Number(r.balance_after) || 0,
        addedBy: r.added_by,
        proofImage: r.proof_image || '',
        createdAt: r.created_at
      }));
    } catch (err) {
      console.warn('getAllRecentTransactions error in postgres_db:', err.message);
      return [];
    }
  }

  // --- 6. Trade Requests ---
  async getTradeRequests() {
    const res = await this.query('SELECT * FROM trade_requests ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      farmerName: r.farmer_name,
      mobile: r.mobile,
      village: r.village,
      cropName: r.crop_name,
      quantity: r.quantity,
      type: r.type,
      expectedPrice: r.expected_price,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at
    }));
  }

  async addTradeRequest(reqData) {
    const newId = "REQ-" + Date.now().toString().slice(-6);
    const today = new Date().toLocaleDateString('en-GB');

    await this.query(`
      INSERT INTO trade_requests (id, farmer_name, mobile, village, crop_name, quantity, type, expected_price, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', $10)
    `, [
      newId,
      reqData.farmerName || "",
      reqData.mobile || "",
      reqData.village || "",
      reqData.cropName || "",
      reqData.quantity || "",
      reqData.type || "sell_crop",
      reqData.expectedPrice || "",
      reqData.notes || "",
      today
    ]);

    const all = await this.getTradeRequests();
    return all.find(r => r.id === newId);
  }

  async updateTradeRequestStatus(id, status) {
    await this.query('UPDATE trade_requests SET status = $1 WHERE id = $2', [status, id]);
    const all = await this.getTradeRequests();
    return all.find(r => r.id === id) || null;
  }

  async deleteTradeRequest(id) {
    await this.query('DELETE FROM trade_requests WHERE id = $1', [id]);
    return true;
  }

  // --- 7. Admin Statistics ---
  async getStats() {
    const [farmers, products, requests, rates] = await Promise.all([
      this.getFarmers(),
      this.getProducts(),
      this.getTradeRequests(),
      this.getRates()
    ]);

    let totalReceivable = 0;
    let totalPayable = 0;
    farmers.forEach(f => {
      const bal = Number(f.currentBalance) || 0;
      if (bal > 0) totalReceivable += bal;
      if (bal < 0) totalPayable += Math.abs(bal);
    });

    const pendingRequests = requests.filter(r => r.status === 'Pending').length;

    let pendingComplaints = 0;
    try {
      const cRes = await this.query("SELECT COUNT(*) FROM complaints WHERE status = 'Pending'");
      pendingComplaints = parseInt(cRes.rows[0].count, 10) || 0;
    } catch (e) {}

    let pendingPassReqs = 0;
    try {
      const pRes = await this.query("SELECT COUNT(*) FROM password_requests WHERE status = 'Pending'");
      pendingPassReqs = parseInt(pRes.rows[0].count, 10) || 0;
    } catch (e) {}

    let payables = [];
    try {
      payables = await this.getFarmerPayables();
    } catch(e) {
      payables = localDb.getFarmerPayables();
    }

    let totalPayablesRemaining = 0;
    let cropPayablesRemaining = 0;
    let otherPayablesRemaining = 0;

    payables.forEach(p => {
      const rem = Number(p.remainingAmount !== undefined ? p.remainingAmount : p.remainingBalance) || 0;
      totalPayablesRemaining += rem;
      if ((p.type || 'crop') === 'crop') {
        cropPayablesRemaining += rem;
      } else {
        otherPayablesRemaining += rem;
      }
    });

    return {
      totalFarmers: farmers.length,
      totalReceivable,
      totalPayable,
      totalPayablesRemaining,
      cropPayablesRemaining,
      otherPayablesRemaining,
      totalPayablesCount: payables.length,
      totalProducts: products.length,
      totalRequests: requests.length,
      pendingRequests,
      pendingComplaints,
      pendingPassReqs,
      activeRatesCount: rates.length
    };
  }

  // --- 8. Complaints Box ---
  async getComplaints() {
    try {
      const res = await this.query('SELECT * FROM complaints ORDER BY created_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        farmerId: r.farmer_id || '',
        farmerName: r.farmer_name || '',
        mobile: r.mobile || '',
        category: r.category || 'عام شکایت',
        message: r.message || '',
        imageUrl: r.image_url || '',
        status: r.status || 'Pending',
        createdAt: r.created_at
      }));
    } catch (e) {
      console.warn('getComplaints warning:', e.message);
      return [];
    }
  }

  async addComplaint(data) {
    const newId = "CMP-" + Date.now().toString().slice(-6);
    try {
      await this.query(`
        INSERT INTO complaints (id, farmer_id, farmer_name, mobile, category, message, image_url, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', NOW())
      `, [
        newId,
        data.farmerId || '',
        data.farmerName || 'نامعلوم کسان',
        data.mobile || '',
        data.category || 'عام شکایت',
        data.message || '',
        data.imageUrl || ''
      ]);
      const all = await this.getComplaints();
      return all.find(c => c.id === newId) || { id: newId, ...data };
    } catch (e) {
      console.warn('addComplaint warning:', e.message);
      return { id: newId, ...data };
    }
  }

  async updateComplaintStatus(id, status) {
    try {
      await this.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, id]);
    } catch (e) {}
    const all = await this.getComplaints();
    return all.find(c => c.id === id) || null;
  }

  async deleteComplaint(id) {
    try {
      await this.query('DELETE FROM complaints WHERE id = $1', [id]);
    } catch (e) {}
    return true;
  }

  // --- 9. Forgot Password Requests ---
  async getPasswordRequests() {
    try {
      const res = await this.query('SELECT * FROM password_requests ORDER BY created_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        farmerId: r.farmer_id || '',
        farmerName: r.farmer_name || '',
        mobile: r.mobile || '',
        message: r.message || '',
        currentPassword: r.current_password || '',
        status: r.status || 'Pending',
        createdAt: r.created_at
      }));
    } catch (e) {
      console.warn('getPasswordRequests warning:', e.message);
      return [];
    }
  }

  async addPasswordRequest(data) {
    const newId = "PWR-" + Date.now().toString().slice(-6);
    let farmer = null;
    if (data.identifier) farmer = await this.findFarmerByPhoneOrId(data.identifier);

    try {
      await this.query(`
        INSERT INTO password_requests (id, farmer_id, farmer_name, mobile, message, current_password, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'Pending', NOW())
      `, [
        newId,
        farmer ? farmer.id : (data.farmerId || ''),
        farmer ? farmer.name : (data.farmerName || 'کسان بھائی'),
        data.identifier || data.mobile || '',
        data.message || 'پاس ورڈ بھول گئے ہیں، رہنمائی فرمائیں۔',
        farmer ? (farmer.password || '') : ''
      ]);
      const all = await this.getPasswordRequests();
      return all.find(p => p.id === newId) || { id: newId, ...data };
    } catch (e) {
      console.warn('addPasswordRequest warning:', e.message);
      return { id: newId, ...data };
    }
  }

  async updatePasswordRequestStatus(id, status) {
    try {
      await this.query('UPDATE password_requests SET status = $1 WHERE id = $2', [status, id]);
    } catch (e) {}
    const all = await this.getPasswordRequests();
    return all.find(p => p.id === id) || null;
  }

  // --- 10. Farmer Payables (کسان کو دینے والے پیسے: گندم، چاول، تل، سورج مکھی، سرسوں و دیگر) ---
  async ensurePayablesTable() {
    if (this._ensuredPayablesTable) return;
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS farmer_payables (
          id VARCHAR(50) PRIMARY KEY,
          farmer_id VARCHAR(50),
          farmer_name VARCHAR(255),
          farmer_mobile VARCHAR(50),
          type VARCHAR(50) DEFAULT 'crop',
          crop_type VARCHAR(50),
          crop_name VARCHAR(255),
          variety VARCHAR(255),
          title VARCHAR(255),
          category VARCHAR(255),
          weight NUMERIC DEFAULT 0,
          bags_count NUMERIC DEFAULT 0,
          weight_unit VARCHAR(50) DEFAULT 'من',
          rate NUMERIC DEFAULT 0,
          total_amount NUMERIC DEFAULT 0,
          paid_amount NUMERIC DEFAULT 0,
          remaining_amount NUMERIC DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          date VARCHAR(50),
          notes TEXT,
          proof_image TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this._ensuredPayablesTable = true;
    } catch(e) {
      console.warn('ensurePayablesTable notice:', e.message);
    }
  }

  async getFarmerPayables(farmerId = null, type = null) {
    try {
      await this.ensurePayablesTable();
      let q = 'SELECT * FROM farmer_payables';
      const params = [];
      const conds = [];
      if (farmerId) {
        params.push(farmerId);
        conds.push(`farmer_id = $${params.length}`);
      }
      if (type) {
        params.push(type);
        conds.push(`type = $${params.length}`);
      }
      if (conds.length > 0) q += ' WHERE ' + conds.join(' AND ');
      q += ' ORDER BY created_at DESC';
      const res = await this.query(q, params);
      if (res && res.rows) {
        return res.rows.map(r => {
          const rem = Number(r.remaining_amount) || 0;
          const w = Number(r.weight) || 0;
          const rt = Number(r.rate) || 0;
          const st = (r.status || 'pending').toLowerCase();
          return {
            id: r.id,
            farmerId: r.farmer_id,
            farmerName: r.farmer_name,
            farmerMobile: r.farmer_mobile,
            type: r.type,
            cropType: r.crop_type,
            cropName: r.crop_name,
            variety: r.variety || '',
            title: r.title,
            category: r.category || (r.type === 'other' ? (r.title || 'متفرق') : r.crop_name),
            weight: w,
            weightMaunds: w,
            bagsCount: Number(r.bags_count) || 0,
            weightUnit: r.weight_unit || 'من',
            rate: rt,
            ratePerMaund: rt,
            totalAmount: Number(r.total_amount) || 0,
            paidAmount: Number(r.paid_amount) || 0,
            remainingAmount: rem,
            remainingBalance: rem,
            status: st,
            paymentStatus: st === 'paid' ? 'Paid' : (st === 'partial' ? 'Partial' : 'Pending'),
            date: r.date,
            notes: r.notes,
            proofImage: r.proof_image,
            createdAt: r.created_at
          };
        });
      }
      return [];
    } catch(e) {
      console.warn('postgres getFarmerPayables fallback:', e.message);
      return localDb.getFarmerPayables(farmerId, type);
    }
  }

  async addFarmerPayable(data) {
    const newId = data.id || ("PAY-" + Date.now().toString().slice(-6));
    const total = Number(data.totalAmount) || 0;
    const paid = Number(data.paidAmount) || 0;
    const remaining = Math.max(0, total - paid);
    let status = 'pending';
    if (remaining === 0 && total > 0) status = 'paid';
    else if (paid > 0 && remaining > 0) status = 'partial';

    const w = Number(data.weightMaunds !== undefined ? data.weightMaunds : data.weight) || 0;
    const r = Number(data.ratePerMaund !== undefined ? data.ratePerMaund : data.rate) || 0;

    let fName = data.farmerName || "";
    let fMobile = data.farmerMobile || "";
    if (data.farmerId && (!fName || !fMobile)) {
      try {
        const f = await this.getFarmerById(data.farmerId);
        if (f) {
          if (!fName) fName = f.name;
          if (!fMobile) fMobile = f.mobile;
        }
      } catch(e) {}
    }

    try {
      await this.ensurePayablesTable();
      await this.query(`
        INSERT INTO farmer_payables (id, farmer_id, farmer_name, farmer_mobile, type, crop_type, crop_name, variety, title, category, weight, bags_count, weight_unit, rate, total_amount, paid_amount, remaining_amount, status, date, notes, proof_image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          farmer_name = EXCLUDED.farmer_name,
          farmer_mobile = EXCLUDED.farmer_mobile,
          total_amount = EXCLUDED.total_amount,
          paid_amount = EXCLUDED.paid_amount,
          remaining_amount = EXCLUDED.remaining_amount,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes
      `, [
        newId,
        data.farmerId || "",
        fName || "کسان",
        fMobile || "",
        data.type === 'other' ? 'other' : 'crop',
        data.cropType || "gandum",
        data.cropName || (data.type === 'other' ? (data.title || "متفرق") : "گندم"),
        data.variety || "",
        data.title || (data.type === 'other' ? "متفرق واجب الادا" : `${data.cropName || 'فصل'} خریداری`),
        data.category || (data.type === 'other' ? (data.title || "متفرق") : data.cropName),
        w,
        Number(data.bagsCount) || 0,
        data.weightUnit || "من",
        r,
        total,
        paid,
        remaining,
        status,
        data.date || new Date().toISOString().split('T')[0],
        data.notes || "",
        data.proofImage || ""
      ]);
    } catch (e) {
      console.warn('postgres addFarmerPayable error:', e.message);
    }

    return {
      id: newId,
      ...data,
      farmerName: fName,
      farmerMobile: fMobile,
      weight: w,
      weightMaunds: w,
      rate: r,
      ratePerMaund: r,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      remainingBalance: remaining,
      status,
      paymentStatus: status === 'paid' ? 'Paid' : (status === 'partial' ? 'Partial' : 'Pending')
    };
  }

  async updateFarmerPayable(id, data) {
    try {
      await this.ensurePayablesTable();
      const existingRes = await this.query('SELECT * FROM farmer_payables WHERE id = $1', [id]);
      const existing = existingRes.rows[0];
      if (!existing) {
        return localDb.updateFarmerPayable(id, data);
      }

      const total = data.totalAmount !== undefined ? Number(data.totalAmount) : Number(existing.total_amount || 0);
      const paid = data.paidAmount !== undefined ? Number(data.paidAmount) : Number(existing.paid_amount || 0);
      const remaining = Math.max(0, total - paid);

      let status = 'pending';
      if (remaining === 0 && total > 0) status = 'paid';
      else if (paid > 0 && remaining > 0) status = 'partial';

      const w = data.weightMaunds !== undefined ? Number(data.weightMaunds) : (data.weight !== undefined ? Number(data.weight) : Number(existing.weight || 0));
      const r = data.ratePerMaund !== undefined ? Number(data.ratePerMaund) : (data.rate !== undefined ? Number(data.rate) : Number(existing.rate || 0));
      const fName = data.farmerName !== undefined ? data.farmerName : existing.farmer_name;
      const fMobile = data.farmerMobile !== undefined ? data.farmerMobile : existing.farmer_mobile;
      const fId = data.farmerId !== undefined ? data.farmerId : existing.farmer_id;
      const cName = data.cropName !== undefined ? data.cropName : existing.crop_name;
      const title = data.title !== undefined ? data.title : existing.title;
      const notes = data.notes !== undefined ? data.notes : existing.notes;
      const date = data.date !== undefined ? data.date : existing.date;
      const type = data.type !== undefined ? data.type : existing.type;

      await this.query(`
        UPDATE farmer_payables
        SET farmer_id = $1, farmer_name = $2, farmer_mobile = $3, type = $4, crop_name = $5,
            title = $6, weight = $7, rate = $8, total_amount = $9, paid_amount = $10,
            remaining_amount = $11, status = $12, date = $13, notes = $14
        WHERE id = $15
      `, [
        fId, fName, fMobile, type, cName, title, w, r, total, paid, remaining, status, date, notes, id
      ]);

      return {
        id,
        ...existing,
        ...data,
        farmerId: fId,
        farmerName: fName,
        farmerMobile: fMobile,
        type,
        cropName: cName,
        title,
        weight: w,
        weightMaunds: w,
        rate: r,
        ratePerMaund: r,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        remainingBalance: remaining,
        status,
        paymentStatus: status === 'paid' ? 'Paid' : (status === 'partial' ? 'Partial' : 'Pending'),
        notes,
        date
      };
    } catch(e) {
      console.warn('postgres updateFarmerPayable fallback:', e.message);
      return localDb.updateFarmerPayable(id, data);
    }
  }

  async deleteFarmerPayable(id) {
    try {
      await this.ensurePayablesTable();
      await this.query('DELETE FROM farmer_payables WHERE id = $1', [id]);
      return true;
    } catch(e) {
      return false;
    }
  }

  // --- 11. In-Store Counter Pickups / Bookings ---
  async ensureBookingsTable() {
    if (this._ensuredBookingsTable) return;
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS pickup_bookings (
          id VARCHAR(50) PRIMARY KEY,
          farmer_id VARCHAR(50),
          farmer_name VARCHAR(255),
          farmer_mobile VARCHAR(50),
          village VARCHAR(255),
          items JSONB DEFAULT '[]'::jsonb,
          total_amount NUMERIC DEFAULT 0,
          pickup_date VARCHAR(50),
          pickup_time VARCHAR(50),
          payment_method VARCHAR(100),
          status VARCHAR(50) DEFAULT 'Pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        );
      `);
      this._ensuredBookingsTable = true;
    } catch(e) {
      console.warn('ensureBookingsTable notice:', e.message);
    }
  }

  async getBookings() {
    try {
      await this.ensureBookingsTable();
      const res = await this.query(`SELECT * FROM pickup_bookings ORDER BY created_at DESC`);
      return res.rows.map(r => ({
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmerMobile: r.farmer_mobile,
        village: r.village,
        items: r.items || [],
        totalAmount: Number(r.total_amount) || 0,
        pickupDate: r.pickup_date,
        pickupTime: r.pickup_time,
        paymentMethod: r.payment_method,
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at,
        completedAt: r.completed_at
      }));
    } catch(e) {
      return localDb.getBookings();
    }
  }

  async addBooking(data) {
    try {
      await this.ensureBookingsTable();
      const id = "BK-" + Math.floor(1000 + Math.random() * 9000);
      const items = Array.isArray(data.items) ? data.items : [];
      const total = Number(data.totalAmount) || 0;
      const pDate = data.pickupDate || new Date().toISOString().slice(0, 10);
      const pTime = data.pickupTime || 'کسی بھی وقت (دکان اوقات)';
      const pMethod = data.paymentMethod || 'کاؤنٹر پر نقد ادائیگی';
      const status = 'Pending';
      const notes = data.notes || '';

      await this.query(`
        INSERT INTO pickup_bookings (id, farmer_id, farmer_name, farmer_mobile, village, items, total_amount, pickup_date, pickup_time, payment_method, status, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        id, data.farmerId || '', data.farmerName || 'نامعلوم کسان', data.farmerMobile || '', data.village || '',
        JSON.stringify(items), total, pDate, pTime, pMethod, status, notes
      ]);

      const bk = {
        id,
        farmerId: data.farmerId || '',
        farmerName: data.farmerName || 'نامعلوم کسان',
        farmerMobile: data.farmerMobile || '',
        village: data.village || '',
        items,
        totalAmount: total,
        pickupDate: pDate,
        pickupTime: pTime,
        paymentMethod: pMethod,
        status,
        notes,
        createdAt: new Date().toISOString()
      };
      localDb.addBooking(bk); // mirror to local
      return bk;
    } catch(e) {
      return localDb.addBooking(data);
    }
  }

  async updateBookingStatus(id, status) {
    try {
      await this.ensureBookingsTable();
      if (status === 'Picked Up') {
        await this.query(`UPDATE pickup_bookings SET status = $1, completed_at = NOW() WHERE id = $2`, [status, id]);
      } else {
        await this.query(`UPDATE pickup_bookings SET status = $1 WHERE id = $2`, [status, id]);
      }
      localDb.updateBookingStatus(id, status);
      const bks = await this.getBookings();
      return bks.find(b => b.id === id) || null;
    } catch(e) {
      return localDb.updateBookingStatus(id, status);
    }
  }

  async deleteBooking(id) {
    try {
      await this.ensureBookingsTable();
      await this.query(`DELETE FROM pickup_bookings WHERE id = $1`, [id]);
      localDb.deleteBooking(id);
      return true;
    } catch(e) {
      return localDb.deleteBooking(id);
    }
  }

  // --- 12. Counter Billing & POS Sales ---
  async ensurePosSalesTable() {
    if (this._ensuredPosSalesTable) return;
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS pos_sales (
          id VARCHAR(50) PRIMARY KEY,
          invoice_number VARCHAR(50),
          sale_date VARCHAR(50),
          sale_time VARCHAR(50),
          customer_type VARCHAR(50) DEFAULT 'cash',
          farmer_id VARCHAR(50),
          farmer_name VARCHAR(255),
          farmer_mobile VARCHAR(50),
          items JSONB DEFAULT '[]'::jsonb,
          subtotal NUMERIC DEFAULT 0,
          discount NUMERIC DEFAULT 0,
          net_total NUMERIC DEFAULT 0,
          paid_amount NUMERIC DEFAULT 0,
          payment_type VARCHAR(50) DEFAULT 'cash',
          biller_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this._ensuredPosSalesTable = true;
    } catch(e) {
      console.warn('ensurePosSalesTable notice:', e.message);
    }
  }

  async getPosSales() {
    try {
      await this.ensurePosSalesTable();
      const res = await this.query(`SELECT * FROM pos_sales ORDER BY created_at DESC LIMIT 200`);
      return res.rows.map(r => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        date: r.sale_date,
        time: r.sale_time,
        customerType: r.customer_type,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmerMobile: r.farmer_mobile,
        items: r.items || [],
        subtotal: Number(r.subtotal) || 0,
        discount: Number(r.discount) || 0,
        netTotal: Number(r.net_total) || 0,
        paidAmount: Number(r.paid_amount) || 0,
        paymentType: r.payment_type,
        billerName: r.biller_name,
        createdAt: r.created_at
      }));
    } catch(e) {
      return localDb.getPosSales();
    }
  }

  async addPosSale(data) {
    try {
      await this.ensurePosSalesTable();
      const invNum = "INV-" + (Date.now() % 1000000);
      const id = "SALE-" + Math.floor(1000 + Math.random() * 9000);
      const sDate = data.date || new Date().toISOString().slice(0, 10);
      const sTime = data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const items = Array.isArray(data.items) ? data.items : [];
      const subtotal = Number(data.subtotal) || 0;
      const discount = Number(data.discount) || 0;
      const netTotal = Number(data.netTotal) || 0;
      const paid = Number(data.paidAmount) || 0;

      await this.query(`
        INSERT INTO pos_sales (id, invoice_number, sale_date, sale_time, customer_type, farmer_id, farmer_name, farmer_mobile, items, subtotal, discount, net_total, paid_amount, payment_type, biller_name, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      `, [
        id, invNum, sDate, sTime, data.customerType || 'cash', data.farmerId || '', data.farmerName || 'واک اِن گاہک', data.farmerMobile || '',
        JSON.stringify(items), subtotal, discount, netTotal, paid, data.paymentType || 'نقد کیش', data.billerName || 'ایڈمن میاں ہارون رشید'
      ]);

      // If khata customer, also add transaction in farmer ledger
      if (data.customerType === 'khata' && data.farmerId) {
        const remainingKhata = Math.max(0, netTotal - paid);
        if (remainingKhata > 0) {
          await this.addTransaction(data.farmerId, {
            type: 'debit',
            category: 'کاؤنٹر بلنگ',
            productName: `کاؤنٹر سیل بل #${invNum}`,
            quantity: `${items.length} آئٹمز`,
            unitPrice: remainingKhata,
            amount: remainingKhata,
            description: `کاؤنٹر بلنگ #${invNum} (کل بل: Rs. ${netTotal}, نقد ادا: Rs. ${paid}, کھاتہ ڈیبٹ: Rs. ${remainingKhata})`,
            addedBy: data.billerName || 'ایڈمن میاں ہارون رشید'
          });
        }
      }

      const saleObj = {
        id,
        invoiceNumber: invNum,
        date: sDate,
        time: sTime,
        customerType: data.customerType || 'cash',
        farmerId: data.farmerId || '',
        farmerName: data.farmerName || 'واک اِن گاہک',
        farmerMobile: data.farmerMobile || '',
        items,
        subtotal,
        discount,
        netTotal,
        paidAmount: paid,
        paymentType: data.paymentType || 'نقد کیش',
        billerName: data.billerName || 'ایڈمن میاں ہارون رشید',
        createdAt: new Date().toISOString()
      };
      localDb.addPosSale(saleObj);
      return saleObj;
    } catch(e) {
      return localDb.addPosSale(data);
    }
  }

  // --- 13. Suppliers & Company Purchases ---
  async getSuppliers() {
    return localDb.getSuppliers();
  }

  async addSupplier(data) {
    return localDb.addSupplier(data);
  }

  async getSupplierPurchases() {
    return localDb.getSupplierPurchases();
  }

  async addSupplierPurchase(data) {
    return localDb.addSupplierPurchase(data);
  }

  // --- 14. Daily Sales & Profit Reports ---
  async getDailyReport(targetDate) {
    const dateStr = targetDate || new Date().toISOString().slice(0, 10);
    try {
      const sales = await this.getPosSales();
      const daySales = sales.filter(s => s.date === dateStr);

      let totalSales = 0;
      let cashSales = 0;
      let khataSales = 0;
      let totalDiscount = 0;
      let estimatedCost = 0;

      for (const sale of daySales) {
        totalSales += Number(sale.netTotal) || 0;
        totalDiscount += Number(sale.discount) || 0;
        cashSales += Number(sale.paidAmount) || 0;
        const khataPart = Math.max(0, (Number(sale.netTotal) || 0) - (Number(sale.paidAmount) || 0));
        khataSales += khataPart;

        if (Array.isArray(sale.items)) {
          for (const it of sale.items) {
            const qty = Number(it.quantity) || 1;
            const cost = Number(it.unitPrice) * 0.88;
            estimatedCost += cost * qty;
          }
        }
      }

      const grossProfit = Math.max(0, totalSales - estimatedCost);

      return {
        date: dateStr,
        totalBills: daySales.length,
        totalSales,
        cashSales,
        khataSales,
        totalDiscount,
        estimatedCost: Math.round(estimatedCost),
        grossProfit: Math.round(grossProfit),
        drawerCash: cashSales,
        recentBills: daySales.slice(0, 20)
      };
    } catch(e) {
      return localDb.getDailyReport(dateStr);
    }
  }
}

module.exports = PostgresDB;
