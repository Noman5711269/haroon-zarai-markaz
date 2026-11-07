// Haroon Zarai Markaz - Multi-Language i18n Module (Urdu, English & Bilingual Both)

const translations = {
  ur: {
    lang_btn: "English",
    top_announcement_badge: '<i class="fa-solid fa-bullhorn text-[10px]"></i> تازہ ترین اعلان',
    top_announcement_text: "🌾 گندم، سفید تل اور سورج مکھی کی نقد خریداری بہترین ریٹ پر جاری ہے!",
    top_timings: "اوقات: صبح 8 تا رات 8 بجے",
    brand_title: "ہارون زرعی مرکز",
    brand_sub: "",
    nav_rates: '<i class="fa-solid fa-chart-line text-brand-600"></i> منڈی کے ریٹ',
    nav_khata: '<i class="fa-solid fa-book-bookmark text-agroorange-500"></i> کسان کھاتہ پورٹل',
    nav_trade: '<i class="fa-solid fa-handshake text-agroorange-500"></i> فصل خرید و فروخت',
    nav_store: '<i class="fa-solid fa-spray-can text-brand-600"></i> ادویات و بیج گائیڈ',
    nav_contact: '<i class="fa-solid fa-location-dot text-brand-600"></i> رابطہ و پتہ',
    btn_whatsapp: "واٹس ایپ رابطہ",
    btn_check_khata: "کھاتہ چیک",
    hero_badge: '<i class="fa-solid fa-circle-check text-brand-600 text-sm"></i> <span>حکومت پنجاب سے منظور شدہ ڈیلر • ڈیجیٹل وزنی کانٹا • فوری کیش پیمنٹ</span>',
    hero_title: "گندم، چاول، تل اور سورج مکھی کی نقد خریداری و تصدیق شدہ بیج",
    hero_desc: "ہارون زرعی مرکز کسانوں کا بااعتماد ساتھی۔ فصلوں کے اعلیٰ مارکیٹ ریٹ، اصل زرعی ادویات کی تفصیلی معلوماتی گائیڈ، اور کسانوں کے لیے 24 گھنٹے اپنا آن لائن کھاتہ اور بیلنس چیک کرنے کی جدید سہولت۔",
    hero_cta_khata: '<i class="fa-solid fa-calculator text-lg"></i> <span>کسان آن لائن کھاتہ چیک کریں</span>',
    hero_cta_trade: '<i class="fa-solid fa-sack-dollar text-yellow-300 text-lg"></i> <span>اپنی فصل بیچنے کی پیشکش دیں</span>',
    hero_cta_store: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> <span>زرعی ادویات کیٹلاگ دیکھیں</span>',
    badge_certified: "تصدیق شدہ بیج و زہر",
    badge_cash: "موقع پر فوری ادائیگی",
    badge_online: "24/7 آن لائن کھاتہ بک",
    hero_rates_title: "آج کے نمایاں منڈی ریٹ",
    hero_rates_note: "منڈی ریٹس میں تغیر ممکن ہے",
    hero_rates_all: '<span>تمام اجناس کے ریٹ دیکھیں</span> <i class="fa-solid fa-arrow-left text-[10px]"></i>',
    rates_badge: '<i class="fa-solid fa-scale-balanced text-agroorange-600"></i> غلہ منڈی کے باضابطہ نرخ',
    rates_title: "آج کے تازہ ترین منڈی خرید و فروخت ریٹ",
    rates_desc: "ہم گندم، باسمتی دھان، سفید و کالا تل، سورج مکھی اور دیگر اجناس براہ راست کسانوں سے منڈی کے بہترین نرخوں پر نقد خریدتے ہیں۔",
    rates_banner_title: "کیا آپ کے پاس بڑی مقدار میں فصل موجود ہے؟",
    rates_banner_desc: "ہم گاڑی یا ٹرالی موقع پر بھیج کر بھی وزنی کانٹے پر نقد مال اٹھا لیتے ہیں۔",
    rates_banner_btn: 'اپنی فصل فروخت کریں <i class="fa-solid fa-arrow-left mr-1 text-xs"></i>',
    khata_badge: '<i class="fa-solid fa-shield-halved text-agroorange-600"></i> محفوظ اور شفاف ڈیجیٹل کھاتہ بک',
    khata_title: "کسان آن لائن کھاتہ و بیلنس پورٹل",
    khata_desc: "کسان بھائی اپنا موبائل نمبر یا کسان آئی ڈی درج کر کے اپنا سابقہ حساب کتاب، بقایا رقم اور مکمل رسید چیک کر سکتے ہیں۔",
    khata_label: "کسان آئی ڈی یا موبائل نمبر درج کریں:",
    khata_placeholder: "مثال: 03001234567 یا HZM-101",
    khata_btn: '<i class="fa-solid fa-magnifying-glass"></i> <span>کھاتہ تلاش کریں</span>',
    khata_test_label: "آزمائشی نمبر (کلک کریں):",
    khata_res_registered: "رجسٹرڈ کسان",
    khata_res_father: "ولدیت:",
    khata_res_village: "رہائش:",
    khata_res_phone: "فون:",
    khata_box_debit: "کل مال خریدا گیا (نام / ادھار)",
    khata_box_credit: "کل جمع کروائی گئی رقم و فصل",
    khata_box_balance: "موجودہ خالص بقایا بیلنس",
    khata_ledger_title: '<i class="fa-solid fa-receipt text-agroorange-600"></i> <span>کھاتے کا تفصیلی ریکارڈ (سابقہ اندراجات)</span>',
    khata_print_btn: '<i class="fa-solid fa-print"></i> رسید پرنٹ کریں',
    khata_wa_btn: '<i class="fa-brands fa-whatsapp"></i> واٹس ایپ',
    khata_th_date: "تاریخ",
    khata_th_item: "پیسے کس چیز کے ہیں (پراڈکٹ / سودا)",
    khata_th_qty: "مقدار و ریٹ",
    khata_th_type: "نوعیت",
    khata_th_debit: "مال دیا / نام (Debit)",
    khata_th_credit: "جمع وصولی (Credit)",
    khata_th_balance: "بقایا بیلنس",
    khata_th_proof: "رسید / ثبوت",
    khata_footer_note: "نوٹ: کھاتے میں کسی بھی تصحیح یا تفصیلی معلومات کے لیے فوری طور پر ہارون زرعی مرکز تشریف لائیں یا کال کریں۔",
    trade_badge: '<i class="fa-solid fa-handshake-angle text-agroorange-600"></i> کسان ٹریڈنگ پورٹل',
    trade_title: "گندم، چاول، تل و سورج مکھی بیچیں یا بیج خریدیں",
    trade_desc: "اپنی فصل فروخت کرنے کے لیے یا تصدیق شدہ بیج آرڈر کرنے کے لیے نیچے دیا گیا فارم پُر کریں۔ ہارون زرعی مرکز کی ٹیم فوری آپ سے رابطہ کرے گی۔",
    trade_what_to_do: "آپ کیا کرنا چاہتے ہیں؟",
    trade_radio_sell: '<i class="fa-solid fa-sack-dollar text-agroorange-500 ml-1"></i> ہمیں فصل بیچیں (Sell Crop)',
    trade_radio_buy: '<i class="fa-solid fa-seedling text-brand-600 ml-1"></i> تصدیق شدہ بیج خریدیں (Buy Seeds)',
    trade_crop_label: "فصل یا بیج کی قسم:",
    trade_qty_label: "تخمینہ مقدار (من یا بوری):",
    trade_name_label: "آپ کا نام:",
    trade_phone_label: "موبائل نمبر:",
    trade_village_label: "گاؤں / چک / علاقہ:",
    trade_rate_label: "آپ کا متوقع ریٹ (اختیاری):",
    trade_notes_label: "اضافی تفصیل / پیغام:",
    trade_submit_btn: '<i class="fa-solid fa-paper-plane"></i> <span>درخواست جمع کروائیں</span>',
    trade_benefits_title: "ہارون زرعی مرکز کو فصل بیچنے کے فوائد",
    trade_b1_title: "موقع پر مکمل نقد ادائیگی:",
    trade_b1_desc: "کوئی لمبا ادھار نہیں، تول مکمل ہونے کے فوری بعد کیش یا بینک ٹرانسفر۔",
    trade_b2_title: "کمپیوٹرائزڈ شفاف وزنی کانٹا:",
    trade_b2_desc: "ایک گرام کی بھی کٹوتی کے بغیر بالکل صاف اور بااعتماد وزن کی پرچی۔",
    trade_b3_title: "مقام پر مال اٹھانے کی سہولت:",
    trade_b3_desc: "ٹرالی یا ٹرک کا انتظام اور ڈیرے پر خریداری کا باقاعدہ نظام۔",
    trade_b4_title: "کھاتے میں کٹوتی کی سہولت:",
    trade_b4_desc: "اگر آپ نے دوائی یا کھاد ادھار لی تھی تو فصل کی رقم سیدھی کھاتے میں مائنس ہو جائے گی۔",
    trade_call_title: "براہِ راست ڈیل کے لیے کال کریں",
    trade_call_owner: "میاں ہارون رشید (مالک مرکز)",
    store_badge: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> معلوماتی زرعی کیٹلاگ و رہنمائی',
    store_title: "زرعی ادویات، کھاد و بیج معلوماتی گائیڈ",
    store_desc: "کسان بھائیوں کی رہنمائی کے لیے ہمارے مرکز پر دستیاب اصل ادویات، موزوں فصلیں، اور فی ایکڑ مقدار و طریقہ استعمال کی مکمل معلومات۔",
    store_search_ph: "دوا، کھاد یا بیج کا نام تلاش کریں...",
    store_cat_all: "تمام ادویات و بیج (All)",
    store_cat_pesticide: "کیڑے مار زہر (Pesticides)",
    store_cat_weedicide: "جڑی بوٹی مار ادویات (Weedicides)",
    store_cat_fungicide: "پھپھوندی کش ادویات (Fungicides)",
    store_cat_fertilizer: "کھاد و نیوٹریشن (Fertilizers)",
    store_cat_seed: "تصدیق شدہ بیج (Certified Seeds)",
    contact_badge: '<i class="fa-solid fa-store"></i> براہ راست تشریف لائیں',
    contact_title: "ہارون زرعی مرکز (پل 88، شادی خان منڈا، کوٹ ادو)",
    contact_desc: "کسی بھی قسم کی زرعی رہنمائی، گندم، تل یا سورج مکھی کا سودا کرنے، ادویات و کھاد کی معلومات یا اپنے کھاتے کا تبادلہ خیال کرنے کے لیے ہمارے مرکز پر تشریف لائیں یا فون پر رابطہ کریں۔",
    contact_addr_label: "دکان کا پتہ:",
    contact_addr_val: "پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)",
    contact_phone_label: "رابطہ نمبرز:",
    contact_wa_label: "واٹس ایپ ہیلپ لائن:",
    contact_timing_title: "اوقاتِ کار (مرکز ٹائمنگز)",
    contact_timing_open: "کھلا ہے",
    contact_timing_weekdays: "پیر تا ہفتہ:",
    contact_timing_sunday: "اتوار (مارکیٹ ڈے):",
    contact_timing_portal: "آن لائن کھاتہ پورٹل:",
    contact_timing_247: "24 گھنٹے 7 دن آن لائن",
    contact_chat_btn: '<i class="fa-brands fa-whatsapp text-xl"></i> <span>واٹس ایپ پر زرعی معلومات لیں</span>',
    footer_desc: "گندم، چاول، سفید تل، سورج مکھی بیج اور دیگر تمام اجناس کی بااعتماد خرید و فروخت۔ زرعی ادویات، کھاد اور کسان کھاتہ بک کا ایک ہی چھت تلے مکمل حل۔",
    footer_links_title: "اہم لنکس",
    footer_admin_title: "انتظامیہ (Admin)",
    footer_admin_desc: "صرف بااختیار ایڈمن عملے کے لیے۔",
    footer_admin_link: '<i class="fa-solid fa-key text-[10px]"></i> ایڈمن لاگ ان لنک',
    footer_copy: "© 2026 ہارون زرعی مرکز (HAROON ZARAI MARKAZ) • جملہ حقوق محفوظ ہیں۔",
    footer_slogan: "کسان کی خدمت، پاکستان کی ترقی"
  },

  en: {
    lang_btn: "اردو (Urdu)",
    top_announcement_badge: '<i class="fa-solid fa-bullhorn text-[10px]"></i> Latest Update',
    top_announcement_text: "🌾 Immediate cash purchase of Wheat, White Sesame & Sunflower Seeds at peak mandi rates!",
    top_timings: "Hours: 8:00 AM - 8:00 PM",
    brand_title: "HAROON ZARAI MARKAZ",
    brand_sub: "",
    nav_rates: '<i class="fa-solid fa-chart-line text-brand-600"></i> Mandi Rates',
    nav_khata: '<i class="fa-solid fa-book-bookmark text-agroorange-500"></i> Farmer Khata Portal',
    nav_trade: '<i class="fa-solid fa-handshake text-agroorange-500"></i> Buy & Sell Crops',
    nav_store: '<i class="fa-solid fa-spray-can text-brand-600"></i> Agri Inputs Guide',
    nav_contact: '<i class="fa-solid fa-location-dot text-brand-600"></i> Contact & Location',
    btn_whatsapp: "WhatsApp Chat",
    btn_check_khata: "Check Khata",
    hero_badge: '<i class="fa-solid fa-circle-check text-brand-600 text-sm"></i> <span>Govt Certified Dealer • Digital Weighbridge • Immediate Cash Payment</span>',
    hero_title: "Cash Purchase of Wheat, Rice, Sesame & Sunflower Seeds",
    hero_desc: "Haroon Zarai Markaz is the trusted partner of farmers. Top market grain rates, authentic agri pesticides detailed guide, and 24/7 online farmer khata ledger access.",
    hero_cta_khata: '<i class="fa-solid fa-calculator text-lg"></i> <span>Check Online Khata</span>',
    hero_cta_trade: '<i class="fa-solid fa-sack-dollar text-yellow-300 text-lg"></i> <span>Offer Crop for Sale</span>',
    hero_cta_store: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> <span>View Agri Products Guide</span>',
    badge_certified: "Certified Seeds & Sprays",
    badge_cash: "Immediate Cash on Spot",
    badge_online: "24/7 Online Khata Book",
    hero_rates_title: "Today's Featured Mandi Rates",
    hero_rates_note: "Rates subject to mandi fluctuations",
    hero_rates_all: '<span>View All Mandi Rates</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>',
    rates_badge: '<i class="fa-solid fa-scale-balanced text-agroorange-600"></i> Official Grain Market Rates',
    rates_title: "Today's Live Mandi Buy & Sell Rates",
    rates_desc: "We buy Wheat, Basmati Paddy, White & Black Sesame, Sunflower, and other grains directly from farmers at the best market rates with instant cash payment.",
    rates_banner_title: "Do you have large quantity of crop available?",
    rates_banner_desc: "We can arrange truck / trolley transport directly from your farm with certified weighbridge slip and instant cash.",
    rates_banner_btn: 'Sell Your Crop <i class="fa-solid fa-arrow-right ml-1 text-xs"></i>',
    khata_badge: '<i class="fa-solid fa-shield-halved text-agroorange-600"></i> Secure & Transparent Digital Ledger',
    khata_title: "Farmer Online Khata & Balance Portal",
    khata_desc: "Farmers can enter their Mobile Number or Farmer ID to check remaining balance, transaction history, and official printable receipts.",
    khata_label: "Enter Farmer ID or Mobile Number:",
    khata_placeholder: "e.g. 03001234567 or HZM-101",
    khata_btn: '<i class="fa-solid fa-magnifying-glass"></i> <span>Search Khata</span>',
    khata_test_label: "Quick Demo Accounts (Click to test):",
    khata_res_registered: "Registered Farmer",
    khata_res_father: "Father Name:",
    khata_res_village: "Village / Area:",
    khata_res_phone: "Phone:",
    khata_box_debit: "Total Purchases / Owed (Debit)",
    khata_box_credit: "Total Paid / Grains Sold (Credit)",
    khata_box_balance: "Current Net Balance",
    khata_ledger_title: '<i class="fa-solid fa-receipt text-agroorange-600"></i> <span>Detailed Ledger Transactions</span>',
    khata_print_btn: '<i class="fa-solid fa-print"></i> Print Receipt Slip',
    khata_wa_btn: '<i class="fa-brands fa-whatsapp"></i> WhatsApp',
    khata_th_date: "Date",
    khata_th_item: "Item / Purpose Detail",
    khata_th_qty: "Qty & Rate",
    khata_th_type: "Type",
    khata_th_debit: "Debit (Owed)",
    khata_th_credit: "Credit (Received)",
    khata_th_balance: "Net Balance",
    khata_th_proof: "Proof / Slip",
    khata_footer_note: "Note: For any reconciliation or ledger inquiry, please visit Haroon Zarai Markaz or contact our helpline.",
    trade_badge: '<i class="fa-solid fa-handshake-angle text-agroorange-600"></i> Farmer Trading Portal',
    trade_title: "Sell Crops or Buy Certified Seeds",
    trade_desc: "Fill the form below to sell your harvest or order certified hybrid seeds. The Haroon Zarai Markaz team will contact you promptly.",
    trade_what_to_do: "What would you like to do?",
    trade_radio_sell: '<i class="fa-solid fa-sack-dollar text-agroorange-500 mr-1"></i> Sell Crop to Us',
    trade_radio_buy: '<i class="fa-solid fa-seedling text-brand-600 mr-1"></i> Buy Certified Seeds',
    trade_crop_label: "Crop or Seed Variety:",
    trade_qty_label: "Estimated Quantity (Maunds or Bags):",
    trade_name_label: "Your Full Name:",
    trade_phone_label: "Mobile Number:",
    trade_village_label: "Village / Chak / Area:",
    trade_rate_label: "Your Expected Price (Optional):",
    trade_notes_label: "Additional Details / Message:",
    trade_submit_btn: '<i class="fa-solid fa-paper-plane"></i> <span>Submit Request</span>',
    trade_benefits_title: "Benefits of Selling to Haroon Zarai Markaz",
    trade_b1_title: "Instant Cash Payment on Spot:",
    trade_b1_desc: "No long credit delays. Direct cash or bank transfer right after weighment.",
    trade_b2_title: "Computerized Digital Weighbridge:",
    trade_b2_desc: "100% accurate weight slip without arbitrary weight cuts.",
    trade_b3_title: "Farmgate Transport Facility:",
    trade_b3_desc: "Truck or trolley pickup arrangement directly from your fields.",
    trade_b4_title: "Direct Khata Deduction Option:",
    trade_b4_desc: "If you had purchased fertilizers or pesticides on credit, your crop earnings can be adjusted directly.",
    trade_call_title: "Call for Direct Commercial Deals",
    trade_call_owner: "Mian Haroon Rashid (Markaz Owner)",
    store_badge: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> Informational Agri Guide',
    store_title: "Agri Inputs, Fertilizers & Seeds Information Guide",
    store_desc: "Authentic information on sprays, seeds, recommended crops, target pests, and per-acre dosage instructions for products available at our center.",
    store_search_ph: "Search pesticide, fertilizer, or seed...",
    store_cat_all: "All Products",
    store_cat_pesticide: "Pesticides",
    store_cat_weedicide: "Weedicides",
    store_cat_fungicide: "Fungicides",
    store_cat_fertilizer: "Fertilizers",
    store_cat_seed: "Certified Seeds",
    contact_badge: '<i class="fa-solid fa-store"></i> Direct In-Person Visit',
    contact_title: "Haroon Zarai Markaz (Pull 88, Shadi Khan Munda, Kot Addu)",
    contact_desc: "Visit our center or call us for crop trading, certified seeds, authentic sprays, fertilizers, or khata verification.",
    contact_addr_label: "Shop Address:",
    contact_addr_val: "Pull 88, Shadi Khan Munda, Kot Addu (Punjab)",
    contact_phone_label: "Contact Numbers:",
    contact_wa_label: "WhatsApp Helpline:",
    contact_timing_title: "Business Working Hours",
    contact_timing_open: "Open Now",
    contact_timing_weekdays: "Monday - Saturday:",
    contact_timing_sunday: "Sunday (Market Day):",
    contact_timing_portal: "Online Khata Portal:",
    contact_timing_247: "24 Hours / 7 Days Online",
    contact_chat_btn: '<i class="fa-brands fa-whatsapp text-xl"></i> <span>Ask Agri Advice on WhatsApp</span>',
    footer_desc: "Reliable cash trading for Wheat, Rice, Sesame, Sunflower and certified seeds. Complete solutions for fertilizers, sprays, and farmer ledger under one roof.",
    footer_links_title: "Quick Links",
    footer_admin_title: "Administration",
    footer_admin_desc: "For authorized admin staff only.",
    footer_admin_link: '<i class="fa-solid fa-key text-[10px]"></i> Admin Login Portal',
    footer_copy: "© 2026 HAROON ZARAI MARKAZ • All Rights Reserved.",
    footer_slogan: "Serving Farmers, Empowering Agriculture"
  },

  both: {
    lang_btn: "🌐 اردو + EN",
    top_announcement_badge: '<i class="fa-solid fa-bullhorn text-[10px]"></i> تازہ اعلان (Latest Update)',
    top_announcement_text: "🌾 گندم، سفید تل اور سورج مکھی کی نقد خریداری جاری ہے | Immediate cash purchase of Wheat, Sesame & Sunflower!",
    top_timings: "اوقات (Hours): صبح 8 تا رات 8 بجے | 8:00 AM - 8:00 PM",
    brand_title: "ہارون زرعی مرکز",
    brand_sub: "",
    nav_rates: '<i class="fa-solid fa-chart-line text-brand-600"></i> منڈی ریٹس (Mandi Rates)',
    nav_khata: '<i class="fa-solid fa-book-bookmark text-agroorange-500"></i> کسان کھاتہ (Farmer Khata)',
    nav_trade: '<i class="fa-solid fa-handshake text-agroorange-500"></i> خرید و فروخت (Crop Trading)',
    nav_store: '<i class="fa-solid fa-spray-can text-brand-600"></i> ادویات و بیج گائیڈ (Agri Catalog)',
    nav_contact: '<i class="fa-solid fa-location-dot text-brand-600"></i> رابطہ و پتہ (Contact)',
    btn_whatsapp: "WhatsApp رابطہ",
    btn_check_khata: "کھاتہ چیک (Check Khata)",
    hero_badge: "",
    hero_title: "گندم، چاول، تل و سورج مکھی کی نقد خریداری و تصدیق شدہ بیج | Cash Trading & Seeds",
    hero_desc: "ہارون زرعی مرکز کسانوں کا بااعتماد ساتھی۔ فصلوں کے اعلیٰ مارکیٹ ریٹ، اصل زرعی ادویات کی تفصیلی معلوماتی گائیڈ، اور کسانوں کے لیے 24 گھنٹے اپنا آن لائن کھاتہ دیکھنے کی جدید سہولت۔",
    hero_cta_khata: '<i class="fa-solid fa-calculator text-lg"></i> <span>کسان آن لائن کھاتہ (Farmer Khata)</span>',
    hero_cta_trade: '<i class="fa-solid fa-sack-dollar text-yellow-300 text-lg"></i> <span>فصل بیچنے کی پیشکش دیں (Sell Crops)</span>',
    hero_cta_store: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> <span>زرعی ادویات کیٹلاگ (Agri Products Guide)</span>',
    badge_certified: "تصدیق شدہ بیج و ادویات (Certified)",
    badge_cash: "موقع پر نقد ادائیگی (Instant Cash)",
    badge_online: "24/7 آن لائن کھاتہ بک (Online Khata)",
    hero_rates_title: "آج کے نمایاں منڈی ریٹ (Featured Mandi Rates)",
    hero_rates_note: "منڈی ریٹس میں تغیر ممکن ہے (Rates subject to market fluctuation)",
    hero_rates_all: '<span>تمام اجناس کے ریٹ دیکھیں (View All Rates)</span> <i class="fa-solid fa-arrow-left text-[10px]"></i>',
    rates_badge: '<i class="fa-solid fa-scale-balanced text-agroorange-600"></i> منڈی نرخ (Official Market Rates)',
    rates_title: "آج کے تازہ ترین منڈی خرید و فروخت ریٹ (Today's Live Mandi Rates)",
    rates_desc: "ہم گندم، باسمتی دھان، سفید و کالا تل اور سورج مکھی کسانوں سے منڈی کے بہترین نرخوں پر نقد خریدتے ہیں۔",
    rates_banner_title: "کیا آپ کے پاس بڑی مقدار میں فصل موجود ہے؟ (Bulk Quantity Available?)",
    rates_banner_desc: "ہم گاڑی یا ٹرالی موقع پر بھیج کر بھی وزنی کانٹے پر نقد مال اٹھا لیتے ہیں۔",
    rates_banner_btn: 'اپنی فصل فروخت کریں (Sell Your Crop) <i class="fa-solid fa-arrow-left mr-1 text-xs"></i>',
    khata_badge: '<i class="fa-solid fa-shield-halved text-agroorange-600"></i> محفوظ ڈیجیٹل کھاتہ بک (Digital Farmer Ledger)',
    khata_title: "کسان آن لائن کھاتہ و بیلنس پورٹل (Farmer Online Khata & Balance Portal)",
    khata_desc: "کسان بھائی اپنا موبائل نمبر یا کسان آئی ڈی درج کر کے اپنا سابقہ حساب کتاب، بقایا رقم اور رسید چیک کر سکتے ہیں۔",
    khata_label: "کسان آئی ڈی یا موبائل نمبر درج کریں (Enter Farmer ID or Mobile):",
    khata_placeholder: "مثال: 03001234567 یا HZM-101 (e.g. 03001234567 or HZM-101)",
    khata_btn: '<i class="fa-solid fa-magnifying-glass"></i> <span>کھاتہ تلاش کریں (Search Khata)</span>',
    khata_test_label: "آزمائشی نمبر (Click to test):",
    khata_res_registered: "رجسٹرڈ کسان (Registered Farmer)",
    khata_res_father: "ولدیت (Father Name):",
    khata_res_village: "رہائش (Area / Village):",
    khata_res_phone: "فون (Mobile):",
    khata_box_debit: "کل مال خریدا گیا (Debit - ادھار)",
    khata_box_credit: "کل جمع کروائی گئی رقم (Credit - جمع)",
    khata_box_balance: "موجودہ خالص بقایا بیلنس (Net Balance)",
    khata_ledger_title: '<i class="fa-solid fa-receipt text-agroorange-600"></i> <span>کھاتے کا تفصیلی ریکارڈ (Detailed Ledger Statement)</span>',
    khata_print_btn: '<i class="fa-solid fa-print"></i> رسید پرنٹ کریں (Print Slip)',
    khata_wa_btn: '<i class="fa-brands fa-whatsapp"></i> واٹس ایپ (WhatsApp)',
    khata_th_date: "تاریخ (Date)",
    khata_th_item: "پیسے کس چیز کے ہیں (Item / Purpose)",
    khata_th_qty: "مقدار و ریٹ (Qty & Rate)",
    khata_th_type: "نوعیت (Type)",
    khata_th_debit: "مال دیا / نام (Debit)",
    khata_th_credit: "جمع وصولی (Credit)",
    khata_th_balance: "بقایا بیلنس (Balance)",
    khata_th_proof: "رسید / ثبوت (Proof / Slip)",
    khata_footer_note: "نوٹ: کھاتے میں کسی بھی تصحیح کے لیے فوری طور پر ہارون زرعی مرکز تشریف لائیں یا کال کریں۔",
    trade_badge: '<i class="fa-solid fa-handshake-angle text-agroorange-600"></i> کسان ٹریڈنگ پورٹل (Trading Portal)',
    trade_title: "گندم، چاول، تل و سورج مکھی بیچیں یا بیج خریدیں (Sell Crops or Buy Seeds)",
    trade_desc: "اپنی فصل فروخت کرنے کے لیے یا تصدیق شدہ بیج حاصل کرنے کے لیے فارم پُر کریں۔",
    trade_what_to_do: "آپ کیا کرنا چاہتے ہیں؟ (What would you like to do?)",
    trade_radio_sell: '<i class="fa-solid fa-sack-dollar text-agroorange-500 ml-1"></i> فصل بیچیں (Sell Crop)',
    trade_radio_buy: '<i class="fa-solid fa-seedling text-brand-600 ml-1"></i> بیج خریدیں (Buy Seeds)',
    trade_crop_label: "فصل یا بیج کی قسم (Crop Variety):",
    trade_qty_label: "تخمینہ مقدار (Estimated Qty):",
    trade_name_label: "آپ کا نام (Your Name):",
    trade_phone_label: "موبائل نمبر (Mobile):",
    trade_village_label: "گاؤں / علاقہ (Village / Area):",
    trade_rate_label: "متوقع ریٹ (Expected Price):",
    trade_notes_label: "اضافی تفصیل (Notes):",
    trade_submit_btn: '<i class="fa-solid fa-paper-plane"></i> <span>درخواست جمع کروائیں (Submit Request)</span>',
    trade_benefits_title: "ہارون زرعی مرکز کے فوائد (Benefits)",
    trade_b1_title: "موقع پر نقد ادائیگی (Instant Cash):",
    trade_b1_desc: "تول مکمل ہونے کے فوری بعد کیش یا بینک ٹرانسفر۔",
    trade_b2_title: "کمپیوٹرائزڈ وزنی کانٹا (Digital Weighbridge):",
    trade_b2_desc: "ایک گرام کی بھی کٹوتی کے بغیر بالکل صاف اور شفاف وزن۔",
    trade_b3_title: "ڈیرے پر مال اٹھانے کی سہولت (Farm Pickup):",
    trade_b3_desc: "ٹرالی یا ٹرک کا انتظام اور موقع پر خریداری۔",
    trade_b4_title: "کھاتے میں کٹوتی کی سہولت (Khata Adjustment):",
    trade_b4_desc: "کھاد یا دوا کے ادھار سے فصل کی رقم ایڈجسٹ ہو سکتی ہے۔",
    trade_call_title: "براہِ راست ڈیل کے لیے کال کریں (Direct Call)",
    trade_call_owner: "میاں ہارون رشید (Mian Haroon Rashid)",
    store_badge: '<i class="fa-solid fa-book-medical text-agroorange-500"></i> معلوماتی کیٹلاگ (Informational Catalog)',
    store_title: "زرعی ادویات، کھاد و بیج معلوماتی گائیڈ (Agri Products Guide)",
    store_desc: "کسانوں کی رہنمائی کے لیے مستند برانڈز کی زرعی ادویات، بیج، موزوں فصلیں اور فی ایکڑ طریقہ استعمال (Comprehensive Agricultural Products & Dosage Guide)۔",
    store_search_ph: "دوا، کھاد یا بیج تلاش کریں (Search product, spray, seed)...",
    store_cat_all: "تمام پراڈکٹس (All)",
    store_cat_pesticide: "کیڑے مار زہر (Pesticides)",
    store_cat_weedicide: "جڑی بوٹی مار (Weedicides)",
    store_cat_fungicide: "پھپھوندی کش (Fungicides)",
    store_cat_fertilizer: "کھاد و نیوٹریشن (Fertilizers)",
    store_cat_seed: "تصدیق شدہ بیج (Certified Seeds)",
    contact_badge: '<i class="fa-solid fa-store"></i> براہ راست تشریف لائیں (Visit Center)',
    contact_title: "ہارون زرعی مرکز (پل 88، شادی خان منڈا، کوٹ ادو)",
    contact_desc: "کسی بھی قسم کی زرعی رہنمائی، گندم، تل یا سورج مکھی کا سودا کرنے کے لیے ہمارے مرکز پر تشریف لائیں یا فون پر رابطہ کریں۔",
    contact_addr_label: "دکان کا پتہ (Shop Address):",
    contact_addr_val: "پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)",
    contact_phone_label: "رابطہ نمبرز (Phone Numbers):",
    contact_wa_label: "واٹس ایپ ہیلپ لائن (WhatsApp Helpline):",
    contact_timing_title: "اوقاتِ کار (Working Hours)",
    contact_timing_open: "کھلا ہے (Open)",
    contact_timing_weekdays: "پیر تا ہفتہ (Mon - Sat):",
    contact_timing_sunday: "اتوار (Sunday):",
    contact_timing_portal: "آن لائن پورٹل (Online Portal):",
    contact_timing_247: "24 گھنٹے 7 دن آن لائن (24/7 Online)",
    contact_chat_btn: '<i class="fa-brands fa-whatsapp text-xl"></i> <span>واٹس ایپ پر زرعی معلومات لیں (Chat on WhatsApp)</span>',
    footer_desc: "گندم، چاول، سفید تل، سورج مکھی بیج اور دیگر تمام اجناس کی بااعتماد خرید و فروخت۔ زرعی ادویات، کھاد اور کسان کھاتہ بک کا ایک ہی چھت تلے مکمل حل۔",
    footer_links_title: "اہم لنکس (Quick Links)",
    footer_admin_title: "انتظامیہ (Admin Portal)",
    footer_admin_desc: "صرف بااختیار ایڈمن عملے کے لیے۔",
    footer_admin_link: '<i class="fa-solid fa-key text-[10px]"></i> ایڈمن لاگ ان لنک (Admin Portal)',
    footer_copy: "© 2026 ہارون زرعی مرکز (HAROON ZARAI MARKAZ) • جملہ حقوق محفوظ ہیں۔",
    footer_slogan: "کسان کی خدمت، پاکستان کی ترقی (Serving Farmers, Empowering Agriculture)"
  }
};

let currentLang = localStorage.getItem('hzm_lang') || 'ur';

function setLanguage(lang) {
  if (lang !== 'ur' && lang !== 'en' && lang !== 'both') lang = 'ur';
  currentLang = lang;
  localStorage.setItem('hzm_lang', lang);

  const dict = translations[lang] || translations.ur;
  const html = document.documentElement;
  const body = document.body;

  if (lang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    body.classList.remove('rtl');
    body.classList.add('ltr');
  } else {
    // Both 'ur' and 'both' run in RTL mode with Nastaliq font
    html.setAttribute('lang', 'ur');
    html.setAttribute('dir', 'rtl');
    body.classList.remove('ltr');
    body.classList.add('rtl');
  }

  // Update text of all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      elem.innerHTML = dict[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-ph');
    if (dict[key] !== undefined) {
      elem.setAttribute('placeholder', dict[key]);
    }
  });

  // Update language pill active states
  document.querySelectorAll('.lang-pill').forEach(btn => {
    const bLang = btn.getAttribute('data-lang');
    if (bLang === lang) {
      btn.className = "lang-pill active bg-gradient-to-r from-agroorange-500 to-amber-500 text-white font-black px-2.5 py-1 rounded-lg shadow-xs transition";
    } else {
      btn.className = "lang-pill text-gray-700 hover:text-agroorange-600 hover:bg-agroyellow-100 font-bold px-2.5 py-1 rounded-lg transition";
    }
  });

  // Update mobile button label
  const mobileBtnLabel = document.getElementById('mobile-lang-btn-label');
  if (mobileBtnLabel) {
    if (lang === 'ur') mobileBtnLabel.innerText = "🇵🇰 اردو";
    else if (lang === 'en') mobileBtnLabel.innerText = "🇬🇧 English";
    else mobileBtnLabel.innerText = "🌐 اردو + EN";
  }

  // Preserve dynamic address and phone values
  if (window.CURRENT_ADDRESS) {
    const addrElem = document.getElementById('contact-address');
    if (addrElem) addrElem.innerText = window.CURRENT_ADDRESS;
  }
  if (window.CURRENT_PHONE) {
    const pElem = document.getElementById('top-phone');
    if (pElem) pElem.innerText = window.CURRENT_PHONE;
    const pLink = document.getElementById('contact-phone-link');
    if (pLink) pLink.innerText = window.CURRENT_PHONE;
    const tPhone = document.getElementById('trade-call-phone');
    if (tPhone) tPhone.innerText = window.CURRENT_PHONE;
  }
  if (window.CURRENT_RAW_WA) {
    const waElem = document.getElementById('contact-wa-link');
    if (waElem) waElem.innerText = window.CURRENT_RAW_WA;
  }

  // Re-render components with the selected language
  if (typeof renderMandiRates === 'function' && typeof globalRates !== 'undefined') {
    renderMandiRates(globalRates);
    renderHeroMiniRates(globalRates);
    renderTicker(globalRates);
  }
  if (typeof renderProductsGrid === 'function' && typeof globalProducts !== 'undefined') {
    renderProductsGrid();
  }
  if (typeof displayFarmerKhata === 'function' && currentLoadedFarmer) {
    displayFarmerKhata(currentLoadedFarmer);
  }
}

// Cycle between all 3 languages when clicked on single toggle button
function cycleLanguage() {
  let next = 'ur';
  if (currentLang === 'ur') next = 'en';
  else if (currentLang === 'en') next = 'both';
  else next = 'ur';
  setLanguage(next);
}

function toggleLanguage() {
  cycleLanguage();
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});
