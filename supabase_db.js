/**
 * Supabase Database Client for Haroon Zarai Markaz
 * Built with native Node.js fetch (Zero external dependencies)
 * Connects to Supabase REST API (PostgREST)
 */

class SupabaseDB {
  constructor(url, key) {
    this.baseUrl = (url || '').replace(/\/$/, '') + '/rest/v1';
    this.key = key || '';
  }

  get isConfigured() {
    return Boolean(this.baseUrl && this.key);
  }

  get headers() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const opts = {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers || {})
      }
    };

    const res = await fetch(url, opts);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase Error (${res.status}): ${errText}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // --- Settings ---
  async getSettings() {
    try {
      const rows = await this.request('/settings?id=eq.main&select=*');
      if (rows && rows.length > 0) {
        const s = rows[0];
        return {
          businessName: s.business_name,
          businessNameEn: s.business_name_en,
          tagline: s.tagline,
          ownerName: s.owner_name,
          phone: s.phone,
          whatsapp: s.whatsapp,
          address: s.address,
          adminPin: s.admin_pin,
          announcement: s.announcement
        };
      }
    } catch (err) {
      console.error('Supabase getSettings error:', err.message);
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
      announcement: "خوش آمدید برائے ہارون زرعی مرکز"
    };
  }

  async updateSettings(data) {
    const payload = {};
    if (data.businessName !== undefined) payload.business_name = data.businessName;
    if (data.businessNameEn !== undefined) payload.business_name_en = data.businessNameEn;
    if (data.tagline !== undefined) payload.tagline = data.tagline;
    if (data.ownerName !== undefined) payload.owner_name = data.ownerName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.whatsapp !== undefined) payload.whatsapp = data.whatsapp;
    if (data.address !== undefined) payload.address = data.address;
    if (data.adminPin !== undefined) payload.admin_pin = data.adminPin;
    if (data.announcement !== undefined) payload.announcement = data.announcement;

    const rows = await this.request('/settings?id=eq.main', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return this.getSettings();
  }

  // --- Mandi Rates ---
  async getRates() {
    const rows = await this.request('/mandi_rates?select=*&order=created_at.asc');
    return (rows || []).map(r => ({
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
    const rows = await this.request(`/mandi_rates?id=eq.${id}&select=*`);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
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
    const newRate = {
      id: "rate-" + Date.now(),
      crop_name_urdu: rateData.cropNameUrdu || "نئی فصل",
      crop_name_en: rateData.cropNameEn || "New Crop",
      unit: rateData.unit || "فی 40 کلوگرام (من)",
      buy_price: Number(rateData.buyPrice) || 0,
      sell_price: Number(rateData.sellPrice) || 0,
      trend: rateData.trend || "stable",
      last_updated: new Date().toISOString().split('T')[0],
      notes: rateData.notes || ""
    };
    const rows = await this.request('/mandi_rates', {
      method: 'POST',
      body: JSON.stringify(newRate)
    });
    return rows && rows[0] ? this.getRateById(newRate.id) : newRate;
  }

  async updateRate(id, rateData) {
    const payload = {};
    if (rateData.cropNameUrdu !== undefined) payload.crop_name_urdu = rateData.cropNameUrdu;
    if (rateData.cropNameEn !== undefined) payload.crop_name_en = rateData.cropNameEn;
    if (rateData.unit !== undefined) payload.unit = rateData.unit;
    if (rateData.buyPrice !== undefined) payload.buy_price = Number(rateData.buyPrice);
    if (rateData.sellPrice !== undefined) payload.sell_price = Number(rateData.sellPrice);
    if (rateData.trend !== undefined) payload.trend = rateData.trend;
    if (rateData.notes !== undefined) payload.notes = rateData.notes;
    payload.last_updated = new Date().toISOString().split('T')[0];

    await this.request(`/mandi_rates?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return this.getRateById(id);
  }

  async deleteRate(id) {
    await this.request(`/mandi_rates?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // --- Products (Zarai Adviyaat & Seeds) ---
  async getProducts(category, search) {
    let query = '/products?select=*&order=created_at.desc';
    if (category && category !== 'all') {
      query += `&category=eq.${category}`;
    }
    const rows = await this.request(query);
    let prods = (rows || []).map(p => ({
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
      featured: Boolean(p.featured)
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
    const rows = await this.request(`/products?id=eq.${id}&select=*`);
    if (!rows || rows.length === 0) return null;
    const p = rows[0];
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
      featured: Boolean(p.featured)
    };
  }

  async addProduct(prodData) {
    const newProd = {
      id: "prod-" + Date.now(),
      name_urdu: prodData.nameUrdu || prodData.name || "",
      name_en: prodData.nameEn || "",
      category: prodData.category || "pesticide",
      category_urdu: prodData.categoryUrdu || "زرعی دوا",
      company: prodData.company || "",
      pack_size: prodData.packSize || "",
      price: Number(prodData.price) || 0,
      stock: Number(prodData.stock) || 0,
      description: prodData.description || "",
      image: prodData.image || prodData.imageUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80",
      featured: Boolean(prodData.featured)
    };
    await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(newProd)
    });
    return this.getProductById(newProd.id);
  }

  async updateProduct(id, prodData) {
    const payload = {};
    if (prodData.nameUrdu !== undefined) payload.name_urdu = prodData.nameUrdu;
    if (prodData.name !== undefined && !payload.name_urdu) payload.name_urdu = prodData.name;
    if (prodData.nameEn !== undefined) payload.name_en = prodData.nameEn;
    if (prodData.category !== undefined) payload.category = prodData.category;
    if (prodData.categoryUrdu !== undefined) payload.category_urdu = prodData.categoryUrdu;
    if (prodData.company !== undefined) payload.company = prodData.company;
    if (prodData.packSize !== undefined) payload.pack_size = prodData.packSize;
    if (prodData.price !== undefined) payload.price = Number(prodData.price);
    if (prodData.stock !== undefined) payload.stock = Number(prodData.stock);
    if (prodData.description !== undefined) payload.description = prodData.description;
    if (prodData.image !== undefined) payload.image = prodData.image;
    if (prodData.imageUrl !== undefined && !payload.image) payload.image = prodData.imageUrl;
    if (prodData.featured !== undefined) payload.featured = Boolean(prodData.featured);

    await this.request(`/products?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.request(`/products?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // --- Farmers & Khata Management ---
  async getFarmers(search) {
    const rows = await this.request('/farmers?select=*,transactions(*)&order=id.desc');
    let farmers = (rows || []).map(f => this.formatFarmer(f));

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
    const rows = await this.request(`/farmers?id=eq.${id}&select=*,transactions(*)`);
    if (!rows || rows.length === 0) return null;
    return this.formatFarmer(rows[0]);
  }

  // Public Search by Phone or ID
  async findFarmerByPhoneOrId(query) {
    if (!query) return null;
    const cleanQ = query.toString().trim().replace(/[-\s]/g, '');

    // Fetch all farmers and match cleanly
    const farmers = await this.getFarmers();
    const found = farmers.find(f => {
      const phone = (f.mobile || '').replace(/[-\s]/g, '');
      const id = (f.id || '').toLowerCase().replace(/[-\s]/g, '');
      const cnic = (f.cnic || '').replace(/[-\s]/g, '');
      const target = cleanQ.toLowerCase();

      return phone === target || phone.endsWith(target) || target.endsWith(phone) || id === target || cnic === target;
    });

    return found || null;
  }

  async addFarmer(farmerData) {
    // Generate next HZM-XXX ID
    const farmers = await this.getFarmers();
    const highestNum = farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;
    const initialBal = Number(farmerData.initialBalance) || 0;

    const newFarmerRow = {
      id: newId,
      name: farmerData.name || "کسان",
      name_en: farmerData.nameEn || "",
      father_name: farmerData.fatherName || "",
      mobile: farmerData.mobile || "",
      cnic: farmerData.cnic || "",
      village: farmerData.village || "",
      land_acres: Number(farmerData.landAcres) || 0,
      current_balance: initialBal,
      notes: farmerData.notes || "",
      created_at: new Date().toISOString().split('T')[0]
    };

    await this.request('/farmers', {
      method: 'POST',
      body: JSON.stringify(newFarmerRow)
    });

    if (initialBal !== 0) {
      await this.request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          id: "TX-" + Date.now().toString().slice(-6),
          farmer_id: newId,
          date: new Date().toISOString().split('T')[0],
          type: initialBal > 0 ? "debit" : "credit",
          category: "سابقہ بقایا",
          product_name: "سابقہ بقایا رقم",
          quantity: "1 اندراج",
          unit_price: Math.abs(initialBal),
          description: "کھاتہ کھولتے وقت سابقہ بقایا رقم درج کی گئی",
          amount: Math.abs(initialBal),
          balance_after: initialBal,
          added_by: "ایڈمن"
        })
      });
    }

    return this.getFarmerById(newId);
  }

  async updateFarmer(id, farmerData) {
    const payload = {};
    if (farmerData.name !== undefined) payload.name = farmerData.name;
    if (farmerData.nameEn !== undefined) payload.name_en = farmerData.nameEn;
    if (farmerData.fatherName !== undefined) payload.father_name = farmerData.fatherName;
    if (farmerData.mobile !== undefined) payload.mobile = farmerData.mobile;
    if (farmerData.cnic !== undefined) payload.cnic = farmerData.cnic;
    if (farmerData.village !== undefined) payload.village = farmerData.village;
    if (farmerData.landAcres !== undefined) payload.land_acres = Number(farmerData.landAcres);
    if (farmerData.notes !== undefined) payload.notes = farmerData.notes;

    await this.request(`/farmers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return this.getFarmerById(id);
  }

  async deleteFarmer(id) {
    await this.request(`/farmers?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // --- Transactions ---
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
    const txRow = {
      id: txId,
      farmer_id: farmerId,
      date: txData.date || new Date().toISOString().split('T')[0],
      type: type,
      category: txData.category || (type === 'debit' ? "ادھار مال و ادویات" : "نقد ادائیگی"),
      product_name: productName,
      quantity: quantity,
      unit_price: unitPrice,
      description: description,
      amount: amount,
      balance_after: newBalance,
      added_by: txData.addedBy || "ایڈمن ہارون"
    };

    // 1. Insert transaction
    await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(txRow)
    });

    // 2. Update farmer balance
    await this.request(`/farmers?id=eq.${farmerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_balance: newBalance })
    });

    const updatedFarmer = await this.getFarmerById(farmerId);
    const savedTx = (updatedFarmer.transactions || []).find(t => t.id === txId) || txRow;
    return { farmer: updatedFarmer, transaction: savedTx };
  }

  async deleteTransaction(farmerId, txId) {
    const farmer = await this.getFarmerById(farmerId);
    if (!farmer) return null;

    // Delete transaction
    await this.request(`/transactions?id=eq.${txId}&farmer_id=eq.${farmerId}`, { method: 'DELETE' });

    // Recalculate farmer balance
    const remainingFarmer = await this.getFarmerById(farmerId);
    let runningBalance = 0;
    (remainingFarmer.transactions || []).forEach(t => {
      if (t.type === 'debit') runningBalance += t.amount;
      else runningBalance -= t.amount;
    });

    await this.request(`/farmers?id=eq.${farmerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_balance: runningBalance })
    });

    return this.getFarmerById(farmerId);
  }

  // --- Trade Requests ---
  async getTradeRequests() {
    const rows = await this.request('/trade_requests?select=*&order=created_at.desc');
    return (rows || []).map(r => ({
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
    const newReq = {
      id: "REQ-" + Date.now().toString().slice(-6),
      farmer_name: reqData.farmerName || "",
      mobile: reqData.mobile || "",
      village: reqData.village || "",
      crop_name: reqData.cropName || "",
      quantity: reqData.quantity || "",
      type: reqData.type || "sell_crop",
      expected_price: reqData.expectedPrice || "",
      notes: reqData.notes || "",
      status: "Pending",
      created_at: new Date().toLocaleDateString('en-GB')
    };

    await this.request('/trade_requests', {
      method: 'POST',
      body: JSON.stringify(newReq)
    });
    return newReq;
  }

  async updateTradeRequestStatus(id, status) {
    const rows = await this.request(`/trade_requests?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    const all = await this.getTradeRequests();
    return all.find(r => r.id === id) || null;
  }

  async deleteTradeRequest(id) {
    await this.request(`/trade_requests?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // --- Statistics ---
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

    return {
      totalFarmers: farmers.length,
      totalReceivable,
      totalPayable,
      totalProducts: products.length,
      totalRequests: requests.length,
      pendingRequests,
      activeRatesCount: rates.length
    };
  }

  formatFarmer(f) {
    const txs = (f.transactions || []).map(t => ({
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
      addedBy: t.added_by
    }));

    return {
      id: f.id,
      name: f.name,
      nameEn: f.name_en,
      fatherName: f.father_name,
      mobile: f.mobile,
      cnic: f.cnic,
      village: f.village,
      landAcres: Number(f.land_acres) || 0,
      currentBalance: Number(f.current_balance) || 0,
      notes: f.notes,
      createdAt: f.created_at,
      transactions: txs
    };
  }
}

module.exports = SupabaseDB;
