const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Initial default seed data
const initialData = {
  settings: {
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
  },
  mandiRates: [
    {
      id: "rate-gandum",
      cropNameUrdu: "گندم (صاف ستھری کسان سپیشل)",
      cropNameEn: "Wheat (Gandum)",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 3950,
      sellPrice: 4100,
      trend: "up",
      lastUpdated: "2026-10-28",
      notes: "نمی 10% سے کم، بر وقت نقد ادائیگی"
    },
    {
      id: "rate-rice-super",
      cropNameUrdu: "دھان / چاول سپر باسمتی",
      cropNameEn: "Super Basmati Rice",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 4250,
      sellPrice: 4450,
      trend: "up",
      lastUpdated: "2026-10-28",
      notes: "لمبا دانہ، خوشبودار قسم"
    },
    {
      id: "rate-rice-1121",
      cropNameUrdu: "دھان کائنات 1121 سپیشل",
      cropNameEn: "Kainat 1121 Rice",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 4650,
      sellPrice: 4900,
      trend: "stable",
      lastUpdated: "2026-10-28",
      notes: "مکمل صفائی کے ساتھ نقد خریداری"
    },
    {
      id: "rate-till-white",
      cropNameUrdu: "سفید تل (اعلیٰ کوالٹی)",
      cropNameEn: "White Sesame (Till)",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 15800,
      sellPrice: 16500,
      trend: "up",
      lastUpdated: "2026-10-28",
      notes: "ایکسپورٹ کوالٹی، نقد ادائیگی موقع پر"
    },
    {
      id: "rate-till-black",
      cropNameUrdu: "کالا تل (دیسی)",
      cropNameEn: "Black Sesame (Till)",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 13900,
      sellPrice: 14600,
      trend: "stable",
      lastUpdated: "2026-10-28",
      notes: "خشک اور صاف تل"
    },
    {
      id: "rate-sunflower",
      cropNameUrdu: "سورج مکھی بیج (آئل کوالٹی)",
      cropNameEn: "Sunflower Seeds",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 6900,
      sellPrice: 7300,
      trend: "up",
      lastUpdated: "2026-10-28",
      notes: "تیل کی مقدار 40% سے زائد پر خصوصی بونس"
    },
    {
      id: "rate-makai",
      cropNameUrdu: "مکئی ہائبرڈ خشک دانہ",
      cropNameEn: "Hybrid Maize (Corn)",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 2800,
      sellPrice: 2950,
      trend: "down",
      lastUpdated: "2026-10-28",
      notes: "14% نمی پر فوری خریداری"
    },
    {
      id: "rate-sarson",
      cropNameUrdu: "سرسوں / کینولا تیل بیج",
      cropNameEn: "Mustard / Canola",
      unit: "فی 40 کلوگرام (من)",
      buyPrice: 7600,
      sellPrice: 8000,
      trend: "stable",
      lastUpdated: "2026-10-28",
      notes: "تیل نکالنے والی فیکٹریوں کے لیے براہ راست ریٹ"
    }
  ],
  products: [
    {
      id: "prod-1",
      nameUrdu: "بائلٹ ایکسپرٹ (Belt Expert)",
      nameEn: "Belt Expert Insecticide",
      category: "pesticide",
      categoryUrdu: "کیڑے مار زہر",
      company: "Bayer CropScience",
      packSize: "100 ملی لیٹر",
      price: 3200,
      stock: 45,
      description: "فصلوں میں ہر قسم کی سنڈی، لشکری سنڈی اور رس چوسنے والے کیڑوں کا مکمل صفایا۔ دیرپا تحفظ فراہم کرتا ہے۔",
      image: "https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-2",
      nameUrdu: "کوراجن (Coragen 20 SC)",
      nameEn: "Coragen FMC",
      category: "pesticide",
      categoryUrdu: "کیڑے مار زہر",
      company: "FMC Pakistan",
      packSize: "50 ملی لیٹر",
      price: 2900,
      stock: 38,
      description: "دھان، مکئی اور کماد میں تنے کی سنڈی اور بورر کے خلاف عالمی شہرت یافتہ برانڈ۔ پودے کو اندرونی قوت دیتا ہے۔",
      image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-3",
      nameUrdu: "نیٹویو (Nativo Fungicide)",
      nameEn: "Nativo 75 WG",
      category: "fungicide",
      categoryUrdu: "پھپھوندی کش دوا",
      company: "Bayer",
      packSize: "100 گرام",
      price: 2650,
      stock: 28,
      description: "چاول کا جھلساؤ (Blast)، گندم کی کنگی اور سبزیوں میں پھپھوندی کے حملے کا جڑ سے خاتمہ۔",
      image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=80",
      featured: false
    },
    {
      id: "prod-4",
      nameUrdu: "اٹلانٹس اسٹار (Atlantis Star)",
      nameEn: "Atlantis Star Weedicide",
      category: "weedicide",
      categoryUrdu: "جڑی بوٹی مار زہر",
      company: "Bayer",
      packSize: "400 ملی لیٹر",
      price: 3150,
      stock: 52,
      description: "گندم کی تمام چوڑے اور نوکیلے پتے والی جڑی بوٹیوں جیسے دمبی سٹی، جنگلی جئی، باتھو اور شاہترہ کا حتمی علاج۔",
      image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-5",
      nameUrdu: "سونا یوریا کھاد (Sona Urea)",
      nameEn: "Sona Urea FFC",
      category: "fertilizer",
      categoryUrdu: "کھاد و نیوٹریشن",
      company: "FFC Pakistan",
      packSize: "50 کلوگرام بوری",
      price: 4650,
      stock: 120,
      description: "46% نائٹروجن پر مشتمل دانے دار یوریا۔ فصلوں کی ابتدائی نشوونما اور سرسبزی کے لیے لازمی۔",
      image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-6",
      nameUrdu: "اینگرو ڈی اے پی کھاد (Engro DAP)",
      nameEn: "Engro DAP Fertilizer",
      category: "fertilizer",
      categoryUrdu: "کھاد و نیوٹریشن",
      company: "Engro Fertilizers",
      packSize: "50 کلوگرام بوری",
      price: 13900,
      stock: 75,
      description: "18% نائٹروجن اور 46% فاسفورس۔ پودے کی جڑ مضبوط کرتا ہے اور جھاڑ میں بھرپور اضافہ کرتا ہے۔",
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-7",
      nameUrdu: "تصدیق شدہ بیج گندم اکبر-19",
      nameEn: "Akbar-19 Certified Wheat Seed",
      category: "seed",
      categoryUrdu: "تصدیق شدہ بیج",
      company: "پنجاب سیڈ کارپوریشن (PSC)",
      packSize: "50 کلوگرام بوری",
      price: 6300,
      stock: 90,
      description: "پنجاب بھر کے لیے کنگی کے خلاف بہترین مدافعت رکھنے والی قسم۔ فی ایکڑ اوسط پیداوار 55 سے 65 من۔ اگاؤ 95% پلس۔",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-8",
      nameUrdu: "بیج گندم فیصل آباد-08 (بنیادی)",
      nameEn: "Faisalabad-08 Wheat Seed",
      category: "seed",
      categoryUrdu: "تصدیق شدہ بیج",
      company: "Punjab Seed Corporation",
      packSize: "50 کلوگرام بوری",
      price: 5950,
      stock: 85,
      description: "چوڑی اور وزنی بالیاں، بھرپور دانہ اور گرمی برداشت کرنے کی لاجواب صلاحیت۔",
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&auto=format&fit=crop&q=80",
      featured: false
    },
    {
      id: "prod-9",
      nameUrdu: "ہائی سن 33 سورج مکھی ہائبرڈ بیج",
      nameEn: "Hi-Sun 33 Sunflower Seed",
      category: "seed",
      categoryUrdu: "تصدیق شدہ بیج",
      company: "ICI Pakistan",
      packSize: "2 کلوگرام بیگ",
      price: 4500,
      stock: 60,
      description: "اعلیٰ ترین فی ایکڑ پیداوار اور زیادہ تیل کی شرح۔ گرنے کے خلاف مضبوط تنا اور تیز پکنے والی ورائٹی۔",
      image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-10",
      nameUrdu: "نیاب پرل سفید تل تصدیق شدہ بیج",
      nameEn: "Niab Pearl Sesame Seed",
      category: "seed",
      categoryUrdu: "تصدیق شدہ بیج",
      company: "نیاب فیصل آباد (NIAB)",
      packSize: "5 کلوگرام پیکٹ",
      price: 4900,
      stock: 40,
      description: "سفید چمکدار دانہ، شاخوں پر پھلیوں کا گچھا، بیماریوں سے محفوظ اور زیادہ تیل دینے والا تل کا معیاری بیج۔",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80",
      featured: true
    },
    {
      id: "prod-11",
      nameUrdu: "سپر باسمتی رائس بیج (گریڈ ون)",
      nameEn: "Super Basmati Rice Seed",
      category: "seed",
      categoryUrdu: "تصدیق شدہ بیج",
      company: "گورنمنٹ سرٹیفائیڈ",
      packSize: "20 کلوگرام تھیلا",
      price: 4300,
      stock: 50,
      description: "لاجواب خوشبو، پکنے پر دانہ دگنا لمبا، پیداواری صلاحیت 45 سے 50 من۔",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
      featured: false
    },
    {
      id: "prod-12",
      nameUrdu: "زنک سپرے 33% اور مائیکرو نیوٹرینٹس",
      nameEn: "Bio Zinc 33% Micro-nutrients",
      category: "fertilizer",
      categoryUrdu: "کھاد و نیوٹریشن",
      company: "Ali Akbar Group",
      packSize: "3 کلوگرام پیک",
      price: 1850,
      stock: 65,
      description: "دھان میں تڑکا روگ اور گندم میں پیلا پن دور کرنے کے لیے فوری جذب ہونے والا خالص زنک۔",
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80",
      featured: false
    }
  ],
  farmers: [],
  tradeRequests: [],
  farmerPayables: []

};

// Database helper functions
class Database {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      this.ensureInitialized();
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (!data.farmerPayables) {
        data.farmerPayables = [];
      }
      return data;
    } catch (e) {
      console.error("DB read error, reinitializing default data:", e);
      return initialData;
    }
  }

  write(data) {
    try {
      this.ensureInitialized();
      // Atomic write using temp file
      const tempPath = DB_PATH + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
      return true;
    } catch (e) {
      console.error("DB write error:", e);
      return false;
    }
  }

  // --- Settings ---
  getSettings() {
    const db = this.read();
    return db.settings || initialData.settings;
  }

  updateSettings(newSettings) {
    const db = this.read();
    db.settings = { ...db.settings, ...newSettings };
    this.write(db);
    return db.settings;
  }

  // --- Mandi Rates ---
  getRates() {
    const db = this.read();
    return db.mandiRates || [];
  }

  updateRate(id, rateData) {
    const db = this.read();
    const index = db.mandiRates.findIndex(r => r.id === id);
    if (index !== -1) {
      db.mandiRates[index] = {
        ...db.mandiRates[index],
        ...rateData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      this.write(db);
      return db.mandiRates[index];
    }
    return null;
  }

  addRate(rateData) {
    const db = this.read();
    const newRate = {
      id: "rate-" + Date.now(),
      cropNameUrdu: rateData.cropNameUrdu || "نئی فصل",
      cropNameEn: rateData.cropNameEn || "New Crop",
      unit: rateData.unit || "فی 40 کلوگرام (من)",
      buyPrice: Number(rateData.buyPrice) || 0,
      sellPrice: Number(rateData.sellPrice) || 0,
      trend: rateData.trend || "stable",
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: rateData.notes || ""
    };
    db.mandiRates.push(newRate);
    this.write(db);
    return newRate;
  }

  deleteRate(id) {
    const db = this.read();
    db.mandiRates = db.mandiRates.filter(r => r.id !== id);
    this.write(db);
    return true;
  }

  // --- Products (Zarai Adviyaat & Seeds) ---
  getProducts(category, search) {
    const db = this.read();
    let prods = db.products || [];
    if (category && category !== 'all') {
      prods = prods.filter(p => p.category === category);
    }
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

  getProductById(id) {
    const db = this.read();
    return db.products.find(p => p.id === id) || null;
  }

  addProduct(prodData) {
    const db = this.read();
    const newProd = {
      id: "prod-" + Date.now(),
      nameUrdu: prodData.nameUrdu || prodData.name || "",
      nameEn: prodData.nameEn || "",
      category: prodData.category || "pesticide",
      categoryUrdu: prodData.categoryUrdu || "زرعی دوا",
      company: prodData.company || "",
      packSize: prodData.packSize || "",
      price: Number(prodData.price) || 0,
      stock: Number(prodData.stock) || 0,
      description: prodData.description || "",
      image: prodData.image || prodData.imageUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80",
      featured: !!prodData.featured,
      activeIngredient: prodData.activeIngredient || "",
      suitableCrops: prodData.suitableCrops || "",
      targetPests: prodData.targetPests || "",
      dosage: prodData.dosage || "",
      precautions: prodData.precautions || ""
    };
    db.products.push(newProd);
    this.write(db);
    return newProd;
  }

  updateProduct(id, prodData) {
    const db = this.read();
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...prodData };
      this.write(db);
      return db.products[index];
    }
    return null;
  }

  deleteProduct(id) {
    const db = this.read();
    db.products = db.products.filter(p => p.id !== id);
    this.write(db);
    return true;
  }

  // --- Farmers & Khata Management ---
  getFarmers(search) {
    const db = this.read();
    let farmers = db.farmers || [];
    if (search && search.trim()) {
      const q = search.toLowerCase().trim().replace(/[-\s]/g, '');
      farmers = farmers.filter(f => {
        const cleanPhone = (f.mobile || '').replace(/[-\s]/g, '');
        const cleanCnic = (f.cnic || '').replace(/[-\s]/g, '');
        const cleanId = (f.id || '').toLowerCase();
        const cleanName = (f.name || '').toLowerCase();
        const cleanNameEn = (f.nameEn || '').toLowerCase();
        const cleanVillage = (f.village || '').toLowerCase();

        return cleanPhone.includes(q) ||
               cleanCnic.includes(q) ||
               cleanId.includes(q) ||
               cleanName.includes(q) ||
               cleanNameEn.includes(q) ||
               cleanVillage.includes(q);
      });
    }
    return farmers;
  }

  getFarmerById(id) {
    const db = this.read();
    return db.farmers.find(f => f.id === id) || null;
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

  // Public search for farmer: by Mobile Number or Farmer ID or CNIC
  findFarmerByPhoneOrId(query) {
    if (!query) return null;
    const db = this.read();
    return db.farmers.find(f => this.matchFarmer(f, query)) || null;
  }

  // Record Farmer Login Activity for Admin
  recordFarmerLogin(loginData) {
    const db = this.read();
    if (!db.farmerLogins) db.farmerLogins = [];
    const farmer = db.farmers.find(f => f.id === loginData.farmerId);
    const entry = {
      id: "LOG-" + Date.now().toString().slice(-6),
      farmerId: loginData.farmerId,
      farmerName: loginData.farmerName || (farmer ? farmer.name : 'کسان بھائی'),
      mobile: loginData.mobile || (farmer ? farmer.mobile || farmer.cnic : ''),
      password: loginData.password || (farmer ? farmer.password : ''),
      loginTime: new Date().toISOString(),
      method: loginData.method || 'Password',
      ip: loginData.ip || 'Local Client'
    };
    db.farmerLogins.unshift(entry);
    if (db.farmerLogins.length > 100) db.farmerLogins = db.farmerLogins.slice(0, 100);

    if (farmer) farmer.lastLogin = entry.loginTime;

    this.write(db);
    return entry;
  }

  getFarmerLogins(limit = 30) {
    const db = this.read();
    const logins = db.farmerLogins || [];
    return logins.slice(0, limit).map(l => {
      const farmer = db.farmers.find(f => f.id === l.farmerId);
      return {
        ...l,
        farmerName: l.farmerName || (farmer ? farmer.name : 'کسان بھائی'),
        mobile: l.mobile || (farmer ? farmer.mobile || farmer.cnic : '-'),
        password: l.password || (farmer ? farmer.password : ''),
        registered: Boolean(farmer && (farmer.registered || farmer.password)),
        currentBalance: farmer ? farmer.currentBalance : 0,
        village: farmer ? farmer.village : 'پل 88، کوٹ ادو'
      };
    });
  }

  // Farmer Online Sign Up
  farmerSignUp(data) {
    const db = this.read();
    const name = (data.name || '').trim();
    const rawId = (data.identifier || data.mobile || data.cnic || '').trim();
    const password = (data.password || '').trim();
    const email = (data.email || data.gmail || '').trim();

    if (!name || !rawId || !password) {
      return { error: 'نام، موبائل نمبر/شناختی کارڈ اور پاس ورڈ درج کرنا لازمی ہے۔' };
    }

    const cleanDigits = rawId.replace(/\D/g, '');
    const isCnic = cleanDigits.length === 13 || rawId.includes('-');

    // Check if farmer already exists in ledger using safe matcher
    const existing = db.farmers.find(f => this.matchFarmer(f, rawId));

    if (existing) {
      if (existing.password && existing.registered) {
        return { error: 'اس موبائل نمبر یا شناختی کارڈ پر اکاؤنٹ پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔' };
      }
      // Farmer was created by Admin without password, now setting password & registering
      existing.name = name || existing.name;
      existing.password = password;
      if (email) existing.email = email;
      existing.registered = true;
      existing.lastLogin = new Date().toISOString();
      if (isCnic) {
        if (!existing.cnic) existing.cnic = rawId;
      } else {
        if (!existing.mobile) existing.mobile = rawId;
      }
      this.write(db);
      this.recordFarmerLogin({ farmerId: existing.id, farmerName: existing.name, mobile: existing.mobile || existing.cnic || rawId, password: password, method: 'New Registration' });
      return { success: true, farmer: existing, isNew: false, message: 'اکاؤنٹ کامیابی سے رجسٹر ہو گیا!' };
    }

    // New Farmer Registration
    const highestNum = db.farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;

    const newFarmer = {
      id: newId,
      name: name,
      nameEn: '',
      fatherName: '',
      mobile: isCnic ? '' : rawId,
      cnic: isCnic ? rawId : '',
      email: email,
      password: password,
      village: 'پل 88، کوٹ ادو',
      landAcres: 0,
      currentBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString(),
      notes: 'آن لائن پورٹل سے رجسٹرڈ کسان',
      registered: true,
      transactions: []
    };

    db.farmers.unshift(newFarmer);
    this.write(db);
    this.recordFarmerLogin({ farmerId: newId, farmerName: name, mobile: rawId, password: password, method: 'New Registration' });
    return { success: true, farmer: newFarmer, isNew: true, message: 'نیا کسان اکاؤنٹ کامیابی سے بن گیا!' };
  }

  // Farmer Online Login
  farmerLogin(identifier, password) {
    if (!identifier || !password) {
      return { error: 'موبائل نمبر / شناختی کارڈ اور پاس ورڈ درج کرنا لازمی ہے۔' };
    }
    const farmer = this.findFarmerByPhoneOrId(identifier);
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
      lastLogin: farmer.lastLogin || new Date().toISOString(),
      totalDebit,
      totalCredit,
      transactions: farmer.transactions || []
    };

    this.recordFarmerLogin({
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

  // Farmer Google Sign-in / Sign-up
  googleAuth(data) {
    const email = (data.email || '').trim().toLowerCase();
    const name = (data.name || '').trim();
    if (!email) return { error: 'گوگل ای میل ایڈریس ضروری ہے۔' };

    const db = this.read();
    let farmer = db.farmers.find(f => f.email && f.email.toLowerCase() === email);

    if (farmer) {
      farmer.lastLogin = new Date().toISOString();
      this.write(db);
      this.recordFarmerLogin({ farmerId: farmer.id, farmerName: farmer.name, mobile: farmer.mobile || email, password: farmer.password || 'گوگل تصدیق شدہ', method: 'Google' });
      return {
        success: true,
        farmer,
        token: `FARMER_${farmer.id}_${Date.now()}`,
        message: 'گوگل کے ذریعے لاگ ان کامیاب!'
      };
    }

    // Register new farmer with Google
    const highestNum = db.farmers.reduce((max, f) => {
      const match = (f.id || '').match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;

    const newFarmer = {
      id: newId,
      name: name || 'کسان بھائی',
      nameEn: '',
      fatherName: '',
      mobile: data.mobile || '',
      cnic: '',
      email: email,
      password: 'گوگل تصدیق شدہ',
      village: 'پل 88، کوٹ ادو',
      landAcres: 0,
      currentBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString(),
      notes: 'رجسٹرڈ بذریعہ گوگل اکاؤنٹ',
      registered: true,
      transactions: []
    };

    db.farmers.unshift(newFarmer);
    this.write(db);
    this.recordFarmerLogin({ farmerId: newId, farmerName: name || 'کسان بھائی', mobile: data.mobile || email, password: 'گوگل تصدیق شدہ', method: 'Google' });

    return {
      success: true,
      farmer: newFarmer,
      token: `FARMER_${newId}_${Date.now()}`,
      message: 'گوگل کے ذریعے نیا اکاؤنٹ بن گیا اور لاگ ان ہو گئے!'
    };
  }

  addFarmer(farmerData) {
    const db = this.read();
    // Generate farmer ID like HZM-105
    const highestNum = db.farmers.reduce((max, f) => {
      const match = f.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const newId = `HZM-${highestNum + 1}`;

    const initialBal = Number(farmerData.initialBalance) || 0;
    const pass = farmerData.password ? farmerData.password.trim() : "";
    const newFarmer = {
      id: newId,
      name: farmerData.name || "کسان",
      nameEn: farmerData.nameEn || "",
      fatherName: farmerData.fatherName || "",
      mobile: farmerData.mobile || "",
      cnic: farmerData.cnic || "",
      village: farmerData.village || "",
      landAcres: Number(farmerData.landAcres) || 0,
      currentBalance: initialBal,
      password: pass,
      registered: Boolean(pass),
      createdAt: new Date().toISOString().split('T')[0],
      notes: farmerData.notes || "",
      transactions: []
    };

    if (initialBal !== 0) {
      newFarmer.transactions.push({
        id: "TX-" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: initialBal > 0 ? "debit" : "credit",
        category: "سابقہ بقایا",
        description: "کھاتہ کھولتے وقت سابقہ بقایا رقم درج کی گئی",
        amount: Math.abs(initialBal),
        balanceAfter: initialBal,
        addedBy: "ایڈمن"
      });
    }

    db.farmers.unshift(newFarmer);
    this.write(db);
    return newFarmer;
  }

  updateFarmer(id, farmerData) {
    const db = this.read();
    const index = db.farmers.findIndex(f => f.id === id);
    if (index !== -1) {
      // Don't overwrite transactions or ID directly through simple edit
      const current = db.farmers[index];
      const newPass = farmerData.password !== undefined 
        ? (farmerData.password ? farmerData.password.trim() : "") 
        : (current.password || "");
      const isReg = newPass ? true : (farmerData.registered !== undefined ? Boolean(farmerData.registered) : Boolean(current.registered));

      db.farmers[index] = {
        ...current,
        name: farmerData.name !== undefined ? farmerData.name : current.name,
        nameEn: farmerData.nameEn !== undefined ? farmerData.nameEn : current.nameEn,
        fatherName: farmerData.fatherName !== undefined ? farmerData.fatherName : current.fatherName,
        mobile: farmerData.mobile !== undefined ? farmerData.mobile : current.mobile,
        cnic: farmerData.cnic !== undefined ? farmerData.cnic : current.cnic,
        village: farmerData.village !== undefined ? farmerData.village : current.village,
        landAcres: farmerData.landAcres !== undefined ? Number(farmerData.landAcres) : current.landAcres,
        notes: farmerData.notes !== undefined ? farmerData.notes : current.notes,
        password: newPass,
        registered: isReg
      };
      this.write(db);
      return db.farmers[index];
    }
    return null;
  }

  deleteFarmer(id) {
    const db = this.read();
    db.farmers = (db.farmers || []).filter(f => f.id !== id);
    if (db.farmerLogins) db.farmerLogins = db.farmerLogins.filter(l => l.farmerId !== id);
    this.write(db);
    return true;
  }

  deregisterFarmer(id) {
    const db = this.read();
    const farmer = (db.farmers || []).find(f => f.id === id);
    if (farmer) {
      delete farmer.password;
      farmer.registered = false;
      this.write(db);
      return farmer;
    }
    return null;
  }

  // Add debit (نام/ادھار) or credit (جمع/وصولی) transaction
  addTransaction(farmerId, txData) {
    const db = this.read();
    const farmer = db.farmers.find(f => f.id === farmerId);
    if (!farmer) return null;

    const amount = Number(txData.amount);
    if (isNaN(amount) || amount <= 0) return null;

    const type = txData.type === 'credit' ? 'credit' : 'debit';
    // Debit increases what farmer owes (+), Credit decreases what farmer owes (-)
    const newBalance = type === 'debit' 
      ? (farmer.currentBalance + amount)
      : (farmer.currentBalance - amount);

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

    const tx = {
      id: "TX-" + Date.now().toString().slice(-6),
      date: txData.date || new Date().toISOString().split('T')[0],
      type: type, // 'debit' (مال خریدا / نام) or 'credit' (رقم جمع کروائی / جمع)
      category: txData.category || (type === 'debit' ? "ادھار مال و ادویات" : "نقد ادائیگی"),
      productName: productName,
      quantity: quantity,
      unitPrice: unitPrice,
      description: description,
      amount: amount,
      balanceAfter: newBalance,
      addedBy: txData.addedBy || "ایڈمن ہارون",
      proofImage: txData.proofImage || txData.receiptImage || ""
    };

    farmer.currentBalance = newBalance;
    if (!farmer.transactions) farmer.transactions = [];
    farmer.transactions.push(tx);

    this.write(db);
    return { farmer, transaction: tx };
  }

  deleteTransaction(farmerId, txId) {
    const db = this.read();
    const farmer = db.farmers.find(f => f.id === farmerId);
    if (!farmer || !farmer.transactions) return null;

    // Filter out transaction and recalculate balance
    farmer.transactions = farmer.transactions.filter(t => t.id !== txId);
    
    // Recalculate balance
    let running = 0;
    for (const t of farmer.transactions) {
      if (t.type === 'debit') running += t.amount;
      else running -= t.amount;
      t.balanceAfter = running;
    }
    farmer.currentBalance = running;

    this.write(db);
    return farmer;
  }

  updateTransaction(farmerId, txId, updateData) {
    const db = this.read();
    const farmer = db.farmers.find(f => f.id === farmerId);
    if (!farmer || !farmer.transactions) return null;

    const tx = farmer.transactions.find(t => t.id === txId);
    if (!tx) return null;

    if (updateData.date) tx.date = updateData.date;
    if (updateData.type) tx.type = updateData.type === 'credit' ? 'credit' : 'debit';
    if (updateData.category !== undefined) tx.category = updateData.category;
    if (updateData.productName !== undefined) tx.productName = updateData.productName;
    if (updateData.quantity !== undefined) tx.quantity = updateData.quantity;
    if (updateData.unitPrice !== undefined) tx.unitPrice = Number(updateData.unitPrice) || 0;
    if (updateData.description !== undefined) tx.description = updateData.description;
    if (updateData.amount !== undefined) {
      const amt = Number(updateData.amount);
      if (!isNaN(amt) && amt > 0) tx.amount = amt;
    }
    if (updateData.proofImage !== undefined) tx.proofImage = updateData.proofImage;
    tx.updatedAt = new Date().toISOString();

    // Recalculate running balance for all transactions in order
    let running = 0;
    for (const t of farmer.transactions) {
      if (t.type === 'debit') running += t.amount;
      else running -= t.amount;
      t.balanceAfter = running;
    }
    farmer.currentBalance = running;

    this.write(db);
    return { farmer, transaction: tx };
  }

  // --- Get All Recent Transactions Across All Farmers ---
  getAllRecentTransactions(limit = 30) {
    const db = this.read();
    const list = [];
    (db.farmers || []).forEach(f => {
      (f.transactions || []).forEach(t => {
        list.push({
          ...t,
          farmerId: f.id,
          farmerName: f.name,
          farmerMobile: f.mobile || '',
          farmerVillage: f.village || ''
        });
      });
    });
    list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list.slice(0, limit);
  }

  // --- Trade Requests (Crop selling/buying by farmers) ---
  getTradeRequests() {
    const db = this.read();
    return db.tradeRequests || [];
  }

  addTradeRequest(reqData) {
    const db = this.read();
    const newReq = {
      id: "REQ-" + (Date.now() % 100000),
      type: reqData.type || "sell_crop", // sell_crop or buy_seeds
      cropName: reqData.cropName || "گندم",
      farmerName: reqData.farmerName || "",
      mobile: reqData.mobile || "",
      village: reqData.village || "",
      quantity: reqData.quantity || "",
      expectedPrice: reqData.expectedPrice || "",
      notes: reqData.notes || "",
      status: "Pending", // Pending, Approved, Contacted, Completed
      createdAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi', hour12: false })
    };
    if (!db.tradeRequests) db.tradeRequests = [];
    db.tradeRequests.unshift(newReq);
    this.write(db);
    return newReq;
  }

  updateTradeRequestStatus(id, status) {
    const db = this.read();
    const req = db.tradeRequests.find(r => r.id === id);
    if (req) {
      req.status = status;
      this.write(db);
      return req;
    }
    return null;
  }

  deleteTradeRequest(id) {
    const db = this.read();
    db.tradeRequests = (db.tradeRequests || []).filter(r => r.id !== id);
    this.write(db);
    return true;
  }

  // --- Farmer Payables (کسان کو دینے والے پیسے: گندم، چاول، تل، سورج مکھی، سرسوں و دیگر) ---
  getFarmerPayables(farmerId = null, type = null) {
    const db = this.read();
    let list = db.farmerPayables || [];
    if (farmerId) {
      list = list.filter(p => p.farmerId === farmerId);
    }
    if (type) {
      list = list.filter(p => p.type === type);
    }
    return list.map(item => {
      const rem = Number(item.remainingAmount !== undefined ? item.remainingAmount : item.remainingBalance) || 0;
      const w = Number(item.weightMaunds !== undefined ? item.weightMaunds : item.weight) || 0;
      const r = Number(item.ratePerMaund !== undefined ? item.ratePerMaund : item.rate) || 0;
      const rawStatus = (item.status || item.paymentStatus || 'Pending').toLowerCase();
      const capStatus = rawStatus === 'paid' ? 'Paid' : (rawStatus === 'partial' ? 'Partial' : 'Pending');

      return {
        ...item,
        remainingAmount: rem,
        remainingBalance: rem,
        weight: w,
        weightMaunds: w,
        rate: r,
        ratePerMaund: r,
        status: rawStatus,
        paymentStatus: capStatus,
        category: item.category || (item.type === 'other' ? (item.title || 'متفرق واجب الادا') : item.cropName)
      };
    });
  }

  addFarmerPayable(data) {
    const db = this.read();
    if (!db.farmerPayables) db.farmerPayables = [];

    const newId = "PAY-" + (Date.now() % 100000);
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
      const f = (db.farmers || []).find(x => x.id === data.farmerId);
      if (f) {
        if (!fName) fName = f.name;
        if (!fMobile) fMobile = f.mobile;
      }
    }

    const payable = {
      id: newId,
      farmerId: data.farmerId || "",
      farmerName: fName || "کسان",
      farmerMobile: fMobile || "",
      type: data.type === 'other' ? 'other' : 'crop', // crop or other
      cropType: data.cropType || "gandum", // gandum, rice, till, sunflower, sarsoon, other
      cropName: data.cropName || (data.type === 'other' ? (data.title || "متفرق واجب الادا") : "گندم"),
      variety: data.variety || "",
      title: data.title || (data.type === 'other' ? "متفرق واجب الادا" : `${data.cropName || 'فصل'} خریداری`),
      category: data.category || (data.type === 'other' ? (data.title || "متفرق") : data.cropName),
      weight: w,
      weightMaunds: w,
      bagsCount: Number(data.bagsCount) || 0,
      weightUnit: data.weightUnit || "من",
      rate: r,
      ratePerMaund: r,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      remainingBalance: remaining,
      status: status,
      paymentStatus: status === 'paid' ? 'Paid' : (status === 'partial' ? 'Partial' : 'Pending'),
      date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes || "",
      proofImage: data.proofImage || "",
      createdAt: new Date().toISOString()
    };

    db.farmerPayables.unshift(payable);
    this.write(db);
    return payable;
  }

  updateFarmerPayable(id, data) {
    const db = this.read();
    if (!db.farmerPayables) db.farmerPayables = [];
    const item = db.farmerPayables.find(p => p.id === id);
    if (!item) return null;

    if (data.farmerId !== undefined) item.farmerId = data.farmerId;
    if (data.farmerName !== undefined) item.farmerName = data.farmerName;
    if (data.farmerMobile !== undefined) item.farmerMobile = data.farmerMobile;
    if (data.type !== undefined) item.type = data.type;
    if (data.cropType !== undefined) item.cropType = data.cropType;
    if (data.cropName !== undefined) item.cropName = data.cropName;
    if (data.variety !== undefined) item.variety = data.variety;
    if (data.title !== undefined) item.title = data.title;
    if (data.category !== undefined) item.category = data.category;
    if (data.weight !== undefined || data.weightMaunds !== undefined) {
      const w = Number(data.weightMaunds !== undefined ? data.weightMaunds : data.weight) || 0;
      item.weight = w;
      item.weightMaunds = w;
    }
    if (data.bagsCount !== undefined) item.bagsCount = Number(data.bagsCount) || 0;
    if (data.weightUnit !== undefined) item.weightUnit = data.weightUnit;
    if (data.rate !== undefined || data.ratePerMaund !== undefined) {
      const r = Number(data.ratePerMaund !== undefined ? data.ratePerMaund : data.rate) || 0;
      item.rate = r;
      item.ratePerMaund = r;
    }
    if (data.totalAmount !== undefined) item.totalAmount = Number(data.totalAmount) || 0;
    if (data.paidAmount !== undefined) item.paidAmount = Number(data.paidAmount) || 0;
    if (data.date !== undefined) item.date = data.date;
    if (data.notes !== undefined) item.notes = data.notes;
    if (data.proofImage !== undefined) item.proofImage = data.proofImage;

    const remaining = Math.max(0, item.totalAmount - item.paidAmount);
    item.remainingAmount = remaining;
    item.remainingBalance = remaining;

    if (item.remainingAmount === 0 && item.totalAmount > 0) {
      item.status = 'paid';
      item.paymentStatus = 'Paid';
    } else if (item.paidAmount > 0 && item.remainingAmount > 0) {
      item.status = 'partial';
      item.paymentStatus = 'Partial';
    } else {
      item.status = 'pending';
      item.paymentStatus = 'Pending';
    }

    this.write(db);
    return item;
  }

  deleteFarmerPayable(id) {
    const db = this.read();
    if (!db.farmerPayables) return false;
    db.farmerPayables = db.farmerPayables.filter(p => p.id !== id);
    this.write(db);
    return true;
  }

  // --- Statistics for Admin Dashboard ---
  getStats() {
    const db = this.read();
    const farmers = db.farmers || [];
    const products = db.products || [];
    const requests = db.tradeRequests || [];
    
    let totalReceivable = 0; // Balance > 0
    let totalPayable = 0;    // Balance < 0
    farmers.forEach(f => {
      if (f.currentBalance > 0) totalReceivable += f.currentBalance;
      if (f.currentBalance < 0) totalPayable += Math.abs(f.currentBalance);
    });

    const pendingRequests = requests.filter(r => r.status === 'Pending').length;
    const pendingComplaints = (db.complaints || []).filter(c => c.status === 'Pending').length;
    const pendingPassReqs = (db.passwordRequests || []).filter(p => p.status === 'Pending').length;

    const payables = db.farmerPayables || [];
    let cropPayablesRemaining = 0;
    let otherPayablesRemaining = 0;
    let totalPayablesRemaining = 0;
    payables.forEach(p => {
      const rem = Number(p.remainingAmount) || 0;
      totalPayablesRemaining += rem;
      if (p.type === 'crop') cropPayablesRemaining += rem;
      else otherPayablesRemaining += rem;
    });

    return {
      totalFarmers: farmers.length,
      totalReceivable: totalReceivable, // کسانوں سے بقایا وصول طلب رقم
      totalPayable: totalPayable,       // کسانوں کو واجب الادا رقم (کھاتہ)
      totalPayablesRemaining: totalPayablesRemaining, // خریدی گئی فصلیں و دیگر واجب الادا
      cropPayablesRemaining: cropPayablesRemaining,
      otherPayablesRemaining: otherPayablesRemaining,
      totalPayablesCount: payables.length,
      totalProducts: products.length,
      totalRequests: requests.length,
      pendingRequests: pendingRequests,
      pendingComplaints: pendingComplaints,
      pendingPassReqs: pendingPassReqs,
      activeRatesCount: (db.mandiRates || []).length
    };
  }

  // --- Complaints Box ---
  getComplaints() {
    const db = this.read();
    return db.complaints || [];
  }

  addComplaint(data) {
    const db = this.read();
    if (!db.complaints) db.complaints = [];
    const newComplaint = {
      id: "CMP-" + (Date.now() % 100000),
      farmerId: data.farmerId || '',
      farmerName: data.farmerName || 'نامعلوم کسان',
      mobile: data.mobile || '',
      category: data.category || 'عام شکایت',
      message: data.message || '',
      imageUrl: data.imageUrl || '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    db.complaints.unshift(newComplaint);
    this.write(db);
    return newComplaint;
  }

  updateComplaintStatus(id, status) {
    const db = this.read();
    const c = (db.complaints || []).find(x => x.id === id);
    if (c) {
      c.status = status;
      this.write(db);
      return c;
    }
    return null;
  }

  deleteComplaint(id) {
    const db = this.read();
    db.complaints = (db.complaints || []).filter(c => c.id !== id);
    this.write(db);
    return true;
  }

  // --- Password Recovery Requests ---
  getPasswordRequests() {
    const db = this.read();
    return db.passwordRequests || [];
  }

  addPasswordRequest(data) {
    const db = this.read();
    if (!db.passwordRequests) db.passwordRequests = [];
    let farmer = null;
    if (data.identifier) farmer = this.findFarmerByPhoneOrId(data.identifier);

    const newReq = {
      id: "PWR-" + (Date.now() % 100000),
      farmerId: farmer ? farmer.id : (data.farmerId || ''),
      farmerName: farmer ? farmer.name : (data.farmerName || 'کسان بھائی'),
      mobile: data.identifier || data.mobile || '',
      message: data.message || 'پاس ورڈ بھول گئے ہیں، رابطہ کریں۔',
      currentPassword: farmer ? (farmer.password || '') : '',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    db.passwordRequests.unshift(newReq);
    this.write(db);
    return newReq;
  }

  updatePasswordRequestStatus(id, status) {
    const db = this.read();
    const p = (db.passwordRequests || []).find(x => x.id === id);
    if (p) {
      p.status = status;
      this.write(db);
      return p;
    }
    return null;
  }

  // --- 11. In-Store Counter Pickups / Bookings ---
  getBookings() {
    const db = this.read();
    return db.bookings || [];
  }

  addBooking(data) {
    const db = this.read();
    if (!db.bookings) db.bookings = [];
    const newBooking = {
      id: "BK-" + Math.floor(1000 + Math.random() * 9000),
      farmerId: data.farmerId || '',
      farmerName: data.farmerName || 'نامعلوم کسان',
      farmerMobile: data.farmerMobile || '',
      village: data.village || '',
      items: Array.isArray(data.items) ? data.items : [],
      totalAmount: Number(data.totalAmount) || 0,
      pickupDate: data.pickupDate || new Date().toISOString().slice(0, 10),
      pickupTime: data.pickupTime || 'کسی بھی وقت (دکان اوقات)',
      paymentMethod: data.paymentMethod || 'کاؤنٹر پر نقد ادائیگی',
      status: 'Pending', // Pending, Ready for Pickup, Picked Up, Cancelled
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    db.bookings.unshift(newBooking);
    this.write(db);
    return newBooking;
  }

  updateBookingStatus(id, status) {
    const db = this.read();
    const b = (db.bookings || []).find(x => x.id === id);
    if (b) {
      b.status = status;
      if (status === 'Picked Up') {
        b.completedAt = new Date().toISOString();
      }
      this.write(db);
      return b;
    }
    return null;
  }

  deleteBooking(id) {
    const db = this.read();
    db.bookings = (db.bookings || []).filter(x => x.id !== id);
    this.write(db);
    return true;
  }

  // --- 12. Counter Billing & POS Sales ---
  getPosSales() {
    const db = this.read();
    return db.posSales || [];
  }

  addPosSale(data) {
    const db = this.read();
    if (!db.posSales) db.posSales = [];
    const invoiceNum = "INV-" + (Date.now() % 1000000);
    const sale = {
      id: "SALE-" + Math.floor(1000 + Math.random() * 9000),
      invoiceNumber: invoiceNum,
      date: data.date || new Date().toISOString().slice(0, 10),
      time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      customerType: data.customerType || 'cash', // 'cash' or 'khata'
      farmerId: data.farmerId || '',
      farmerName: data.farmerName || 'واک اِن گاہک (نقد)',
      farmerMobile: data.farmerMobile || '',
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal) || 0,
      discount: Number(data.discount) || 0,
      netTotal: Number(data.netTotal) || 0,
      paidAmount: Number(data.paidAmount) || 0,
      paymentType: data.paymentType || 'نقد کیش (Cash)',
      billerName: data.billerName || 'ایڈمن میاں ہارون رشید',
      createdAt: new Date().toISOString()
    };

    // Deduct stock from products
    if (db.products && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (item.productId) {
          const prod = db.products.find(p => p.id === item.productId);
          if (prod && typeof prod.stock === 'number') {
            prod.stock = Math.max(0, prod.stock - (Number(item.quantity) || 1));
          }
        }
      }
    }

    // If Khata customer and has remaining balance, debit farmer khata
    if (sale.customerType === 'khata' && sale.farmerId) {
      const remainingKhata = Math.max(0, sale.netTotal - sale.paidAmount);
      if (remainingKhata > 0) {
        this.addTransaction(sale.farmerId, {
          type: 'debit',
          category: 'کاؤنٹر بلنگ',
          productName: `کاؤنٹر سیل بل #${invoiceNum}`,
          quantity: `${sale.items.length} آئٹمز`,
          unitPrice: remainingKhata,
          amount: remainingKhata,
          description: `کاؤنٹر بلنگ #${invoiceNum} (کل بل: Rs. ${sale.netTotal}, نقد ادا: Rs. ${sale.paidAmount}, کھاتہ ڈیبٹ: Rs. ${remainingKhata})`,
          addedBy: sale.billerName
        });
      }
    }

    db.posSales.unshift(sale);
    this.write(db);
    return sale;
  }

  // --- 13. Suppliers & Company Purchases ---
  getSuppliers() {
    const db = this.read();
    if (!db.suppliers || db.suppliers.length === 0) {
      db.suppliers = [
        { id: "SUP-1", name: "Engro Fertilizers Ltd", contact: "طارق محمود", phone: "0300-1122334", city: "ڈہرکی / ملتان", balance: 0 },
        { id: "SUP-2", name: "FMC United Agro", contact: "عمران خان", phone: "0301-5544332", city: "لاہور / ملتان", balance: 0 },
        { id: "SUP-3", name: "Bayer Crop Science Pakistan", contact: "احمد بلال", phone: "0321-9988776", city: "کراچی / رحیم یار خان", balance: 0 },
        { id: "SUP-4", name: "Syngenta Pakistan", contact: "رضوان الحق", phone: "0302-3322110", city: "ملتان", balance: 0 },
        { id: "SUP-5", name: "Fatima Fertilizer (Sarsabz)", contact: "شاہد علی", phone: "0300-7766554", city: "صادق آباد", balance: 0 },
        { id: "SUP-6", name: "Four Brothers Agri (4B)", contact: "نعمان اشرف", phone: "0305-4433221", city: "لاہور", balance: 0 }
      ];
      this.write(db);
    }
    return db.suppliers;
  }

  addSupplier(data) {
    const db = this.read();
    if (!db.suppliers) db.suppliers = [];
    const sup = {
      id: "SUP-" + (db.suppliers.length + 1),
      name: data.name || 'نئی کمپنی',
      contact: data.contact || '',
      phone: data.phone || '',
      city: data.city || '',
      balance: Number(data.balance) || 0
    };
    db.suppliers.push(sup);
    this.write(db);
    return sup;
  }

  getSupplierPurchases() {
    const db = this.read();
    return db.supplierPurchases || [];
  }

  addSupplierPurchase(data) {
    const db = this.read();
    if (!db.supplierPurchases) db.supplierPurchases = [];
    const pur = {
      id: "PUR-" + (Date.now() % 100000),
      supplierId: data.supplierId || '',
      supplierName: data.supplierName || 'کمپنی',
      invoiceNumber: data.invoiceNumber || 'INV-' + (Date.now() % 10000),
      date: data.date || new Date().toISOString().slice(0, 10),
      items: Array.isArray(data.items) ? data.items : [],
      totalAmount: Number(data.totalAmount) || 0,
      paidAmount: Number(data.paidAmount) || 0,
      remainingBalance: Math.max(0, (Number(data.totalAmount) || 0) - (Number(data.paidAmount) || 0)),
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    db.supplierPurchases.unshift(pur);

    // Update supplier balance
    if (db.suppliers) {
      const s = db.suppliers.find(x => x.id === pur.supplierId || x.name === pur.supplierName);
      if (s) {
        s.balance = (Number(s.balance) || 0) + pur.remainingBalance;
      }
    }
    this.write(db);
    return pur;
  }

  // --- 14. Daily Sales & Profit Reports ---
  getDailyReport(targetDate) {
    const db = this.read();
    const dateStr = targetDate || new Date().toISOString().slice(0, 10);
    const sales = (db.posSales || []).filter(s => s.date === dateStr);

    let totalSales = 0;
    let cashSales = 0;
    let khataSales = 0;
    let totalDiscount = 0;
    let estimatedCost = 0;

    for (const sale of sales) {
      totalSales += Number(sale.netTotal) || 0;
      totalDiscount += Number(sale.discount) || 0;
      cashSales += Number(sale.paidAmount) || 0;
      const khataPart = Math.max(0, (Number(sale.netTotal) || 0) - (Number(sale.paidAmount) || 0));
      khataSales += khataPart;

      // Estimate gross profit based on products purchase price
      if (Array.isArray(sale.items)) {
        for (const it of sale.items) {
          const qty = Number(it.quantity) || 1;
          const prod = (db.products || []).find(p => p.id === it.productId);
          const cost = prod ? (Number(prod.purchasePrice) || Number(prod.price) * 0.88) : (Number(it.unitPrice) * 0.88);
          estimatedCost += cost * qty;
        }
      }
    }

    const grossProfit = Math.max(0, totalSales - estimatedCost);

    return {
      date: dateStr,
      totalBills: sales.length,
      totalSales,
      cashSales,
      khataSales,
      totalDiscount,
      estimatedCost: Math.round(estimatedCost),
      grossProfit: Math.round(grossProfit),
      drawerCash: cashSales,
      recentBills: sales.slice(0, 20)
    };
  }
}

module.exports = new Database();
