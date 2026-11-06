// Haroon Zarai Markaz - Public Frontend JS

let globalSettings = {};
let globalRates = [];
let globalProducts = [];
let currentCategory = 'all';
let currentLoadedFarmer = null;

// Global Urdu Typography Controller for Customer Portal
function applyUrduFont(fontKey) {
  if (!fontKey) fontKey = 'noto-sans';
  document.documentElement.setAttribute('data-urdu-font', fontKey);
  const fontMap = {
    'noto-sans': { family: "'Noto Sans Arabic', 'Inter', sans-serif", line: '1.6' },
    'gulzar': { family: "'Gulzar', 'Inter', serif", line: '2.1' },
    'amiri': { family: "'Amiri', 'Inter', serif", line: '1.75' },
    'noto-nastaliq': { family: "'Noto Nastaliq Urdu', 'Inter', serif", line: '2.1' },
    'vazirmatn': { family: "'Vazirmatn', 'Inter', sans-serif", line: '1.6' }
  };
  const font = fontMap[fontKey] || fontMap['noto-sans'];
  document.documentElement.style.setProperty('--font-urdu', font.family);
  document.documentElement.style.setProperty('--font-urdu-line-height', font.line);
  document.body.className = (document.body.className || '').replace(/\bfont-[a-z-]+\b/g, '') + ' font-' + fontKey;
}

// Initialize on document ready
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadMandiRates();
  loadProducts();
  setupEventListeners();
  checkFarmerAutoLogin();
  
  // Set current date in Urdu format in hero
  const today = new Date();
  const dateStr = today.toLocaleDateString('ur-PK', { day: 'numeric', month: 'long', year: 'numeric' });
  const heroDateElem = document.getElementById('hero-today-date');
  if (heroDateElem) heroDateElem.innerText = dateStr || "28 اکتوبر 2026";

  // Check URL params for auto-printing personal khata slip if already logged in
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('printKhata')) {
    setTimeout(() => {
      if (currentLoadedFarmer) printKhataSlip();
    }, 800);
  }
});

// Setup event listeners
function setupEventListeners() {
  // Khata search form
  const khataForm = document.getElementById('khata-search-form');
  if (khataForm) {
    khataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('khata-query-input').value.trim();
      searchKhata(query);
    });
  }

  // Trade form
  const tradeForm = document.getElementById('trade-form');
  if (tradeForm) {
    tradeForm.addEventListener('submit', submitTradeRequest);
  }

  // Store search input
  const storeSearch = document.getElementById('store-search-input');
  if (storeSearch) {
    storeSearch.addEventListener('input', (e) => {
      renderProductsGrid(e.target.value.trim());
    });
  }
}

function cleanWhatsAppNumber(raw) {
  if (!raw) return '923007654321';
  let clean = String(raw).replace(/[^0-9]/g, '');
  if (clean.startsWith('03')) {
    clean = '92' + clean.slice(1);
  } else if (clean.startsWith('0092')) {
    clean = clean.slice(2);
  }
  return clean || '923007654321';
}

function cleanTelNumber(raw) {
  if (!raw) return '03007654321';
  return String(raw).replace(/[^0-9+]/g, '');
}

// 1. Load Settings
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      globalSettings = await res.json();
      
      // Apply active Urdu font chosen by Admin
      applyUrduFont(globalSettings.urduFont || 'noto-sans');
      
      const phone = globalSettings.phone || '0300-7654321';
      const cleanTel = cleanTelNumber(phone);
      const rawWa = globalSettings.whatsapp || globalSettings.phone || '923007654321';
      const cleanWa = cleanWhatsAppNumber(rawWa);
      const address = globalSettings.address || 'پل 88، شادی خان منڈا، کوٹ ادو (PULL 88, Shadi Khan Munda, Kot Addu)';

      window.CURRENT_PHONE = phone;
      window.CURRENT_CLEAN_TEL = cleanTel;
      window.CURRENT_WHATSAPP = cleanWa;
      window.CURRENT_RAW_WA = rawWa;
      window.CURRENT_ADDRESS = address;

      // 1. Announcement Banner
      if (globalSettings.announcement) {
        const ann = document.getElementById('announcement-text');
        if (ann) ann.innerText = globalSettings.announcement;
      }

      // 2. Top Bar Phone & Link
      const topPhone = document.getElementById('top-phone');
      if (topPhone) topPhone.innerText = phone;
      const topPhoneLink = document.getElementById('top-phone-link');
      if (topPhoneLink) topPhoneLink.href = `tel:${cleanTel}`;

      // 3. Header WhatsApp Button
      const waBtn = document.getElementById('whatsapp-header-btn');
      if (waBtn) waBtn.href = `https://wa.me/${cleanWa}`;

      // 4. Trade Call Section Phone & Link
      const tradeCallPhone = document.getElementById('trade-call-phone');
      if (tradeCallPhone) tradeCallPhone.innerText = phone;
      const tradeCallLink = document.getElementById('trade-call-link');
      if (tradeCallLink) tradeCallLink.href = `tel:${cleanTel}`;

      // 5. Contact Section Address
      const addr = document.getElementById('contact-address');
      if (addr) addr.innerText = address;

      // 6. Contact Section Phone Link
      const contactPhoneLink = document.getElementById('contact-phone-link');
      if (contactPhoneLink) {
        contactPhoneLink.innerText = phone;
        contactPhoneLink.href = `tel:${cleanTel}`;
      }

      // 7. Contact Section WhatsApp Link
      const contactWaLink = document.getElementById('contact-wa-link');
      if (contactWaLink) {
        contactWaLink.innerText = rawWa;
        contactWaLink.href = `https://wa.me/${cleanWa}`;
      }

      // 8. Hero Shop Name & Address Banner
      const heroAddr = document.getElementById('hero-address-text');
      if (heroAddr) heroAddr.innerText = address;
      const heroName = document.getElementById('hero-business-name');
      if (heroName && globalSettings.businessName) heroName.innerText = globalSettings.businessName;
      const heroTagline = document.getElementById('hero-tagline-text');
      if (heroTagline && globalSettings.tagline) heroTagline.innerText = globalSettings.tagline;

      // 8. Contact Section Big WhatsApp Chat Button
      const contactBigWaBtn = document.getElementById('contact-big-wa-btn');
      if (contactBigWaBtn) {
        const text = encodeURIComponent('السلام علیکم، ہارون زرعی مرکز سے معلومات چاہیئں');
        contactBigWaBtn.href = `https://wa.me/${cleanWa}?text=${text}`;
      }

      // 9. Printable Receipt Slip Contact
      const printSlipContact = document.getElementById('print-slip-contact');
      if (printSlipContact) {
        printSlipContact.innerText = `${address} • فون: ${phone}`;
      }

      // Re-render product cards so "Order on WhatsApp" uses the newly loaded number
      if (globalProducts && globalProducts.length > 0) {
        renderProductsGrid();
      }
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

// 2. Load Mandi Rates
async function loadMandiRates() {
  try {
    const res = await fetch('/api/rates');
    if (res.ok) {
      globalRates = await res.json();
      renderMandiRates(globalRates);
      renderHeroMiniRates(globalRates);
      renderTicker(globalRates);
    }
  } catch (err) {
    console.error('Error loading mandi rates:', err);
  }
}

function renderTicker(rates) {
  const ticker = document.getElementById('running-ticker');
  if (!ticker || !rates.length) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isBoth = typeof currentLang !== 'undefined' && currentLang === 'both';

  const items = rates.map(r => {
    let cropName = r.cropNameUrdu;
    if (isEn) cropName = r.cropNameEn || r.cropNameUrdu;
    else if (isBoth) cropName = `${r.cropNameUrdu} (${r.cropNameEn || ''})`;

    const buyLabel = isEn ? "Buy" : (isBoth ? "خرید (Buy)" : "خرید");
    const sellLabel = isEn ? "Sell" : (isBoth ? "فروخت (Sell)" : "فروخت");
    const curLabel = isEn ? "Rs." : (isBoth ? "روپے (Rs.)" : "روپے");
    return `<span class="inline-flex items-center gap-2">🌾 <strong>${cropName}:</strong> ${buyLabel} ${r.buyPrice.toLocaleString()} ${curLabel} | ${sellLabel} ${r.sellPrice.toLocaleString()} ${curLabel} (${r.unit})</span>`;
  }).join(' <span class="text-amber-900 mx-2">•</span> ');

  // Duplicate for smooth seamless loop
  ticker.innerHTML = items + ' <span class="text-amber-900 mx-2">•</span> ' + items;
}

function renderHeroMiniRates(rates) {
  const container = document.getElementById('hero-mini-rates');
  if (!container) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isBoth = typeof currentLang !== 'undefined' && currentLang === 'both';
  const featured = rates.slice(0, 4);

  container.innerHTML = featured.map(r => {
    let cropName = r.cropNameUrdu;
    if (isEn) cropName = r.cropNameEn || r.cropNameUrdu;
    else if (isBoth) cropName = `${r.cropNameUrdu} (${r.cropNameEn || ''})`;

    const trendText = r.trend === 'up' 
      ? (isEn ? 'Bullish' : (isBoth ? 'تیز (Bullish)' : 'تیز'))
      : (r.trend === 'down' 
        ? (isEn ? 'Bearish' : (isBoth ? 'مندی (Bearish)' : 'مندی'))
        : (isEn ? 'Stable' : (isBoth ? 'مستحکم (Stable)' : 'مستحکم')));

    const trendIcon = r.trend === 'up' 
      ? `<span class="text-emerald-600 font-bold text-xs flex items-center gap-0.5"><i class="fa-solid fa-arrow-trend-up"></i> ${trendText}</span>`
      : (r.trend === 'down' 
        ? `<span class="text-rose-600 font-bold text-xs flex items-center gap-0.5"><i class="fa-solid fa-arrow-trend-down"></i> ${trendText}</span>`
        : `<span class="text-gray-500 font-bold text-xs flex items-center gap-0.5"><i class="fa-solid fa-minus"></i> ${trendText}</span>`);

    return `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-agroyellow-50/80 hover:bg-brand-50/80 transition border border-agroyellow-200/70 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-agroorange-100 text-agroorange-600 flex items-center justify-center font-bold text-xs">
            <i class="fa-solid fa-wheat-awn"></i>
          </div>
          <div>
            <h5 class="text-xs font-bold text-gray-900 font-urdu leading-tight">${cropName}</h5>
            <span class="text-[10px] text-gray-500">${r.unit}</span>
          </div>
        </div>
        <div class="text-left">
          <div class="text-sm font-black font-mono text-brand-900">Rs. ${r.buyPrice.toLocaleString()}</div>
          ${trendIcon}
        </div>
      </div>
    `;
  }).join('');
}

function renderMandiRates(rates, searchQuery = '') {
  const grid = document.getElementById('rates-cards-grid');
  if (!grid) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isBoth = typeof currentLang !== 'undefined' && currentLang === 'both';

  let list = rates || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(r => 
      (r.cropNameUrdu && r.cropNameUrdu.toLowerCase().includes(q)) ||
      (r.cropNameEn && r.cropNameEn.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }

  if (!list || list.length === 0) {
    grid.innerHTML = `<div class="col-span-4 text-center py-8 text-gray-500 font-bold">${isEn ? 'No mandi rates available matching your search.' : (isBoth ? 'کوئی ریٹس دستیاب نہیں (No rates found)' : 'کوئی منڈی ریٹس تلاش کے مطابق دستیاب نہیں ہیں۔')}</div>`;
    return;
  }

  grid.innerHTML = list.map(r => {
    let cropName = r.cropNameUrdu;
    let subTitle = r.cropNameEn;

    if (isEn) {
      cropName = r.cropNameEn || r.cropNameUrdu;
      subTitle = r.cropNameUrdu;
    } else if (isBoth) {
      cropName = `${r.cropNameUrdu} (${r.cropNameEn || ''})`;
      subTitle = 'غلہ منڈی باضابطہ ریٹ (Official Mandi Rate)';
    }

    const trendBadge = r.trend === 'up'
      ? `<span class="bg-brand-100 text-brand-800 border border-brand-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <i class="fa-solid fa-arrow-trend-up text-brand-600"></i> ${isEn ? 'Market Bullish' : (isBoth ? 'مارکیٹ تیز (Bullish)' : 'مارکیٹ تیز')}
        </span>`
      : (r.trend === 'down'
        ? `<span class="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <i class="fa-solid fa-arrow-trend-down"></i> ${isEn ? 'Market Bearish' : (isBoth ? 'مندی (Bearish)' : 'مندی')}
          </span>`
        : `<span class="bg-agroyellow-100 text-agroyellow-800 border border-agroyellow-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <i class="fa-solid fa-minus"></i> ${isEn ? 'Rate Stable' : (isBoth ? 'ریٹ مستحکم (Stable)' : 'ریٹ مستحکم')}
          </span>`);

    const buyLabel = isEn ? 'Cash Buy Rate:' : (isBoth ? 'ہماری نقد خرید (Cash Buy):' : 'ہماری نقد خرید ریٹ:');
    const sellLabel = isEn ? 'Our Sell Rate:' : (isBoth ? 'ہماری فروخت (Our Sell):' : 'ہماری فروخت ریٹ:');

    return `
      <div class="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition border border-agroorange-100 hover:border-agroorange-300 flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-9 h-9 rounded-xl bg-agroyellow-100 text-agroorange-600 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-seedling"></i>
            </span>
            ${trendBadge}
          </div>

          <h3 class="text-base font-black text-gray-900 font-urdu leading-snug group-hover:text-agroorange-600 transition">
            ${cropName}
          </h3>
          <p class="text-[11px] text-gray-500 mt-0.5">${subTitle} • ${r.unit}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-agroorange-100 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-600 font-semibold">${buyLabel}</span>
            <span class="text-base font-black text-brand-900 font-mono">Rs. ${r.buyPrice.toLocaleString()}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-500 font-semibold">${sellLabel}</span>
            <span class="text-sm font-bold text-agroorange-700 font-mono">Rs. ${r.sellPrice.toLocaleString()}</span>
          </div>
          ${r.notes ? `<p class="text-[10px] text-agroorange-800 bg-agroorange-50 p-1.5 rounded-lg font-medium border border-agroorange-100">${r.notes}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 3. Khata Search (Farmer checks their own ledger)
async function searchKhata(query) {
  const alertBox = document.getElementById('khata-alert');
  const resultBox = document.getElementById('khata-result-box');
  const searchBtn = document.getElementById('khata-search-btn');

  alertBox.classList.add('hidden');
  resultBox.classList.add('hidden');

  if (!query) {
    showAlert(alertBox, 'براہ کرم کسان آئی ڈی یا موبائل نمبر درج کریں۔', 'error');
    return;
  }

  // Set loading state
  searchBtn.disabled = true;
  searchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>تلاش ہو رہا ہے...</span>`;

  try {
    const res = await fetch(`/api/khata/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok || !data.found) {
      showAlert(alertBox, data.message || 'اس نمبر یا آئی ڈی پر کوئی کھاتہ نہیں ملا۔ براہ کرم صحیح نمبر درج کریں یا مرکز سے رابطہ کریں۔', 'error');
      currentLoadedFarmer = null;
      return;
    }

    currentLoadedFarmer = data.farmer;
    displayFarmerKhata(data.farmer);
    resultBox.classList.remove('hidden');

    // Smooth scroll to results
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Search error:', err);
    showAlert(alertBox, 'سرور سے رابطہ نہیں ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔', 'error');
  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> <span>کھاتہ تلاش کریں</span>`;
  }
}

function quickSearch(val) {
  const input = document.getElementById('khata-query-input');
  if (input) {
    input.value = val;
    searchKhata(val);
  }
}

function displayFarmerKhata(farmer) {
  if (!farmer) return;
  currentLoadedFarmer = farmer;

  const setElemText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setElemText('res-farmer-id', farmer.id || '-');
  setElemText('res-farmer-name', farmer.name || '-');
  setElemText('res-farmer-father', farmer.fatherName || "غیر درج شدہ");
  setElemText('res-farmer-village', farmer.village || "پل 88، کوٹ ادو");
  setElemText('res-farmer-phone', farmer.mobile || farmer.email || "-");
  setElemText('res-farmer-mobile', farmer.mobile || farmer.email || "-");
  setElemText('res-farmer-acres', farmer.landAcres ? `${farmer.landAcres} ایکڑ` : "غیر درج شدہ");

  // Balance Indicator
  const bal = Number(farmer.currentBalance) || 0;
  const absBal = Math.abs(bal);

  // 1. Direct Balance on khata.html (#res-farmer-balance)
  const balElem = document.getElementById('res-farmer-balance');
  if (balElem) {
    if (bal > 0) {
      balElem.className = "text-3xl sm:text-4xl font-black font-mono tracking-tight text-rose-600";
      balElem.innerText = `Rs. ${bal.toLocaleString()}`;
    } else if (bal < 0) {
      balElem.className = "text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-600";
      balElem.innerText = `Rs. ${absBal.toLocaleString()}`;
    } else {
      balElem.className = "text-3xl sm:text-4xl font-black font-mono tracking-tight text-blue-600";
      balElem.innerText = `Rs. 0`;
    }
  }

  // 2. Status Pill (#res-farmer-status-pill)
  const pillElem = document.getElementById('res-farmer-status-pill');
  if (pillElem) {
    if (bal > 0) {
      pillElem.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300";
      pillElem.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>آپ کے ذمے واجب الادا بقایا رقم</span>`;
    } else if (bal < 0) {
      pillElem.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300";
      pillElem.innerHTML = `<i class="fa-solid fa-check"></i> <span>مرکز کے ذمے کسان کی واجب الوصول رقم</span>`;
    } else {
      pillElem.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300";
      pillElem.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>کھاتہ مکمل کلیئر ہے</span>`;
    }
  }

  // 3. Status Description (#res-farmer-status-desc)
  const descElem = document.getElementById('res-farmer-status-desc');
  if (descElem) {
    if (bal > 0) {
      descElem.innerText = "براہ کرم فصل کی کٹائی یا نقد رقم کی ادائیگی مرکز پر بروقت فرمائیں۔";
    } else if (bal < 0) {
      descElem.innerText = "یہ رقم آپ کسی بھی وقت ہارون زرعی مرکز کاؤنٹر سے وصول فرما سکتے ہیں۔";
    } else {
      descElem.innerText = "الحمدللہ! تمام سابقہ ادھار و وصولیاں مکمل کلیئر ہیں۔";
    }
  }

  // 4. Legacy Balance Badge (#res-balance-badge) if present
  const badgeContainer = document.getElementById('res-balance-badge');
  if (badgeContainer) {
    if (bal > 0) {
      badgeContainer.className = "p-4 rounded-2xl text-center min-w-[220px] bg-rose-50 border-2 border-rose-300 shadow-sm";
      badgeContainer.innerHTML = `
        <span class="text-xs font-bold text-rose-800 block">آپ کے ذمے واجب الادا بقایا رقم</span>
        <span class="text-2xl font-black text-rose-600 font-mono block mt-0.5">Rs. ${bal.toLocaleString()}</span>
        <span class="text-[10px] text-rose-700 mt-1 block">براہ کرم فصل یا نقد کی ادائیگی وقت پر کریں</span>
      `;
    } else if (bal < 0) {
      badgeContainer.className = "p-4 rounded-2xl text-center min-w-[220px] bg-emerald-50 border-2 border-emerald-300 shadow-sm";
      badgeContainer.innerHTML = `
        <span class="text-xs font-bold text-emerald-800 block">مرکز کے ذمے آپ کی واجب الوصول رقم</span>
        <span class="text-2xl font-black text-emerald-600 font-mono block mt-0.5">Rs. ${absBal.toLocaleString()}</span>
        <span class="text-[10px] text-emerald-700 mt-1 block">آپ یہ رقم کسی بھی وقت مرکز سے وصول کر سکتے ہیں</span>
      `;
    } else {
      badgeContainer.className = "p-4 rounded-2xl text-center min-w-[220px] bg-blue-50 border-2 border-blue-300 shadow-sm";
      badgeContainer.innerHTML = `
        <span class="text-xs font-bold text-blue-800 block">الحمدللہ کھاتہ مکمل کلیئر ہے</span>
        <span class="text-2xl font-black text-blue-600 font-mono block mt-0.5">Rs. 0</span>
        <span class="text-[10px] text-blue-700 mt-1 block">کوئی بقایا رقم واجب الادا نہیں</span>
      `;
    }
  }

  // Summary Metrics
  let totalDebit = farmer.totalDebit;
  let totalCredit = farmer.totalCredit;
  if (totalDebit === undefined || totalCredit === undefined) {
    totalDebit = 0;
    totalCredit = 0;
    (farmer.transactions || []).forEach(t => {
      if (t.type === 'debit') totalDebit += (Number(t.amount) || 0);
      else totalCredit += (Number(t.amount) || 0);
    });
  }

  setElemText('res-total-debit', `Rs. ${totalDebit.toLocaleString()}`);
  setElemText('res-total-credit', `Rs. ${totalCredit.toLocaleString()}`);
  setElemText('res-net-balance', `Rs. ${bal.toLocaleString()}`);

  const txList = farmer.transactions || [];
  const custTxInput = document.getElementById('customer-tx-search-input');
  if (custTxInput) custTxInput.value = '';
  renderCustomerTransactionsRows(txList, false);

  // Load Payables to this Farmer (خریدی گئی فصلیں و دیگر واجبات)
  if (farmer.id) {
    loadCustomerFarmerPayables(farmer.id);
  }
}

// Render Customer Transactions Table
function renderCustomerTransactionsRows(txList, isFiltered = false) {
  const tbody = document.getElementById('res-farmer-tx-body') || document.getElementById('res-transactions-tbody');
  const countBadge = document.getElementById('tx-count-badge');
  if (countBadge) {
    countBadge.innerText = `${txList ? txList.length : 0} اندراجات${isFiltered ? ' (تلاش شدہ)' : ''}`;
  }
  if (!tbody) return;

  if (!txList || txList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-gray-400">
          <i class="fa-solid fa-receipt text-3xl mb-2 text-gray-300 block"></i>
          <span class="font-bold">${isFiltered ? 'کوئی اندراج تلاش کے مطابق نہیں ملا۔' : 'ابھی تک اس کھاتے میں کوئی لین دین درج نہیں ہے۔'}</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = txList.map((tx) => {
    const isDebit = tx.type === 'debit';
    const prodName = tx.productName || tx.description || 'زرعی مال / کھاتہ';
    const qtyRate = tx.quantity ? `${tx.quantity}${tx.unitPrice ? ` @ Rs. ${Number(tx.unitPrice).toLocaleString()}` : ''}` : '';
    const categoryLabel = tx.category || (isDebit ? 'ادھار مال' : 'نقد جمع');
    const debitText = isDebit ? `Rs. ${Number(tx.amount || 0).toLocaleString()}` : '-';
    const creditText = !isDebit ? `Rs. ${Number(tx.amount || 0).toLocaleString()}` : '-';
    const balanceAfter = tx.balanceAfter !== undefined ? `Rs. ${Number(tx.balanceAfter).toLocaleString()}` : '-';
    const proofImg = tx.proofImage || tx.receiptImage || '';

    return `
      <tr class="hover:bg-agroyellow-50/60 transition border-b border-gray-100">
        <td class="p-3.5 whitespace-nowrap text-gray-600 font-mono text-xs font-bold">
          ${tx.date || '-'}
        </td>
        <td class="p-3.5 whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${isDebit ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
            <i class="fa-solid ${isDebit ? 'fa-arrow-up text-rose-600' : 'fa-arrow-down text-emerald-600'} text-[10px]"></i>
            <span>${categoryLabel}</span>
          </span>
        </td>
        <td class="p-3.5">
          <div class="font-black text-gray-900 text-sm">${prodName}</div>
          ${qtyRate ? `<div class="text-xs font-bold text-brand-800 mt-0.5"><i class="fa-solid fa-boxes-stacked text-[10px]"></i> مقدار و ریٹ: <span class="font-mono">${qtyRate}</span></div>` : ''}
          ${tx.description && tx.description !== prodName ? `<div class="text-[11px] text-gray-500 mt-0.5">${tx.description}</div>` : ''}
          ${tx.addedBy ? `<div class="text-[10px] text-gray-400 mt-0.5">درج کنندہ: ${tx.addedBy}</div>` : ''}
        </td>
        <td class="p-3.5 whitespace-nowrap font-mono font-black text-rose-600 text-sm">
          ${debitText}
        </td>
        <td class="p-3.5 whitespace-nowrap font-mono font-black text-emerald-600 text-sm">
          ${creditText}
        </td>
        <td class="p-3.5 whitespace-nowrap font-mono font-black text-gray-900 text-sm">
          ${balanceAfter}
        </td>
        <td class="p-3.5 whitespace-nowrap text-center">
          ${proofImg ? `
            <button type="button" onclick="openProofModal('${proofImg.replace(/'/g, "\\'")}', '${(prodName || '').replace(/'/g, "\\'")}', '${tx.date || ''}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold px-2.5 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer">
              <i class="fa-solid fa-image text-indigo-600"></i>
              <span>رسید دیکھیں</span>
            </button>
          ` : `<span class="text-gray-300 font-mono text-xs">-</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// Search inside customer's khata ledger
function triggerCustomerTxSearch() {
  const input = document.getElementById('customer-tx-search-input');
  const q = input ? input.value.trim().toLowerCase() : '';
  if (!currentLoadedFarmer) return;

  const txList = currentLoadedFarmer.transactions || [];
  if (!q) {
    renderCustomerTransactionsRows(txList, false);
    return;
  }

  const filtered = txList.filter(tx => {
    const prod = (tx.productName || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const date = (tx.date || '').toLowerCase();
    const cat = (tx.category || '').toLowerCase();
    const amt = (tx.amount || '').toString();
    const qty = (tx.quantity || '').toLowerCase();
    return prod.includes(q) || desc.includes(q) || date.includes(q) || cat.includes(q) || amt.includes(q) || qty.includes(q);
  });

  renderCustomerTransactionsRows(filtered, true);
}

function clearCustomerTxSearch() {
  const input = document.getElementById('customer-tx-search-input');
  if (input) input.value = '';
  if (currentLoadedFarmer) {
    renderCustomerTransactionsRows(currentLoadedFarmer.transactions || [], false);
  }
}

// Customer Product Search (Adviyaat)
function triggerCustomerProductSearch() {
  const input = document.getElementById('product-search-input') || document.getElementById('store-search-input');
  const val = input ? input.value.trim() : '';
  renderProductsGrid(val);
}

function clearCustomerProductSearch() {
  const input = document.getElementById('product-search-input') || document.getElementById('store-search-input');
  if (input) input.value = '';
  renderProductsGrid('');
}

// Customer Mandi Rates Search
function triggerMandiSearch() {
  const input = document.getElementById('mandi-rate-search-input');
  const val = input ? input.value.trim() : '';
  renderMandiRates(globalRates, val);
}

function clearMandiSearch() {
  const input = document.getElementById('mandi-rate-search-input');
  if (input) input.value = '';
  renderMandiRates(globalRates, '');
}

// Refresh Customer Khata in Real Time
async function refreshCustomerKhata(showToast = true) {
  let farmerId = null;
  let token = '';

  const sessionStr = localStorage.getItem('hzm_farmer_session');
  if (sessionStr) {
    try {
      const s = JSON.parse(sessionStr);
      farmerId = s.farmerId;
      token = s.token || '';
    } catch(e) {}
  }

  if (!farmerId && currentLoadedFarmer) {
    farmerId = currentLoadedFarmer.id;
  }

  if (!farmerId) return;

  const refreshBtn = document.getElementById('btn-refresh-khata');
  const origHtml = refreshBtn ? refreshBtn.innerHTML : '';
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> <span>ریفریش ہو رہا ہے...</span>`;
  }

  try {
    const res = await fetch(`/api/farmer/me?id=${encodeURIComponent(farmerId)}&token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.farmer) {
        currentLoadedFarmer = data.farmer;
        renderFarmerSession(data.farmer);
        displayFarmerKhata(data.farmer);
        const resultBox = document.getElementById('khata-result-box');
        if (resultBox) resultBox.classList.remove('hidden');

        if (showToast) {
          const alertBox = document.getElementById('farmer-login-alert') || document.getElementById('khata-alert');
          if (alertBox) showAlert(alertBox, 'کھاتے کی تازہ ترین تفصیلات کامیابی سے لوڈ ہو گئیں!', 'success');
        }
      }
    }
  } catch(e) {
    console.warn('refreshCustomerKhata error:', e);
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = origHtml || `<i class="fa-solid fa-rotate"></i> کھاتہ ریفریش کریں`;
    }
  }
}

// Auto Refresh Khata whenever the customer returns to tab
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if (localStorage.getItem('hzm_farmer_session') || currentLoadedFarmer) {
      refreshCustomerKhata(false);
    }
  });
}

// Print Khata Slip
function printKhataSlip() {
  if (!currentLoadedFarmer) return;

  const f = currentLoadedFarmer;
  const setElemText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setElemText('print-farmer-name', f.name || '-');
  setElemText('print-farmer-id', f.id || '-');
  setElemText('print-farmer-father', f.fatherName || '-');
  setElemText('print-farmer-village', f.village || '-');
  setElemText('print-farmer-mobile', f.mobile || '-');
  setElemText('print-date', new Date().toLocaleString());

  const printBal = document.getElementById('print-net-balance');
  const printTitle = document.getElementById('print-balance-title');

  if (printBal && printTitle) {
    if (f.currentBalance > 0) {
      printTitle.innerText = "کسان کے ذمے خالص واجب الادا بقایا رقم:";
      printBal.innerText = `Rs. ${f.currentBalance.toLocaleString()}`;
      printBal.style.color = "#b91c1c";
    } else if (f.currentBalance < 0) {
      printTitle.innerText = "مرکز کے ذمے کسان کی واجب الوصول رقم:";
      printBal.innerText = `Rs. ${Math.abs(f.currentBalance).toLocaleString()}`;
      printBal.style.color = "#15803d";
    } else {
      printTitle.innerText = "کھاتہ بالکل کلیئر ہے (صفر بیلنس):";
      printBal.innerText = "Rs. 0";
      printBal.style.color = "#2563eb";
    }
  }

  const printBody = document.getElementById('print-transactions-body');
  if (printBody) {
    const txList = f.transactions || [];
    printBody.innerHTML = txList.map(tx => {
      const isDebit = tx.type === 'debit';
      const prodName = tx.productName || tx.description || 'زرعی مال';
      const qtyRate = tx.quantity ? (tx.quantity + (tx.unitPrice ? ` @ Rs. ${Number(tx.unitPrice).toLocaleString()}` : '')) : '-';

      return `
        <tr>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center; font-family: monospace;">${tx.date || '-'}</td>
          <td style="padding: 6px; border: 1px solid #fdba74; font-weight: bold;">
            ${prodName}
            ${tx.description && tx.description !== prodName ? `<br><small style="color:#6b7280; font-weight:normal;">${tx.description}</small>` : ''}
          </td>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center;">${qtyRate}</td>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center;">${isDebit ? 'مال نام' : 'رقم جمع'}</td>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center; color: #b91c1c; font-family: monospace; font-weight: bold;">${isDebit ? ('Rs. ' + Number(tx.amount || 0).toLocaleString()) : '-'}</td>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center; color: #15803d; font-family: monospace; font-weight: bold;">${!isDebit ? ('Rs. ' + Number(tx.amount || 0).toLocaleString()) : '-'}</td>
          <td style="padding: 6px; border: 1px solid #fdba74; text-align: center; font-weight: bold; font-family: monospace;">${tx.balanceAfter !== undefined ? ('Rs. ' + Number(tx.balanceAfter).toLocaleString()) : '-'}</td>
        </tr>
      `;
    }).join('');
  }

  window.print();
}

// Share Khata via WhatsApp
function shareKhataWhatsApp() {
  if (!currentLoadedFarmer) return;
  const f = currentLoadedFarmer;
  const balText = f.currentBalance > 0 
    ? `واجب الادا بقایا: Rs. ${f.currentBalance.toLocaleString()}` 
    : (f.currentBalance < 0 ? `مرکز کے ذمے رقم: Rs. ${Math.abs(f.currentBalance).toLocaleString()}` : 'کھاتہ کلیئر ہے (Rs. 0)');

  const contactPhone = window.CURRENT_PHONE || '0300-7654321';
  const msg = `*ہارون زرعی مرکز (پل 88، شادی خان منڈا، کوٹ ادو)*%0A*کسان کھاتہ تفصیل:*%0Aنام: ${f.name}%0Aکسان آئی ڈی: ${f.id}%0Aموبائل: ${f.mobile}%0A*بیلنس:* ${balText}%0Aکل خریدا گیا مال: Rs. ${(f.totalDebit || 0).toLocaleString()}%0Aکل جمع شدہ رقم: Rs. ${(f.totalCredit || 0).toLocaleString()}%0A%0Aرابطہ: ${contactPhone}`;

  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

// 4. Submit Trade Request (Buy / Sell crop)
async function submitTradeRequest(e) {
  e.preventDefault();
  const alertBox = document.getElementById('trade-alert');
  const btn = document.getElementById('trade-submit-btn');

  const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
  const cropName = document.getElementById('trade-crop').value;
  const quantity = document.getElementById('trade-qty').value.trim();
  const farmerName = document.getElementById('trade-name').value.trim();
  const mobile = document.getElementById('trade-phone').value.trim();
  const village = document.getElementById('trade-village').value.trim();
  const expectedPrice = document.getElementById('trade-rate').value.trim();
  const notes = document.getElementById('trade-notes').value.trim();

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>ارسال ہو رہا ہے...</span>`;

  try {
    const res = await fetch('/api/trade-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: tradeType,
        cropName,
        quantity,
        farmerName,
        mobile,
        village,
        expectedPrice,
        notes
      })
    });

    const data = await res.json();

    if (res.ok) {
      alertBox.className = "p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 block text-xs leading-relaxed";
      alertBox.innerHTML = `
        <strong>شکریہ کسان بھائی!</strong> آپ کی درخواست موصول ہو چکی ہے۔ ہارون زرعی مرکز کا نمائندہ جلد آپ کے نمبر (${mobile}) پر رابطہ کرے گا۔
        <div class="mt-2">
          <a href="https://wa.me/${window.CURRENT_WHATSAPP || '923007654321'}?text=${encodeURIComponent(`السلام علیکم، میں نے ویب سائٹ پر درخواست دی ہے:%0Aکسان: ${farmerName}%0Aفصل: ${cropName}%0Aمقدار: ${quantity}%0Aفون: ${mobile}`)}" target="_blank" class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold">
            <i class="fa-brands fa-whatsapp"></i> واٹس ایپ پر بھی تصدیق بھیجیں
          </a>
        </div>
      `;
      document.getElementById('trade-form').reset();
    } else {
      alertBox.className = "p-4 rounded-2xl bg-rose-100 text-rose-900 border border-rose-300 block text-xs";
      alertBox.innerText = data.error || 'درخواست جمع کرنے میں خرابی واقع ہوئی۔';
    }
  } catch (err) {
    alertBox.className = "p-4 rounded-2xl bg-rose-100 text-rose-900 border border-rose-300 block text-xs";
    alertBox.innerText = 'سرور سے رابطہ نہ ہو سکا۔';
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>درخواست جمع کروائیں</span>`;
  }
}

// 5. Zarai Adviyaat, Khaad & Seeds Store
let currentDepartment = 'pesticide';
let currentSubCategory = 'all';

function detectInitialDepartment() {
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  const path = window.location.pathname.toLowerCase();

  if (catParam) {
    if (catParam === 'fertilizer' || catParam === 'khaad') currentDepartment = 'fertilizer';
    else if (catParam === 'seed' || catParam === 'seeds' || catParam === 'beej') currentDepartment = 'seed';
    else if (catParam === 'pesticide' || catParam === 'adviyaat') currentDepartment = 'pesticide';
    else if (catParam === 'all') currentDepartment = 'all';
    else currentDepartment = catParam;
  } else if (path === '/khaad' || path === '/fertilizer' || path === '/fertilizers') {
    currentDepartment = 'fertilizer';
  } else if (path === '/beej' || path === '/seeds') {
    currentDepartment = 'seed';
  } else if (path === '/adviyaat' || path === '/store') {
    currentDepartment = 'pesticide';
  }
}

async function loadProducts() {
  detectInitialDepartment();
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      globalProducts = await res.json();
      filterDepartment(currentDepartment, false);
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function filterDepartment(dept, triggerRender = true) {
  currentDepartment = dept;
  currentSubCategory = 'all';

  // Highlight active top department tab
  const depts = ['pesticide', 'fertilizer', 'seed', 'all'];
  depts.forEach(d => {
    const btn = document.getElementById(`dept-btn-${d}`);
    if (!btn) return;
    if (d === dept) {
      if (d === 'pesticide') {
        btn.className = "dept-tab active bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-md transition cursor-pointer border-2 border-orange-400";
      } else if (d === 'fertilizer') {
        btn.className = "dept-tab active bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-md transition cursor-pointer border-2 border-blue-400";
      } else if (d === 'seed') {
        btn.className = "dept-tab active bg-teal-700 hover:bg-teal-800 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-md transition cursor-pointer border-2 border-teal-400";
      } else {
        btn.className = "dept-tab active bg-gray-800 hover:bg-gray-900 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-md transition cursor-pointer border-2 border-gray-400";
      }
    } else {
      if (d === 'pesticide') {
        btn.className = "dept-tab bg-white hover:bg-orange-50 text-orange-950 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-xs transition cursor-pointer border-2 border-orange-200";
      } else if (d === 'fertilizer') {
        btn.className = "dept-tab bg-white hover:bg-blue-50 text-blue-950 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-xs transition cursor-pointer border-2 border-blue-200";
      } else if (d === 'seed') {
        btn.className = "dept-tab bg-white hover:bg-teal-50 text-teal-950 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-xs transition cursor-pointer border-2 border-teal-200";
      } else {
        btn.className = "dept-tab bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-xs transition cursor-pointer border-2 border-gray-200";
      }
    }
  });

  // Update dynamic headings
  const headingElem = document.getElementById('current-dept-heading');
  const subHeadingElem = document.getElementById('current-dept-subheading');
  if (headingElem && subHeadingElem) {
    if (dept === 'pesticide') {
      headingElem.innerHTML = `<i class="fa-solid fa-flask-vial text-orange-600"></i> <span>زرعی ادویات و اسپرے کیٹلاگ</span>`;
      subHeadingElem.innerText = `کیڑے مار، جڑی بوٹی مار، اور پھپھوند کش زہریں مع طریقہ استعمال و قیمت:`;
    } else if (dept === 'fertilizer') {
      headingElem.innerHTML = `<i class="fa-solid fa-cubes-stacked text-blue-600"></i> <span>کھاد سینٹر و زرعی نیوٹریشن (Fertilizers)</span>`;
      subHeadingElem.innerText = `سونا یوریا، اینگرو ڈی اے پی، سرسبز نائٹروفاس، زنک اور پوٹاش کھادیں:`;
    } else if (dept === 'seed') {
      headingElem.innerHTML = `<i class="fa-solid fa-seedling text-teal-600"></i> <span>گھاس، چارہ اور فصلوں کے بیج (Certified Seeds)</span>`;
      subHeadingElem.innerText = `گندم، دھان، مکئی، تل، سرسوں اور گھاس بیج (مصری برسیم، لوسرن، چارہ جوار):`;
    } else {
      headingElem.innerHTML = `<i class="fa-solid fa-boxes-stacked text-gray-700"></i> <span>تمام زرعی مصنوعات (All Products)</span>`;
      subHeadingElem.innerText = `ہارون زرعی مرکز کی تمام ادویات، کھادیں اور بیج ایک ساتھ دیکھیں:`;
    }
  }

  // Render Sub-Category Filters
  renderSubFilters(dept);

  if (triggerRender) {
    const searchVal = document.getElementById('product-search-input') ? document.getElementById('product-search-input').value.trim() : '';
    renderProductsGrid(searchVal);
  } else {
    renderProductsGrid('');
  }
}

function renderSubFilters(dept) {
  const container = document.getElementById('subfilters-container');
  if (!container) return;

  let filters = [];
  if (dept === 'pesticide') {
    filters = [
      { id: 'all', label: 'تمام زرعی ادویات (All Sprays)' },
      { id: 'pesticide', label: '🐛 کیڑے مار زہریں (Insecticide)' },
      { id: 'weedicide', label: '🌿 جڑی بوٹی مار (Weedicide)' },
      { id: 'fungicide', label: '🍄 پھپھوند کش (Fungicide)' }
    ];
  } else if (dept === 'fertilizer') {
    filters = [
      { id: 'all', label: 'تمام کھادیں (All Fertilizers)' },
      { id: 'urea', label: '🌾 سونا یوریا (Urea)' },
      { id: 'dap', label: '⚡ اینگرو ڈی اے پی (DAP)' },
      { id: 'nitrophos', label: '🌟 سرسبز نائٹروفاس (NP)' },
      { id: 'zinc', label: '🧪 زنک 33% و مائیکرو' },
      { id: 'potash', label: '💎 سونا پوٹاش (SOP)' }
    ];
  } else if (dept === 'seed') {
    filters = [
      { id: 'all', label: 'تمام بیج (All Seeds)' },
      { id: 'crop_seed', label: '🌾 فصلوں کے بیج (گندم، دھان، تل، سرسوں)' },
      { id: 'grass_seed', label: '🌿 گھاس و چارہ بیج (برسیم، لوسرن، جوار)' }
    ];
  } else {
    filters = [
      { id: 'all', label: 'تمام مصنوعات (All)' },
      { id: 'pesticide', label: '🧪 زرعی ادویات' },
      { id: 'fertilizer', label: '⚡ کھادیں' },
      { id: 'seed', label: '🌱 بیج (فصلیں و گھاس)' }
    ];
  }

  container.innerHTML = filters.map(f => {
    const isActive = currentSubCategory === f.id;
    const activeClass = "sub-pill active bg-gradient-to-r from-agroorange-500 to-amber-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition cursor-pointer";
    const inactiveClass = "sub-pill bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer";
    return `<button type="button" onclick="filterSubCategory('${f.id}')" class="${isActive ? activeClass : inactiveClass}" data-sub="${f.id}">${f.label}</button>`;
  }).join('');
}

function filterSubCategory(subId) {
  currentSubCategory = subId;
  renderSubFilters(currentDepartment);
  const searchVal = document.getElementById('product-search-input') ? document.getElementById('product-search-input').value.trim() : '';
  renderProductsGrid(searchVal);
}

function filterCategory(category) {
  // Legacy backward compatibility
  if (category === 'all') {
    filterDepartment('all');
  } else if (category.includes('کیڑے') || category.includes('Pesticide')) {
    filterDepartment('pesticide');
    filterSubCategory('pesticide');
  } else if (category.includes('بوٹی') || category.includes('Weedicide')) {
    filterDepartment('pesticide');
    filterSubCategory('weedicide');
  } else if (category.includes('پھپھوند') || category.includes('Fungicide')) {
    filterDepartment('pesticide');
    filterSubCategory('fungicide');
  } else if (category.includes('کھاد') || category.includes('Fertilizer')) {
    filterDepartment('fertilizer');
  } else if (category.includes('بیج') || category.includes('Seed')) {
    filterDepartment('seed');
  } else {
    filterDepartment('all');
  }
}

function renderProductsGrid(searchQuery = '') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let list = globalProducts || [];

  // 1. Department Filtering
  if (currentDepartment === 'pesticide') {
    list = list.filter(p => p.category === 'pesticide' || p.category === 'weedicide' || p.category === 'fungicide');
    if (currentSubCategory !== 'all') {
      list = list.filter(p => p.category === currentSubCategory);
    }
  } else if (currentDepartment === 'fertilizer') {
    list = list.filter(p => p.category === 'fertilizer');
    if (currentSubCategory === 'urea') {
      list = list.filter(p => (p.nameUrdu && p.nameUrdu.includes('یوریا')) || (p.nameEn && p.nameEn.toLowerCase().includes('urea')));
    } else if (currentSubCategory === 'dap') {
      list = list.filter(p => (p.nameUrdu && p.nameUrdu.includes('ڈی اے پی')) || (p.nameEn && p.nameEn.toLowerCase().includes('dap')));
    } else if (currentSubCategory === 'nitrophos') {
      list = list.filter(p => (p.nameUrdu && p.nameUrdu.includes('نائٹروفاس')) || (p.nameEn && p.nameEn.toLowerCase().includes('nitrophos')));
    } else if (currentSubCategory === 'zinc') {
      list = list.filter(p => (p.nameUrdu && p.nameUrdu.includes('زنک')) || (p.nameEn && p.nameEn.toLowerCase().includes('zinc')));
    } else if (currentSubCategory === 'potash') {
      list = list.filter(p => (p.nameUrdu && p.nameUrdu.includes('پوٹاش')) || (p.nameEn && p.nameEn.toLowerCase().includes('potash')));
    }
  } else if (currentDepartment === 'seed') {
    list = list.filter(p => p.category === 'seed');
    if (currentSubCategory === 'grass_seed') {
      list = list.filter(p => p.subCategory === 'grass_seed' || (p.nameUrdu && (p.nameUrdu.includes('برسیم') || p.nameUrdu.includes('لوسرن') || p.nameUrdu.includes('گھاس') || p.nameUrdu.includes('چارہ'))));
    } else if (currentSubCategory === 'crop_seed') {
      list = list.filter(p => p.subCategory !== 'grass_seed' && !(p.nameUrdu && (p.nameUrdu.includes('برسیم') || p.nameUrdu.includes('لوسرن') || p.nameUrdu.includes('گھاس') || p.nameUrdu.includes('چارہ'))));
    }
  } else if (currentDepartment !== 'all') {
    list = list.filter(p => p.category === currentDepartment);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p => 
      (p.nameUrdu && p.nameUrdu.toLowerCase().includes(q)) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.company && p.company.toLowerCase().includes(q)) ||
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(q)) ||
      (p.targetPests && p.targetPests.toLowerCase().includes(q)) ||
      (p.suitableCrops && p.suitableCrops.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isBoth = typeof currentLang !== 'undefined' && currentLang === 'both';

  if (list.length === 0) {
    const noProdsMsg = isEn 
      ? 'No agricultural products found in this category.' 
      : (isBoth ? 'اس زمرے میں کوئی دوا یا بیج نہیں ملا (No products found)' : 'اس زمرے میں کوئی دوا یا بیج موجود نہیں۔');
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-bold">${noProdsMsg}</div>`;
    return;
  }

  const cleanWa = window.CURRENT_WHATSAPP || '923007654321';

  grid.innerHTML = list.map(p => {
    let displayName = p.nameUrdu;
    let subName = p.nameEn || '';

    if (isEn) {
      displayName = p.nameEn || p.nameUrdu;
      subName = p.nameUrdu;
    } else if (isBoth) {
      displayName = p.nameUrdu;
      subName = p.nameEn || '';
    }

    // Availability Badge Text
    const availLabel = isEn 
      ? 'Authentic & In Stock' 
      : (isBoth ? 'اصلی و دستیاب (Authentic)' : 'ہارون زرعی مرکز پر دستیاب');

    // Details button label
    const detailsBtnText = isEn 
      ? 'View Full Guide & Specs' 
      : (isBoth ? 'مکمل زرعی معلومات و گائیڈ (Full Specs)' : 'مکمل زرعی تفصیل و رہنمائی دیکھیں');

    // WhatsApp Advice button label
    const adviceBtnText = isEn 
      ? 'Consult Advice' 
      : (isBoth ? 'زرعی مشورہ (Consult)' : 'ماہر سے مشورہ');

    const adviceWaText = encodeURIComponent(
      `السلام علیکم ہارون زرعی مرکز!\nمجھے اس پراڈکٹ کے بارے میں زرعی رہنمائی چاہیے:\n*${p.nameUrdu} (${p.nameEn || ''})*\nکمپنی: ${p.company}\nپیکنگ: ${p.packSize}`
    );

    return `
      <div class="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-agroorange-100 hover:border-agroorange-300 flex flex-col justify-between group">
        <div>
          <!-- Product Image & Quality Badges -->
          <div class="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-50 mb-4 border border-agroorange-100/70">
            <img src="${p.image}" alt="${displayName}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            
            <!-- Category Tag -->
            <span class="absolute top-2.5 right-2.5 bg-brand-900/90 backdrop-blur-md text-agroyellow-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ${p.categoryUrdu || 'زرعی پراڈکٹ'}
            </span>

            <!-- Authentic Dealer Quality Badge -->
            <span class="absolute bottom-2.5 right-2.5 bg-emerald-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <i class="fa-solid fa-circle-check text-[9px]"></i>
              <span>${availLabel}</span>
            </span>
          </div>

          <!-- Brand & Pack Info -->
          <div class="flex items-center justify-between text-xs text-agroorange-600 font-extrabold pb-1">
            <span class="bg-agroorange-50 px-2 py-0.5 rounded-md border border-agroorange-200/60 uppercase tracking-wide">${p.company}</span>
            <span class="text-gray-500 font-medium">${p.packSize}</span>
          </div>

          <!-- Product Title -->
          <h3 class="text-base sm:text-lg font-black text-gray-900 font-urdu leading-snug group-hover:text-agroorange-600 transition mt-1.5">
            ${displayName}
            ${isBoth && subName ? `<span class="block text-xs font-mono font-bold text-gray-500 font-normal mt-0.5" dir="ltr">(${subName})</span>` : ''}
          </h3>
          ${!isBoth && subName ? `<p class="text-[11px] text-gray-400 font-semibold font-mono mt-0.5" dir="ltr">${subName}</p>` : ''}

          <!-- Key Agricultural Specs Chips (Informational) -->
          <div class="mt-3 space-y-1.5 text-[11px]">
            ${p.activeIngredient ? `
              <div class="p-2 rounded-xl bg-brand-50/70 border border-brand-200/80 text-brand-950 flex items-start gap-1.5">
                <i class="fa-solid fa-flask-vial text-brand-600 text-xs shrink-0 mt-0.5"></i>
                <div class="leading-tight">
                  <strong class="font-bold">${isEn ? 'Formula:' : (isBoth ? 'کیمیائی فارمولا (Formula):' : 'کیمیائی فارمولا:')}</strong>
                  <span class="font-mono font-medium">${p.activeIngredient}</span>
                </div>
              </div>
            ` : ''}

            ${p.targetPests ? `
              <div class="p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950 flex items-start gap-1.5">
                <i class="fa-solid fa-bug text-rose-600 text-xs shrink-0 mt-0.5"></i>
                <div class="leading-tight">
                  <strong class="font-bold">${isEn ? 'Targets:' : (isBoth ? 'کنٹرول کیڑے (Target Pests):' : 'کنٹرول کیڑے و بیماریاں:')}</strong>
                  <span class="font-medium">${p.targetPests}</span>
                </div>
              </div>
            ` : ''}

            ${p.dosage ? `
              <div class="p-2 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 flex items-start gap-1.5">
                <i class="fa-solid fa-scale-balanced text-blue-600 text-xs shrink-0 mt-0.5"></i>
                <div class="leading-tight">
                  <strong class="font-bold">${isEn ? 'Dosage:' : (isBoth ? 'خوراک (Dosage):' : 'فی ایکڑ خوراک:')}</strong>
                  <span class="font-medium">${p.dosage}</span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Brief Description -->
          <p class="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mt-2.5 font-medium">
            ${p.description}
          </p>
        </div>

        <!-- Informational Action Buttons (No online purchase, pure informational guide & expert advice) -->
        <div class="mt-4 pt-3 border-t border-agroorange-100 space-y-2">
          <!-- Primary: Full Leaflet / Technical Guide Modal -->
          <button type="button" onclick="openProductViewModal('${p.id}')" class="w-full bg-gradient-to-r from-agroorange-500 to-amber-500 hover:from-agroorange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-agroorange-500/15 transition hover:scale-[1.01] cursor-pointer">
            <i class="fa-solid fa-circle-info"></i>
            <span>${detailsBtnText}</span>
          </button>

          <!-- Secondary: WhatsApp Consultation -->
          <a href="https://wa.me/${cleanWa}?text=${adviceWaText}" target="_blank" class="w-full bg-agroyellow-50 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-300 text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition">
            <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
            <span>${adviceBtnText}</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Open Full Technical Details Modal for a Product
function openProductViewModal(id) {
  const p = (globalProducts || []).find(x => x.id === id);
  if (!p) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isBoth = typeof currentLang !== 'undefined' && currentLang === 'both';

  const modal = document.getElementById('modal-product-view');
  if (!modal) return;

  // Image & Category
  const imgElem = document.getElementById('view-prod-image');
  if (imgElem) {
    imgElem.src = p.image || 'https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80';
    imgElem.alt = p.nameUrdu;
  }

  const catElem = document.getElementById('view-prod-cat');
  if (catElem) {
    if (isEn) catElem.innerText = p.category || 'Agricultural Product';
    else if (isBoth) catElem.innerText = `${p.categoryUrdu || 'زرعی پراڈکٹ'} (${p.category || 'Product'})`;
    else catElem.innerText = p.categoryUrdu || 'زرعی پراڈکٹ';
  }

  // Company & Pack
  const compElem = document.getElementById('view-prod-company');
  if (compElem) compElem.innerText = p.company || 'ہارون زرعی مرکز';

  const packElem = document.getElementById('view-prod-pack');
  if (packElem) {
    const packPrefix = isEn ? 'Pack: ' : (isBoth ? 'پیکنگ (Pack): ' : 'پیک سائز: ');
    packElem.innerText = packPrefix + (p.packSize || '-');
  }

  // Titles
  const nameUrduElem = document.getElementById('view-prod-name-urdu');
  if (nameUrduElem) {
    if (isEn) nameUrduElem.innerText = p.nameEn || p.nameUrdu;
    else if (isBoth) nameUrduElem.innerText = `${p.nameUrdu} - ${p.nameEn || ''}`;
    else nameUrduElem.innerText = p.nameUrdu;
  }

  const nameEnElem = document.getElementById('view-prod-name-en');
  if (nameEnElem) {
    if (isBoth) nameEnElem.innerText = `English: ${p.nameEn || p.nameUrdu}`;
    else if (isEn) nameEnElem.innerText = p.nameUrdu ? `Urdu: ${p.nameUrdu}` : '';
    else nameEnElem.innerText = p.nameEn ? `English: ${p.nameEn}` : '';
  }

  // Active Ingredient
  const activeElem = document.getElementById('view-prod-active');
  if (activeElem) activeElem.innerText = p.activeIngredient || 'حکومتی منظور شدہ تصدیق شدہ فارمولیشن (Govt Approved Standard Formula)';

  // Suitable Crops
  const cropsElem = document.getElementById('view-prod-crops');
  if (cropsElem) cropsElem.innerText = p.suitableCrops || 'گندم، کپاس، مکئی، دھان، تل، سورج مکھی اور تمام موسمی سبزیاں';

  // Target Pests
  const pestsElem = document.getElementById('view-prod-pests');
  if (pestsElem) pestsElem.innerText = p.targetPests || 'سنڈی، لشکری سنڈی، رس چوسنے والے کیڑے و بیماریوں کا مکمل تدارک';

  // Dosage
  const dosageElem = document.getElementById('view-prod-dosage');
  if (dosageElem) dosageElem.innerText = p.dosage || '100 ملی لیٹر فی ایکڑ (100 تا 120 لیٹر پانی میں حل کر کے سپرے کریں)';

  // Full Description
  const descElem = document.getElementById('view-prod-desc');
  if (descElem) descElem.innerText = p.description || 'اصل برانڈڈ زرعی پروڈکٹ، حکومت پنجاب سے تصدیق شدہ ڈیلرشپ پر دستیاب ہے۔ استعمال سے پہلے لیبل پر دی گئی ہدایات ضرور پڑھیں۔';

  // Precautions
  const precElem = document.getElementById('view-prod-precautions');
  if (precElem) {
    precElem.innerText = p.precautions || 'صبح سویرے یا شام کے وقت ترجیحاً سپرے کریں۔ تیز ہوا یا دھوپ میں سپرے سے گریز کریں۔ حفاظتی ماسک اور دستانے لازمی استعمال کریں۔ بچوں اور جانوروں کی پہنچ سے دور رکھیں۔';
  }

  // Consultation WhatsApp Button
  const waBtn = document.getElementById('view-prod-wa-inquire');
  if (waBtn) {
    const cleanWa = window.CURRENT_WHATSAPP || '923007654321';
    const inquireMsg = encodeURIComponent(
      `السلام علیکم ہارون زرعی مرکز (کوٹ ادو)!\nمجھے اس پراڈکٹ کے بارے میں تکنیکی رہنمائی اور زرعی مشورہ چاہیئے:\n` +
      `*پراڈکٹ:* ${p.nameUrdu} (${p.nameEn || ''})\n` +
      `*کمپنی:* ${p.company}\n` +
      `*پیکنگ سائز:* ${p.packSize}\n` +
      `*کیمیائی فارمولا:* ${p.activeIngredient || '-'}\n` +
      `براہ کرم اس کے درست طریقہ استعمال اور موزوں وقت کے بارے میں رہنمائی فرمائیں۔`
    );
    waBtn.href = `https://wa.me/${cleanWa}?text=${inquireMsg}`;
    
    const btnLabel = isEn 
      ? '<span>Consult Agronomist on WhatsApp</span>' 
      : (isBoth ? '<span>زرعی ماہر سے مشورہ لیں (Consult on WhatsApp)</span>' : '<span>اس دوا کے متعلق زرعی ماہر سے مشورہ لیں</span>');
    waBtn.innerHTML = `<i class="fa-brands fa-whatsapp text-lg"></i> ${btnLabel}`;
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

// Close Full Technical Details Modal
function closeProductViewModal() {
  const modal = document.getElementById('modal-product-view');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// Close on Escape or click outside
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductViewModal();
    closeProofModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-product-view');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProductViewModal();
    });
  }

  const proofModal = document.getElementById('modal-proof-viewer');
  if (proofModal) {
    proofModal.addEventListener('click', (e) => {
      if (e.target === proofModal) closeProofModal();
    });
  }
});

// Utility alert helper
function showAlert(container, msg, type = 'error') {
  if (!container) {
    alert(msg);
    return;
  }
  container.className = type === 'error'
    ? "mt-4 p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs md:text-sm font-semibold block"
    : "mt-4 p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs md:text-sm font-semibold block";
  container.innerHTML = `<i class="fa-solid fa-triangle-exclamation ml-2"></i> ${msg}`;
  container.classList.remove('hidden');
}

// ==========================================
// FARMER AUTH & SESSION MANAGEMENT
// ==========================================

function switchFarmerAuthTab(tab) {
  const tabs = ['login', 'signup'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-tab-farmer-${t}`);
    const content = document.getElementById(`tab-content-farmer-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = "flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 bg-agroorange-500 text-white shadow-xs cursor-pointer";
      } else {
        btn.className = "flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 text-gray-700 hover:text-agroorange-600 bg-transparent cursor-pointer";
      }
    }
    if (content) {
      if (t === tab) content.classList.remove('hidden');
      else content.classList.add('hidden');
    }
  });

  const alertBox = document.getElementById('khata-alert');
  if (alertBox) alertBox.classList.add('hidden');
}

function quickFillLogin(id, pass) {
  switchFarmerAuthTab('login');
  const idInput = document.getElementById('farmer-login-id');
  const passInput = document.getElementById('farmer-login-pass');
  if (idInput) idInput.value = id;
  if (passInput) passInput.value = pass;
  if (idInput) idInput.focus();

  const gwIdInput = document.getElementById('gw-login-id');
  const gwPassInput = document.getElementById('gw-login-pass');
  if (gwIdInput) gwIdInput.value = id;
  if (gwPassInput) gwPassInput.value = pass;
}

function renderFarmerSession(farmer) {
  if (!farmer) return;
  try {
    document.documentElement.classList.add('farmer-logged-in');
  } catch(e) {}

  // 1. Header user badge on all pages
  const headerPill = document.getElementById('header-user-pill');
  const headerName = document.getElementById('header-user-name');
  if (headerPill) {
    headerPill.classList.remove('hidden');
    headerPill.classList.add('inline-flex');
  }
  if (headerName) {
    headerName.innerText = farmer.name || 'کسان بھائی';
  }

  // 2. Index.html Big Portal Button 1 customization
  const homeBadge = document.getElementById('home-khata-badge');
  const homeTitle = document.getElementById('home-khata-title');
  const homeDesc = document.getElementById('home-khata-desc');
  const homeAction = document.getElementById('home-khata-action');

  if (homeBadge) {
    homeBadge.innerHTML = '✅ آپ کا کھاتہ لاگ ان ہے';
    homeBadge.className = 'bg-emerald-400 text-brand-950 text-[11px] font-black px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-xs';
  }
  if (homeTitle) {
    homeTitle.innerText = `خوش آمدید، ${farmer.name || 'کسان بھائی'}`;
  }
  if (homeDesc) {
    homeDesc.innerText = 'آپ کا ڈیجیٹل کھاتہ آن لائن فعال ہے۔ اپنے تمام سابقہ لین دین، ادھار ادویات، کھاد اور نقد وصولیوں کی تفصیلات دیکھنے کے لیے اوپن کریں۔';
  }
  if (homeAction) {
    homeAction.innerHTML = `اپنا کھاتہ دیکھیں <i class="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1.5"></i>`;
  }

  // 3. Khata.html Active Session Banner & Hero Desc
  const banner = document.getElementById('farmer-session-banner');
  const authTabs = document.getElementById('farmer-auth-tabs-wrap');
  const heroDesc = document.getElementById('khata-hero-desc');

  if (banner) {
    const sessionFarmerId = document.getElementById('session-farmer-id');
    const sessionFarmerName = document.getElementById('session-farmer-name');
    const sessionFarmerPhone = document.getElementById('session-farmer-phone');
    const sessionFarmerCnic = document.getElementById('session-farmer-cnic');
    const sessionCnicWrap = document.getElementById('session-farmer-cnic-wrap');

    if (sessionFarmerId) sessionFarmerId.innerText = farmer.id || '';
    if (sessionFarmerName) sessionFarmerName.innerText = `خوش آمدید، ${farmer.name || 'کسان بھائی'}`;
    if (sessionFarmerPhone) sessionFarmerPhone.innerText = farmer.mobile || farmer.email || '-';
    
    if (farmer.cnic) {
      if (sessionFarmerCnic) sessionFarmerCnic.innerText = farmer.cnic;
      if (sessionCnicWrap) sessionCnicWrap.classList.remove('hidden');
    } else if (sessionCnicWrap) {
      sessionCnicWrap.classList.add('hidden');
    }
    banner.classList.remove('hidden');
  }

  if (heroDesc) {
    heroDesc.innerText = `خوش آمدید ${farmer.name || 'کسان بھائی'}! آپ کا کھاتہ لاگ ان ہے۔ نیچے آپ کا موجودہ بقایا بیلنس اور تمام سابقہ ادھار و وصولی کی تفصیلی تاریخ پیش ہے۔`;
  }

  // 4. Hide all login boxes and modals across the entire website
  if (authTabs) authTabs.classList.add('hidden');
  closeGatewayModal();
}

async function handleFarmerLoginSubmit(e) {
  if (e) e.preventDefault();
  const alertBox = document.getElementById('farmer-login-alert') || document.getElementById('khata-alert');
  const resultBox = document.getElementById('khata-result-box');
  const btn = document.getElementById('farmer-login-btn');

  if (alertBox) alertBox.classList.add('hidden');

  const identifier = (document.getElementById('farmer-login-id')?.value || '').trim();
  const password = (document.getElementById('farmer-login-pass')?.value || '').trim();

  if (!identifier || !password) {
    showAlert(alertBox, 'براہ کرم اپنا موبائل نمبر / شناختی کارڈ اور پاس ورڈ دونوں درج کریں۔', 'error');
    return;
  }

  const origBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>لاگ ان ہو رہا ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showAlert(alertBox, data.error || 'لاگ ان کی تفصیلات درست نہیں ہیں۔ براہ کرم دوبارہ چیک کریں۔', 'error');
      return;
    }

    // Save session to localStorage
    localStorage.setItem('hzm_farmer_session', JSON.stringify({
      token: data.token,
      farmerId: data.farmer.id,
      phone: data.farmer.mobile,
      name: data.farmer.name
    }));

    currentLoadedFarmer = data.farmer;
    renderFarmerSession(data.farmer);
    displayFarmerKhata(data.farmer);

    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    console.error('Login error:', err);
    showAlert(alertBox, 'سرور سے رابطہ نہ ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnHtml;
    }
  }
}

async function handleFarmerSignUpSubmit(e) {
  if (e) e.preventDefault();
  const alertBox = document.getElementById('farmer-signup-alert') || document.getElementById('khata-alert');
  const resultBox = document.getElementById('khata-result-box');
  const btn = document.getElementById('farmer-signup-btn');

  if (alertBox) alertBox.classList.add('hidden');

  const name = (document.getElementById('farmer-signup-name')?.value || '').trim();
  const identifier = (document.getElementById('farmer-signup-id')?.value || '').trim();
  const password = (document.getElementById('farmer-signup-pass')?.value || '').trim();
  const email = (document.getElementById('farmer-signup-email')?.value || '').trim();

  if (!name || !identifier || !password) {
    showAlert(alertBox, 'براہ کرم نام، موبائل/شناختی کارڈ اور پاس ورڈ لازمی درج کریں۔', 'error');
    return;
  }

  if (password.length < 4) {
    showAlert(alertBox, 'پاس ورڈ کم از کم 4 ہندسوں یا حروف پر مشتمل ہونا چاہیئے۔', 'error');
    return;
  }

  const origBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>نیا اکاؤنٹ بن رہا ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, identifier, password, email })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showAlert(alertBox, data.error || 'اکاؤنٹ بنانے میں مسئلہ پیش آیا۔', 'error');
      return;
    }

    // Save session
    localStorage.setItem('hzm_farmer_session', JSON.stringify({
      token: data.token,
      farmerId: data.farmer.id,
      phone: data.farmer.mobile,
      name: data.farmer.name
    }));

    currentLoadedFarmer = data.farmer;
    renderFarmerSession(data.farmer);
    displayFarmerKhata(data.farmer);

    showAlert(alertBox, `مبارک ہو! آپ کا اکاؤنٹ کامیابی سے بن گیا ہے (کسان آئی ڈی: ${data.farmer.id})۔ آپ کا کھاتہ نیچے پیش ہے۔`, 'success');

    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    console.error('Sign up error:', err);
    showAlert(alertBox, 'سرور سے رابطہ نہ ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnHtml;
    }
  }
}

function farmerLogout() {
  if (confirm('کیا آپ اپنے کسان اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟')) {
    localStorage.removeItem('hzm_farmer_session');
    try {
      document.documentElement.classList.remove('farmer-logged-in');
    } catch(e) {}
    currentLoadedFarmer = null;

    const banner = document.getElementById('farmer-session-banner');
    const authTabs = document.getElementById('farmer-auth-tabs-wrap');
    const resultBox = document.getElementById('khata-result-box');
    const alertBox = document.getElementById('khata-alert');
    const headerPill = document.getElementById('header-user-pill');

    if (banner) banner.classList.add('hidden');
    if (authTabs) authTabs.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');
    if (headerPill) {
      headerPill.classList.add('hidden');
      headerPill.classList.remove('inline-flex');
    }

    // Reset home button 1 if on index.html
    const homeBadge = document.getElementById('home-khata-badge');
    const homeTitle = document.getElementById('home-khata-title');
    const homeDesc = document.getElementById('home-khata-desc');
    const homeAction = document.getElementById('home-khata-action');
    if (homeBadge) {
      homeBadge.innerHTML = '🔒 کسان اکاؤنٹ';
      homeBadge.className = 'bg-emerald-500/80 backdrop-blur-xs text-white text-[11px] font-black px-3.5 py-1.5 rounded-full border border-emerald-300/40 shadow-xs';
    }
    if (homeTitle) homeTitle.innerText = 'ڈیجیٹل کسان کھاتہ';
    if (homeDesc) homeDesc.innerText = 'اپنا آن لائن کھاتہ لاگ ان کریں، واجب الادا رقم، لین دین کی تاریخ اور کھاتے کی رسیدوں کا فوٹو ثبوت دیکھیں۔';
    if (homeAction) homeAction.innerHTML = `کھاتہ صفحہ اوپن کریں <i class="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1.5"></i>`;

    const loginForm = document.getElementById('farmer-login-form');
    const signupForm = document.getElementById('farmer-signup-form');
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();

    // Reload page to return cleanly to visitor state
    window.location.reload();
  }
}

async function checkFarmerAutoLogin() {
  const sessionStr = localStorage.getItem('hzm_farmer_session');
  if (!sessionStr) {
    // Show gateway login modal only after the 5-second motion intro splash completes
    const isHome = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '';
    if (isHome) {
      setTimeout(() => {
        openGatewayModal();
      }, 5400);
    }
    return;
  }

  try {
    const session = JSON.parse(sessionStr);
    if (!session || !session.farmerId) {
      localStorage.removeItem('hzm_farmer_session');
      return;
    }

    // Immediately apply cached session info so there is ZERO delay or flicker!
    try {
      document.documentElement.classList.add('farmer-logged-in');
    } catch(e) {}

    renderFarmerSession({
      id: session.farmerId,
      name: session.name || 'کسان بھائی',
      mobile: session.phone || ''
    });

    // Fetch full fresh ledger in background
    const res = await fetch(`/api/farmer/me?id=${encodeURIComponent(session.farmerId)}&token=${encodeURIComponent(session.token || '')}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.farmer) {
        currentLoadedFarmer = data.farmer;
        renderFarmerSession(data.farmer);
        displayFarmerKhata(data.farmer);
        const resultBox = document.getElementById('khata-result-box');
        if (resultBox) resultBox.classList.remove('hidden');
      }
    } else if (res.status === 404 || res.status === 401) {
      // If account was deleted by admin or session expired
      localStorage.removeItem('hzm_farmer_session');
      try {
        document.documentElement.classList.remove('farmer-logged-in');
      } catch(e) {}
      window.location.reload();
    }
  } catch (e) {
    console.warn('Auto login check failed:', e);
  }
}

// ==========================================
// VISITOR GATEWAY MODAL (FIRST SCREEN)
// ==========================================

function openGatewayModal() {
  if (localStorage.getItem('hzm_farmer_session')) return;
  const modal = document.getElementById('modal-farmer-gateway');
  if (modal) modal.classList.remove('hidden');
}

function closeGatewayModal() {
  const modal = document.getElementById('modal-farmer-gateway');
  if (modal) modal.classList.add('hidden');
}

function switchGatewayTab(tab) {
  const btnLogin = document.getElementById('btn-gw-login');
  const btnSignup = document.getElementById('btn-gw-signup');
  const tabLogin = document.getElementById('gw-tab-login');
  const tabSignup = document.getElementById('gw-tab-signup');

  if (tab === 'login') {
    if (btnLogin) btnLogin.className = "flex-1 py-2.5 rounded-xl bg-agroorange-500 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5";
    if (btnSignup) btnSignup.className = "flex-1 py-2.5 rounded-xl text-gray-700 hover:text-agroorange-600 cursor-pointer flex items-center justify-center gap-1.5";
    if (tabLogin) tabLogin.classList.remove('hidden');
    if (tabSignup) tabSignup.classList.add('hidden');
  } else {
    if (btnSignup) btnSignup.className = "flex-1 py-2.5 rounded-xl bg-brand-600 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5";
    if (btnLogin) btnLogin.className = "flex-1 py-2.5 rounded-xl text-gray-700 hover:text-agroorange-600 cursor-pointer flex items-center justify-center gap-1.5";
    if (tabSignup) tabSignup.classList.remove('hidden');
    if (tabLogin) tabLogin.classList.add('hidden');
  }
}

async function handleGatewayLogin(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('gw-login-id')?.value.trim();
  const pass = document.getElementById('gw-login-pass')?.value.trim();
  if (!id || !pass) return;

  const btn = document.getElementById('gw-login-btn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>لاگ ان ہو رہا ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: id, password: pass })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      alert(data.error || 'لاگ ان کی تفصیلات درست نہیں ہیں۔');
      return;
    }

    localStorage.setItem('hzm_farmer_session', JSON.stringify({
      token: data.token,
      farmerId: data.farmer.id,
      phone: data.farmer.mobile,
      name: data.farmer.name
    }));

    closeGatewayModal();
    currentLoadedFarmer = data.farmer;
    renderFarmerSession(data.farmer);
    displayFarmerKhata(data.farmer);

    const resultBox = document.getElementById('khata-result-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    alert('سرور سے رابطہ نہ ہو سکا۔');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function handleGatewaySignUp(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('gw-signup-name')?.value.trim();
  const id = document.getElementById('gw-signup-id')?.value.trim();
  const pass = document.getElementById('gw-signup-pass')?.value.trim();
  const email = document.getElementById('gw-signup-email')?.value.trim();

  if (!name || !id || !pass) return;

  const btn = document.getElementById('gw-signup-btn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>نیا اکاؤنٹ بن رہا ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, identifier: id, password: pass, email })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      alert(data.error || 'اکاؤنٹ بنانے میں مسئلہ پیش آیا۔');
      return;
    }

    localStorage.setItem('hzm_farmer_session', JSON.stringify({
      token: data.token,
      farmerId: data.farmer.id,
      phone: data.farmer.mobile,
      name: data.farmer.name
    }));

    closeGatewayModal();
    currentLoadedFarmer = data.farmer;
    renderFarmerSession(data.farmer);
    displayFarmerKhata(data.farmer);

    const resultBox = document.getElementById('khata-result-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    alert('سرور سے رابطہ نہ ہو سکا۔');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

// ==========================================
// GOOGLE AUTH MODAL (OPTIONAL)
// ==========================================

function openGoogleAuthModal() {
  const modal = document.getElementById('modal-google-auth');
  if (modal) modal.classList.remove('hidden');
}

function closeGoogleAuthModal() {
  const modal = document.getElementById('modal-google-auth');
  if (modal) modal.classList.add('hidden');
}

async function submitGoogleAuth(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('google-auth-email')?.value.trim();
  const name = document.getElementById('google-auth-name')?.value.trim();
  const mobile = document.getElementById('google-auth-mobile')?.value.trim();

  if (!email || !name) {
    alert('براہ کرم گوگل ای میل اور اپنا نام درج کریں۔');
    return;
  }

  const btn = document.getElementById('google-auth-btn');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>گوگل لاگ ان ہو رہا ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, mobile })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || 'گوگل لاگ ان میں مسئلہ پیش آیا۔');
      return;
    }

    localStorage.setItem('hzm_farmer_session', JSON.stringify({
      token: data.token,
      farmerId: data.farmer.id,
      phone: data.farmer.mobile || email,
      name: data.farmer.name
    }));

    closeGoogleAuthModal();
    closeGatewayModal();

    currentLoadedFarmer = data.farmer;
    renderFarmerSession(data.farmer);
    displayFarmerKhata(data.farmer);

    const resultBox = document.getElementById('khata-result-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    alert('سرور سے رابطہ نہ ہو سکا۔');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}

// Proof Slip Lightbox Modal for Farmers
function openProofModal(imageUrl, title, date) {
  const modal = document.getElementById('modal-proof-viewer');
  if (!modal) return;

  const img = document.getElementById('proof-modal-img');
  const titleElem = document.getElementById('proof-modal-title');
  const subtitleElem = document.getElementById('proof-modal-subtitle');
  const downloadLink = document.getElementById('proof-modal-download');

  if (img) img.src = imageUrl;
  if (titleElem) titleElem.innerText = title ? `رسید / ثبوت: ${title}` : 'رسید / پرچی کا تصویری ثبوت';
  if (subtitleElem) subtitleElem.innerText = date ? `تاریخ اندراج: ${date} | باضابطہ تصدیقی ریکارڈ` : 'کھاتے کے اس اندراج کے لیے باضابطہ منسلک شدہ ثبوت';
  if (downloadLink) downloadLink.href = imageUrl;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeProofModal() {
  const modal = document.getElementById('modal-proof-viewer');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// ==========================================
// GOOGLE AUTH EXTENSIONS
// ==========================================

function toggleCustomGoogleInput() {
  const form = document.getElementById('google-auth-form');
  if (form) {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      document.getElementById('google-auth-email')?.focus();
    }
  }
}

async function quickSelectGoogleAccount(email, name) {
  const emailInput = document.getElementById('google-auth-email');
  const nameInput = document.getElementById('google-auth-name');
  if (emailInput) emailInput.value = email;
  if (nameInput) nameInput.value = name;
  await submitGoogleAuth();
}

// ==========================================
// FORGOT PASSWORD MODAL & SUBMIT
// ==========================================

function openForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  if (!modal) return;
  
  // Pre-fill identifier if entered on login form
  const loginId = document.getElementById('farmer-login-id')?.value.trim() || document.getElementById('gw-login-id')?.value.trim() || '';
  const fpIdInput = document.getElementById('fp-identifier');
  if (fpIdInput && loginId) fpIdInput.value = loginId;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

async function handleForgotPasswordSubmit(e) {
  if (e) e.preventDefault();
  const identifier = document.getElementById('fp-identifier')?.value.trim();
  const name = document.getElementById('fp-name')?.value.trim();
  const message = document.getElementById('fp-message')?.value.trim();

  if (!identifier || !name) {
    alert('براہ کرم اپنا موبائل نمبر اور نام دونوں درج کریں۔');
    return;
  }

  const btn = document.getElementById('btn-submit-fp');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>درخواست بھیجی جا رہی ہے...</span>`;
  }

  try {
    const res = await fetch('/api/farmer/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, name, message })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || 'درخواست بھیجنے میں مسئلہ پیش آیا۔');
      return;
    }

    alert('شکریہ! آپ کی پاس ورڈ ریکوری کی درخواست ہارون زرعی مرکز کو موصول ہو گئی ہے۔ ہماری ٹیم جلد آپ کے نمبر پر رابطہ کر کے پاس ورڈ فراہم کرے گی۔');
    closeForgotPasswordModal();
    const form = document.getElementById('form-forgot-password');
    if (form) form.reset();

  } catch (err) {
    console.error('Forgot password error:', err);
    alert('سرور سے رابطہ نہ ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}

// ==========================================
// COMPLAINT BOX & IMAGE UPLOAD
// ==========================================

let complaintImageBase64 = null;

function openComplaintModal() {
  const modal = document.getElementById('modal-farmer-complaint');
  if (!modal) return;

  // Pre-fill with session farmer info if available
  if (currentLoadedFarmer) {
    const nameInput = document.getElementById('cmp-farmer-name');
    const mobileInput = document.getElementById('cmp-farmer-mobile');
    if (nameInput && !nameInput.value) nameInput.value = currentLoadedFarmer.name || '';
    if (mobileInput && !mobileInput.value) mobileInput.value = currentLoadedFarmer.mobile || '';
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeComplaintModal() {
  const modal = document.getElementById('modal-farmer-complaint');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function handleComplaintImageSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      // Compress and resize
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      complaintImageBase64 = canvas.toDataURL('image/jpeg', 0.75);

      const previewImg = document.getElementById('cmp-preview-img');
      const previewWrap = document.getElementById('cmp-preview-wrap');
      const promptWrap = document.getElementById('cmp-upload-prompt');

      if (previewImg) previewImg.src = complaintImageBase64;
      if (previewWrap) previewWrap.classList.remove('hidden');
      if (promptWrap) promptWrap.classList.add('hidden');
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function removeComplaintImage() {
  complaintImageBase64 = null;
  const fileInput = document.getElementById('cmp-image-file');
  if (fileInput) fileInput.value = '';

  const previewWrap = document.getElementById('cmp-preview-wrap');
  const promptWrap = document.getElementById('cmp-upload-prompt');
  const previewImg = document.getElementById('cmp-preview-img');

  if (previewImg) previewImg.src = '';
  if (previewWrap) previewWrap.classList.add('hidden');
  if (promptWrap) promptWrap.classList.remove('hidden');
}

async function handleComplaintSubmit(e) {
  if (e) e.preventDefault();
  const farmerName = document.getElementById('cmp-farmer-name')?.value.trim();
  const mobile = document.getElementById('cmp-farmer-mobile')?.value.trim();
  const category = document.getElementById('cmp-category')?.value;
  const message = document.getElementById('cmp-message')?.value.trim();

  if (!farmerName || !mobile || !message) {
    alert('براہ کرم اپنا نام، موبائل نمبر اور شکایت کی تفصیل لازمی درج کریں۔');
    return;
  }

  const btn = document.getElementById('btn-submit-complaint');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>شکایت و ثبوت جمع ہو رہے ہیں...</span>`;
  }

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerName,
        mobile,
        category,
        message,
        imageUrl: complaintImageBase64
      })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      alert(data.error || 'شکایت جمع کرنے میں مسئلہ پیش آیا۔');
      return;
    }

    alert('آپ کی شکایت / رسید کا تصویری ثبوت کامیابی سے جمع ہو گیا ہے۔ ہارون زرعی مرکز کسٹمر سپورٹ ٹیم اس پر فوری کارروائی کرے گی۔ شکریہ!');
    closeComplaintModal();
    const form = document.getElementById('form-complaint');
    if (form) form.reset();
    removeComplaintImage();

  } catch (err) {
    console.error('Complaint submit error:', err);
    alert('سرور سے رابطہ نہ ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}

// ==========================================
// CUSTOMER KHATA PORTAL: PAYABLES TO FARMER
// (فصل خریداری و دیگر واجب الادا حساب)
// ==========================================
let custPayablesCache = [];
let currentCustPayableTab = 'crops';

async function loadCustomerFarmerPayables(farmerId) {
  if (!farmerId) return;
  const totalDueEl = document.getElementById('cust-pay-total-due');
  const statusPill = document.getElementById('cust-pay-status-pill');
  const countEl = document.getElementById('cust-pay-count');

  try {
    const res = await fetch('/api/payables?farmerId=' + encodeURIComponent(farmerId));
    if (!res.ok) return;
    custPayablesCache = await res.json();

    const cropsList = custPayablesCache.filter(p => (p.type || 'crop') === 'crop');
    const otherList = custPayablesCache.filter(p => p.type === 'other');

    let totalDue = 0;
    custPayablesCache.forEach(p => {
      totalDue += Number(p.remainingBalance || 0);
    });

    if (totalDueEl) totalDueEl.innerText = 'Rs. ' + totalDue.toLocaleString();
    if (countEl) countEl.innerText = custPayablesCache.length;

    if (statusPill) {
      if (totalDue > 0) {
        statusPill.className = "inline-block text-[10px] font-black px-3 py-1 rounded-full bg-amber-400 text-amber-950 shadow-xs";
        statusPill.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> واجب الوصول باقی رقم: Rs. ' + totalDue.toLocaleString();
      } else {
        statusPill.className = "inline-block text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/40 text-emerald-100";
        statusPill.innerText = "تمام ادائیگیاں مکمل ہو چکی ہیں";
      }
    }

    renderCustomerCropsTable(cropsList);
    renderCustomerOtherTable(otherList);
  } catch (err) {
    console.error('Customer payables load error:', err);
  }
}

function switchCustPayablesTab(tab) {
  currentCustPayableTab = tab;
  const btnCrops = document.getElementById('cust-subtab-btn-crops');
  const btnOther = document.getElementById('cust-subtab-btn-other');
  const tabCrops = document.getElementById('cust-subtab-crops');
  const tabOther = document.getElementById('cust-subtab-other');

  if (tab === 'crops') {
    if (btnCrops) btnCrops.className = "bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer";
    if (btnOther) btnOther.className = "bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer";
    if (tabCrops) tabCrops.classList.remove('hidden');
    if (tabOther) tabOther.classList.add('hidden');
  } else {
    if (btnCrops) btnCrops.className = "bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer";
    if (btnOther) btnOther.className = "bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer";
    if (tabCrops) tabCrops.classList.add('hidden');
    if (tabOther) tabOther.classList.remove('hidden');
  }
}

function renderCustomerCropsTable(crops) {
  const tbody = document.getElementById('cust-crops-tbody');
  if (!tbody) return;

  if (!crops || crops.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-gray-500 bg-gray-50/50">
          <i class="fa-solid fa-wheat-awn text-3xl text-emerald-300 block mb-2"></i>
          <span class="font-bold text-xs">اس وقت مرکز کی طرف آپ سے خریدی گئی فصل کی کوئی واجب الادا ادائیگی باقی نہیں ہے۔</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = crops.map(item => {
    const isPaid = item.paymentStatus === 'Paid';
    const isPartial = item.paymentStatus === 'Partial';
    const statusBadge = isPaid
      ? `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-check text-[9px]"></i> مکمل ادا شدہ</span>`
      : (isPartial
        ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i> جزوی ادا شدہ</span>`
        : `<span class="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-circle-exclamation text-[9px]"></i> واجب الادا</span>`);

    const weightText = (item.weightMaunds || 0) + ' من' + (item.bagsCount ? (' (' + item.bagsCount + ' بوری)') : '');
    const varietyBadge = item.variety ? ('<span class="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold mr-1">' + escapeHtml(item.variety) + '</span>') : '';

    return `
      <tr class="hover:bg-amber-50/40 transition">
        <td class="p-3 font-mono text-xs text-gray-600">${escapeHtml(item.date || '-')}</td>
        <td class="p-3">
          <div class="font-black text-brand-950 flex items-center gap-1">
            <i class="fa-solid fa-wheat-awn text-emerald-600"></i>
            <span>${escapeHtml(item.cropName || '-')}</span>
            ${varietyBadge}
          </div>
          ${item.notes ? ('<div class="text-[11px] text-gray-500 mt-0.5">' + escapeHtml(item.notes) + '</div>') : ''}
        </td>
        <td class="p-3 font-bold font-mono text-gray-800">${weightText}</td>
        <td class="p-3 font-bold font-mono text-gray-700">Rs. ${(Number(item.ratePerMaund) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-gray-900">Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-emerald-700">Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono ${Number(item.remainingBalance) > 0 ? 'text-rose-700 text-sm' : 'text-emerald-700'}">Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}</td>
        <td class="p-3 text-center">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function renderCustomerOtherTable(otherList) {
  const tbody = document.getElementById('cust-other-tbody');
  if (!tbody) return;

  if (!otherList || otherList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-gray-500 bg-gray-50/50">
          <i class="fa-solid fa-receipt text-3xl text-indigo-300 block mb-2"></i>
          <span class="font-bold text-xs">اس وقت دیگر مدات (کرایہ، پلے داری، بونس) میں کوئی واجب الادا رقم باقی نہیں ہے۔</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = otherList.map(item => {
    const isPaid = item.paymentStatus === 'Paid';
    const isPartial = item.paymentStatus === 'Partial';
    const statusBadge = isPaid
      ? `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-check text-[9px]"></i> مکمل ادا شدہ</span>`
      : (isPartial
        ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i> جزوی ادا شدہ</span>`
        : `<span class="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-circle-exclamation text-[9px]"></i> واجب الادا</span>`);

    return `
      <tr class="hover:bg-indigo-50/30 transition">
        <td class="p-3 font-mono text-xs text-gray-600">${escapeHtml(item.date || '-')}</td>
        <td class="p-3">
          <span class="bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-xs px-2.5 py-1 rounded-xl">
            ${escapeHtml(item.category || item.cropName || 'متفرق')}
          </span>
        </td>
        <td class="p-3">
          <div class="font-bold text-gray-900">${escapeHtml(item.title || item.cropName || '-')}</div>
          ${item.notes ? ('<div class="text-[11px] text-gray-500 mt-0.5">' + escapeHtml(item.notes) + '</div>') : ''}
        </td>
        <td class="p-3 font-black font-mono text-gray-900">Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-emerald-700">Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono ${Number(item.remainingBalance) > 0 ? 'text-rose-700 text-sm' : 'text-emerald-700'}">Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}</td>
        <td class="p-3 text-center">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}
