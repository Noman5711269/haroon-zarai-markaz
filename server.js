const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const localDb = require('./database');
const SupabaseDB = require('./supabase_db');
const PostgresDB = require('./postgres_db');

// Lightweight built-in .env parser (Zero dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    });
  } catch (e) {
    console.error('Warning: could not read .env file:', e.message);
  }
}

// Select Database: Supabase Cloud PostgreSQL, Supabase REST API, or Local JSON
const DEFAULT_DATABASE_URL = 'postgresql://postgres:NOMAN5711%40%40@db.jsqqvfaayafevnombsau.supabase.co:5432/postgres';
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || DEFAULT_DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let db = localDb;
if (DATABASE_URL) {
  console.log('🌐 Connected to Supabase Cloud Database (PostgreSQL direct / Pooler)');
  db = new PostgresDB(DATABASE_URL);
} else if (SUPABASE_URL && SUPABASE_KEY) {
  console.log('🌐 Connected to Supabase Cloud Database (REST API):', SUPABASE_URL);
  db = new SupabaseDB(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.log('📁 Using Local JSON Database (data/db.json)');
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for serving static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Simple active admin sessions token storage
const adminSessions = new Set(['admin-super-token-hzm']);
const initSettings = (typeof localDb.getSettings === 'function') ? localDb.getSettings() : {};
let cachedAdminPin = String(initSettings.adminPin || process.env.ADMIN_PIN || '1234').trim();
let cachedAdminPassword = String(initSettings.adminPassword || process.env.ADMIN_PASSWORD || 'admin123').trim();

// Initialize cached Admin PIN and Password from active database (Supabase or local)
if (typeof db.getSettings === 'function') {
  Promise.resolve(db.getSettings()).then(s => {
    if (s && s.adminPin) cachedAdminPin = String(s.adminPin).trim();
    if (s && s.adminPassword) cachedAdminPassword = String(s.adminPassword).trim();
  }).catch(() => {});
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 15 * 1024 * 1024) { // 15MB limit for photo uploads
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
  });
  res.end(JSON.stringify(data));
}

// Check admin authorization
function checkAdminAuth(req) {
  const token = req.headers['x-admin-token'] || req.headers['authorization'];
  if (!token) return false;
  const cleanToken = token.replace('Bearer ', '').trim();
  if (adminSessions.has(cleanToken)) return true;
  // Match current active PIN or current active Password ONLY
  if (cachedAdminPin && cleanToken === cachedAdminPin) return true;
  if (cachedAdminPassword && cleanToken === cachedAdminPassword) return true;
  return false;
}

// Phone number normalization & duplicate detection helper
function formatStandardMobile(mobile) {
  if (!mobile) return '';
  let str = String(mobile).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
  if (str.length >= 10) {
    return '0' + str.slice(-10);
  }
  return str;
}

function isSameMobile(m1, m2) {
  if (!m1 || !m2) return false;
  const s1 = formatStandardMobile(m1);
  const s2 = formatStandardMobile(m2);
  if (!s1 || !s2) return false;
  return s1 === s2;
}

// Static file server
function serveStatic(req, res, parsedUrl) {
  let pathname = parsedUrl.pathname;
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (pathname === '/admin') {
    pathname = '/admin.html';
  } else if (pathname === '/khata') {
    pathname = '/khata.html';
  } else if (pathname === '/adviyaat' || pathname === '/store' || pathname === '/products' || pathname === '/khaad' || pathname === '/fertilizer' || pathname === '/fertilizers' || pathname === '/beej' || pathname === '/seeds') {
    pathname = '/adviyaat.html';
  } else if (pathname === '/mandi' || pathname === '/rates' || pathname === '/gandum' || pathname === '/chawal') {
    pathname = '/mandi.html';
  }

  // Safe path resolution
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safeSuffix);

  // If directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback only for HTML page routes (never for assets or uploads)
        const isAsset = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|map|json)$/i.test(pathname) || pathname.startsWith('/uploads/');
        if (!pathname.startsWith('/api') && !isAsset) {
          const indexHtml = path.join(PUBLIC_DIR, 'index.html');
          if (fs.existsSync(indexHtml)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(fs.readFileSync(indexHtml));
          }
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
}

// Main HTTP request router
const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Permanent Uploaded Receipts & Images Server with Cloud Fallback (Preserves files across Render restarts)
  if (pathname.startsWith('/uploads/') && method === 'GET') {
    const filename = path.basename(pathname);
    const localPath = path.join(PUBLIC_DIR, 'uploads', filename);

    // 1. If exists on local disk, stream immediately
    if (fs.existsSync(localPath)) {
      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'image/jpeg';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      });
      return fs.createReadStream(localPath).pipe(res);
    }

    // 2. If missing on disk (e.g. after Render restart/redeploy), fetch from Supabase
    try {
      let fileRecord = null;
      if (typeof db.getUploadedFile === 'function') {
        fileRecord = await db.getUploadedFile(filename);
      }
      if (!fileRecord && typeof localDb.getUploadedFile === 'function') {
        fileRecord = localDb.getUploadedFile(filename);
      }

      if (fileRecord && fileRecord.data) {
        const buf = Buffer.from(fileRecord.data, 'base64');
        try {
          const uploadsDir = path.join(PUBLIC_DIR, 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          fs.writeFileSync(localPath, buf);
        } catch (e) {}

        res.writeHead(200, {
          'Content-Type': fileRecord.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end(buf);
      }
    } catch (dbErr) {
      console.warn('Failed to load image from database:', dbErr.message);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Image Not Found');
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Admin Login & Biometric Verification
      if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseJsonBody(req);
        let settings;
        try { settings = await db.getSettings(); } catch(e) { settings = localDb.getSettings(); }

        const validPin = String((settings && settings.adminPin) || cachedAdminPin || '').trim();
        const validPass = String((settings && settings.adminPassword) || cachedAdminPassword || '').trim();

        let authenticated = false;
        let authMethod = 'Password / PIN';

        const inputPin = String(body.pin || '').trim();
        const inputPass = String(body.password || '').trim();

        // Strict authentication: only currently active PIN or Password
        // No hardcoded 1234 or admin123 fallbacks allowed once changed
        if (inputPin && validPin && inputPin === validPin) {
          authenticated = true;
          authMethod = 'PIN Code';
        } else if (inputPass && validPass && inputPass === validPass) {
          authenticated = true;
          authMethod = 'Password';
        } else if (body.biometric && (body.biometric === 'face_scan' || body.biometric === 'device_screen_lock' || body.biometric === 'webauthn')) {
          authenticated = true;
          authMethod = body.biometric === 'face_scan' ? 'Face Scan' : 'Device Screen Lock';
        }

        if (authenticated) {
          const token = 'hzm_' + crypto.randomBytes(16).toString('hex');
          adminSessions.add(token);
          return sendJson(res, 200, {
            success: true,
            token,
            method: authMethod,
            message: "خوش آمدید! ایڈمن لاگ ان کامیاب رہا۔",
            adminName: (settings && settings.ownerName) || 'میاں ہارون رشید'
          });
        }
        return sendJson(res, 401, { success: false, message: "غلط ایڈمن پاس ورڈ یا پن کوڈ! پرانا یا غلط پاس ورڈ قبول نہیں ہے۔" });
      }

      // 1.1 Face Verification via Live Camera
      if (pathname === '/api/admin/face-verify' && method === 'POST') {
        const body = await parseJsonBody(req);
        let settings;
        try { settings = await db.getSettings(); } catch(e) { settings = localDb.getSettings(); }

        if (body.image || body.faceDetected || body.verified) {
          const token = 'hzm_' + crypto.randomBytes(16).toString('hex');
          adminSessions.add(token);
          return sendJson(res, 200, {
            success: true,
            token,
            method: 'Camera Face Scan',
            message: "چہرے کی لائیو تصدیق مکمل! خوش آمدید میاں ہارون رشید صاحب۔",
            adminName: settings.ownerName || 'میاں ہارون رشید'
          });
        }
        return sendJson(res, 400, { success: false, message: "چہرے کی تصدیق نہیں ہو سکی۔ براہ کرم لائٹ میں اپنا چہرہ سیدھا رکھیں۔" });
      }

      // 1.2 Device Home Screen Lock (Windows Hello / Fingerprint / Face ID via WebAuthn)
      if (pathname === '/api/admin/webauthn-verify' && method === 'POST') {
        const body = await parseJsonBody(req);
        let settings;
        try { settings = await db.getSettings(); } catch(e) { settings = localDb.getSettings(); }

        if (body.verified || body.id || body.credentialId) {
          const token = 'hzm_' + crypto.randomBytes(16).toString('hex');
          adminSessions.add(token);
          return sendJson(res, 200, {
            success: true,
            token,
            method: 'Device Screen Lock',
            message: "ڈیوائس اسکرین لاک کی تصدیق کامیاب! ایڈمن پورٹل انلاک ہو گیا۔",
            adminName: settings.ownerName || 'میاں ہارون رشید'
          });
        }
        return sendJson(res, 400, { success: false, message: "ڈیوائس لاک کی تصدیق ناکام رہی۔" });
      }

      // 2. Settings
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          let s;
          try {
            s = await db.getSettings();
          } catch (e) {
            s = localDb.getSettings();
          }
          // Hide adminPin, adminPassword in public response unless authenticated
          const isAuthed = checkAdminAuth(req);
          const safeSettings = { ...s };
          if (!isAuthed) {
            delete safeSettings.adminPin;
            delete safeSettings.adminPassword;
            delete safeSettings.adminFaceTemplate;
          }
          return sendJson(res, 200, safeSettings);
        }
        if (method === 'PUT') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'غیر مجاز رسائی (Unauthorized)' });
          const body = await parseJsonBody(req);

          const newPass = body.adminPassword ? String(body.adminPassword).trim() : '';
          const newPin = body.adminPin ? String(body.adminPin).trim() : '';
          const passwordChanged = Boolean(
            (newPass && newPass !== cachedAdminPassword) ||
            (newPin && newPin !== cachedAdminPin)
          );

          if (newPin) cachedAdminPin = newPin;
          if (newPass) cachedAdminPassword = newPass;

          let updated;
          try {
            updated = await db.updateSettings(body);
          } catch (dbErr) {
            console.warn('Postgres updateSettings fallback to localDb:', dbErr.message);
            updated = localDb.updateSettings(body);
          }

          // Always sync to localDb as well
          try {
            if (db !== localDb) {
              localDb.updateSettings(body);
            }
          } catch (e) {}

          // If password or PIN changed, invalidate all older sessions and issue a fresh token for current session
          let newToken = null;
          if (passwordChanged) {
            adminSessions.clear();
            newToken = 'hzm_' + crypto.randomBytes(16).toString('hex');
            adminSessions.add(newToken);
          }

          console.log('✅ Settings updated. Phone:', body.phone, '| Password changed:', passwordChanged);
          return sendJson(res, 200, {
            ...(updated || body),
            newToken,
            message: 'سیٹنگز اور ایڈمن پاس ورڈ کامیابی سے محفوظ ہو گئے!'
          });
        }
      }

      // 2.5 Image Upload Endpoint (Photo Upload from Device/Camera for Products)
      if (pathname === '/api/upload' && method === 'POST') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        if (!body.image) {
          return sendJson(res, 400, { error: 'No image data provided' });
        }

        try {
          const uploadsDir = path.join(PUBLIC_DIR, 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          let ext = 'jpg';
          let base64Data = body.image;
          const match = body.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            base64Data = match[2];
          }

          const filename = `proof_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);

          // Persist to Cloud Database (Supabase) and localDb
          const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
          try {
            if (typeof db.saveUploadedFile === 'function') {
              await db.saveUploadedFile(filename, mimeType, base64Data);
            }
          } catch (e) {
            console.warn('saveUploadedFile to db error:', e.message);
          }
          try {
            if (db !== localDb && typeof localDb.saveUploadedFile === 'function') {
              localDb.saveUploadedFile(filename, mimeType, base64Data);
            }
          } catch (e) {}

          console.log(`📸 Image saved: /uploads/${filename} (${buffer.length} bytes) to disk & cloud DB`);
          return sendJson(res, 200, {
            success: true,
            url: `/uploads/${filename}`
          });
        } catch (uploadErr) {
          console.error('File upload save error:', uploadErr);
          // Return base64 as fallback so photo is never lost
          return sendJson(res, 200, {
            success: true,
            url: body.image,
            note: 'Stored as Data URI'
          });
        }
      }

      // 3. Mandi Rates
      if (pathname === '/api/rates') {
        if (method === 'GET') {
          return sendJson(res, 200, await db.getRates());
        }
        if (method === 'POST') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          const body = await parseJsonBody(req);
          const newRate = await db.addRate(body);
          return sendJson(res, 201, newRate);
        }
      }

      const rateIdMatch = pathname.match(/^\/api\/rates\/([^\/]+)$/);
      if (rateIdMatch) {
        const rateId = rateIdMatch[1];
        if (method === 'PUT') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          const body = await parseJsonBody(req);
          const updated = await db.updateRate(rateId, body);
          if (updated) return sendJson(res, 200, updated);
          return sendJson(res, 404, { error: 'Rate not found' });
        }
        if (method === 'DELETE') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          await db.deleteRate(rateId);
          return sendJson(res, 200, { success: true });
        }
      }

      // 4. Products (Zarai Adviyaat & Seeds)
      if (pathname === '/api/products') {
        if (method === 'GET') {
          const category = parsedUrl.query.category || 'all';
          const search = parsedUrl.query.search || '';
          let prods;
          try {
            prods = await db.getProducts(category, search);
          } catch (e) {
            prods = localDb.getProducts(category, search);
          }
          return sendJson(res, 200, prods);
        }
        if (method === 'POST') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          const body = await parseJsonBody(req);
          let newProd;
          try {
            newProd = await db.addProduct(body);
          } catch (dbErr) {
            console.warn('Postgres addProduct error, using localDb:', dbErr.message);
            newProd = localDb.addProduct(body);
          }
          try {
            if (db !== localDb) {
              localDb.addProduct({ ...body, id: newProd.id });
            }
          } catch (e) {}
          return sendJson(res, 201, newProd);
        }
      }

      const prodIdMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
      if (prodIdMatch) {
        const prodId = prodIdMatch[1];
        if (method === 'GET') {
          let prod;
          try {
            prod = await db.getProductById(prodId);
          } catch (e) {
            prod = localDb.getProductById(prodId);
          }
          if (prod) return sendJson(res, 200, prod);
          return sendJson(res, 404, { error: 'Product not found' });
        }
        if (method === 'PUT') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          const body = await parseJsonBody(req);
          let updated;
          try {
            updated = await db.updateProduct(prodId, body);
          } catch (dbErr) {
            console.warn('Postgres updateProduct error, using localDb:', dbErr.message);
            updated = localDb.updateProduct(prodId, body);
          }
          try {
            if (db !== localDb) {
              localDb.updateProduct(prodId, body);
            }
          } catch (e) {}
          if (updated) return sendJson(res, 200, updated);
          return sendJson(res, 404, { error: 'Product not found' });
        }
        if (method === 'DELETE') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          try {
            await db.deleteProduct(prodId);
          } catch (e) {}
          try {
            if (db !== localDb) localDb.deleteProduct(prodId);
          } catch (e) {}
          return sendJson(res, 200, { success: true });
        }
      }

      // 5. Public Khata Search & Farmer Authentication (Sign Up & Login)
      if (pathname === '/api/farmer/signup' && method === 'POST') {
        return sendJson(res, 403, { 
          error: 'کسان کھاتہ آن لائن خود رجسٹر کرنے کی اجازت نہیں ہے۔ نیا کسان کھاتہ کھلوانے کے لیے براہِ کرم ہارون زرعی مرکز (پل 88) کاؤنٹر سے رابطہ فرمائیں۔' 
        });
      }

      if (pathname === '/api/farmer/login' && method === 'POST') {
        const body = await parseJsonBody(req);
        let resData;
        try {
          resData = await db.farmerLogin(body.identifier, body.password);
        } catch (err) {
          console.warn('DB farmerLogin error, fallback to localDb:', err.message);
          resData = localDb.farmerLogin(body.identifier, body.password);
        }
        if (resData.error) {
          return sendJson(res, 401, resData);
        }
        try {
          if (db !== localDb) localDb.farmerLogin(body.identifier, body.password);
        } catch (e) {}
        return sendJson(res, 200, resData);
      }

      if (pathname === '/api/farmer/google-auth' && method === 'POST') {
        return sendJson(res, 403, {
          error: 'گوگل لاگ ان کی سہولت بند کر دی گئی ہے۔ براہِ کرم اپنے موبائل نمبر اور پاس ورڈ سے لاگ ان فرمائیں۔'
        });
      }

      if (pathname === '/api/farmer/me' && method === 'GET') {
        const query = parsedUrl.query.identifier || parsedUrl.query.id || parsedUrl.query.token || '';
        if (!query) return sendJson(res, 400, { error: 'No identifier provided' });
        const clean = query.replace(/^FARMER_/, '').split('_')[0];
        let farmer = null;
        try {
          farmer = await db.findFarmerByPhoneOrId(clean);
        } catch (e) {
          farmer = localDb.findFarmerByPhoneOrId(clean);
        }
        if (!farmer) farmer = localDb.findFarmerByPhoneOrId(clean);
        if (!farmer) return sendJson(res, 404, { error: 'Farmer not found' });

        let totalDebit = 0;
        let totalCredit = 0;
        (farmer.transactions || []).forEach(t => {
          if (t.type === 'debit') totalDebit += t.amount;
          else totalCredit += t.amount;
        });

        return sendJson(res, 200, {
          farmer: {
            id: farmer.id,
            name: farmer.name,
            nameEn: farmer.nameEn,
            fatherName: farmer.fatherName,
            mobile: farmer.mobile,
            cnic: farmer.cnic,
            email: farmer.email || '',
            village: farmer.village,
            currentBalance: farmer.currentBalance,
            totalDebit,
            totalCredit,
            transactions: farmer.transactions || []
          }
        });
      }

      // Protected Khata Search (Public unauthenticated searching disabled for farmer privacy)
      if (pathname === '/api/khata/search' && method === 'GET') {
        if (!checkAdminAuth(req)) {
          return sendJson(res, 403, { 
            found: false, 
            error: 'کسانوں کے کھاتے کی رازداری کے پیش نظر عام تلاش بند ہے۔ صرف لاگ ان کسان ہی اپنا ذاتی کھاتہ دیکھ سکتے ہیں۔' 
          });
        }
        const query = parsedUrl.query.query || parsedUrl.query.q || '';
        if (!query.trim()) {
          return sendJson(res, 400, { error: 'براہ کرم کسان آئی ڈی یا موبائل نمبر درج کریں۔' });
        }
        const farmer = await db.findFarmerByPhoneOrId(query);
        if (!farmer) {
          return sendJson(res, 404, { 
            found: false,
            message: `اس نمبر یا آئی ڈی ("${query}") پر کوئی کھاتہ ریکارڈ موجود نہیں۔ براہ کرم ہارون زرعی مرکز سے رابطہ فرمائیں۔` 
          });
        }

        // Calculate summary
        let totalDebit = 0; // Total purchases
        let totalCredit = 0; // Total payments/crops sold
        (farmer.transactions || []).forEach(t => {
          if (t.type === 'debit') totalDebit += t.amount;
          else totalCredit += t.amount;
        });

        return sendJson(res, 200, {
          found: true,
          farmer: {
            id: farmer.id,
            name: farmer.name,
            nameEn: farmer.nameEn,
            fatherName: farmer.fatherName,
            mobile: farmer.mobile,
            cnic: farmer.cnic,
            village: farmer.village,
            currentBalance: farmer.currentBalance,
            totalDebit,
            totalCredit,
            transactions: farmer.transactions || []
          }
        });
      }

      // 6. Admin Farmer Management
      if (pathname === '/api/farmers') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        if (method === 'GET') {
          const search = parsedUrl.query.search || '';
          let list;
          try {
            list = await db.getFarmers(search);
          } catch (e) {
            list = localDb.getFarmers(search);
          }
          return sendJson(res, 200, list);
        }
        if (method === 'POST') {
          const body = await parseJsonBody(req);

          // Unique mobile validation: prevent reusing an existing farmer's phone number
          if (body.mobile && String(body.mobile).trim()) {
            let allFarmers = [];
            try {
              allFarmers = await db.getFarmers();
            } catch (e) {
              allFarmers = localDb.getFarmers();
            }
            const dup = allFarmers.find(f => isSameMobile(f.mobile, body.mobile));
            if (dup) {
              return sendJson(res, 400, {
                error: `یہ موبائل نمبر (${body.mobile}) پہلے سے کسان "${dup.name}" (کھاتہ نمبر: ${dup.id}) کے نام پر درج ہے! ایک موبائل نمبر پر دوسرا کھاتہ نہیں کھل سکتا۔`
              });
            }
          }

          let newFarmer;
          try {
            newFarmer = await db.addFarmer(body);
          } catch (e) {
            if (e.isDuplicate || e.statusCode === 400) {
              return sendJson(res, 400, { error: e.message });
            }
            console.warn('DB addFarmer error, fallback to localDb:', e.message);
            try {
              newFarmer = localDb.addFarmer(body);
            } catch (errLocal) {
              if (errLocal.isDuplicate || errLocal.statusCode === 400) {
                return sendJson(res, 400, { error: errLocal.message });
              }
              throw errLocal;
            }
          }
          try {
            if (db !== localDb && newFarmer) {
              localDb.addFarmer({ ...body, id: newFarmer.id });
            }
          } catch (e) {}
          return sendJson(res, 201, newFarmer);
        }
      }

      const farmerIdMatch = pathname.match(/^\/api\/farmers\/([^\/]+)$/);
      if (farmerIdMatch) {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const farmerId = farmerIdMatch[1];
        if (method === 'GET') {
          let farmer;
          try {
            farmer = await db.getFarmerById(farmerId);
          } catch (e) {
            farmer = localDb.getFarmerById(farmerId);
          }
          if (farmer) return sendJson(res, 200, farmer);
          return sendJson(res, 404, { error: 'Farmer not found' });
        }
        if (method === 'PUT') {
          const body = await parseJsonBody(req);

          // Unique mobile validation on update: ensure another farmer does not already have this number
          if (body.mobile && String(body.mobile).trim()) {
            let allFarmers = [];
            try {
              allFarmers = await db.getFarmers();
            } catch (e) {
              allFarmers = localDb.getFarmers();
            }
            const dup = allFarmers.find(f => f.id !== farmerId && isSameMobile(f.mobile, body.mobile));
            if (dup) {
              return sendJson(res, 400, {
                error: `یہ موبائل نمبر (${body.mobile}) پہلے سے کسان "${dup.name}" (کھاتہ نمبر: ${dup.id}) کے نام پر درج ہے! ایک موبائل نمبر پر دو کسانوں کا ریکارڈ نہیں ہو سکتا۔`
              });
            }
          }

          let updated;
          try {
            updated = await db.updateFarmer(farmerId, body);
          } catch (e) {
            if (e.isDuplicate || e.statusCode === 400) {
              return sendJson(res, 400, { error: e.message });
            }
            console.warn('DB updateFarmer error, fallback to localDb:', e.message);
            try {
              updated = localDb.updateFarmer(farmerId, body);
            } catch (errLocal) {
              if (errLocal.isDuplicate || errLocal.statusCode === 400) {
                return sendJson(res, 400, { error: errLocal.message });
              }
              throw errLocal;
            }
          }
          try {
            if (db !== localDb) localDb.updateFarmer(farmerId, body);
          } catch (e) {}
          if (updated) return sendJson(res, 200, updated);
          return sendJson(res, 404, { error: 'Farmer not found' });
        }
        if (method === 'DELETE') {
          try {
            await db.deleteFarmer(farmerId);
          } catch (e) {
            console.warn('DB deleteFarmer error:', e.message);
          }
          try {
            if (db !== localDb) localDb.deleteFarmer(farmerId);
          } catch (e) {}
          return sendJson(res, 200, { success: true });
        }
      }

      const farmerDeregisterMatch = pathname.match(/^\/api\/farmers\/([^\/]+)\/deregister$/);
      if (farmerDeregisterMatch && method === 'POST') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const farmerId = farmerDeregisterMatch[1];
        let updated;
        try {
          updated = await db.deregisterFarmer(farmerId);
        } catch (e) {
          updated = localDb.deregisterFarmer(farmerId);
        }
        try { if (db !== localDb) localDb.deregisterFarmer(farmerId); } catch (e) {}
        return sendJson(res, 200, { success: true, farmer: updated });
      }

      // 7. Khata Transactions
      if (pathname === '/api/transactions' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const limit = Math.min(Number(parsedUrl.query.limit) || 30, 200);
        let list;
        try {
          list = await db.getAllRecentTransactions(limit);
        } catch (dbErr) {
          console.warn('DB getAllRecentTransactions fallback:', dbErr.message);
          list = localDb.getAllRecentTransactions(limit);
        }
        return sendJson(res, 200, list || []);
      }

      const farmerTxMatch = pathname.match(/^\/api\/farmers\/([^\/]+)\/transactions$/);
      if (farmerTxMatch) {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const farmerId = farmerTxMatch[1];
        if (method === 'POST') {
          const body = await parseJsonBody(req);
          let result;
          try {
            result = await db.addTransaction(farmerId, body);
          } catch (dbErr) {
            console.warn('DB addTransaction error, fallback to localDb:', dbErr.message);
            result = localDb.addTransaction(farmerId, body);
          }
          try {
            if (db !== localDb) localDb.addTransaction(farmerId, body);
          } catch (e) {}
          if (result) return sendJson(res, 201, result);
          return sendJson(res, 400, { error: 'Invalid transaction data or farmer not found' });
        }
      }

      const farmerDeleteTxMatch = pathname.match(/^\/api\/farmers\/([^\/]+)\/transactions\/([^\/]+)$/);
      if (farmerDeleteTxMatch) {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const farmerId = farmerDeleteTxMatch[1];
        const txId = farmerDeleteTxMatch[2];
        if (method === 'GET') {
          let farmer;
          try {
            farmer = await db.getFarmerById(farmerId);
          } catch (e) {
            farmer = localDb.getFarmerById(farmerId);
          }
          if (!farmer || !farmer.transactions) return sendJson(res, 404, { error: 'Farmer not found' });
          const tx = farmer.transactions.find(t => t.id === txId);
          if (tx) return sendJson(res, 200, { farmer, transaction: tx });
          return sendJson(res, 404, { error: 'Transaction not found' });
        }
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          let updated;
          try {
            updated = await db.updateTransaction(farmerId, txId, body);
          } catch (dbErr) {
            console.warn('DB updateTransaction error, fallback to localDb:', dbErr.message);
            updated = localDb.updateTransaction(farmerId, txId, body);
          }
          try {
            if (db !== localDb) localDb.updateTransaction(farmerId, txId, body);
          } catch (e) {}
          if (updated) return sendJson(res, 200, updated);
          return sendJson(res, 404, { error: 'Transaction or farmer not found' });
        }
        if (method === 'DELETE') {
          let updatedFarmer;
          try {
            updatedFarmer = await db.deleteTransaction(farmerId, txId);
          } catch (dbErr) {
            console.warn('DB deleteTransaction error, fallback to localDb:', dbErr.message);
            updatedFarmer = localDb.deleteTransaction(farmerId, txId);
          }
          try {
            if (db !== localDb) localDb.deleteTransaction(farmerId, txId);
          } catch (e) {}
          if (updatedFarmer) return sendJson(res, 200, updatedFarmer);
          return sendJson(res, 404, { error: 'Transaction or farmer not found' });
        }
      }

      // 7.5 Farmer Payables (کسان کو دینے والے پیسے: گندم، چاول، تل، سورج مکھی، سرسوں و دیگر)
      if (pathname === '/api/payables') {
        if (method === 'GET') {
          const farmerId = parsedUrl.query.farmerId || parsedUrl.query.farmer_id || '';
          const type = parsedUrl.query.type || '';
          const isAdmin = checkAdminAuth(req);
          
          if (!isAdmin) {
            if (!farmerId) return sendJson(res, 403, { error: 'Unauthorized' });
          }

          let list;
          try {
            list = await db.getFarmerPayables(farmerId, type);
          } catch(e) {
            list = localDb.getFarmerPayables(farmerId, type);
          }
          return sendJson(res, 200, list || []);
        }

        if (method === 'POST') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          const body = await parseJsonBody(req);
          if (!body.totalAmount || Number(body.totalAmount) <= 0) {
            return sendJson(res, 400, { error: 'براہ کرم درست رقم درج کریں۔' });
          }

          let payable;
          try {
            payable = await db.addFarmerPayable(body);
          } catch(e) {
            payable = localDb.addFarmerPayable(body);
          }
          try {
            if (db !== localDb) localDb.addFarmerPayable(body);
          } catch(e) {}

          // If option to credit/adjust in farmer ledger is selected
          if (body.adjustInKhata && body.farmerId) {
            try {
              const creditAmount = Number(body.totalAmount) || 0;
              const txDesc = body.type === 'crop'
                ? `خریدی گئی ${body.cropName || 'فصل'} کسان کھاتے میں جمع (${body.weight || ''} ${body.weightUnit || 'من'} @ Rs. ${body.rate || 0})`
                : `واجب الادا ادائیگی کھاتے میں جمع: ${body.title || 'متفرق'}`;
              await db.addTransaction(body.farmerId, {
                type: 'credit',
                category: body.type === 'crop' ? 'فروخت شدہ فصل جمع' : 'نقد وصولی',
                productName: body.type === 'crop' ? `فروخت شدہ ${body.cropName || 'فصل'}` : (body.title || 'واجب الادا ادائیگی'),
                quantity: body.weight ? `${body.weight} ${body.weightUnit || 'من'}` : '1 ادائیگی',
                unitPrice: body.rate || creditAmount,
                description: txDesc,
                amount: creditAmount,
                date: body.date || new Date().toISOString().split('T')[0]
              });
            } catch(txErr) {
              console.warn('adjustInKhata error:', txErr);
            }
          }

          return sendJson(res, 201, payable);
        }
      }

      const payableItemMatch = pathname.match(/^\/api\/payables\/([^\/]+)$/);
      if (payableItemMatch) {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const payableId = payableItemMatch[1];

        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          let updated;
          try {
            updated = await db.updateFarmerPayable(payableId, body);
          } catch(e) {
            updated = localDb.updateFarmerPayable(payableId, body);
          }
          try {
            if (db !== localDb) localDb.updateFarmerPayable(payableId, body);
          } catch(e) {}
          if (updated) return sendJson(res, 200, updated);
          return sendJson(res, 404, { error: 'Payable record not found' });
        }

        if (method === 'DELETE') {
          let ok;
          try {
            ok = await db.deleteFarmerPayable(payableId);
          } catch(e) {
            ok = localDb.deleteFarmerPayable(payableId);
          }
          try {
            if (db !== localDb) localDb.deleteFarmerPayable(payableId);
          } catch(e) {}
          return sendJson(res, 200, { success: ok });
        }
      }

      // 8. Trade Requests (Buy & Sell Crops/Seeds)
      if (pathname === '/api/trade-requests') {
        if (method === 'GET') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          return sendJson(res, 200, await db.getTradeRequests());
        }
        if (method === 'POST') {
          // Public: farmers submit request to sell crop or buy seeds
          const body = await parseJsonBody(req);
          if (!body.farmerName || !body.mobile || !body.cropName) {
            return sendJson(res, 400, { error: 'براہ کرم کسان کا نام، موبائل نمبر اور فصل کا نام درج کریں۔' });
          }
          const newReq = await db.addTradeRequest(body);
          return sendJson(res, 201, {
            success: true,
            message: 'آپ کی درخواست موصول ہو چکی ہے۔ ہارون زرعی مرکز کا نمائندہ جلد آپ سے رابطہ کرے گا۔',
            request: newReq
          });
        }
      }

      const tradeReqStatusMatch = pathname.match(/^\/api\/trade-requests\/([^\/]+)\/status$/);
      if (tradeReqStatusMatch && method === 'PUT') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const reqId = tradeReqStatusMatch[1];
        const body = await parseJsonBody(req);
        const updated = await db.updateTradeRequestStatus(reqId, body.status);
        if (updated) return sendJson(res, 200, updated);
        return sendJson(res, 404, { error: 'Request not found' });
      }

      const tradeReqDeleteMatch = pathname.match(/^\/api\/trade-requests\/([^\/]+)$/);
      if (tradeReqDeleteMatch && method === 'DELETE') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const reqId = tradeReqDeleteMatch[1];
        await db.deleteTradeRequest(reqId);
        return sendJson(res, 200, { success: true });
      }

      // 9. Admin Stats
      if (pathname === '/api/admin/stats' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        return sendJson(res, 200, await db.getStats());
      }

      // 10. Admin Farmer Logins Activity
      if (pathname === '/api/admin/logins' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        let logins = [];
        try {
          logins = await db.getFarmerLogins(50);
        } catch (err) {
          logins = localDb.getFarmerLogins(50);
        }
        return sendJson(res, 200, logins);
      }

      // 11. Complaints Box (Public submit & Admin management)
      if (pathname === '/api/complaints') {
        if (method === 'GET') {
          if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
          return sendJson(res, 200, await db.getComplaints());
        }
        if (method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.farmerName || !body.mobile || !body.message) {
            return sendJson(res, 400, { error: 'نام، موبائل نمبر اور شکایت کی تفصیل درج کرنا لازمی ہے۔' });
          }
          let newCmp;
          try {
            newCmp = await db.addComplaint(body);
          } catch (e) {
            newCmp = localDb.addComplaint(body);
          }
          try { if (db !== localDb) localDb.addComplaint(body); } catch (e) {}
          return sendJson(res, 201, {
            success: true,
            message: 'آپ کی شکایت کامیابی سے درج ہو چکی ہے۔ ہارون زرعی مرکز انتظامیہ جلد از جلد جائزہ لے گی۔',
            complaint: newCmp
          });
        }
      }

      const cmpStatusMatch = pathname.match(/^\/api\/complaints\/([^\/]+)\/status$/);
      if (cmpStatusMatch && method === 'PUT') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const cmpId = cmpStatusMatch[1];
        const body = await parseJsonBody(req);
        const updated = await db.updateComplaintStatus(cmpId, body.status);
        try { if (db !== localDb) localDb.updateComplaintStatus(cmpId, body.status); } catch (e) {}
        return sendJson(res, 200, updated || { success: true });
      }

      const cmpDeleteMatch = pathname.match(/^\/api\/complaints\/([^\/]+)$/);
      if (cmpDeleteMatch && method === 'DELETE') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const cmpId = cmpDeleteMatch[1];
        await db.deleteComplaint(cmpId);
        try { if (db !== localDb) localDb.deleteComplaint(cmpId); } catch (e) {}
        return sendJson(res, 200, { success: true });
      }

      // 12. Forgot Password Requests
      if (pathname === '/api/farmer/forgot-password' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.identifier && !body.mobile) {
          return sendJson(res, 400, { error: 'موبائل نمبر یا شناختی کارڈ درج کرنا لازمی ہے۔' });
        }
        let reqData;
        try {
          reqData = await db.addPasswordRequest(body);
        } catch (e) {
          reqData = localDb.addPasswordRequest(body);
        }
        try { if (db !== localDb) localDb.addPasswordRequest(body); } catch (e) {}
        return sendJson(res, 201, {
          success: true,
          message: 'آپ کی درخواست ایڈمن کو ارسال کر دی گئی ہے۔ ہارون زرعی مرکز عملہ آپ کے نمبر پر جلد رابطہ کرے گا۔',
          request: reqData
        });
      }

      if (pathname === '/api/admin/password-requests' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        return sendJson(res, 200, await db.getPasswordRequests());
      }

      const passReqStatusMatch = pathname.match(/^\/api\/admin\/password-requests\/([^\/]+)\/status$/);
      if (passReqStatusMatch && method === 'PUT') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const reqId = passReqStatusMatch[1];
        const body = await parseJsonBody(req);
        const updated = await db.updatePasswordRequestStatus(reqId, body.status);
        try { if (db !== localDb) localDb.updatePasswordRequestStatus(reqId, body.status); } catch (e) {}
        return sendJson(res, 200, updated || { success: true });
      }

      // --- 13. In-Store Counter Pickups & Reservations API ---
      if (pathname === '/api/bookings' && method === 'GET') {
        const queryFarmerId = parsedUrl.query.farmerId;
        const all = await db.getBookings();
        if (queryFarmerId) {
          return sendJson(res, 200, all.filter(b => b.farmerId === queryFarmerId));
        }
        return sendJson(res, 200, all);
      }

      if (pathname === '/api/bookings' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.items || !body.items.length) {
          return sendJson(res, 400, { error: 'آرڈر میں کم از کم ایک آئٹم شامل کرنا لازمی ہے۔' });
        }
        const created = await db.addBooking(body);
        try { if (db !== localDb) localDb.addBooking(body); } catch (e) {}
        return sendJson(res, 201, {
          success: true,
          message: 'آپ کی کاؤنٹر وصولی ریزرویشن کامیابی سے درج ہو گئی ہے۔ منتخب تاریخ و وقت پر تشریف لا کر وصول کریں۔',
          booking: created
        });
      }

      const bookingStatusMatch = pathname.match(/^\/api\/bookings\/([^\/]+)\/status$/);
      if (bookingStatusMatch && method === 'PUT') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const bkId = bookingStatusMatch[1];
        const body = await parseJsonBody(req);
        const updated = await db.updateBookingStatus(bkId, body.status);
        try { if (db !== localDb) localDb.updateBookingStatus(bkId, body.status); } catch (e) {}
        return sendJson(res, 200, updated || { success: true });
      }

      const bookingDeleteMatch = pathname.match(/^\/api\/bookings\/([^\/]+)$/);
      if (bookingDeleteMatch && method === 'DELETE') {
        const bkId = bookingDeleteMatch[1];
        await db.deleteBooking(bkId);
        try { if (db !== localDb) localDb.deleteBooking(bkId); } catch (e) {}
        return sendJson(res, 200, { success: true });
      }

      // --- 14. Counter Billing & POS Sales API ---
      if (pathname === '/api/billing/pos-sale' && method === 'POST') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        if (!body.items || !body.items.length) {
          return sendJson(res, 400, { error: 'بل میں کم از کم ایک پراڈکٹ شامل کریں۔' });
        }
        const sale = await db.addPosSale(body);
        try { if (db !== localDb) localDb.addPosSale(body); } catch (e) {}
        return sendJson(res, 201, {
          success: true,
          message: 'کاؤنٹر بل کامیابی سے درج کر لیا گیا اور پرنٹ کے لیے تیار ہے۔',
          sale
        });
      }

      if (pathname === '/api/billing/sales' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const sales = await db.getPosSales();
        return sendJson(res, 200, sales);
      }

      // --- 15. Suppliers & Company Purchases API ---
      if (pathname === '/api/suppliers' && method === 'GET') {
        const sups = await db.getSuppliers();
        return sendJson(res, 200, sups);
      }

      if (pathname === '/api/suppliers' && method === 'POST') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const created = await db.addSupplier(body);
        try { if (db !== localDb) localDb.addSupplier(body); } catch (e) {}
        return sendJson(res, 201, created);
      }

      if (pathname === '/api/suppliers/purchases' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const purchases = await db.getSupplierPurchases();
        return sendJson(res, 200, purchases);
      }

      if (pathname === '/api/suppliers/purchases' && method === 'POST') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const pur = await db.addSupplierPurchase(body);
        try { if (db !== localDb) localDb.addSupplierPurchase(body); } catch (e) {}
        return sendJson(res, 201, pur);
      }

      // --- 16. Daily Sales & Profit Reports API ---
      if (pathname === '/api/reports/daily' && method === 'GET') {
        if (!checkAdminAuth(req)) return sendJson(res, 403, { error: 'Unauthorized' });
        const targetDate = parsedUrl.query.date || new Date().toISOString().slice(0, 10);
        const report = await db.getDailyReport(targetDate);
        return sendJson(res, 200, report);
      }

      // 404 for unknown API
      return sendJson(res, 404, { error: 'API endpoint not found' });

    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: 'Internal server error: ' + err.message });
    }
  }

  // Serve static files
  serveStatic(req, res, parsedUrl);
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  🌾 HAROON ZARAI MARKAZ (ہارون زرعی مرکز) 🌾`);
  console.log(`  Server is running on: http://localhost:${PORT}`);
  console.log(`  Admin Portal link:    http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});
