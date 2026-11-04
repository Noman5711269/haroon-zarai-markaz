-- ========================================================
-- ہارون زرعی مرکز (HAROON ZARAI MARKAZ)
-- مکمل ڈیٹا بیس اسکیمہ برائے سپابیس (Supabase PostgreSQL Schema)
-- ========================================================
-- طریقہ استعمال:
-- 1. https://supabase.com پر جا کر لاگ ان کریں اور نیا پروجیکٹ بنائیں
-- 2. بائیں جانب مینو سے "SQL Editor" کھولیں
-- 3. یہ تمام کوڈ کاپی کر کے وہاں پیسٹ کریں اور "RUN" دبائیں
-- ========================================================

-- پرانی ٹیبلز صاف کریں (اگر پہلے سے موجود ہوں)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS trade_requests CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS mandi_rates CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. سیٹنگز ٹیبل (SETTINGS)
CREATE TABLE settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    business_name TEXT NOT NULL DEFAULT 'ہارون زرعی مرکز',
    business_name_en TEXT NOT NULL DEFAULT 'HAROON ZARAI MARKAZ',
    tagline TEXT DEFAULT 'کسان کی خوشحالی، ہماری اولین ترجیح',
    owner_name TEXT DEFAULT 'میاں ہارون رشید',
    phone TEXT DEFAULT '0300-7654321',
    whatsapp TEXT DEFAULT '923007654321',
    address TEXT DEFAULT 'پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)',
    admin_pin TEXT DEFAULT '1234',
    announcement TEXT DEFAULT '🌾 خوشخبری: گندم، سفید تل اور سورج مکھی کی بہترین نرخوں پر نقد خریداری جاری ہے! تصدیق شدہ بیج اور معیاری ادویات رعایت پر دستیاب ہیں۔',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. منڈی ریٹس ٹیبل (MANDI RATES)
CREATE TABLE mandi_rates (
    id TEXT PRIMARY KEY,
    crop_name_urdu TEXT NOT NULL,
    crop_name_en TEXT,
    unit TEXT DEFAULT 'فی 40 کلوگرام (من)',
    buy_price NUMERIC NOT NULL DEFAULT 0,
    sell_price NUMERIC NOT NULL DEFAULT 0,
    trend TEXT DEFAULT 'stable', -- 'up', 'down', 'stable'
    last_updated TEXT DEFAULT CURRENT_DATE::TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. زرعی ادویات، کھاد و بیج ٹیبل (PRODUCTS & INVENTORY)
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name_urdu TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL, -- pesticide, weedicide, fungicide, fertilizer, seed
    category_urdu TEXT DEFAULT 'زرعی پراڈکٹ',
    company TEXT,
    pack_size TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    image TEXT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. کسان ٹیبل (FARMERS)
CREATE TABLE farmers (
    id TEXT PRIMARY KEY, -- e.g. HZM-101
    name TEXT NOT NULL,
    name_en TEXT,
    father_name TEXT,
    mobile TEXT NOT NULL,
    cnic TEXT,
    village TEXT,
    land_acres NUMERIC DEFAULT 0,
    current_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_DATE::TEXT
);

-- موبائل اور کسان آئی ڈی پر تیز ترین سرچ کے لیے انڈیکس
CREATE INDEX idx_farmers_mobile ON farmers (mobile);
CREATE INDEX idx_farmers_id ON farmers (id);

-- 5. کھاتہ لین دین ٹیبل (TRANSACTIONS - کسان کھاتہ بک)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY, -- e.g. TX-1001
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    date TEXT DEFAULT CURRENT_DATE::TEXT,
    type TEXT NOT NULL, -- 'debit' (نام/ادھار) or 'credit' (جمع/وصولی)
    category TEXT,
    product_name TEXT, -- پیسے کس چیز کے ہیں (دوا، بیج، کھاد یا رقم)
    quantity TEXT, -- مثلاً 5 بوری یا 2 بوتل
    unit_price NUMERIC DEFAULT 0,
    description TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    added_by TEXT DEFAULT 'ایڈمن ہارون',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_farmer_id ON transactions (farmer_id);

-- 6. کسان کی فصل فروخت / بیج خریداری درخواستیں (TRADE REQUESTS)
CREATE TABLE trade_requests (
    id TEXT PRIMARY KEY,
    farmer_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    village TEXT,
    crop_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'sell_crop', -- 'sell_crop' or 'buy_seed'
    expected_price TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Contacted', 'Completed'
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_DATE::TEXT
);

-- ========================================================
-- ابتدائی ڈیٹا (INITIAL SEED DATA)
-- ========================================================

-- سیٹنگز شامل کریں
INSERT INTO settings (id, business_name, business_name_en, tagline, owner_name, phone, whatsapp, address, admin_pin, announcement)
VALUES (
    'main',
    'ہارون زرعی مرکز',
    'HAROON ZARAI MARKAZ',
    'کسان کی خوشحالی، ہماری اولین ترجیح',
    'میاں ہارون رشید',
    '0300-7654321',
    '923007654321',
    'پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)',
    '1234',
    '🌾 خوشخبری: گندم، سفید تل اور سورج مکھی کی بہترین نرخوں پر نقد خریداری جاری ہے! تصدیق شدہ بیج اور معیاری ادویات رعایت پر دستیاب ہیں۔'
);

-- منڈی ریٹس
INSERT INTO mandi_rates (id, crop_name_urdu, crop_name_en, unit, buy_price, sell_price, trend, last_updated, notes) VALUES
('rate-gandum', 'گندم (صاف ستھری کسان سپیشل)', 'Wheat (Gandum)', 'فی 40 کلوگرام (من)', 3950, 4100, 'up', CURRENT_DATE::TEXT, 'نمی 10% سے کم، بر وقت نقد ادائیگی'),
('rate-rice-super', 'دھان / چاول سپر باسمتی', 'Super Basmati Rice', 'فی 40 کلوگرام (من)', 4250, 4450, 'up', CURRENT_DATE::TEXT, 'لمبا دانہ، خوشبودار قسم'),
('rate-rice-1121', 'دھان کائنات 1121 سپیشل', 'Kainat 1121 Rice', 'فی 40 کلوگرام (من)', 4650, 4900, 'stable', CURRENT_DATE::TEXT, 'مکمل صفائی کے ساتھ نقد خریداری'),
('rate-till-white', 'سفید تل (اعلیٰ کوالٹی)', 'White Sesame (Till)', 'فی 40 کلوگرام (من)', 15800, 16500, 'up', CURRENT_DATE::TEXT, 'تیل کی اعلیٰ شرح، فوری نقد پیمنٹ'),
('rate-till-black', 'کالا تل (دیسی)', 'Black Sesame', 'فی 40 کلوگرام (من)', 14200, 14900, 'stable', CURRENT_DATE::TEXT, 'صاف ستھرا مال'),
('rate-sunflower', 'سورج مکھی بیج (ہائبرڈ)', 'Sunflower Seeds', 'فی 40 کلوگرام (من)', 7200, 7600, 'up', CURRENT_DATE::TEXT, 'نقد خریداری منڈی وہاڑی'),
('rate-makai', 'مکئی دانہ (ہائبرڈ پیلی)', 'Hybrid Yellow Maize', 'فی 40 کلوگرام (من)', 2450, 2600, 'stable', CURRENT_DATE::TEXT, 'ڈرائی شدہ معیاری دانہ'),
('rate-sarson', 'سرسوں / رایا تیل دار', 'Mustard / Canola Seed', 'فی 40 کلوگرام (من)', 6800, 7200, 'down', CURRENT_DATE::TEXT, 'تیل ملوں کے لیے خریداری');

-- زرعی پراڈکٹس (کھاد، سپرے، بیج)
INSERT INTO products (id, name_urdu, name_en, category, category_urdu, company, pack_size, price, stock, description, image, featured) VALUES
('prod-1', 'کوراجن 20 SC کیڑے مار زہر', 'Coragen 20 SC FMC', 'pesticide', 'کیڑے مار زہر', 'FMC Pakistan', '50 ملی لیٹر', 2850, 35, 'سنڈی اور بورر کے خلاف جدید ترین زہر۔ دیرپا اثر، گندم، دھان اور مکئی کے لیے اکسیر۔', 'https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80', true),
('prod-2', 'بیلٹ 480 SC بائر', 'Belt 480 SC Bayer', 'pesticide', 'کیڑے مار زہر', 'Bayer Crop Science', '50 ملی لیٹر', 3100, 20, 'لشکری سنڈی، امریکی سنڈی اور ٹوکے کا مکمل خاتمہ۔ فصل کو محفوظ رکھنے کی مضبوط ڈھال۔', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80', true),
('prod-3', 'گندم تصدیق شدہ بیج (اکبر-19)', 'Wheat Seed Akbar-19 Certified', 'seed', 'تصدیق شدہ بیج', 'پنجاب سیڈ کارپوریشن', '50 کلوگرام بوری', 4800, 85, 'پنجاب بھر میں سب سے زیادہ رقبے پر کاشت ہونے والا بیماریوں سے محفوظ 55 تا 60 من پیداواری صلاحیت کا حامل بیج۔', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80', true),
('prod-4', 'سورج مکھی ہائبرڈ بیج NK-278', 'Syngenta Sunflower Hybrid NK-278', 'seed', 'تصدیق شدہ بیج', 'Syngenta', '2 کلوگرام بیگ', 4800, 45, 'اعلیٰ ترین فی ایکڑ پیداوار اور زیادہ تیل کی شرح۔ گرنے کے خلاف مضبوط تنا اور تیز پکنے والی ورائٹی۔', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80', true),
('prod-5', 'سونا یوریا کھاد (پریمیئم)', 'Sona Urea Fertilizer FFC', 'fertilizer', 'کھاد و نیوٹریشن', 'FFC (فوجی فرٹیلائزر)', '50 کلوگرام بوری', 4650, 150, 'نائٹروجن سے بھرپور دانے دار سونا یوریا کھاد۔ فصل کی شادابی اور تیز رفتار نشوونما کا ضامن۔', 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=80', true),
('prod-6', 'ڈی اے پی اینگرو کھاد', 'Engro DAP Fertilizer', 'fertilizer', 'کھاد و نیوٹریشن', 'اینگرو فرٹیلائزرز', '50 کلوگرام بوری', 13400, 60, 'فاسفورس اور نائٹروجن کا اعلیٰ امتزاج۔ جڑوں کی مضبوطی اور دانے کی بھرپور موٹائی کے لیے لازمی۔', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80', true),
('prod-7', 'نیاب پرل سفید تل تصدیق شدہ بیج', 'Niab Pearl Sesame Seed', 'seed', 'تصدیق شدہ بیج', 'نیاب فیصل آباد (NIAB)', '5 کلوگرام پیکٹ', 4900, 40, 'سفید چمکدار دانہ، شاخوں پر پھلیوں کا گچھا، بیماریوں سے محفوظ اور زیادہ تیل دینے والا تل کا معیاری بیج۔', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80', true);

-- کسان کھاتے (FARMERS)
INSERT INTO farmers (id, name, name_en, father_name, mobile, cnic, village, land_acres, current_balance, notes) VALUES
('HZM-101', 'چوہدری محمد اکرم گجر', 'Ch. Muhammad Akram Gujjar', 'چوہدری بشیر احمد', '03001234567', '36102-1234567-1', 'چک نمبر 54/EB، وہاڑی', 25, 45000, 'معتبر پرانے کھاتہ دار، ربیع فصل پر ادائیگی'),
('HZM-102', 'میاں شاہد محمود کمبوہ', 'Mian Shahid Mehmood', 'میاں عاشق علی', '03019876543', '36102-9876543-3', 'چک 87/WB، ڈاکخانہ خاص، میلسی', 40, -35000, 'تل کی فصل مرکز کو فروخت کی، مرکز کے ذمے رقم واجب الادا ہے'),
('HZM-103', 'ملک طارق اعوان', 'Malik Tariq Awan', 'ملک غلام رسول', '03451122334', '36102-4455667-5', 'چک 12/WB، نزد کوٹ ہیبت، بورے والا', 18, 0, 'مکمل کھاتہ صاف ہو چکا ہے'),
('HZM-104', 'رانا تنویر اختر', 'Rana Tanveer Akhtar', 'رانا منور خاں', '03025556677', '36102-7788990-7', 'بستی اللہ بخش، لڈن روڈ، وہاڑی', 30, 28000, 'کھاد اور جڑی بوٹی مار زہر ادھار لیا گیا');

-- کھاتے کی تفصیلی انٹریز (TRANSACTIONS - پیسے کس چیز کے ہیں)
INSERT INTO transactions (id, farmer_id, date, type, category, product_name, quantity, unit_price, description, amount, balance_after, added_by) VALUES
('TX-1001', 'HZM-101', '2026-10-15', 'debit', 'بیج و کھاد ادھار خریدی', 'گندم بیج اکبر-19 + سونا یوریا', '5 بوری بیج + 2 بوری کھاد', 59300, 'گندم بیج اکبر-19 (5 بوری) + 2 بوری سونا یوریا کھاتے پر ادھار دی گئی', 59300, 59300, 'ایڈمن ہارون'),
('TX-1002', 'HZM-101', '2026-10-20', 'credit', 'نقد وصولی', 'نقد رقم وصول بذریعہ کیش', '1 رقم', 20000, 'کسان نے بذریعہ کیش رقم جمع کروائی (دکان پر وصولی)', 20000, 39300, 'ایڈمن ہارون'),
('TX-1003', 'HZM-101', '2026-10-25', 'debit', 'کیڑے مار دوا', 'کوراجن 20 SC کیڑے مار زہر', '2 بوتلیں (50ml)', 2850, 'کوراجن 20 SC کیڑے مار دوا (2 بوتلیں) ادھار دی گئی', 5700, 45000, 'ایڈمن ہارون'),

('TX-1004', 'HZM-102', '2026-10-08', 'debit', 'کھاد خریداری', 'سونا یوریا کھاد FFC', '10 بوری', 4650, 'سونا یوریا 10 بوری کھاتے میں درج کی گئیں', 46500, 46500, 'ایڈمن ہارون'),
('TX-1005', 'HZM-102', '2026-10-22', 'credit', 'فصل کی فروخت', 'سفید تل فروخت کیے (5 من)', '5 من', 16300, 'سفید تل فروخت کیے (5 من @ 16,300 فی من) ٹوٹل 81,500 روپے کھاتے میں جمع کیے', 81500, -35000, 'ایڈمن ہارون'),

('TX-1006', 'HZM-103', '2026-10-02', 'debit', 'سورج مکھی بیج', 'ہائی سن 33 سورج مکھی بیج', '6 پیکٹ', 4500, 'ہائی سن 33 سورج مکھی بیج 6 پیکٹ ادھار دیے', 27000, 27000, 'ایڈمن ہارون'),
('TX-1007', 'HZM-103', '2026-10-18', 'credit', 'مکمل وصولی', 'نقد رقم وصول بذریعہ کیش', '1 ادائیگی', 27000, 'کھاتے کی تمام سابقہ بقایا رقم نقد وصول پائی', 27000, 0, 'ایڈمن ہارون');

-- ٹریڈ ریکویسٹس
INSERT INTO trade_requests (id, farmer_name, mobile, village, crop_name, quantity, type, expected_price, status, notes, created_at) VALUES
('REQ-101', 'حاجی بشیر احمد کمبوہ', '03009988776', 'چک 34/WB وہاڑی', 'سفید تل (اعلیٰ کوالٹی)', '15 من', 'sell_crop', '16,000 فی من', 'Pending', 'مال تیار ہے، منڈی ریٹ پر نقد سودا کرنا چاہتے ہیں', '2026-10-27'),
('REQ-102', 'ملک ربنواز اعوان', '03038877665', 'میلسی روڈ، وہاڑی', 'گندم دیسی صاف', '100 من', 'sell_crop', '4,000 فی من', 'Contacted', 'فون پر رابطہ کیا گیا، کل سیمپل لے کر آئیں گے', '2026-10-26');

-- ========================================================
-- پبلک ریڈ اینڈ رائٹ پالیسیز (ROW LEVEL SECURITY - RLS)
-- ========================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

-- عام عوام اور کسانوں کے لیے پڑھنے اور ریکویسٹ بھیجنے کی مکمل اجازت
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public Read Mandi Rates" ON mandi_rates FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Farmers Khata" ON farmers FOR SELECT USING (true);
CREATE POLICY "Public Read Transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Trade Requests" ON trade_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Trade Requests" ON trade_requests FOR SELECT USING (true);

-- ایڈمن / سروس رول کو مکمل تبدیلیوں کی اجازت
CREATE POLICY "Service Role Full Settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Mandi Rates" ON mandi_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Trade Requests" ON trade_requests FOR ALL USING (true) WITH CHECK (true);

-- مبارک ہو! تمام ٹیبلز، انڈیکس اور ڈیٹا مکمل طور پر تیار ہیں۔
