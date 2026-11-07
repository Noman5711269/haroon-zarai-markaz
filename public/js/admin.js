// Haroon Zarai Markaz - Admin Portal JS

let currentAdminTab = 'overview';
let activeFarmerIdForLedger = null;
let allFarmersCache = [];
let allRatesCache = [];
let allProductsCache = [];
let allRequestsCache = [];
let currentAdviyaatFilter = 'all';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function escapeJs(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/['"\\]/g, '\\$&').replace(/\n/g, '\\n').replace(/\r/g, '');
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndInit();
  setupAdminForms();
});

// 1. Auth & Session
function checkAuthAndInit() {
  const token = sessionStorage.getItem('adminToken');
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardApp = document.getElementById('admin-dashboard-app');

  if (token) {
    loginScreen.classList.add('hidden');
    dashboardApp.classList.remove('hidden');
    loadAdminStats();
    loadAllFarmers();
    loadRecentTransactions();
    loadAllRates();
    loadAllProducts();
    loadTradeRequests();
    loadAdminSettings();
    loadFarmerLogins();
    loadPayables();
  } else {
    loginScreen.classList.remove('hidden');
    dashboardApp.classList.add('hidden');
  }
}

function adminFetch(url, options = {}) {
  const token = sessionStorage.getItem('adminToken') || '';
  if (!options.headers) options.headers = {};
  options.headers['Content-Type'] = 'application/json';
  options.headers['x-admin-token'] = token;
  return fetch(url, options);
}

// --- Admin Authentication (Username & Password ONLY) ---

// Password Visibility Toggle
function togglePassVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Admin Username & Password Form Submit
const adminLoginForm = document.getElementById('admin-login-form');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('admin-username-input')?.value || '').trim();
    const password = (document.getElementById('admin-password-input')?.value || '').trim();
    const errBox = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    if (!username || !password) {
      if (errBox) {
        errBox.classList.remove('hidden');
        errBox.innerText = 'برائے مہربانی ایڈمن یوزر نیم اور پاس ورڈ دونوں درج کریں۔';
      }
      return;
    }

    if (errBox) errBox.classList.add('hidden');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>تصدیق ہو رہی ہے...</span>`;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('adminToken', data.token);
        if (data.adminName) {
          const nameEl = document.getElementById('admin-welcome-name');
          if (nameEl) nameEl.innerText = `${data.adminName} (ایڈمن)`;
        }
        checkAuthAndInit();
      } else {
        if (errBox) {
          errBox.classList.remove('hidden');
          errBox.innerText = data.message || 'غلط ایڈمن یوزر نیم یا پاس ورڈ!';
        }
      }
    } catch (err) {
      if (errBox) {
        errBox.classList.remove('hidden');
        errBox.innerText = 'سرور سے رابطہ نہ ہو سکا۔ برائے مہربانی انٹرنیٹ چیک کریں۔';
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>ایڈمن لاگ ان کریں (Login)</span>`;
      }
    }
  });
}

async function adminLogout() {
  if (confirm('کیا آپ ایڈمن پورٹل سے لاگ آؤٹ کرنا چاہتے ہیں؟')) {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    sessionStorage.removeItem('adminToken');
    window.location.reload();
  }
}

// 2. Tab Navigation
let currentKhaadFilter = 'all';
let currentSeedsFilter = 'all';

function switchAdminTab(tabName) {
  // Support legacy or direct sub-links
  if (tabName === 'products') tabName = 'adviyaat';
  if (tabName === 'fertilizer' || tabName === 'fertilizers') tabName = 'khaad';
  if (tabName === 'seed') tabName = 'seeds';
  if (tabName === 'rates' || tabName === 'seeds-mandi' || tabName === 'mandi') tabName = 'mandi-rates';
  if (tabName === 'requests') {
    tabName = 'mandi-rates';
    setTimeout(() => switchMandiRatesSubTab('requests'), 30);
  }

  currentAdminTab = tabName;

  document.querySelectorAll('.tab-btn').forEach(b => {
    const bTab = b.dataset.tab;
    if (bTab === tabName) {
      if (bTab === 'khata') {
        b.className = "tab-btn active bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else if (bTab === 'payables') {
        b.className = "tab-btn active bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else if (bTab === 'adviyaat') {
        b.className = "tab-btn active bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else if (bTab === 'khaad') {
        b.className = "tab-btn active bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else if (bTab === 'seeds') {
        b.className = "tab-btn active bg-teal-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else if (bTab === 'mandi-rates') {
        b.className = "tab-btn active bg-yellow-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm font-black";
      } else {
        b.className = "tab-btn active bg-agroorange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm";
      }
    } else {
      if (bTab === 'khata') {
        b.className = "tab-btn bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else if (bTab === 'payables') {
        b.className = "tab-btn bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else if (bTab === 'adviyaat') {
        b.className = "tab-btn bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else if (bTab === 'khaad') {
        b.className = "tab-btn bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else if (bTab === 'seeds') {
        b.className = "tab-btn bg-teal-50 text-teal-950 hover:bg-teal-100 border border-teal-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else if (bTab === 'mandi-rates') {
        b.className = "tab-btn bg-yellow-50 text-yellow-950 hover:bg-yellow-100 border border-yellow-300 px-4 py-2 rounded-xl flex items-center gap-2 transition font-black";
      } else {
        b.className = "tab-btn bg-agroyellow-50 text-gray-700 hover:bg-agroyellow-100 border border-agroyellow-200 px-4 py-2 rounded-xl flex items-center gap-2 transition";
      }
    }
  });

  document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) activeSection.classList.remove('hidden');

  if (tabName === 'overview') {
    loadAdminStats();
    loadFarmerLogins();
  }
  if (tabName === 'khata') {
    loadAllFarmers();
    loadRecentTransactions();
    loadAllProducts();
    loadFarmerLogins();
  }
  if (tabName === 'payables') {
    loadPayables();
    loadAllFarmers();
  }
  if (tabName === 'adviyaat') {
    loadAllProducts();
  }
  if (tabName === 'khaad') {
    loadAllProducts();
  }
  if (tabName === 'seeds') {
    loadAllProducts();
  }
  if (tabName === 'mandi-rates') {
    loadAllRates();
    loadTradeRequests();
  }
  if (tabName === 'complaints') {
    loadComplaints();
  }
}

// Subtab switcher for Portal 5: Mandi Rates & Offers
function switchMandiRatesSubTab(subTabName) {
  document.querySelectorAll('.manditab-pill').forEach(btn => {
    btn.className = "manditab-pill bg-yellow-50 text-gray-700 hover:bg-yellow-100 border border-yellow-200 px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer";
  });
  const activeBtn = document.getElementById(`manditab-btn-${subTabName}`);
  if (activeBtn) {
    activeBtn.className = "manditab-pill active bg-yellow-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer";
  }

  document.querySelectorAll('.mandiview-pane').forEach(p => p.classList.add('hidden'));
  const activePane = document.getElementById(`mandiview-${subTabName}`);
  if (activePane) activePane.classList.remove('hidden');

  if (subTabName === 'rates') loadAllRates();
  if (subTabName === 'requests') loadTradeRequests();
}

// 3. Stats & Overview
async function loadAdminStats() {
  try {
    const res = await adminFetch('/api/admin/stats');
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('stat-farmers').innerText = stats.totalFarmers || 0;
      document.getElementById('stat-receivable').innerText = `Rs. ${(stats.totalReceivable || 0).toLocaleString()}`;
      document.getElementById('stat-payable').innerText = `Rs. ${(stats.totalPayable || 0).toLocaleString()}`;
      document.getElementById('stat-requests').innerText = stats.totalRequests || 0;
      document.getElementById('stat-pending-req').innerText = `${stats.pendingRequests || 0} زیرِ غور`;
      
      const badge = document.getElementById('badge-pending-requests');
      if (badge) badge.innerText = stats.pendingRequests || 0;

      const subtabBadge = document.getElementById('subtab-badge-requests');
      if (subtabBadge) subtabBadge.innerText = stats.pendingRequests || 0;

      const mandiReqBadge = document.getElementById('badge-mandi-requests');
      if (mandiReqBadge) mandiReqBadge.innerText = stats.pendingRequests || 0;

      const badgeCmp = document.getElementById('badge-pending-complaints');
      if (badgeCmp) badgeCmp.innerText = stats.pendingComplaints || 0;

      const bF = document.getElementById('badge-total-farmers');
      if (bF && stats.totalFarmers !== undefined) bF.innerText = stats.totalFarmers;

      const bRates = document.getElementById('badge-total-rates');
      if (bRates && stats.activeRatesCount !== undefined) bRates.innerText = stats.activeRatesCount;

      // Also ensure products are fetched to populate Adviyaat, Khaad & Seeds stats
      if (!allProductsCache || allProductsCache.length === 0) {
        loadAllProducts();
      } else {
        renderProductsTable(allProductsCache);
      }

      if (stats.totalPayablesRemaining !== undefined) {
        const pTotal = document.getElementById('stat-payables-total');
        if (pTotal) pTotal.innerText = `Rs. ${(stats.totalPayablesRemaining || 0).toLocaleString()}`;
        const pCrops = document.getElementById('stat-payables-crops');
        if (pCrops) pCrops.innerText = `Rs. ${(stats.cropPayablesRemaining || 0).toLocaleString()}`;
        const pOther = document.getElementById('stat-payables-other');
        if (pOther) pOther.innerText = `Rs. ${(stats.otherPayablesRemaining || 0).toLocaleString()}`;
        const pBadge = document.getElementById('badge-total-payables');
        if (pBadge) pBadge.innerText = stats.totalPayablesCount || 0;
      }
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }
}

// 4. Farmers & Khata Management
let recentFarmersOverviewCache = [];

async function loadAllFarmers(search = '') {
  try {
    const res = await adminFetch(`/api/farmers?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      allFarmersCache = await res.json();
      recentFarmersOverviewCache = allFarmersCache.slice(0, 10);
      renderFarmersTable(allFarmersCache);

      const overviewSearchInput = document.getElementById('overview-farmer-search');
      if (overviewSearchInput && overviewSearchInput.value.trim()) {
        filterOverviewRecentFarmers(overviewSearchInput.value);
      } else {
        renderOverviewRecentFarmers(recentFarmersOverviewCache);
      }

      const bF = document.getElementById('badge-total-farmers');
      if (bF) bF.innerText = allFarmersCache.length;
      const countEl = document.getElementById('admin-farmer-count');
      if (countEl) countEl.innerText = allFarmersCache.length;
      populatePayablesFarmerDropdowns();
    }
  } catch (err) {
    console.error('Farmers load error:', err);
  }
}

function renderOverviewRecentFarmers(farmers) {
  const tbody = document.getElementById('overview-recent-farmers');
  if (!tbody) return;

  if (farmers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-400 font-bold">کوئی کسان نہیں ملا۔</td></tr>`;
    return;
  }

  tbody.innerHTML = farmers.map(f => {
    const isReg = Boolean(f.password || f.registered);
    const passBadge = f.password 
      ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold px-2 py-0.5 rounded text-xs inline-flex items-center gap-1"><i class="fa-solid fa-key text-amber-600 text-[10px]"></i> <span>${escapeHtml(f.password)}</span></span>`
      : `<span class="text-gray-400 text-xs italic">کوئی نہیں</span>`;

    const deregisterBtn = isReg 
      ? `<button onclick="confirmDeregisterFarmer('${f.id}', '${escapeJs(f.name)}')" title="کسان کی آن لائن رجسٹریشن ختم کریں" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"><i class="fa-solid fa-user-slash text-[11px]"></i> <span>رجسٹریشن ڈیلیٹ</span></button>`
      : '';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-3 font-mono font-bold text-brand-800">${f.id}</td>
        <td class="p-3 font-bold text-gray-900">${escapeHtml(f.name)}</td>
        <td class="p-3 font-mono text-gray-700 text-xs font-bold" dir="ltr">${f.mobile || f.cnic || '-'}</td>
        <td class="p-3">${passBadge}</td>
        <td class="p-3 text-gray-600 text-xs">${escapeHtml(f.village || '-')}</td>
        <td class="p-3 font-mono font-black ${f.currentBalance > 0 ? 'text-rose-600' : (f.currentBalance < 0 ? 'text-emerald-600' : 'text-gray-700')}">
          Rs. ${f.currentBalance.toLocaleString()}
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <button onclick="quickOpenKhataTx('${f.id}', 'debit')" title="مال ادھار دیں" class="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1">
              <i class="fa-solid fa-cart-plus text-rose-600 text-[10px]"></i>
              <span>+ مال</span>
            </button>
            <button onclick="quickOpenKhataTx('${f.id}', 'cash')" title="نقد پیسے جمع کریں" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1">
              <i class="fa-solid fa-money-bill-wave text-emerald-600 text-[10px]"></i>
              <span>+ پیسے</span>
            </button>
            <button onclick="quickOpenKhataTx('${f.id}', 'crop')" title="فروخت شدہ فصل سے پیسے جمع" class="bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-300 text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1">
              <i class="fa-solid fa-wheat-awn text-yellow-700 text-[10px]"></i>
              <span>+ فصل</span>
            </button>
            <button onclick="openLedgerModal('${f.id}')" title="مکمل کھاتہ دیکھیں" class="bg-amber-500 hover:bg-amber-600 text-brand-950 text-xs font-bold px-2 py-1 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1">
              <i class="fa-solid fa-receipt"></i>
              <span>کھاتہ</span>
            </button>
            <button onclick="editFarmer('${f.id}')" title="معلومات ایڈٹ کریں" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs p-1.5 rounded-lg border border-blue-200 transition cursor-pointer">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            ${deregisterBtn}
            <button onclick="deleteFarmer('${f.id}', '${escapeJs(f.name)}')" title="مکمل کھاتہ ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Live Search Filter for Overview Recent Farmers Table
function filterOverviewRecentFarmers(val) {
  const q = (val || '').trim().toLowerCase();
  const clearBtn = document.getElementById('overview-farmer-search-clear');
  if (clearBtn) {
    if (q) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  const list = allFarmersCache || [];
  if (!q) {
    renderOverviewRecentFarmers(recentFarmersOverviewCache.length ? recentFarmersOverviewCache : list.slice(0, 10));
    return;
  }

  const filtered = list.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.mobile && f.mobile.includes(q)) ||
    (f.village && f.village.toLowerCase().includes(q)) ||
    (f.cnic && f.cnic.includes(q)) ||
    (String(f.id).includes(q))
  );

  renderOverviewRecentFarmers(filtered);
}

function clearOverviewFarmerSearch() {
  const input = document.getElementById('overview-farmer-search');
  if (input) input.value = '';
  filterOverviewRecentFarmers('');
}

function renderFarmersTable(farmers) {
  const tbody = document.getElementById('admin-farmers-table-body');
  if (!tbody) return;

  const countEl = document.getElementById('admin-farmer-count');
  if (countEl) countEl.innerText = farmers.length;
  const badgeEl = document.getElementById('badge-total-farmers');
  if (badgeEl) badgeEl.innerText = (allFarmersCache && allFarmersCache.length) || farmers.length;

  // Populate Quick Transaction Farmer and Product dropdowns
  populateQuickTxFarmerDropdown(allFarmersCache.length ? allFarmersCache : farmers);
  populateQuickTxProductDropdown();

  if (farmers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400 font-bold">کوئی کسان کھاتہ نہیں ملا۔</td></tr>`;
    return;
  }

  tbody.innerHTML = farmers.map(f => {
    const bal = f.currentBalance;
    let balBadge = '';
    if (bal > 0) {
      balBadge = `<span class="bg-rose-100 text-rose-800 font-bold font-mono px-2.5 py-1 rounded-lg text-xs">
        Rs. ${bal.toLocaleString()} (واجب الادا)
      </span>`;
    } else if (bal < 0) {
      balBadge = `<span class="bg-emerald-100 text-emerald-800 font-bold font-mono px-2.5 py-1 rounded-lg text-xs">
        Rs. ${Math.abs(bal).toLocaleString()} (مرکز کے ذمے)
      </span>`;
    } else {
      balBadge = `<span class="bg-blue-100 text-blue-800 font-bold font-mono px-2.5 py-1 rounded-lg text-xs">
        Rs. 0 (کلیئر)
      </span>`;
    }

    const passBadge = f.password 
      ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1.5 shadow-2xs" title="کسان کا لاگ ان پاس ورڈ"><i class="fa-solid fa-key text-amber-600 text-[10px]"></i> <span>${escapeHtml(f.password)}</span></span>`
      : `<span class="text-gray-400 text-xs italic">کوئی نہیں</span>`;

    const isReg = Boolean(f.password || f.registered);
    const regBadge = isReg 
      ? `<span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-circle-check text-[9px]"></i> رجسٹرڈ</span>`
      : `<span class="bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">صرف آف لائن</span>`;

    const deregisterBtn = isReg 
      ? `<button onclick="confirmDeregisterFarmer('${f.id}', '${escapeJs(f.name)}')" title="کسان کی آن لائن رجسٹریشن ختم کریں (پاس ورڈ ڈیلیٹ)" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs px-2.5 py-1.5 rounded-lg border border-amber-400 transition cursor-pointer flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-user-slash text-[11px]"></i> <span>رجسٹریشن ڈیلیٹ</span></button>`
      : '';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-3.5 font-mono font-bold text-brand-900">${f.id}</td>
        <td class="p-3.5">
          <div class="font-extrabold text-gray-900">${escapeHtml(f.name)}</div>
          <div class="text-[11px] text-gray-500">ولدیت: ${escapeHtml(f.fatherName || '-')}</div>
        </td>
        <td class="p-3.5 font-mono font-bold text-gray-700" dir="ltr">${f.mobile || f.cnic || '-'}</td>
        <td class="p-3.5">${passBadge}</td>
        <td class="p-3.5">${regBadge}</td>
        <td class="p-3.5 text-gray-600">${escapeHtml(f.village || '-')}</td>
        <td class="p-3.5">${balBadge}</td>
        <td class="p-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <button onclick="quickOpenKhataTx('${f.id}', 'debit')" title="اس کسان کو کھاد، بیج یا زرعی دوا ادھار دیں" class="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-cart-plus text-rose-600"></i>
              <span>+ مال ادھار</span>
            </button>
            <button onclick="quickOpenKhataTx('${f.id}', 'cash')" title="کسان نے نقد رقم جمع کروائی" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-money-bill-wave text-emerald-600"></i>
              <span>+ پیسے جمع</span>
            </button>
            <button onclick="quickOpenKhataTx('${f.id}', 'crop')" title="کسان نے گندم، چاول، تل، سرسوں بیچی (کھاتے میں جمع)" class="bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-300 text-xs font-bold px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-wheat-awn text-yellow-700"></i>
              <span>+ فصل جمع</span>
            </button>
            <button onclick="openLedgerModal('${f.id}')" title="اس کسان کا مکمل کھاتہ، پرانے اور نئے تمام اندراجات دیکھیں، غلطی کی درستی (ایڈٹ) کریں یا پرنٹ سلپ نکالیں" class="bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer">
              <i class="fa-solid fa-file-invoice"></i>
              <span>کھاتہ و اندراجات</span>
            </button>
            <button onclick="editFarmer('${f.id}')" title="کسان کی ذاتی پروفائل (نام، والد کا نام، موبائل، شناختی کارڈ، رقبہ یا لاگ ان پاس ورڈ) تبدیل کریں" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-extrabold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer">
              <i class="fa-solid fa-user-pen text-amber-700"></i>
              <span>پروفائل تبدیلی</span>
            </button>
            ${deregisterBtn}
            <button onclick="deleteFarmer('${f.id}', '${escapeJs(f.name)}')" title="مکمل کھاتہ ریکارڈ ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Farmer search handlers & Search Button
function triggerFarmerSearch() {
  const input = document.getElementById('admin-farmer-search');
  const val = input ? input.value.trim() : '';
  loadAllFarmers(val);
}

function clearFarmerSearch() {
  const input = document.getElementById('admin-farmer-search');
  if (input) input.value = '';
  loadAllFarmers('');
}

const farmerSearchInput = document.getElementById('admin-farmer-search');
if (farmerSearchInput) {
  farmerSearchInput.addEventListener('input', (e) => {
    loadAllFarmers(e.target.value.trim());
  });
}

// Product Search in Portal 2: Zarai Adviyaat
function triggerProductAdminSearch() {
  const input = document.getElementById('admin-product-search');
  const q = input ? input.value.trim().toLowerCase() : '';
  const adviyaatItems = allProductsCache.filter(p => p.category === 'pesticide' || p.category === 'weedicide' || p.category === 'fungicide');
  if (!q) {
    renderAdviyaatTable(adviyaatItems);
    return;
  }
  const filtered = adviyaatItems.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.nameUrdu && p.nameUrdu.toLowerCase().includes(q)) ||
    (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
    (p.company && p.company.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.targetPests && p.targetPests.toLowerCase().includes(q)) ||
    (p.suitableCrops && p.suitableCrops.toLowerCase().includes(q))
  );
  renderAdviyaatTable(filtered);
}

function clearProductAdminSearch() {
  const input = document.getElementById('admin-product-search');
  if (input) input.value = '';
  const adviyaatItems = allProductsCache.filter(p => p.category === 'pesticide' || p.category === 'weedicide' || p.category === 'fungicide');
  renderAdviyaatTable(adviyaatItems);
}

// Khaad Search in Portal 3: Fertilizers
function triggerKhaadAdminSearch() {
  const input = document.getElementById('admin-khaad-search');
  const q = input ? input.value.trim().toLowerCase() : '';
  const khaadItems = allProductsCache.filter(p => p.category === 'fertilizer');
  if (!q) {
    renderKhaadTable(khaadItems);
    return;
  }
  const filtered = khaadItems.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.nameUrdu && p.nameUrdu.toLowerCase().includes(q)) ||
    (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
    (p.company && p.company.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q))
  );
  renderKhaadTable(filtered);
}

function clearKhaadAdminSearch() {
  const input = document.getElementById('admin-khaad-search');
  if (input) input.value = '';
  const khaadItems = allProductsCache.filter(p => p.category === 'fertilizer');
  renderKhaadTable(khaadItems);
}

// Mandi Rate Search in Portal 5: Mandi Rates
function triggerRateAdminSearch() {
  const input = document.getElementById('admin-rate-search');
  const q = input ? input.value.trim().toLowerCase() : '';
  if (!q) {
    renderRatesTable(allRatesCache);
    return;
  }
  const filtered = allRatesCache.filter(r => 
    (r.cropNameUrdu && r.cropNameUrdu.toLowerCase().includes(q)) ||
    (r.cropNameEn && r.cropNameEn.toLowerCase().includes(q)) ||
    (r.notes && r.notes.toLowerCase().includes(q)) ||
    (r.buyingPrice && r.buyingPrice.toString().includes(q)) ||
    (r.sellingPrice && r.sellingPrice.toString().includes(q))
  );
  renderRatesTable(filtered);
}

function clearRateAdminSearch() {
  const input = document.getElementById('admin-rate-search');
  if (input) input.value = '';
  renderRatesTable(allRatesCache);
}

// Seed Search in Portal 4: Seeds (Crop & Grass Seeds)
function triggerSeedAdminSearch() {
  const input = document.getElementById('admin-seed-search');
  const q = input ? input.value.trim().toLowerCase() : '';
  const seedItems = allProductsCache.filter(p => p.category === 'seed');
  if (!q) {
    renderSeedsTable(seedItems);
    return;
  }
  const filtered = seedItems.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.nameUrdu && p.nameUrdu.toLowerCase().includes(q)) ||
    (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
    (p.company && p.company.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q))
  );
  renderSeedsTable(filtered);
}

function clearSeedAdminSearch() {
  const input = document.getElementById('admin-seed-search');
  if (input) input.value = '';
  const seedItems = allProductsCache.filter(p => p.category === 'seed');
  renderSeedsTable(seedItems);
}

// Modal Ledger Transactions Filter & Search
let activeFarmerTransactionsCache = [];
let allRecentTransactionsCache = [];

function renderLedgerTransactionsRows(transactions) {
  const tbody = document.getElementById('led-transactions-tbody');
  const countEl = document.getElementById('led-tx-count');
  if (countEl) countEl.innerText = (transactions || []).length;
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-6 text-center text-gray-400">کوئی اندراج نہیں ملا۔</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const isDebit = tx.type === 'debit';
    const prodName = tx.productName || tx.description || 'زرعی مال';
    const qtyRate = tx.quantity ? (tx.quantity + (tx.unitPrice ? ` @ Rs. ${Number(tx.unitPrice).toLocaleString()}` : '')) : '-';

    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-3 text-gray-500 font-mono text-xs whitespace-nowrap">${tx.date}</td>
        <td class="p-3">
          <div class="font-bold text-gray-900">${prodName}</div>
          ${tx.description && tx.description !== prodName ? `<div class="text-[10px] text-gray-500">${tx.description}</div>` : ''}
        </td>
        <td class="p-3 font-semibold text-xs text-gray-700 whitespace-nowrap">${qtyRate}</td>
        <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${tx.category || '-'}</td>
        <td class="p-3 font-mono font-bold text-rose-600 whitespace-nowrap">
          ${isDebit ? 'Rs. ' + Number(tx.amount || 0).toLocaleString() : '-'}
        </td>
        <td class="p-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
          ${!isDebit ? 'Rs. ' + Number(tx.amount || 0).toLocaleString() : '-'}
        </td>
        <td class="p-3 font-mono font-black text-gray-800 whitespace-nowrap">
          Rs. ${tx.balanceAfter !== undefined ? Number(tx.balanceAfter).toLocaleString() : '-'}
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          ${tx.proofImage ? `
            <button type="button" onclick="viewTransactionProof('${tx.id}')" class="bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-300 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs transition cursor-pointer">
              <i class="fa-solid fa-file-invoice text-brand-600"></i> رسید دیکھیں
            </button>
          ` : '<span class="text-gray-300">-</span>'}
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5 justify-center">
            <button type="button" onclick="openEditTransactionModal('${tx.id}', '${activeFarmerIdForLedger}')" title="اندراج میں غلطی درست / ایڈٹ کریں (Edit Transaction)" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer">
              <i class="fa-solid fa-pen-to-square text-amber-700"></i>
              <span>ایڈٹ</span>
            </button>
            <button type="button" onclick="deleteTransaction('${tx.id}', '${activeFarmerIdForLedger}')" title="اندراج ختم کریں (Delete)" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer">
              <i class="fa-solid fa-trash-can text-rose-500"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterModalTransactions() {
  const input = document.getElementById('modal-tx-search');
  const q = input ? input.value.trim().toLowerCase() : '';
  if (!activeFarmerTransactionsCache) return;
  if (!q) {
    renderLedgerTransactionsRows(activeFarmerTransactionsCache);
    return;
  }
  const filtered = activeFarmerTransactionsCache.filter(tx => {
    const prod = (tx.productName || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const date = (tx.date || '').toLowerCase();
    const cat = (tx.category || '').toLowerCase();
    const amt = (tx.amount || '').toString();
    const qty = (tx.quantity || '').toLowerCase();
    return prod.includes(q) || desc.includes(q) || date.includes(q) || cat.includes(q) || amt.includes(q) || qty.includes(q);
  });
  renderLedgerTransactionsRows(filtered);
}

function clearModalTransactionsFilter() {
  const input = document.getElementById('modal-tx-search');
  if (input) input.value = '';
  if (activeFarmerTransactionsCache) {
    renderLedgerTransactionsRows(activeFarmerTransactionsCache);
  }
}

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

function resetFarmerMobileValidation() {
  const warnBox = document.getElementById('farmer-mobile-dup-warn');
  const warnText = document.getElementById('farmer-mobile-dup-text');
  const mobInput = document.getElementById('farmer-mobile');
  if (warnBox) warnBox.classList.add('hidden');
  if (warnText) warnText.innerText = '';
  if (mobInput) {
    mobInput.classList.remove('border-rose-500', 'bg-rose-50', 'text-rose-700', 'ring-2', 'ring-rose-400');
  }
}

function checkFarmerMobileDuplicate(val, editingFarmerId) {
  const warnBox = document.getElementById('farmer-mobile-dup-warn');
  const warnText = document.getElementById('farmer-mobile-dup-text');
  const mobInput = document.getElementById('farmer-mobile');

  const clean = formatStandardMobile(val);
  if (!clean || clean.length < 10) {
    resetFarmerMobileValidation();
    return null;
  }

  const dup = (allFarmersCache || []).find(f => {
    if (editingFarmerId && f.id === editingFarmerId) return false;
    return isSameMobile(f.mobile, val);
  });

  if (dup) {
    if (warnBox && warnText) {
      warnText.innerHTML = `یہ موبائل نمبر پہلے سے کسان <strong>"${escapeHtml(dup.name)}"</strong> (کھاتہ: ${escapeHtml(dup.id)}${dup.village ? ' - ' + escapeHtml(dup.village) : ''}) کے نام پر درج ہے! ایک ہی موبائل نمبر پر دو مختلف کسانوں کا کھاتہ نہیں کھل سکتا۔`;
      warnBox.classList.remove('hidden');
    }
    if (mobInput) {
      mobInput.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-700', 'ring-2', 'ring-rose-400');
    }
    return dup;
  } else {
    resetFarmerMobileValidation();
    return null;
  }
}

function openAddFarmerModal() {
  document.getElementById('form-farmer').reset();
  document.getElementById('farmer-edit-id').value = '';
  const passInp = document.getElementById('farmer-password');
  if (passInp) passInp.value = '';
  document.getElementById('modal-farmer-title').innerText = 'نیا کسان کھاتہ درج کریں';
  document.getElementById('farmer-initial-balance-container').classList.remove('hidden');
  resetFarmerMobileValidation();
  openModal('modal-farmer');
}

function editFarmer(id) {
  const f = allFarmersCache.find(x => x.id === id);
  if (!f) return;

  document.getElementById('farmer-edit-id').value = f.id;
  document.getElementById('farmer-name').value = f.name || '';
  document.getElementById('farmer-father').value = f.fatherName || '';
  document.getElementById('farmer-mobile').value = f.mobile || '';
  document.getElementById('farmer-cnic').value = f.cnic || '';
  document.getElementById('farmer-acres').value = f.landAcres || '';
  document.getElementById('farmer-village').value = f.village || '';
  const passInp = document.getElementById('farmer-password');
  if (passInp) passInp.value = f.password || '';
  document.getElementById('farmer-notes').value = f.notes || '';
  document.getElementById('farmer-initial-balance-container').classList.add('hidden');
  document.getElementById('modal-farmer-title').innerText = `کسان ایڈٹ کریں: ${f.name} (${f.id})`;
  resetFarmerMobileValidation();
  openModal('modal-farmer');
}

function editFarmerFromLedger() {
  if (!activeFarmerIdForLedger) return;
  const id = activeFarmerIdForLedger;
  closeModal('modal-ledger');
  editFarmer(id);
}

async function deleteActiveLedgerFarmer() {
  if (!activeFarmerIdForLedger) return;
  const id = activeFarmerIdForLedger;
  const f = allFarmersCache.find(x => x.id === id);
  const name = f ? f.name : (document.getElementById('led-farmer-name')?.innerText || 'کسان');
  closeModal('modal-ledger');
  await deleteFarmer(id, name);
}

async function deleteFarmer(id, name) {
  if (confirm(`کیا آپ واقعی کسان "${name}" (${id}) کا کھاتہ اور تمام سابقہ ریکارڈ ڈیلیٹ کرنا چاہتے ہیں؟`)) {
    try {
      const res = await adminFetch(`/api/farmers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert(`کسان "${name}" (${id}) کا کھاتہ اور تمام سابقہ ریکارڈ کامیابی سے ڈیلیٹ ہو گیا۔`);
        loadAllFarmers();
        loadAdminStats();
        loadFarmerLogins();
      } else {
        alert('ڈیلیٹ کرنے میں خرابی واقع ہوئی۔');
      }
    } catch (err) {
      alert('ڈیلیٹ کرنے میں خرابی واقع ہوئی۔');
    }
  }
}

async function confirmDeregisterFarmer(id, name) {
  if (confirm(`کیا آپ کسان "${name}" (${id}) کی آن لائن رجسٹریشن ختم (Deregister) کرنا چاہتے ہیں؟\n\nاس سے کسان کا پاس ورڈ اور آن لائن سائن اپ ختم ہو جائے گا تاکہ وہ نئے سرے سے سائن اپ کر سکے یا لاگ ان نہ ہو سکے۔ کھاتے کا بیلنس اور لین دین محفوظ رہیں گے۔`)) {
    try {
      const res = await adminFetch(`/api/farmers/${id}/deregister`, { method: 'POST' });
      if (res.ok) {
        alert(`کسان "${name}" کی آن لائن رجسٹریشن ختم کر دی گئی ہے۔ اب وہ غیر رجسٹرڈ ہے۔`);
        loadAllFarmers();
      } else {
        alert('رجسٹریشن ختم کرنے میں خرابی واقع ہوئی۔');
      }
    } catch (err) {
      console.error(err);
      alert('سرور سے رابطہ نہ ہو سکا۔');
    }
  }
}

// 5. QUICK KHATA TRANSACTION CONTROLLER (کھاتے میں ادھار مال، پیسے جمع اور فصل جمع)
function populateQuickTxFarmerDropdown(farmers) {
  const select = document.getElementById('quick-tx-farmer');
  if (!select) return;

  const currentVal = select.value;
  const list = farmers || allFarmersCache || [];

  select.innerHTML = `<option value="">-- کسان منتخب کریں (نام یا موبائل نمبر) --</option>` +
    list.map(f => {
      const balStr = f.currentBalance > 0 
        ? `Rs. ${f.currentBalance.toLocaleString()} (ادھار)` 
        : (f.currentBalance < 0 ? `Rs. ${Math.abs(f.currentBalance).toLocaleString()} (جمع)` : 'Rs. 0');
      return `<option value="${f.id}">${f.id}: ${escapeHtml(f.name)} (${f.mobile || f.village || '-'}) • بقایا: ${balStr}</option>`;
    }).join('');

  if (currentVal && list.some(x => x.id === currentVal)) {
    select.value = currentVal;
    onQuickTxFarmerChange(currentVal);
  }
}

// Live Filter & Search for Quick Khata Entry Farmer Selection
function filterQuickTxFarmerDropdown(query) {
  const q = (query || '').trim().toLowerCase();
  const select = document.getElementById('quick-tx-farmer');
  const clearBtn = document.getElementById('quick-tx-farmer-search-clear');
  if (clearBtn) {
    if (q) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  if (!select) return;

  const list = allFarmersCache || [];
  if (!q) {
    populateQuickTxFarmerDropdown(list);
    return;
  }

  const filtered = list.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) ||
    (f.mobile && f.mobile.includes(q)) ||
    (f.village && f.village.toLowerCase().includes(q)) ||
    (f.cnic && f.cnic.includes(q)) ||
    (String(f.id).includes(q))
  );

  if (filtered.length === 0) {
    select.innerHTML = `<option value="">-- کوئی کسان نہیں ملا ("${escapeHtml(q)}") --</option>`;
    onQuickTxFarmerChange('');
    return;
  }

  select.innerHTML = `<option value="">-- سرچ شدہ کسان (${filtered.length} ملے) --</option>` +
    filtered.map(f => {
      const balStr = f.currentBalance > 0 
        ? `Rs. ${f.currentBalance.toLocaleString()} (ادھار)` 
        : (f.currentBalance < 0 ? `Rs. ${Math.abs(f.currentBalance).toLocaleString()} (جمع)` : 'Rs. 0');
      return `<option value="${f.id}">${f.id}: ${escapeHtml(f.name)} (${f.mobile || f.village || '-'}) • بقایا: ${balStr}</option>`;
    }).join('');

  // Auto-select the first matching farmer!
  select.value = filtered[0].id;
  onQuickTxFarmerChange(filtered[0].id);
}

function triggerQuickTxFarmerSearchBtn() {
  const input = document.getElementById('quick-tx-farmer-search-input');
  const val = input ? input.value : '';
  filterQuickTxFarmerDropdown(val);
}

function clearQuickTxFarmerSearch() {
  const input = document.getElementById('quick-tx-farmer-search-input');
  if (input) input.value = '';
  filterQuickTxFarmerDropdown('');
}

function populateQuickTxProductDropdown() {
  const dd = document.getElementById('quick-prod-dropdown');
  if (!dd) return;

  dd.innerHTML = `<option value="">-- فہرست سے چنیں یا کسٹم لکھیں --</option>` +
    allProductsCache.map(p => {
      return `<option value="${p.id}" data-name="${escapeHtml(p.nameUrdu)}" data-price="${p.price}" data-pack="${escapeHtml(p.packSize || '')}" data-cat="${escapeHtml(p.categoryUrdu || p.category)}">
        ${escapeHtml(p.nameUrdu)} (${escapeHtml(p.company || '')}) - Rs. ${(p.price || 0).toLocaleString()} (${escapeHtml(p.packSize || '')})
      </option>`;
    }).join('') +
    `<option value="custom">دیگر کسٹم مال / دوا / بیج (خود لکھیں)</option>`;
}

function onQuickTxFarmerChange(farmerId) {
  const balEl = document.getElementById('quick-tx-farmer-balance');
  if (!balEl) return;

  if (!farmerId) {
    balEl.className = "text-base font-black font-mono text-gray-800";
    balEl.innerText = "Rs. 0 (منتخب نہیں)";
    return;
  }

  const f = allFarmersCache.find(x => x.id === farmerId);
  if (!f) return;

  if (f.currentBalance > 0) {
    balEl.className = "text-base font-black font-mono text-rose-600";
    balEl.innerText = `Rs. ${f.currentBalance.toLocaleString()} (کسان کے ذمے واجب الادا)`;
  } else if (f.currentBalance < 0) {
    balEl.className = "text-base font-black font-mono text-emerald-600";
    balEl.innerText = `Rs. ${Math.abs(f.currentBalance).toLocaleString()} (مرکز کے ذمے کریڈٹ)`;
  } else {
    balEl.className = "text-base font-black font-mono text-blue-600";
    balEl.innerText = "Rs. 0 (کھاتہ صاف ہے)";
  }
}

function switchQuickTxMode(mode) {
  const panelDebit = document.getElementById('quick-panel-debit');
  const panelCash = document.getElementById('quick-panel-cash');
  const panelCrop = document.getElementById('quick-panel-crop');
  const btnText = document.getElementById('quick-tx-submit-text');

  if (panelDebit) panelDebit.classList.add('hidden');
  if (panelCash) panelCash.classList.add('hidden');
  if (panelCrop) panelCrop.classList.add('hidden');

  if (mode === 'debit') {
    if (panelDebit) panelDebit.classList.remove('hidden');
    if (btnText) btnText.innerText = 'کھاتے میں ادھار مال محفوظ کریں';
  } else if (mode === 'cash') {
    if (panelCash) panelCash.classList.remove('hidden');
    if (btnText) btnText.innerText = 'نقد رقم کھاتے میں جمع کریں';
  } else if (mode === 'crop') {
    if (panelCrop) panelCrop.classList.remove('hidden');
    if (btnText) btnText.innerText = 'فصل کے پیسے کھاتے میں جمع کریں';
  }
}

function onQuickProdDropdownChange(prodId) {
  if (!prodId || prodId === 'custom') {
    const nameInp = document.getElementById('quick-prod-name');
    if (nameInp) nameInp.focus();
    return;
  }

  const p = allProductsCache.find(x => x.id === prodId);
  if (p) {
    document.getElementById('quick-prod-name').value = p.nameUrdu;
    document.getElementById('quick-prod-price').value = p.price;
    document.getElementById('quick-prod-pack').value = p.packSize || '';
    
    let catVal = 'کھاد و نیوٹریشن';
    if (p.category === 'seed') catVal = 'تصدیق شدہ بیج';
    else if (p.category === 'weedicide') catVal = 'جڑی بوٹی مار دوا';
    else if (p.category === 'fungicide') catVal = 'پھپھوندی کش دوا';
    else if (p.category === 'pesticide') catVal = 'کیڑے مار دوا';
    
    const catSelect = document.getElementById('quick-prod-category');
    if (catSelect) catSelect.value = catVal;

    const qtyInp = document.getElementById('quick-prod-qty');
    if (qtyInp && !qtyInp.value.trim()) {
      qtyInp.value = "1 " + (p.packSize || "بوری");
    }
    calcQuickDebitTotal();
  }
}

function calcQuickDebitTotal() {
  const qtyStr = document.getElementById('quick-prod-qty')?.value || '';
  const price = Number(document.getElementById('quick-prod-price')?.value) || 0;
  const match = qtyStr.match(/\d+(\.\d+)?/);
  const qtyNum = match ? parseFloat(match[0]) : 1;
  const total = Math.round(qtyNum * price);
  const totalInp = document.getElementById('quick-prod-total');
  if (totalInp) totalInp.value = total > 0 ? total : 0;
}

function onQuickCropChange(cropVal) {
  const customInp = document.getElementById('quick-crop-custom-name');
  if (cropVal === 'custom') {
    if (customInp) {
      customInp.classList.remove('hidden');
      customInp.focus();
    }
  } else {
    if (customInp) customInp.classList.add('hidden');
  }

  const select = document.getElementById('quick-crop-select');
  const selectedOpt = select.options[select.selectedIndex];
  const rate = selectedOpt ? selectedOpt.dataset.rate : null;

  if (rate) {
    document.getElementById('quick-crop-rate').value = rate;
  }
  calcQuickCropTotal();
}

function calcQuickCropTotal() {
  const weight = Number(document.getElementById('quick-crop-weight')?.value) || 0;
  const rate = Number(document.getElementById('quick-crop-rate')?.value) || 0;
  const total = Math.round(weight * rate);
  
  const displayEl = document.getElementById('quick-crop-total-display');
  if (displayEl) displayEl.innerText = `Rs. ${total.toLocaleString()}`;

  const amountInp = document.getElementById('quick-crop-total-amount');
  if (amountInp) amountInp.value = total;
}

function quickOpenKhataTx(farmerId, mode = 'debit') {
  if (currentAdminTab !== 'khata') {
    switchAdminTab('khata');
  }

  const farmerSelect = document.getElementById('quick-tx-farmer');
  if (farmerSelect) {
    populateQuickTxFarmerDropdown();
    farmerSelect.value = farmerId;
    onQuickTxFarmerChange(farmerId);
  }

  const searchInp = document.getElementById('quick-tx-farmer-search-input');
  if (searchInp) {
    const f = (allFarmersCache || []).find(x => x.id === farmerId);
    if (f) searchInp.value = f.name;
    const clearBtn = document.getElementById('quick-tx-farmer-search-clear');
    if (clearBtn) clearBtn.classList.remove('hidden');
  }

  const radios = document.getElementsByName('quickTxModeRadio');
  radios.forEach(r => {
    if (r.value === mode) r.checked = true;
  });
  switchQuickTxMode(mode);

  const card = document.getElementById('card-quick-khata-tx');
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('ring-4', 'ring-emerald-400');
    setTimeout(() => card.classList.remove('ring-4', 'ring-emerald-400'), 2500);
  }

  if (mode === 'debit') {
    const pDd = document.getElementById('quick-prod-dropdown');
    if (pDd) pDd.focus();
  } else if (mode === 'cash') {
    const cashInp = document.getElementById('quick-cash-amount');
    if (cashInp) cashInp.focus();
  } else if (mode === 'crop') {
    const cropSel = document.getElementById('quick-crop-select');
    if (cropSel) cropSel.focus();
  }
}

function handleQuickTxProofFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const rawData = e.target.result;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedData = canvas.toDataURL('image/jpeg', 0.85);

      const previewBox = document.getElementById('quick-tx-preview-box');
      const previewImg = document.getElementById('quick-tx-preview-img');
      const hiddenInp = document.getElementById('quick-tx-proof-image');

      if (previewBox && previewImg && hiddenInp) {
        previewImg.src = compressedData;
        hiddenInp.value = compressedData;
        previewBox.classList.remove('hidden');

        // Asynchronously save to cloud DB / server uploads for a clean permanent URL
        adminFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedData })
        }).then(res => res.json()).then(data => {
          if (data && data.url) {
            hiddenInp.value = data.url;
            console.log('Quick tx proof uploaded to permanent storage:', data.url);
          }
        }).catch(err => {
          console.warn('Background proof upload error, base64 retained:', err);
        });
      }
    };
    img.src = rawData;
  };
  reader.readAsDataURL(file);
}

function removeQuickTxProof() {
  const previewBox = document.getElementById('quick-tx-preview-box');
  const previewImg = document.getElementById('quick-tx-preview-img');
  const hiddenInp = document.getElementById('quick-tx-proof-image');
  const fileInp = document.getElementById('quick-tx-file');

  if (previewBox) previewBox.classList.add('hidden');
  if (previewImg) previewImg.src = '';
  if (hiddenInp) hiddenInp.value = '';
  if (fileInp) fileInp.value = '';
}

// Quick Khata Form Submit Listener
const quickTxForm = document.getElementById('form-quick-khata-tx');
if (quickTxForm) {
  quickTxForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const farmerId = document.getElementById('quick-tx-farmer')?.value;
    if (!farmerId) {
      alert('براہ کرم سب سے پہلے کسان بھائی کا نام منتخب کریں۔');
      document.getElementById('quick-tx-farmer').focus();
      return;
    }

    const mode = document.querySelector('input[name="quickTxModeRadio"]:checked')?.value || 'debit';
    const type = (mode === 'cash' || mode === 'crop') ? 'credit' : 'debit';

    let productName = "";
    let quantity = "";
    let unitPrice = 0;
    let amount = 0;
    let category = "";
    let description = "";

    if (mode === 'debit') {
      productName = document.getElementById('quick-prod-name')?.value.trim();
      quantity = document.getElementById('quick-prod-qty')?.value.trim();
      unitPrice = Number(document.getElementById('quick-prod-price')?.value) || 0;
      amount = Number(document.getElementById('quick-prod-total')?.value) || 0;
      category = document.getElementById('quick-prod-category')?.value || 'زرعی مال';
      const pack = document.getElementById('quick-prod-pack')?.value.trim();
      description = `${productName} (${quantity}${unitPrice > 0 ? ' @ Rs. ' + unitPrice.toLocaleString() : ''})${pack ? ' [' + pack + ']' : ''}`;

      if (!productName) {
        alert('براہ کرم دوا، کھاد یا بیج کا نام درج کریں۔');
        document.getElementById('quick-prod-name').focus();
        return;
      }
    } else if (mode === 'cash') {
      amount = Number(document.getElementById('quick-cash-amount')?.value) || 0;
      const payMode = document.getElementById('quick-cash-mode')?.value;
      const detail = document.getElementById('quick-cash-detail')?.value.trim();
      productName = payMode;
      quantity = "1 ادائیگی";
      unitPrice = amount;
      category = "نقد وصولی";
      description = detail ? `${payMode}: ${detail}` : payMode;
    } else if (mode === 'crop') {
      const cropSel = document.getElementById('quick-crop-select');
      const cropName = cropSel.value === 'custom' 
        ? (document.getElementById('quick-crop-custom-name').value.trim() || 'فصل') 
        : cropSel.value;
      const weight = Number(document.getElementById('quick-crop-weight')?.value) || 0;
      const rate = Number(document.getElementById('quick-crop-rate')?.value) || 0;
      amount = Number(document.getElementById('quick-crop-total-amount')?.value) || Math.round(weight * rate);
      const cropNotes = (document.getElementById('quick-crop-notes')?.value || '').trim();

      if (!cropSel.value) {
        alert('براہ کرم فروخت شدہ فصل کا نام منتخب کریں۔');
        cropSel.focus();
        return;
      }
      if (weight <= 0) {
        alert('براہ کرم فصل کا وزن (من) درج کریں۔');
        document.getElementById('quick-crop-weight').focus();
        return;
      }

      productName = `فروخت شدہ ${cropName}`;
      quantity = `${weight} من`;
      unitPrice = rate;
      category = "فروخت شدہ فصل جمع";
      description = `فروخت شدہ ${cropName} (${weight} من @ Rs. ${rate.toLocaleString()} فی من)${cropNotes ? ' - ' + cropNotes : ''}`;
    }

    if (!amount || amount <= 0) {
      alert('براہ کرم درست رقم درج فرمائیں۔ رقم 0 سے زیادہ ہونی چاہیے۔');
      return;
    }

    const submitBtn = document.getElementById('btn-quick-tx-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>محفوظ ہو رہا ہے...</span>`;
    }

    try {
      const proofImage = (document.getElementById('quick-tx-proof-image')?.value || '').trim();
      const res = await adminFetch(`/api/farmers/${farmerId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          category,
          productName,
          quantity,
          unitPrice,
          description,
          amount,
          date: new Date().toISOString().split('T')[0],
          proofImage
        })
      });

      if (res.ok) {
        quickTxForm.reset();
        removeQuickTxProof();
        const debitRadio = document.querySelector('input[name="quickTxModeRadio"][value="debit"]');
        if (debitRadio) debitRadio.checked = true;
        switchQuickTxMode('debit');

        await loadAllFarmers();
        await loadAdminStats();
        await loadRecentTransactions();
        
        // Re-select farmer and update displayed balance
        const fSelect = document.getElementById('quick-tx-farmer');
        if (fSelect) {
          fSelect.value = farmerId;
          onQuickTxFarmerChange(farmerId);
        }

        const successMsg = type === 'debit' 
          ? `مال / کھاد (Rs. ${amount.toLocaleString()}) کسان کے کھاتے میں کامیابی سے ادھار (Debit) درج ہو گیا۔`
          : (mode === 'crop' 
              ? `فصل فروخت کی رقم (Rs. ${amount.toLocaleString()}) کسان کے کھاتے میں کامیابی سے جمع (Credit) ہو گئی۔`
              : `نقد رقم (Rs. ${amount.toLocaleString()}) کسان کے کھاتے میں جمع (Credit) ہو گئی۔`);
        
        alert(`کامیابی! 🎉\n\n${successMsg}\n\n💡 اگر کوئی غلطی سے زیادہ یا کم پیسے یا ڈیٹا درج ہو گیا ہو تو نیچے "حالیہ کھاتہ اندراجات" میں ✏️ ایڈٹ کے بٹن سے فوری درست کر سکتے ہیں۔`);
      } else {
        alert('اندراج محفوظ کرنے میں خرابی واقع ہوئی۔');
      }
    } catch (err) {
      alert('سرور سے رابطہ نہ ہو سکا۔');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-circle-check text-base"></i> <span id="quick-tx-submit-text">کھاتے میں یہ اندراج محفوظ کریں</span>`;
      }
    }
  });
}

// 6. LEDGER DRAWER / MODAL
async function openLedgerModal(farmerId) {
  activeFarmerIdForLedger = farmerId;
  removeTxProofPhoto();
  openModal('modal-ledger');
  populateTxProductDropdown();
  await refreshActiveFarmerLedger();
}

function populateTxProductDropdown() {
  const dd = document.getElementById('tx-product-dropdown');
  if (!dd) return;

  dd.innerHTML = `<option value="">-- فہرست سے منتخب کریں یا نیچے کسٹم لکھیں --</option>` +
    allProductsCache.map(p => {
      return `<option value="${p.id}" data-name="${p.nameUrdu}" data-price="${p.price}" data-pack="${p.packSize}" data-cat="${p.categoryUrdu || p.category}">
        ${p.nameUrdu} (${p.company}) - Rs. ${p.price.toLocaleString()} (${p.packSize})
      </option>`;
    }).join('') +
    `<option value="custom">دیگر کسٹم مال / دوا / بیج (خود لکھیں)</option>`;
}

function toggleTxMode() {
  const isDebit = document.getElementById('radio-tx-debit')?.checked;
  const isCredit = document.getElementById('radio-tx-credit')?.checked;
  const isCrop = document.getElementById('radio-tx-crop')?.checked;

  const secDebit = document.getElementById('section-tx-debit');
  const secCredit = document.getElementById('section-tx-credit');
  const secCrop = document.getElementById('section-tx-crop');

  if (secDebit) secDebit.classList.add('hidden');
  if (secCredit) secCredit.classList.add('hidden');
  if (secCrop) secCrop.classList.add('hidden');

  if (isDebit) {
    if (secDebit) secDebit.classList.remove('hidden');
    document.getElementById('tx-product-name')?.setAttribute('required', 'true');
    document.getElementById('tx-quantity')?.setAttribute('required', 'true');
    document.getElementById('tx-amount')?.setAttribute('required', 'true');
    document.getElementById('tx-credit-amount')?.removeAttribute('required');
  } else if (isCredit) {
    if (secCredit) secCredit.classList.remove('hidden');
    document.getElementById('tx-product-name')?.removeAttribute('required');
    document.getElementById('tx-quantity')?.removeAttribute('required');
    document.getElementById('tx-amount')?.removeAttribute('required');
    document.getElementById('tx-credit-amount')?.setAttribute('required', 'true');
  } else if (isCrop) {
    if (secCrop) secCrop.classList.remove('hidden');
    document.getElementById('tx-product-name')?.removeAttribute('required');
    document.getElementById('tx-quantity')?.removeAttribute('required');
    document.getElementById('tx-amount')?.removeAttribute('required');
    document.getElementById('tx-credit-amount')?.removeAttribute('required');
  }
}

function onModalCropChange(cropVal) {
  const customInp = document.getElementById('tx-crop-custom-name');
  if (cropVal === 'custom') {
    if (customInp) {
      customInp.classList.remove('hidden');
      customInp.focus();
    }
  } else {
    if (customInp) customInp.classList.add('hidden');
  }

  const select = document.getElementById('tx-crop-select');
  const selectedOpt = select.options[select.selectedIndex];
  const rate = selectedOpt ? selectedOpt.dataset.rate : null;

  if (rate) {
    document.getElementById('tx-crop-rate').value = rate;
  }
  calcModalCropTotal();
}

function calcModalCropTotal() {
  const weight = Number(document.getElementById('tx-crop-weight')?.value) || 0;
  const rate = Number(document.getElementById('tx-crop-rate')?.value) || 0;
  const total = Math.round(weight * rate);
  
  const displayEl = document.getElementById('tx-crop-total-display');
  if (displayEl) displayEl.innerText = `Rs. ${total.toLocaleString()}`;

  const amountInp = document.getElementById('tx-crop-amount');
  if (amountInp) amountInp.value = total;
}

function onTxProductSelected(prodId) {
  if (!prodId || prodId === 'custom') {
    document.getElementById('tx-product-name').focus();
    return;
  }

  const p = allProductsCache.find(x => x.id === prodId);
  if (p) {
    document.getElementById('tx-product-name').value = p.nameUrdu;
    document.getElementById('tx-unit-price').value = p.price;
    if (!document.getElementById('tx-quantity').value.trim()) {
      document.getElementById('tx-quantity').value = "1 " + (p.packSize || "بوری");
    }
    calculateTxTotal();
  }
}

function calculateTxTotal() {
  const qtyStr = document.getElementById('tx-quantity')?.value || '';
  const price = Number(document.getElementById('tx-unit-price')?.value) || 0;
  
  const match = qtyStr.match(/\d+(\.\d+)?/);
  const qtyNum = match ? parseFloat(match[0]) : 1;

  if (price > 0) {
    document.getElementById('tx-amount').value = Math.round(qtyNum * price);
  }
}

async function refreshActiveFarmerLedger() {
  if (!activeFarmerIdForLedger) return;

  try {
    const res = await adminFetch(`/api/farmers/${activeFarmerIdForLedger}`);
    if (!res.ok) return;

    const f = await res.json();
    document.getElementById('led-farmer-id').innerText = f.id;
    document.getElementById('led-farmer-name').innerText = f.name;
    document.getElementById('led-farmer-father').innerText = f.fatherName || '-';
    document.getElementById('led-farmer-village').innerText = f.village || '-';
    document.getElementById('led-farmer-phone').innerText = f.mobile || '-';
    const passElem = document.getElementById('led-farmer-pass');
    if (passElem) passElem.innerText = f.password || 'کوئی نہیں';
    document.getElementById('led-tx-count').innerText = (f.transactions || []).length;

    const balElem = document.getElementById('led-farmer-balance');
    if (f.currentBalance > 0) {
      balElem.className = "text-xl md:text-2xl font-black font-mono text-rose-600";
      balElem.innerText = `Rs. ${f.currentBalance.toLocaleString()} (واجب الادا)`;
    } else if (f.currentBalance < 0) {
      balElem.className = "text-xl md:text-2xl font-black font-mono text-emerald-600";
      balElem.innerText = `Rs. ${Math.abs(f.currentBalance).toLocaleString()} (مرکز کے ذمے)`;
    } else {
      balElem.className = "text-xl md:text-2xl font-black font-mono text-blue-600";
      balElem.innerText = "Rs. 0 (صاف)";
    }

    // Transactions list
    activeFarmerTransactionsCache = f.transactions || [];
    const modalSearchInput = document.getElementById('modal-tx-search');
    if (modalSearchInput) modalSearchInput.value = '';
    renderLedgerTransactionsRows(activeFarmerTransactionsCache);

  } catch (err) {
    console.error('Ledger refresh error:', err);
  }
}

// Add transaction form submit handler (Modal)
const modalTxForm = document.getElementById('form-add-transaction');
if (modalTxForm) {
  modalTxForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeFarmerIdForLedger) return;

    const isCredit = document.getElementById('radio-tx-credit')?.checked;
    const isCrop = document.getElementById('radio-tx-crop')?.checked;
    const type = (isCredit || isCrop) ? 'credit' : 'debit';

    let productName = "";
    let quantity = "";
    let unitPrice = 0;
    let amount = 0;
    let category = "";
    let description = "";

    if (isCrop) {
      const cropSel = document.getElementById('tx-crop-select');
      const cropName = cropSel.value === 'custom' 
        ? (document.getElementById('tx-crop-custom-name').value.trim() || 'فصل') 
        : cropSel.value;
      const weight = Number(document.getElementById('tx-crop-weight')?.value) || 0;
      const rate = Number(document.getElementById('tx-crop-rate')?.value) || 0;
      amount = Number(document.getElementById('tx-crop-amount')?.value) || Math.round(weight * rate);
      const cropNotes = (document.getElementById('tx-crop-notes')?.value || '').trim();

      if (!cropSel.value) {
        alert('براہ کرم فروخت شدہ فصل کا نام منتخب کریں۔');
        cropSel.focus();
        return;
      }
      if (weight <= 0) {
        alert('براہ کرم فصل کا وزن (من) درج کریں۔');
        document.getElementById('tx-crop-weight').focus();
        return;
      }

      productName = `فروخت شدہ ${cropName}`;
      quantity = `${weight} من`;
      unitPrice = rate;
      category = 'فروخت شدہ فصل جمع';
      description = `فروخت شدہ ${cropName} (${weight} من @ Rs. ${rate.toLocaleString()} فی من)${cropNotes ? ' - ' + cropNotes : ''}`;
    } else if (isCredit) {
      amount = Number(document.getElementById('tx-credit-amount')?.value) || 0;
      const mode = document.getElementById('tx-credit-mode')?.value;
      const detail = document.getElementById('tx-credit-detail')?.value.trim();
      productName = mode;
      category = "نقد وصولی";
      description = detail ? `${mode}: ${detail}` : mode;
      quantity = "1 ادائیگی";
      unitPrice = amount;
    } else {
      productName = document.getElementById('tx-product-name')?.value.trim();
      quantity = document.getElementById('tx-quantity')?.value.trim();
      unitPrice = Number(document.getElementById('tx-unit-price')?.value) || 0;
      amount = Number(document.getElementById('tx-amount')?.value) || 0;
      category = document.getElementById('tx-category')?.value;
      description = document.getElementById('tx-desc')?.value.trim();
      if (!description) {
        description = `${productName} (${quantity})`;
      }
    }

    if (!amount || amount <= 0) {
      alert('براہ کرم درست رقم درج کریں۔ رقم 0 سے زیادہ ہونی چاہیے۔');
      return;
    }

    try {
      const proofImage = (document.getElementById('tx-proof-image')?.value || '').trim();
      const res = await adminFetch(`/api/farmers/${activeFarmerIdForLedger}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          category,
          productName,
          quantity,
          unitPrice,
          description,
          amount,
          date: new Date().toISOString().split('T')[0],
          proofImage
        })
      });

      if (res.ok) {
        modalTxForm.reset();
        removeTxProofPhoto();
        const debitRadio = document.getElementById('radio-tx-debit');
        if (debitRadio) debitRadio.checked = true;
        toggleTxMode();
        await refreshActiveFarmerLedger();
        loadAllFarmers();
        loadAdminStats();
        loadRecentTransactions();
        alert('کھاتے میں نیا اندراج کامیابی سے شامل ہو گیا!\n\n💡 اگر کوئی غلطی درج ہو گئی ہو تو نیچے اندراجات کے جدول میں ✏️ ایڈٹ کے بٹن سے فوری درست کر سکتے ہیں۔');
      } else {
        alert('اندراج محفوظ کرنے میں خرابی واقع ہوئی۔');
      }
    } catch (err) {
      alert('سرور سے رابطہ نہ ہو سکا۔');
    }
  });
}

// Transaction Proof Image Handlers
function handleTxProofFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const rawData = e.target.result;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedData = canvas.toDataURL('image/jpeg', 0.8);

      const previewBox = document.getElementById('tx-preview-box');
      const previewImg = document.getElementById('tx-preview-img');
      const hiddenInp = document.getElementById('tx-proof-image');

      if (previewBox && previewImg && hiddenInp) {
        previewImg.src = compressedData;
        hiddenInp.value = compressedData;
        previewBox.classList.remove('hidden');

        // Asynchronously save to cloud DB / server uploads for a clean permanent URL
        adminFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedData })
        }).then(res => res.json()).then(data => {
          if (data && data.url) {
            hiddenInp.value = data.url;
            console.log('Quick tx proof uploaded to permanent storage:', data.url);
          }
        }).catch(err => {
          console.warn('Background proof upload error, base64 retained:', err);
        });
      }
    };
    img.src = rawData;
  };
  reader.readAsDataURL(file);
}

function removeTxProofPhoto() {
  const previewBox = document.getElementById('tx-preview-box');
  const previewImg = document.getElementById('tx-preview-img');
  const hiddenInp = document.getElementById('tx-proof-image');
  const fileInp = document.getElementById('tx-proof-file');

  if (previewBox) previewBox.classList.add('hidden');
  if (previewImg) previewImg.src = '';
  if (hiddenInp) hiddenInp.value = '';
  if (fileInp) fileInp.value = '';
}

let currentProofUrl = '';

function viewTransactionProof(txId) {
  if (!txId) return;
  let tx = null;
  if (Array.isArray(activeFarmerTransactionsCache)) {
    tx = activeFarmerTransactionsCache.find(t => String(t.id) === String(txId));
  }
  if (!tx && Array.isArray(allRecentTransactionsCache)) {
    tx = allRecentTransactionsCache.find(t => String(t.id) === String(txId));
  }
  if (!tx && Array.isArray(allFarmersCache)) {
    for (const f of allFarmersCache) {
      if (Array.isArray(f.transactions)) {
        const found = f.transactions.find(t => String(t.id) === String(txId));
        if (found) { tx = found; break; }
      }
    }
  }
  if (!tx || (!tx.proofImage && !tx.receiptImage)) {
    showToast('اس اندراج کے ساتھ کوئی تصویری رسید منسلک نہیں ہے', 'info');
    return;
  }
  const imgUrl = tx.proofImage || tx.receiptImage;
  const title = tx.productName || tx.description || 'رسید ثبوت';
  openProofViewer(imgUrl, tx.id, title);
}

function openProofViewer(url, txId, title) {
  if (!url) return;
  currentProofUrl = url;
  const modal = document.getElementById('modal-proof-viewer');
  const img = document.getElementById('proof-viewer-img');
  const titleElem = document.getElementById('proof-viewer-title');
  const subElem = document.getElementById('proof-viewer-subtitle');
  const dlBtn = document.getElementById('proof-viewer-download');
  const spinner = document.getElementById('proof-viewer-spinner');
  const errElem = document.getElementById('proof-viewer-error');

  if (titleElem) titleElem.innerText = title ? `رسید / ثبوت: ${title}` : 'رسید / پرچی کا تصویری ثبوت';
  if (subElem) subElem.innerText = txId ? `اندراج نمبر: ${txId} • تصدیق شدہ اصل واؤچر` : 'کھاتے کے اس اندراج کے لیے منسلک شدہ باضابطہ ثبوت';
  if (dlBtn) {
    dlBtn.href = url;
    dlBtn.setAttribute('download', `receipt-${txId || 'proof'}.jpg`);
  }

  if (spinner) spinner.classList.remove('hidden');
  if (errElem) {
    errElem.classList.add('hidden');
    errElem.innerHTML = '';
  }

  if (img) {
    img.style.display = 'none';
    img.onload = () => {
      if (spinner) spinner.classList.add('hidden');
      img.style.display = 'block';
    };
    img.onerror = () => {
      if (spinner) spinner.classList.add('hidden');
      img.style.display = 'none';
      if (errElem) {
        errElem.classList.remove('hidden');
        errElem.innerHTML = `
          <div class="py-6 flex flex-col items-center justify-center text-rose-600 gap-2 font-urdu">
            <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
            <p class="font-bold text-sm">رسید کی تصویر لوڈ نہیں ہو سکی۔</p>
            <p class="text-xs text-gray-500">فائل کلاؤڈ پر تلاش کی جا رہی ہے یا انٹرنیٹ سست ہے۔ براہ کرم "بڑی اسکرین" پر کلک کر کے دیکھیں۔</p>
          </div>
        `;
      }
    };
    img.src = url;
  }

  if (modal) modal.classList.remove('hidden');
}

function openProofInNewWindow() {
  if (!currentProofUrl) return;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>رسید ثبوت - ہارون زرعی مرکز</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; padding:20px; background:#111827; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; color:white; }
    img { max-width:96vw; max-height:85vh; object-fit:contain; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); background:#fff; }
    .bar { margin-bottom:14px; display:flex; gap:12px; }
    a, button { background:#16a34a; color:#fff; text-decoration:none; padding:10px 18px; border-radius:10px; font-weight:bold; font-size:14px; border:none; cursor:pointer; }
    a:hover, button:hover { background:#15803d; }
  </style>
</head>
<body>
  <div class="bar">
    <a href="${currentProofUrl}" download="receipt.jpg">ڈاؤنلوڈ کریں</a>
    <button onclick="window.print()">پرنٹ کریں</button>
  </div>
  <img src="${currentProofUrl}" alt="رسید واؤچر">
</body>
</html>`);
    w.document.close();
  }
}

function closeProofViewer() {
  const modal = document.getElementById('modal-proof-viewer');
  if (modal) modal.classList.add('hidden');
  const img = document.getElementById('proof-viewer-img');
  if (img) img.src = '';
  currentProofUrl = '';
}

// ==========================================
// 7. RECENT TRANSACTIONS & KHATA EDIT SYSTEM
// ==========================================
async function loadRecentTransactions() {
  const tbody = document.getElementById('recent-transactions-tbody');
  const badge = document.getElementById('recent-tx-badge');
  if (!tbody) return;

  try {
    const res = await adminFetch('/api/transactions?limit=25');
    if (!res.ok) throw new Error('Failed to load recent transactions');
    const transactions = await res.json();
    allRecentTransactionsCache = transactions || [];

    if (badge) badge.innerText = allRecentTransactionsCache.length;

    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400 font-bold font-urdu">ابھی کوئی حالیہ کھاتہ اندراج موجود نہیں۔ نیا اندراج شامل کریں!</td></tr>`;
      return;
    }

    tbody.innerHTML = transactions.map(tx => {
      const isDebit = tx.type === 'debit';
      const prodName = tx.productName || tx.description || 'زرعی مال';
      const qtyRate = tx.quantity ? (tx.quantity + (tx.unitPrice ? ` @ Rs. ${Number(tx.unitPrice).toLocaleString()}` : '')) : '-';
      const farmerLabel = tx.farmerName ? `${escapeHtml(tx.farmerName)} <span class="font-mono text-[10px] text-gray-400">(${tx.farmerId})</span>` : tx.farmerId;

      return `
        <tr class="hover:bg-amber-50/40 transition">
          <td class="p-3 text-gray-500 font-mono text-xs whitespace-nowrap">${tx.date || '-'}</td>
          <td class="p-3 whitespace-nowrap">
            <div class="font-extrabold text-gray-900">${farmerLabel}</div>
            ${tx.farmerMobile ? `<div class="text-[10px] text-gray-500 font-mono" dir="ltr">${tx.farmerMobile}</div>` : ''}
          </td>
          <td class="p-3">
            <div class="font-bold text-gray-900">${escapeHtml(prodName)}</div>
            ${tx.description && tx.description !== prodName ? `<div class="text-[10px] text-gray-500">${escapeHtml(tx.description)}</div>` : ''}
          </td>
          <td class="p-3 font-semibold text-xs text-gray-700 whitespace-nowrap">${escapeHtml(qtyRate)}</td>
          <td class="p-3 font-mono font-bold text-rose-600 whitespace-nowrap">
            ${isDebit ? 'Rs. ' + Number(tx.amount || 0).toLocaleString() : '-'}
          </td>
          <td class="p-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
            ${!isDebit ? 'Rs. ' + Number(tx.amount || 0).toLocaleString() : '-'}
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${tx.proofImage ? `
              <button type="button" onclick="viewTransactionProof('${tx.id}')" class="bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-300 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs transition cursor-pointer">
                <i class="fa-solid fa-file-invoice text-brand-600"></i> رسید
              </button>
            ` : '<span class="text-gray-300">-</span>'}
          </td>
          <td class="p-3 text-center whitespace-nowrap bg-amber-50/30">
            <div class="inline-flex items-center gap-1.5 justify-center">
              <button type="button" onclick="openEditTransactionModal('${tx.id}', '${tx.farmerId}')" title="اس اندراج میں غلطی درست / ایڈٹ کریں (Edit Transaction)" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer hover:scale-105 active:scale-95">
                <i class="fa-solid fa-pen-to-square text-amber-700"></i>
                <span>ایڈٹ کریں</span>
              </button>
              <button type="button" onclick="deleteTransaction('${tx.id}', '${tx.farmerId}')" title="اندراج ختم کریں (Delete)" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-2 py-1.5 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer">
                <i class="fa-solid fa-trash-can text-rose-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('loadRecentTransactions error:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-rose-500 font-bold text-xs">حالیہ اندراجات لوڈ کرنے میں خرابی ہوئی۔</td></tr>`;
  }
}

async function deleteTransaction(txId, farmerId) {
  const targetFarmerId = farmerId || activeFarmerIdForLedger;
  if (!targetFarmerId) {
    alert('کسان کا شناختی ریکارڈ نہیں ملا۔');
    return;
  }
  if (!confirm('کیا آپ واقعی یہ اندراج کھاتے سے خارج کرنا چاہتے ہیں؟ کھاتے کا بقایا دوبارہ درست شمار کیا جائے گا۔')) return;
  try {
    const res = await adminFetch(`/api/farmers/${targetFarmerId}/transactions/${txId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      if (activeFarmerIdForLedger === targetFarmerId) {
        await refreshActiveFarmerLedger();
      }
      await loadAllFarmers();
      await loadAdminStats();
      await loadRecentTransactions();
      alert('اندراج کھاتے سے کامیابی کے ساتھ خارج کر دیا گیا اور کسان کا بقایا دوبارہ درست شمار ہو گیا!');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'حذف کرنے میں خرابی ہوئی۔');
    }
  } catch (err) {
    alert('حذف کرنے میں خرابی ہوئی۔ سرور سے رابطہ نہ ہو سکا۔');
  }
}

// ==========================================
// EDIT TRANSACTION (کھاتے کے اندراج کی درستی / ترمیم)
// ==========================================
async function openEditTransactionModal(txId, farmerId) {
  let targetFarmerId = farmerId || activeFarmerIdForLedger;
  let tx = null;

  // 1. Check in activeFarmerTransactionsCache
  if (activeFarmerTransactionsCache && activeFarmerTransactionsCache.length > 0) {
    tx = activeFarmerTransactionsCache.find(t => t.id === txId);
  }

  // 2. Check in allRecentTransactionsCache
  if (!tx && allRecentTransactionsCache && allRecentTransactionsCache.length > 0) {
    tx = allRecentTransactionsCache.find(t => t.id === txId);
    if (tx && tx.farmerId) targetFarmerId = tx.farmerId;
  }

  // 3. Check in allFarmersCache
  if (!tx && targetFarmerId) {
    const f = (allFarmersCache || []).find(x => x.id === targetFarmerId);
    if (f && f.transactions) {
      tx = f.transactions.find(t => t.id === txId);
    }
  }

  // 4. Search all farmers in cache
  if (!tx) {
    for (const f of (allFarmersCache || [])) {
      if (f.transactions) {
        const found = f.transactions.find(t => t.id === txId);
        if (found) {
          tx = found;
          targetFarmerId = f.id;
          break;
        }
      }
    }
  }

  // 5. Fetch from server if still not found
  if (!tx && targetFarmerId) {
    try {
      const res = await adminFetch(`/api/farmers/${targetFarmerId}`);
      if (res.ok) {
        const f = await res.json();
        tx = (f.transactions || []).find(t => t.id === txId);
        if (activeFarmerIdForLedger === targetFarmerId) {
          activeFarmerTransactionsCache = f.transactions || [];
        }
      }
    } catch (e) {}
  }

  if (!tx) {
    alert('اندراج کا ڈیٹا نہیں مل سکا۔ براہ کرم لیجر کھول کر دوبارہ کوشش فرمائیں۔');
    return;
  }

  activeFarmerIdForLedger = targetFarmerId;
  const fHidden = document.getElementById('edit-tx-farmer-id');
  if (fHidden) fHidden.value = targetFarmerId;

  const f = (allFarmersCache || []).find(x => x.id === targetFarmerId);
  const farmerName = f ? f.name : (tx.farmerName || document.getElementById('led-farmer-name')?.innerText || 'کسان');

  const fNameEl = document.getElementById('edit-tx-farmer-name');
  const idBadge = document.getElementById('edit-tx-id-badge');
  if (fNameEl) fNameEl.innerText = `${farmerName} (${targetFarmerId})`;
  if (idBadge) idBadge.innerText = tx.id;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-date').value = tx.date || new Date().toISOString().split('T')[0];

  const isCredit = tx.type === 'credit';
  const debitRadio = document.getElementById('edit-radio-debit');
  const creditRadio = document.getElementById('edit-radio-credit');
  if (isCredit) {
    if (creditRadio) creditRadio.checked = true;
  } else {
    if (debitRadio) debitRadio.checked = true;
  }

  const catSel = document.getElementById('edit-tx-category');
  if (catSel) catSel.value = tx.category || (isCredit ? 'نقد وصولی' : 'کھاد و نیوٹریشن');

  const prodName = tx.productName || tx.description || (isCredit ? 'نقد وصولی' : 'زرعی مال');
  document.getElementById('edit-tx-product-name').value = prodName;
  document.getElementById('edit-tx-quantity').value = tx.quantity || '';
  document.getElementById('edit-tx-unit-price').value = tx.unitPrice || '';
  document.getElementById('edit-tx-amount').value = tx.amount || 0;
  document.getElementById('edit-tx-desc').value = tx.description || '';

  // Proof photo
  const proofUrlInput = document.getElementById('edit-tx-proof-url');
  const previewWrap = document.getElementById('edit-tx-photo-preview-wrap');
  const previewImg = document.getElementById('edit-tx-photo-preview');
  const btnRemove = document.getElementById('btn-remove-edit-tx-photo');
  const fileInput = document.getElementById('edit-tx-file-input');
  if (fileInput) fileInput.value = '';

  if (tx.proofImage) {
    if (proofUrlInput) proofUrlInput.value = tx.proofImage;
    if (previewImg) previewImg.src = tx.proofImage;
    if (previewWrap) previewWrap.classList.remove('hidden');
    if (btnRemove) btnRemove.classList.remove('hidden');
  } else {
    if (proofUrlInput) proofUrlInput.value = '';
    if (previewWrap) previewWrap.classList.add('hidden');
    if (btnRemove) btnRemove.classList.add('hidden');
  }

  openModal('modal-edit-transaction');
}

function toggleEditTxType() {
  const isCredit = document.getElementById('edit-radio-credit')?.checked;
  const catSel = document.getElementById('edit-tx-category');
  if (catSel) {
    if (isCredit && catSel.value.includes('کھاد')) {
      catSel.value = 'نقد وصولی';
    } else if (!isCredit && catSel.value.includes('وصولی')) {
      catSel.value = 'کھاد و نیوٹریشن';
    }
  }
}

function calculateEditTxTotal() {
  const qtyStr = document.getElementById('edit-tx-quantity')?.value || '';
  const unitPrice = Number(document.getElementById('edit-tx-unit-price')?.value) || 0;
  const amountInput = document.getElementById('edit-tx-amount');
  
  // Extract number from qty (e.g. "5 بوری" -> 5)
  const match = qtyStr.match(/[\d.]+/);
  if (match && unitPrice > 0) {
    const qtyNum = parseFloat(match[0]);
    if (!isNaN(qtyNum)) {
      amountInput.value = Math.round(qtyNum * unitPrice);
    }
  }
}

function handleEditTxPhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const base64Data = evt.target.result;
    
    try {
      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ image: base64Data })
      });
      const data = await res.json();
      const finalUrl = data.url || base64Data;
      document.getElementById('edit-tx-proof-url').value = finalUrl;
      const previewImg = document.getElementById('edit-tx-photo-preview');
      if (previewImg) previewImg.src = finalUrl;
      document.getElementById('edit-tx-photo-preview-wrap')?.classList.remove('hidden');
      document.getElementById('btn-remove-edit-tx-photo')?.classList.remove('hidden');
    } catch(err) {
      document.getElementById('edit-tx-proof-url').value = base64Data;
      const previewImg = document.getElementById('edit-tx-photo-preview');
      if (previewImg) previewImg.src = base64Data;
      document.getElementById('edit-tx-photo-preview-wrap')?.classList.remove('hidden');
      document.getElementById('btn-remove-edit-tx-photo')?.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
}

function removeEditTxPhoto() {
  const proofUrlInput = document.getElementById('edit-tx-proof-url');
  if (proofUrlInput) proofUrlInput.value = '';
  const fileInput = document.getElementById('edit-tx-file-input');
  if (fileInput) fileInput.value = '';
  document.getElementById('edit-tx-photo-preview-wrap')?.classList.add('hidden');
  document.getElementById('btn-remove-edit-tx-photo')?.classList.add('hidden');
}

async function handleEditTransactionSubmit(e) {
  if (e) e.preventDefault();
  const farmerId = document.getElementById('edit-tx-farmer-id')?.value || activeFarmerIdForLedger;
  if (!farmerId) {
    alert('کسان کا شناختی ریکارڈ نہیں ملا۔');
    return;
  }

  const txId = document.getElementById('edit-tx-id')?.value;
  if (!txId) return;

  const type = document.getElementById('edit-radio-credit')?.checked ? 'credit' : 'debit';
  const date = document.getElementById('edit-tx-date')?.value || new Date().toISOString().split('T')[0];
  const category = document.getElementById('edit-tx-category')?.value || (type === 'credit' ? 'نقد وصولی' : 'کھاد و نیوٹریشن');
  let productName = document.getElementById('edit-tx-product-name')?.value.trim();
  const quantity = document.getElementById('edit-tx-quantity')?.value.trim();
  const unitPrice = Number(document.getElementById('edit-tx-unit-price')?.value) || 0;
  const amount = Number(document.getElementById('edit-tx-amount')?.value) || 0;
  let description = document.getElementById('edit-tx-desc')?.value.trim();
  const proofImage = document.getElementById('edit-tx-proof-url')?.value || '';

  if (!productName) {
    productName = description || (type === 'credit' ? 'نقد رقم وصولی' : 'زرعی مال');
  }
  if (!amount || amount <= 0) {
    alert('براہ کرم درست رقم درج کریں۔ رقم 0 سے زیادہ ہونی چاہیے۔');
    document.getElementById('edit-tx-amount')?.focus();
    return;
  }
  if (!description) {
    description = quantity ? `${productName} (${quantity})` : productName;
  }

  const btn = document.getElementById('btn-submit-edit-tx');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>درستی محفوظ ہو رہی ہے...</span>`;
  }

  try {
    const res = await adminFetch(`/api/farmers/${farmerId}/transactions/${txId}`, {
      method: 'PUT',
      body: JSON.stringify({
        date,
        type,
        category,
        productName,
        quantity,
        unitPrice,
        description,
        amount,
        proofImage
      })
    });

    if (res.ok) {
      closeModal('modal-edit-transaction');
      if (activeFarmerIdForLedger === farmerId) {
        await refreshActiveFarmerLedger();
      }
      await loadAllFarmers();
      await loadAdminStats();
      await loadRecentTransactions();
      alert('کھاتے کے اندراج میں غلطی کامیابی سے درست ہو گئی اور نیا بقایا بیلنس اپڈیٹ ہو گیا!');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'اندراج اپڈیٹ کرنے میں مسئلہ پیش آیا۔');
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

function printCurrentLedger() {
  window.open(`/?printKhata=${activeFarmerIdForLedger}#khata`, '_blank');
}

// 6. Mandi Rates Management
async function loadAllRates() {
  try {
    const res = await fetch('/api/rates');
    if (res.ok) {
      allRatesCache = await res.json();
      renderRatesTable(allRatesCache);
    }
  } catch (err) {
    console.error('Rates load error:', err);
  }
}

function renderRatesTable(rates) {
  const tbody = document.getElementById('admin-rates-tbody');
  if (!tbody) return;

  tbody.innerHTML = rates.map(r => {
    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-3.5">
          <div class="font-extrabold text-gray-900">${r.cropNameUrdu}</div>
          <div class="text-[11px] text-gray-500">${r.cropNameEn}</div>
        </td>
        <td class="p-3.5 text-xs text-gray-600 font-semibold">${r.unit}</td>
        <td class="p-3.5 font-mono font-black text-brand-800 text-base">Rs. ${r.buyPrice.toLocaleString()}</td>
        <td class="p-3.5 font-mono font-bold text-gray-700">Rs. ${r.sellPrice.toLocaleString()}</td>
        <td class="p-3.5 text-center">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${r.trend === 'up' ? 'bg-emerald-100 text-emerald-800' : (r.trend === 'down' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700')}">
            ${r.trend === 'up' ? 'تیز (بڑھ رہا)' : (r.trend === 'down' ? 'مندی' : 'مستحکم')}
          </span>
        </td>
        <td class="p-3.5 text-xs text-gray-500">${r.notes || '-'}</td>
        <td class="p-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="editRate('${r.id}')" class="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-200">
              تبدیل ریٹ
            </button>
            <button onclick="deleteRate('${r.id}')" class="text-rose-500 hover:text-rose-700 text-xs p-1">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddRateModal() {
  document.getElementById('form-rate').reset();
  document.getElementById('rate-id').value = '';
  document.getElementById('modal-rate-title').innerText = 'نئی فصل کا ریٹ شامل کریں';
  openModal('modal-rate');
}

function editRate(id) {
  const r = allRatesCache.find(x => x.id === id);
  if (!r) return;

  document.getElementById('rate-id').value = r.id;
  document.getElementById('rate-crop-urdu').value = r.cropNameUrdu || '';
  document.getElementById('rate-crop-en').value = r.cropNameEn || '';
  document.getElementById('rate-buy').value = r.buyPrice || 0;
  document.getElementById('rate-sell').value = r.sellPrice || 0;
  document.getElementById('rate-unit').value = r.unit || 'فی 40 کلوگرام (من)';
  document.getElementById('rate-trend').value = r.trend || 'stable';
  document.getElementById('rate-notes').value = r.notes || '';
  document.getElementById('modal-rate-title').innerText = `ریٹ تبدیل کریں: ${r.cropNameUrdu}`;
  openModal('modal-rate');
}

async function deleteRate(id) {
  if (confirm('کیا آپ یہ منڈی ریٹ حذف کرنا چاہتے ہیں؟')) {
    try {
      const res = await adminFetch(`/api/rates/${id}`, { method: 'DELETE' });
      if (res.ok) loadAllRates();
    } catch (err) {
      alert('ریٹ ڈیلیٹ نہ ہو سکا۔');
    }
  }
}

// Preset Images for Products
const PRESET_IMAGES = {
  seed: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
  wheat: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&auto=format&fit=crop&q=80',
  sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
  sesame: 'https://images.unsplash.com/photo-1608797178974-15b35a61dd7b?w=500&auto=format&fit=crop&q=80',
  pesticide: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a307?w=500&auto=format&fit=crop&q=80',
  weedicide: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&auto=format&fit=crop&q=80',
  fungicide: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&auto=format&fit=crop&q=80',
  fertilizer: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=80'
};

// Handle Product Image Upload from Device/Camera
function handleProductImageFile(input, mode) {
  const file = input.files && input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('براہ کرم تصویر (Image File) منتخب فرمائیں۔');
    return;
  }

  const prefix = mode === 'inline' ? 'inline-' : '';
  const previewBox = document.getElementById(`${prefix}prod-preview-box`);
  const previewImg = document.getElementById(`${prefix}prod-preview-img`);
  const targetInput = document.getElementById(`${prefix}prod-image`);

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    
    // Compress and resize client-side using Canvas to keep size around ~50KB
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Immediate visual feedback
      if (previewBox && previewImg) {
        previewImg.src = compressedDataUrl;
        previewBox.classList.remove('hidden');
      }
      if (targetInput) {
        targetInput.value = compressedDataUrl;
      }

      // Upload to server endpoint /api/upload
      adminFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ image: compressedDataUrl, filename: file.name })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.url && targetInput) {
          targetInput.value = data.url;
        }
      })
      .catch(err => {
        console.warn('Upload fallback to data URL:', err);
      });
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

// Remove Selected Product Photo
function removeProductPhoto(mode) {
  const prefix = mode === 'inline' ? 'inline-' : '';
  const fileInput = document.getElementById(`${prefix}prod-file`);
  const previewBox = document.getElementById(`${prefix}prod-preview-box`);
  const previewImg = document.getElementById(`${prefix}prod-preview-img`);
  const targetInput = document.getElementById(`${prefix}prod-image`);

  if (fileInput) fileInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewBox) previewBox.classList.add('hidden');
  if (targetInput) targetInput.value = '';
}

// Set Quick Preset Agricultural Image
function setPresetImage(type, mode) {
  const url = PRESET_IMAGES[type] || PRESET_IMAGES.pesticide;
  const modes = mode ? [mode] : ['inline', 'modal'];

  modes.forEach(m => {
    const prefix = m === 'inline' ? 'inline-' : '';
    const targetInput = document.getElementById(`${prefix}prod-image`);
    const previewBox = document.getElementById(`${prefix}prod-preview-box`);
    const previewImg = document.getElementById(`${prefix}prod-preview-img`);

    if (targetInput) targetInput.value = url;
    if (previewBox && previewImg) {
      previewImg.src = url;
      previewBox.classList.remove('hidden');
    }
  });
}

// Update Admin WhatsApp Test Button Link
function updateAdminWaTestBtn(val) {
  const btn = document.getElementById('btn-test-wa');
  if (!btn) return;
  let clean = String(val || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('03')) clean = '92' + clean.slice(1);
  btn.href = `https://wa.me/${clean || '923007654321'}`;
}

// 7. Products & Inventory (Split into Portal 2: Adviyaat & Portal 3: Seeds)
async function loadAllProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      allProductsCache = await res.json();
      renderProductsTable(allProductsCache);
      populateQuickTxProductDropdown();
      populateTxProductDropdown();
    }
  } catch (err) {
    console.error('Products load error:', err);
  }
}

function filterAdviyaatCategory(cat) {
  currentAdviyaatFilter = cat;
  document.querySelectorAll('.adviyaat-filter-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.className = "adviyaat-filter-btn active bg-agroorange-500 text-white px-4 py-2 rounded-xl transition shadow-xs";
    } else {
      btn.className = "adviyaat-filter-btn bg-white hover:bg-agroyellow-50 text-gray-700 border border-agroyellow-300 px-4 py-2 rounded-xl transition";
    }
  });

  renderProductsTable(allProductsCache);
}

function filterKhaadCategory(cat) {
  currentKhaadFilter = cat;
  document.querySelectorAll('.khaad-filter-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.className = "khaad-filter-btn active bg-blue-600 text-white px-4 py-2 rounded-xl transition shadow-xs";
    } else {
      btn.className = "khaad-filter-btn bg-white hover:bg-blue-50 text-gray-700 border border-blue-200 px-4 py-2 rounded-xl transition";
    }
  });

  renderProductsTable(allProductsCache);
}

function filterSeedsCategory(cat) {
  currentSeedsFilter = cat;
  document.querySelectorAll('.seeds-filter-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.className = "seeds-filter-btn active bg-teal-600 text-white px-4 py-2 rounded-xl transition shadow-xs";
    } else {
      btn.className = "seeds-filter-btn bg-white hover:bg-teal-50 text-gray-700 border border-teal-200 px-4 py-2 rounded-xl transition";
    }
  });

  renderProductsTable(allProductsCache);
}

function renderProductsTable(prods) {
  const allList = Array.isArray(prods) ? prods : [];
  
  // 1. زرعی ادویات (Pesticides, Weedicides, Fungicides)
  const adviyaatItems = allList.filter(p => p.category === 'pesticide' || p.category === 'weedicide' || p.category === 'fungicide');
  // 2. کھاد سینٹر (Fertilizers)
  const khaadItems = allList.filter(p => p.category === 'fertilizer');
  // 3. گھاس و فصلوں کے بیج (Seeds & Fodder)
  const seedItems = allList.filter(p => p.category === 'seed');

  // Update counters, badges & stat cards
  const badgeAdviyaat = document.getElementById('badge-total-adviyaat');
  if (badgeAdviyaat) badgeAdviyaat.innerText = adviyaatItems.length;

  const countAdviyaat = document.getElementById('admin-prod-count');
  if (countAdviyaat) countAdviyaat.innerText = adviyaatItems.length;

  const statAdviyaat = document.getElementById('stat-adviyaat-count');
  if (statAdviyaat) statAdviyaat.innerText = adviyaatItems.length;

  const badgeKhaad = document.getElementById('badge-total-khaad');
  if (badgeKhaad) badgeKhaad.innerText = khaadItems.length;

  const countKhaad = document.getElementById('admin-khaad-count');
  if (countKhaad) countKhaad.innerText = khaadItems.length;

  const statKhaad = document.getElementById('stat-khaad-count');
  if (statKhaad) statKhaad.innerText = khaadItems.length;

  const badgeSeeds = document.getElementById('badge-total-seeds');
  if (badgeSeeds) badgeSeeds.innerText = seedItems.length;

  const countSeeds = document.getElementById('admin-seeds-count');
  if (countSeeds) countSeeds.innerText = seedItems.length;

  const statSeeds = document.getElementById('stat-seeds-count');
  if (statSeeds) statSeeds.innerText = seedItems.length;

  // Filter Adviyaat by selected sub-category
  let displayedAdviyaat = adviyaatItems;
  if (currentAdviyaatFilter && currentAdviyaatFilter !== 'all') {
    displayedAdviyaat = adviyaatItems.filter(p => p.category === currentAdviyaatFilter);
  }

  // Filter Khaad by selected sub-category
  let displayedKhaad = khaadItems;
  if (currentKhaadFilter && currentKhaadFilter !== 'all') {
    if (currentKhaadFilter === 'urea') {
      displayedKhaad = khaadItems.filter(p => (p.nameUrdu && p.nameUrdu.includes('یوریا')) || (p.nameEn && p.nameEn.toLowerCase().includes('urea')));
    } else if (currentKhaadFilter === 'dap') {
      displayedKhaad = khaadItems.filter(p => (p.nameUrdu && p.nameUrdu.includes('ڈی اے پی')) || (p.nameEn && p.nameEn.toLowerCase().includes('dap')));
    } else if (currentKhaadFilter === 'np') {
      displayedKhaad = khaadItems.filter(p => (p.nameUrdu && (p.nameUrdu.includes('نائٹروفاس') || p.nameUrdu.includes('این پی'))) || (p.nameEn && p.nameEn.toLowerCase().includes('nitrophos')));
    } else if (currentKhaadFilter === 'potash_zinc') {
      displayedKhaad = khaadItems.filter(p => (p.nameUrdu && (p.nameUrdu.includes('پوٹاش') || p.nameUrdu.includes('زنک') || p.nameUrdu.includes('زینک'))) || (p.nameEn && (p.nameEn.toLowerCase().includes('potash') || p.nameEn.toLowerCase().includes('zinc'))));
    }
  }

  // Filter Seeds by crop vs grass
  let displayedSeeds = seedItems;
  if (currentSeedsFilter && currentSeedsFilter !== 'all') {
    if (currentSeedsFilter === 'grass') {
      displayedSeeds = seedItems.filter(p => p.subCategory === 'grass_seed' || (p.nameUrdu && (p.nameUrdu.includes('برسیم') || p.nameUrdu.includes('لوسرن') || p.nameUrdu.includes('جوار') || p.nameUrdu.includes('گھاس') || p.nameUrdu.includes('چارہ'))));
    } else if (currentSeedsFilter === 'crop') {
      displayedSeeds = seedItems.filter(p => p.subCategory !== 'grass_seed' && !(p.nameUrdu && (p.nameUrdu.includes('برسیم') || p.nameUrdu.includes('لوسرن') || p.nameUrdu.includes('جوار') || p.nameUrdu.includes('گھاس') || p.nameUrdu.includes('چارہ'))));
    }
  }

  // Render dedicated sections
  renderAdviyaatTable(displayedAdviyaat);
  renderKhaadTable(displayedKhaad);
  renderSeedsTable(displayedSeeds);
}

function renderAdviyaatTable(prods) {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  if (!prods || prods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400 font-bold">کوئی زرعی دوا موجود نہیں ہے۔ اوپر دیے گئے باکس سے نئی دوا شامل کریں۔</td></tr>`;
    return;
  }

  tbody.innerHTML = prods.map(p => {
    return `
      <tr class="hover:bg-amber-50/40 transition">
        <td class="p-3">
          <img src="${p.image || PRESET_IMAGES.pesticide}" class="w-12 h-12 rounded-xl object-cover border border-amber-200 shadow-2xs">
        </td>
        <td class="p-3">
          <div class="font-extrabold text-gray-900">${escapeHtml(p.nameUrdu)}</div>
          <div class="text-[11px] text-gray-500 font-sans">${escapeHtml(p.nameEn || '')}</div>
          ${p.activeIngredient ? `<div class="text-[10px] text-amber-800 font-mono mt-0.5">${escapeHtml(p.activeIngredient)}</div>` : ''}
        </td>
        <td class="p-3 text-xs">
          <span class="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">${escapeHtml(p.categoryUrdu || p.category)}</span>
        </td>
        <td class="p-3 text-xs font-semibold text-gray-700">${escapeHtml(p.company || '-')}</td>
        <td class="p-3 text-xs font-bold text-gray-600 font-mono">${escapeHtml(p.packSize || '-')}</td>
        <td class="p-3 font-mono font-black text-brand-900 text-sm">Rs. ${(p.price || 0).toLocaleString()}</td>
        <td class="p-3">
          <span class="font-mono font-bold ${p.stock < 10 ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-gray-800 bg-gray-50 border border-gray-200'} px-2 py-0.5 rounded-md text-xs">
            ${p.stock || 0}
          </span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="editProduct('${p.id}')" title="قیمت و اسٹاک تبدیل کریں" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>تبدیلی</span>
            </button>
            <button onclick="deleteProduct('${p.id}')" title="پراڈکٹ ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderKhaadTable(prods) {
  const tbody = document.getElementById('admin-khaad-tbody');
  if (!tbody) return;

  if (!prods || prods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">کوئی کھاد موجود نہیں ہے۔ اوپر دیے گئے بٹن سے نئی کھاد شامل کریں۔</td></tr>`;
    return;
  }

  tbody.innerHTML = prods.map(p => {
    return `
      <tr class="hover:bg-blue-50/40 transition">
        <td class="p-3">
          <img src="${p.image || PRESET_IMAGES.fertilizer}" class="w-12 h-12 rounded-xl object-cover border border-blue-200 shadow-2xs">
        </td>
        <td class="p-3">
          <div class="font-extrabold text-gray-900 text-sm">${escapeHtml(p.nameUrdu)}</div>
          <div class="text-[11px] text-gray-500 font-sans">${escapeHtml(p.nameEn || '')}</div>
          ${p.description ? `<div class="text-[10px] text-blue-800 line-clamp-1 mt-0.5">${escapeHtml(p.description)}</div>` : ''}
        </td>
        <td class="p-3 text-xs">
          <span class="bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-lg border border-blue-200">${escapeHtml(p.company || 'کھاد کمپنی')}</span>
        </td>
        <td class="p-3 text-xs font-bold text-gray-700 font-mono">${escapeHtml(p.packSize || '50 کلوگرام بوری')}</td>
        <td class="p-3 font-mono font-black text-blue-950 text-sm">Rs. ${(p.price || 0).toLocaleString()}</td>
        <td class="p-3">
          <span class="font-mono font-bold ${p.stock < 10 ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-blue-700 bg-blue-50 border border-blue-200'} px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
            <i class="fa-solid fa-cubes-stacked text-[10px]"></i>
            ${p.stock || 0} بوری
          </span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="editProduct('${p.id}')" title="کھاد کی قیمت یا اسٹاک تبدیل کریں" class="bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-pen-to-square text-blue-700"></i>
              <span>تبدیلی</span>
            </button>
            <button onclick="deleteProduct('${p.id}')" title="کھاد ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderSeedsTable(seeds) {
  const tbody = document.getElementById('admin-seeds-tbody');
  if (!tbody) return;

  if (!seeds || seeds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">کوئی تصدیق شدہ بیج موجود نہیں ہے۔ اوپر دیے گئے بٹن سے نیا بیج شامل کریں۔</td></tr>`;
    return;
  }

  tbody.innerHTML = seeds.map(s => {
    const isGrass = s.subCategory === 'grass_seed' || (s.nameUrdu && (s.nameUrdu.includes('برسیم') || s.nameUrdu.includes('لوسرن') || s.nameUrdu.includes('جوار') || s.nameUrdu.includes('گھاس') || s.nameUrdu.includes('چارہ')));
    return `
      <tr class="hover:bg-teal-50/40 transition">
        <td class="p-3">
          <img src="${s.image || PRESET_IMAGES.seed}" class="w-12 h-12 rounded-xl object-cover border border-teal-300 shadow-2xs">
        </td>
        <td class="p-3">
          <div class="flex items-center gap-1.5">
            <span class="font-extrabold text-gray-900 text-sm">${escapeHtml(s.nameUrdu)}</span>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full ${isGrass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-teal-100 text-teal-800 border border-teal-300'}">
              ${isGrass ? '🌱 گھاس / چارہ' : '🌾 فصل بیج'}
            </span>
          </div>
          <div class="text-[11px] text-gray-500 font-sans">${escapeHtml(s.nameEn || '')}</div>
          ${s.description ? `<div class="text-[10px] text-teal-800 line-clamp-1 mt-0.5">${escapeHtml(s.description)}</div>` : ''}
        </td>
        <td class="p-3 text-xs font-semibold text-gray-700">
          <span class="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 font-bold">${escapeHtml(s.company || 'تصدیق شدہ')}</span>
        </td>
        <td class="p-3 text-xs font-bold text-gray-800 font-mono">${escapeHtml(s.packSize || 'بیگ')}</td>
        <td class="p-3 font-mono font-black text-brand-900 text-sm">Rs. ${(s.price || 0).toLocaleString()}</td>
        <td class="p-3">
          <span class="font-mono font-bold ${s.stock < 10 ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-teal-700 bg-teal-50 border border-teal-200'} px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
            <i class="fa-solid fa-box text-[10px]"></i>
            ${s.stock || 0} بیگز
          </span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="editProduct('${s.id}')" title="بیج کی قیمت یا اسٹاک تبدیل کریں" class="bg-teal-100 hover:bg-teal-200 text-teal-950 border border-teal-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs">
              <i class="fa-solid fa-pen-to-square text-teal-700"></i>
              <span>تبدیل ریٹ / تفصیل</span>
            </button>
            <button onclick="deleteProduct('${s.id}')" title="بیج ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddProductModal(defaultCategory = 'pesticide') {
  document.getElementById('form-product').reset();
  document.getElementById('prod-id').value = '';
  const catElem = document.getElementById('prod-category');
  if (catElem) catElem.value = defaultCategory;

  const titleElem = document.getElementById('modal-product-title');
  if (defaultCategory === 'seed') {
    if (titleElem) titleElem.innerText = 'نیا تصدیق شدہ بیج شامل کریں (فصلوں یا گھاس کے بیج)';
    setPresetImage('seed', 'modal');
  } else if (defaultCategory === 'fertilizer') {
    if (titleElem) titleElem.innerText = 'نئی کھاد شامل کریں (یوریا، ڈی اے پی، این پی، پوٹاش، زینک)';
    setPresetImage('fertilizer', 'modal');
  } else {
    if (titleElem) titleElem.innerText = 'نئی زرعی دوا شامل کریں (کیڑے مار، جڑی بوٹی مار، فنگس کش)';
    setPresetImage('pesticide', 'modal');
  }

  const activeInp = document.getElementById('prod-active');
  if (activeInp) activeInp.value = '';
  const cropsInp = document.getElementById('prod-crops');
  if (cropsInp) cropsInp.value = '';
  const pestsInp = document.getElementById('prod-pests');
  if (pestsInp) pestsInp.value = '';
  const dosageInp = document.getElementById('prod-dosage');
  if (dosageInp) dosageInp.value = '';
  const precInp = document.getElementById('prod-precautions');
  if (precInp) precInp.value = '';
  removeProductPhoto('modal');
  openModal('modal-product');
}

function openAddSeedModal() {
  openAddProductModal('seed');
  setPresetImage('seed', 'modal');
}

function openAddKhaadModal() {
  openAddProductModal('fertilizer');
  setPresetImage('fertilizer', 'modal');
}

function editProduct(id) {
  const p = allProductsCache.find(x => x.id === id);
  if (!p) return;

  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name-urdu').value = p.nameUrdu || '';
  document.getElementById('prod-name-en').value = p.nameEn || '';
  document.getElementById('prod-category').value = p.category || 'pesticide';
  document.getElementById('prod-company').value = p.company || '';
  document.getElementById('prod-pack').value = p.packSize || '';
  document.getElementById('prod-price').value = p.price || 0;
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-image').value = p.image || '';
  document.getElementById('prod-desc').value = p.description || '';

  const activeInp = document.getElementById('prod-active');
  if (activeInp) activeInp.value = p.activeIngredient || '';
  const cropsInp = document.getElementById('prod-crops');
  if (cropsInp) cropsInp.value = p.suitableCrops || '';
  const pestsInp = document.getElementById('prod-pests');
  if (pestsInp) pestsInp.value = p.targetPests || '';
  const dosageInp = document.getElementById('prod-dosage');
  if (dosageInp) dosageInp.value = p.dosage || '';
  const precInp = document.getElementById('prod-precautions');
  if (precInp) precInp.value = p.precautions || '';

  document.getElementById('modal-product-title').innerText = `پراڈکٹ ایڈٹ: ${p.nameUrdu}`;

  // Populate preview if image exists
  const previewBox = document.getElementById('prod-preview-box');
  const previewImg = document.getElementById('prod-preview-img');
  if (p.image && previewBox && previewImg) {
    previewImg.src = p.image;
    previewBox.classList.remove('hidden');
  } else if (previewBox) {
    previewBox.classList.add('hidden');
  }

  openModal('modal-product');
}

async function deleteProduct(id) {
  if (confirm('کیا آپ واقعی یہ پراڈکٹ ڈیلیٹ کرنا چاہتے ہیں؟')) {
    try {
      const res = await adminFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) loadAllProducts();
    } catch (err) {
      alert('پراڈکٹ ڈیلیٹ نہ ہو سکی۔');
    }
  }
}

// 8. Farmer Trade Requests
async function loadTradeRequests() {
  try {
    const res = await adminFetch('/api/trade-requests');
    if (res.ok) {
      allRequestsCache = await res.json();
      renderTradeRequestsTable(allRequestsCache);
    }
  } catch (err) {
    console.error('Requests load error:', err);
  }
}

function renderTradeRequestsTable(reqs) {
  const tbody = document.getElementById('admin-requests-tbody');
  if (!tbody) return;

  const pendingCount = (reqs || []).filter(r => r.status === 'Pending').length;
  const subBadge = document.getElementById('subtab-badge-requests');
  if (subBadge) subBadge.innerText = pendingCount;

  if (reqs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400">کسانوں کی کوئی نئی درخواست نہیں ہے۔</td></tr>`;
    return;
  }

  tbody.innerHTML = reqs.map(r => {
    const isSell = r.type === 'sell_crop';
    const waText = encodeURIComponent(`السلام علیکم کسان محترم ${r.farmerName}! ہارون زرعی مرکز وہاڑی سے رابطہ کر رہے ہیں بابت آپ کی درخواست: ${r.cropName} (${r.quantity})۔`);
    
    return `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-3.5 text-xs text-gray-500 font-mono whitespace-nowrap">${r.createdAt}</td>
        <td class="p-3.5 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full text-xs font-bold ${isSell ? 'bg-amber-100 text-amber-900' : 'bg-brand-100 text-brand-900'}">
            ${isSell ? 'فصل فروخت' : 'بیج خریداری'}
          </span>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-gray-900">${r.farmerName}</div>
          <div class="text-xs font-mono text-gray-600" dir="ltr">${r.mobile}</div>
        </td>
        <td class="p-3.5 text-xs text-gray-600">${r.village || '-'}</td>
        <td class="p-3.5">
          <div class="font-bold text-brand-900">${r.cropName}</div>
          <div class="text-xs text-gray-500">مقدار: ${r.quantity}</div>
        </td>
        <td class="p-3.5 font-mono text-xs font-bold text-gray-800">${r.expectedPrice || 'مارکیٹ ریٹ'}</td>
        <td class="p-3.5 whitespace-nowrap">
          <select onchange="updateRequestStatus('${r.id}', this.value)" class="text-xs font-bold p-1 rounded-lg border ${r.status === 'Pending' ? 'bg-rose-50 text-rose-800 border-rose-300' : (r.status === 'Contacted' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300')}">
            <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>زیرِ غور (Pending)</option>
            <option value="Contacted" ${r.status === 'Contacted' ? 'selected' : ''}>رابطہ ہو گیا (Contacted)</option>
            <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>سودا مکمل (Completed)</option>
          </select>
        </td>
        <td class="p-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <a href="tel:${r.mobile}" class="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 rounded-lg text-xs" title="کال کریں">
              <i class="fa-solid fa-phone"></i>
            </a>
            <a href="https://wa.me/${r.mobile.replace(/[^0-9]/g, '')}?text=${waText}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-xs" title="واٹس ایپ">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button onclick="deleteTradeRequest('${r.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 text-xs" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateRequestStatus(id, status) {
  try {
    await adminFetch(`/api/trade-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    loadTradeRequests();
    loadAdminStats();
  } catch (err) {
    alert('اسٹیٹس اپ ڈیٹ نہیں ہو سکا۔');
  }
}

async function deleteTradeRequest(id) {
  if (confirm('کیا آپ یہ درخواست ڈیلیٹ کرنا چاہتے ہیں؟')) {
    try {
      await adminFetch(`/api/trade-requests/${id}`, { method: 'DELETE' });
      loadTradeRequests();
      loadAdminStats();
    } catch (err) {
      alert('حذف نہ ہو سکا۔');
    }
  }
}

// 9. Settings
async function loadAdminSettings() {
  try {
    const res = await adminFetch('/api/settings');
    if (res.ok) {
      const s = await res.json();
      document.getElementById('set-business-name').value = s.businessName || '';
      document.getElementById('set-owner-name').value = s.ownerName || '';
      document.getElementById('set-phone').value = s.phone || '';
      document.getElementById('set-whatsapp').value = s.whatsapp || '';
      document.getElementById('set-address').value = s.address || '';
      document.getElementById('set-announcement').value = s.announcement || '';
      if (document.getElementById('set-username')) {
        document.getElementById('set-username').value = s.adminUsername || 'admin';
      }
      if (document.getElementById('set-password')) {
        document.getElementById('set-password').value = s.adminPassword || '';
      }
      if (document.getElementById('set-pin')) {
        document.getElementById('set-pin').value = s.adminPin || '';
      }
      updateAdminWaTestBtn(s.whatsapp || s.phone);

      // Load active Urdu font selection
      const font = s.urduFont || 'gulzar';
      selectUrduFontCard(font, false);
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

// Global Urdu Typography Controller
function applyUrduFont(fontKey) {
  if (!fontKey) fontKey = 'gulzar';
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

function selectUrduFontCard(fontKey, saveImmediately = false) {
  if (!fontKey) fontKey = 'noto-sans';
  const inputEl = document.getElementById('set-urdu-font');
  if (inputEl) inputEl.value = fontKey;

  // Header select sync
  const headerSelect = document.getElementById('header-font-select');
  if (headerSelect) headerSelect.value = fontKey;

  // Update card visuals
  const allKeys = ['noto-sans', 'gulzar', 'amiri', 'noto-nastaliq', 'vazirmatn'];
  allKeys.forEach(k => {
    const card = document.getElementById(`font-card-${k}`);
    if (card) {
      const check = card.querySelector('.font-check');
      if (k === fontKey) {
        card.classList.remove('border-gray-200');
        card.classList.add('border-2', 'border-emerald-500', 'bg-emerald-50/20');
        if (check) check.classList.remove('hidden');
      } else {
        card.classList.remove('border-2', 'border-emerald-500', 'bg-emerald-50/20');
        card.classList.add('border', 'border-gray-200');
        if (check) check.classList.add('hidden');
      }
    }
  });

  // Update live preview container in settings
  const previewBox = document.getElementById('live-font-preview-container');
  if (previewBox) {
    previewBox.className = `font-${fontKey} space-y-2`;
  }
  const previewLabel = document.getElementById('preview-font-label');
  const labels = {
    'noto-sans': '1. Noto Sans Arabic (ماڈرن نسخ)',
    'gulzar': '2. Gulzar (جدید نستعلیق)',
    'amiri': '3. Amiri (کلاسک نسخ)',
    'noto-nastaliq': '4. Noto Nastaliq Urdu (روایتی)',
    'vazirmatn': '5. Vazirmatn (ٹیک اسٹائل)'
  };
  if (previewLabel) previewLabel.innerText = labels[fontKey] || fontKey;

  // Apply to current document typography in real-time
  applyUrduFont(fontKey);

  if (saveImmediately) {
    saveActiveFontDirectly();
  }
}

function quickSwitchAdminFont(fontKey) {
  selectUrduFontCard(fontKey, true);
}

async function saveActiveFontDirectly() {
  const fontKey = (document.getElementById('set-urdu-font') && document.getElementById('set-urdu-font').value) || 'noto-sans';
  try {
    const res = await adminFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ urduFont: fontKey })
    });
    if (res.ok) {
      const alertBox = document.getElementById('settings-alert');
      if (alertBox) {
        alertBox.className = "p-3 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-400 text-xs font-bold block shadow-2xs";
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> اردو فونٹ <strong>"${fontKey}"</strong> کامیابی سے منتخب ہو کر محفوظ ہو گیا! کسٹمر پورٹل اور ایڈمن دونوں پر یہ فونٹ لاگو ہو چکا ہے۔`;
      }
    }
  } catch (e) {
    console.error('Failed to save font:', e);
  }
}

// Setup form submit handlers
function setupAdminForms() {
  // Real-time Mobile Number duplicate checking
  const farmerMobileInput = document.getElementById('farmer-mobile');
  if (farmerMobileInput) {
    const runMobileDupCheck = () => {
      const editId = document.getElementById('farmer-edit-id')?.value;
      checkFarmerMobileDuplicate(farmerMobileInput.value, editId);
    };
    farmerMobileInput.addEventListener('input', runMobileDupCheck);
    farmerMobileInput.addEventListener('change', runMobileDupCheck);
    farmerMobileInput.addEventListener('blur', runMobileDupCheck);
  }

  // Farmer Add / Edit
  document.getElementById('form-farmer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('farmer-edit-id').value;
    const mobileVal = document.getElementById('farmer-mobile').value.trim();

    // Frontend validation: prevent duplicate mobile number
    const duplicate = checkFarmerMobileDuplicate(mobileVal, id);
    if (duplicate) {
      alert(`⚠️ یہ موبائل نمبر (${mobileVal}) پہلے سے کسان "${duplicate.name}" (کھاتہ نمبر: ${duplicate.id}) کے نام پر درج ہے!\n\nایک موبائل نمبر پر دو مختلف کسانوں کا کھاتہ نہیں کھل سکتا۔ برائے مہربانی درست یا دوسرا موبائل نمبر درج کریں۔`);
      document.getElementById('farmer-mobile').focus();
      return;
    }

    const passVal = (document.getElementById('farmer-password')?.value || '').trim();
    const body = {
      name: document.getElementById('farmer-name').value.trim(),
      fatherName: document.getElementById('farmer-father').value.trim(),
      mobile: mobileVal,
      cnic: document.getElementById('farmer-cnic').value.trim(),
      landAcres: document.getElementById('farmer-acres').value,
      village: document.getElementById('farmer-village').value.trim(),
      initialBalance: document.getElementById('farmer-initial-balance').value,
      password: passVal,
      notes: document.getElementById('farmer-notes').value.trim()
    };

    const url = id ? `/api/farmers/${id}` : '/api/farmers';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        alert(id ? 'کسان کا ریکارڈ کامیابی سے اپڈیٹ (Edit) ہو گیا!' : 'نیا کسان کھاتہ کامیابی سے محفوظ ہو گیا!');
        closeModal('modal-farmer');
        resetFarmerMobileValidation();
        loadAllFarmers();
        loadAdminStats();
        loadFarmerLogins();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'کسان ریکارڈ محفوظ کرنے میں خرابی واقع ہوئی۔');
      }
    } catch (err) {
      alert('سرور سے رابطہ نہ ہو سکا۔');
    }
  });

  // Rate Add / Edit
  document.getElementById('form-rate').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('rate-id').value;
    const body = {
      cropNameUrdu: document.getElementById('rate-crop-urdu').value.trim(),
      cropNameEn: document.getElementById('rate-crop-en').value.trim(),
      buyPrice: Number(document.getElementById('rate-buy').value),
      sellPrice: Number(document.getElementById('rate-sell').value),
      unit: document.getElementById('rate-unit').value.trim(),
      trend: document.getElementById('rate-trend').value,
      notes: document.getElementById('rate-notes').value.trim()
    };

    const url = id ? `/api/rates/${id}` : '/api/rates';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        closeModal('modal-rate');
        loadAllRates();
      }
    } catch (err) {
      alert('ریٹ محفوظ نہ ہو سکا۔');
    }
  });

  // Product Add / Edit (Modal)
  document.getElementById('form-product').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const categorySelect = document.getElementById('prod-category');
    const categoryUrdu = categorySelect.options[categorySelect.selectedIndex].text.split('(')[0].trim();

    const body = {
      nameUrdu: document.getElementById('prod-name-urdu').value.trim(),
      nameEn: document.getElementById('prod-name-en').value.trim(),
      category: categorySelect.value,
      categoryUrdu: categoryUrdu,
      company: document.getElementById('prod-company').value.trim(),
      packSize: document.getElementById('prod-pack').value.trim(),
      price: Number(document.getElementById('prod-price').value),
      stock: Number(document.getElementById('prod-stock').value),
      image: document.getElementById('prod-image').value.trim() || PRESET_IMAGES.pesticide,
      description: document.getElementById('prod-desc').value.trim(),
      activeIngredient: (document.getElementById('prod-active')?.value || '').trim(),
      suitableCrops: (document.getElementById('prod-crops')?.value || '').trim(),
      targetPests: (document.getElementById('prod-pests')?.value || '').trim(),
      dosage: (document.getElementById('prod-dosage')?.value || '').trim(),
      precautions: (document.getElementById('prod-precautions')?.value || '').trim()
    };

    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        removeProductPhoto('modal');
        closeModal('modal-product');
        await loadAllProducts();
        loadAdminStats();
        alert('پراڈکٹ کامیابی سے محفوظ ہو گئی!');
      } else {
        alert('پراڈکٹ محفوظ نہ ہو سکی۔');
      }
    } catch (err) {
      alert('پراڈکٹ محفوظ نہ ہو سکی۔');
    }
  });

  // Permanent Add Product Box Handler (اسٹاک میں پراڈکٹ شامل کرنے کا باکس)
  const inlineProdForm = document.getElementById('form-inline-product');
  if (inlineProdForm) {
    inlineProdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('inline-prod-btn');
      const catSelect = document.getElementById('inline-prod-category');
      const categoryUrdu = catSelect.options[catSelect.selectedIndex].text.split('(')[0].trim();

      const body = {
        nameUrdu: document.getElementById('inline-prod-name-urdu').value.trim(),
        nameEn: document.getElementById('inline-prod-name-en').value.trim(),
        category: catSelect.value,
        categoryUrdu: categoryUrdu,
        company: document.getElementById('inline-prod-company').value.trim(),
        packSize: document.getElementById('inline-prod-pack').value.trim(),
        price: Number(document.getElementById('inline-prod-price').value),
        stock: Number(document.getElementById('inline-prod-stock').value),
        image: document.getElementById('inline-prod-image').value.trim() || PRESET_IMAGES.pesticide,
        description: document.getElementById('inline-prod-desc').value.trim(),
        activeIngredient: (document.getElementById('inline-prod-active')?.value || '').trim(),
        suitableCrops: (document.getElementById('inline-prod-crops')?.value || '').trim(),
        targetPests: (document.getElementById('inline-prod-pests')?.value || '').trim(),
        dosage: (document.getElementById('inline-prod-dosage')?.value || '').trim(),
        precautions: (document.getElementById('inline-prod-precautions')?.value || '').trim()
      };

      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...`;

      try {
        const res = await adminFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if (res.ok) {
          inlineProdForm.reset();
          removeProductPhoto('inline');
          await loadAllProducts();
          loadAdminStats();
          alert('نئی پراڈکٹ کامیابی سے دکان میں شامل کر دی گئی!');
        } else {
          alert('پراڈکٹ محفوظ نہ ہو سکی۔');
        }
      } catch (err) {
        alert('سرور سے رابطہ نہ ہو سکا۔');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-plus-circle"></i> <span>یہ پراڈکٹ دکان میں محفوظ کریں</span>`;
      }
    });
  }

  // Settings update
  document.getElementById('admin-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('settings-alert');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const phoneVal = document.getElementById('set-phone').value.trim();
    const waVal = document.getElementById('set-whatsapp').value.trim();
    const userVal = document.getElementById('set-username') ? document.getElementById('set-username').value.trim() : 'admin';
    const passVal = document.getElementById('set-password') ? document.getElementById('set-password').value.trim() : '';
    const pinVal = document.getElementById('set-pin') ? document.getElementById('set-pin').value.trim() : '';

    const body = {
      businessName: document.getElementById('set-business-name').value.trim(),
      ownerName: document.getElementById('set-owner-name').value.trim(),
      phone: phoneVal,
      whatsapp: waVal,
      address: document.getElementById('set-address').value.trim(),
      announcement: document.getElementById('set-announcement').value.trim(),
      adminUsername: userVal || 'admin',
      adminPassword: passVal,
      adminPin: pinVal,
      urduFont: document.getElementById('set-urdu-font') ? document.getElementById('set-urdu-font').value : 'noto-sans'
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>محفوظ ہو رہا ہے...</span>`;
    }

    try {
      const res = await adminFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.newToken) {
          sessionStorage.setItem('adminToken', data.newToken);
        }
        updateAdminWaTestBtn(waVal);
        alertBox.className = "p-4 rounded-2xl bg-emerald-100 text-emerald-950 border-2 border-emerald-400 text-xs md:text-sm font-bold block shadow-sm";
        alertBox.innerHTML = `
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-emerald-600 text-lg"></i>
            <div>
              <p>سیٹنگز، ایڈمن پاس ورڈ اور فون نمبر کامیابی سے تبدیل ہو گئے!</p>
              <p class="text-[11px] font-normal text-emerald-800 mt-0.5">نیا پاس ورڈ اور پن سیٹ ہو چکا ہے (پرانا پاس ورڈ منسوخ ہو چکا ہے)۔ فون: <strong>${phoneVal}</strong> | واٹس ایپ: <strong>${waVal}</strong> اب فعال ہے۔</p>
            </div>
          </div>
        `;
      } else {
        const errData = await res.json().catch(() => ({}));
        alertBox.className = "p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold block";
        alertBox.innerText = errData.error || 'محفوظ کرنے میں خرابی واقع ہوئی۔';
      }
    } catch (err) {
      alertBox.className = "p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold block";
      alertBox.innerText = 'محفوظ کرنے میں خرابی واقع ہوئی: سرور سے رابطہ نہ ہو سکا۔';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>سیٹنگز محفوظ کریں</span>`;
      }
    }
  });
}

// Load Farmer Login Activity for Admin
async function loadFarmerLogins() {
  const tbody = document.getElementById('admin-logins-tbody');
  if (!tbody) return;

  try {
    const res = await adminFetch('/api/admin/logins');
    if (res.ok) {
      const rawLogins = await res.json();
      const threeDaysAgoMs = Date.now() - (3 * 24 * 60 * 60 * 1000);
      const logins = (rawLogins || []).filter(l => {
        if (!l.loginTime) return true;
        const t = new Date(l.loginTime).getTime();
        return isNaN(t) || t >= threeDaysAgoMs;
      });

      if (!logins || logins.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="p-8 text-center text-gray-400 font-semibold font-urdu">
              <i class="fa-solid fa-user-clock text-3xl mb-2 text-emerald-400 block"></i>
              پچھلے 3 دنوں میں کوئی نیا کسان لاگ ان ریکارڈ موجود نہیں ہے۔<br>
              <span class="text-xs text-gray-400 font-sans mt-1 inline-block">(3 دن سے پرانا لاگ ان ریکارڈ خودکار سسٹم سے صاف کر دیا جاتا ہے)</span>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = logins.map(l => {
        let timeStr = '-';
        try {
          if (l.loginTime) {
            const d = new Date(l.loginTime);
            timeStr = d.toLocaleDateString('ur-PK') + ' ' + d.toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {
          timeStr = l.loginTime || '-';
        }

        const methodBadge = l.method && l.method.includes('Google')
          ? `<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-brands fa-google text-blue-600"></i> گوگل لاگ ان</span>`
          : (l.method && l.method.includes('Registration')
            ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-user-plus text-emerald-600"></i> نیا رجسٹرڈ</span>`
            : `<span class="bg-agroyellow-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-key text-amber-600"></i> پاس ورڈ لاگ ان</span>`);

        const bal = l.currentBalance || 0;
        const balColor = bal > 0 ? 'text-rose-600' : (bal < 0 ? 'text-emerald-600' : 'text-gray-700');

        let displayPass = l.password || '';
        if (!displayPass && typeof allFarmersCache !== 'undefined' && Array.isArray(allFarmersCache)) {
          const match = allFarmersCache.find(f => f.id === l.farmerId);
          if (match && match.password) displayPass = match.password;
        }

        const passBadge = displayPass 
          ? `<span class="bg-amber-100 text-amber-950 font-mono font-bold px-2 py-1 rounded-lg text-xs border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs" title="کسان کا پاس ورڈ"><i class="fa-solid fa-key text-amber-600 text-[10px]"></i> <span>${escapeHtml(displayPass)}</span></span>`
          : `<span class="text-gray-400 text-xs italic">کوئی نہیں</span>`;

        const isReg = Boolean(displayPass || l.registered);
        const deregisterBtn = isReg
          ? `<button onclick="confirmDeregisterFarmer('${l.farmerId}', '${escapeJs(l.farmerName || 'کسان')}')" title="کسان کی آن لائن رجسٹریشن ختم کریں" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 transition flex items-center gap-1 cursor-pointer">
              <i class="fa-solid fa-user-slash text-[11px]"></i>
              <span>رجسٹریشن ڈیلیٹ</span>
            </button>`
          : '';

        return `
          <tr class="hover:bg-agroyellow-50/50 transition">
            <td class="p-3">
              <div class="font-extrabold text-gray-900">${escapeHtml(l.farmerName || 'کسان بھائی')}</div>
              <div class="text-[11px] font-mono text-brand-900 font-bold">${l.farmerId || '-'}</div>
            </td>
            <td class="p-3 font-mono font-bold text-xs" dir="ltr">
              <span class="text-gray-900">${l.mobile || '-'}</span>
            </td>
            <td class="p-3">${passBadge}</td>
            <td class="p-3 text-xs text-gray-600 font-mono" dir="ltr">${timeStr}</td>
            <td class="p-3 text-center">${methodBadge}</td>
            <td class="p-3 font-mono font-black ${balColor}">Rs. ${Math.abs(bal).toLocaleString()}</td>
            <td class="p-3 text-center">
              <div class="flex items-center justify-center gap-1.5">
                <button onclick="openLedgerModal('${l.farmerId}')" title="کھاتہ کھولیں" class="bg-amber-500 hover:bg-amber-600 text-brand-950 font-bold px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1">
                  <i class="fa-solid fa-receipt"></i>
                  <span>کھاتہ</span>
                </button>
                <button onclick="editFarmer('${l.farmerId}')" title="معلومات ایڈٹ کریں" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs p-1.5 rounded-lg border border-blue-200 transition cursor-pointer">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                ${deregisterBtn}
                <button onclick="deleteFarmer('${l.farmerId}', '${escapeJs(l.farmerName || 'کسان')}')" title="کھاتہ مکمل ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs p-1.5 rounded-lg border border-rose-200 transition cursor-pointer">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-rose-600 font-bold">کسان لاگ ان معلومات لوڈ نہ ہو سکیں۔ (ایرر: ${res.status})</td></tr>`;
    }
  } catch (err) {
    console.warn('loadFarmerLogins error:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-rose-600 font-bold">سرور سے کسان لاگ ان ریکارڈ حاصل کرنے میں مسئلہ آیا ہے۔</td></tr>`;
  }
}

// Clear all farmer login activity logs
async function clearAllFarmerLoginsConfirm() {
  if (!confirm('کیا آپ واقعی کسان لاگ ان کا تمام سابقہ لاگ ریکارڈ صاف کرنا چاہتے ہیں؟\nنوٹ: کسانوں کے اصل کھاتے، بقایا اور ٹرانزیکشنز بالکل محفوظ رہیں گی۔')) return;
  try {
    const res = await adminFetch('/api/admin/logins', { method: 'DELETE' });
    if (res.ok) {
      showToast('کسان لاگ ان لاگز کامیابی سے صاف کر دیے گئے', 'success');
      loadFarmerLogins();
    } else {
      showToast('لاگز صاف کرنے میں خرابی ہوئی', 'error');
    }
  } catch (err) {
    console.error('clearAllFarmerLoginsConfirm error:', err);
    showToast('سرور کنکشن ایرر', 'error');
  }
}

// Function alias so any call to openFarmerLedger works
function openFarmerLedger(farmerId) {
  openLedgerModal(farmerId);
}

// Deregister active farmer from within the open ledger modal
async function deregisterActiveLedgerFarmer() {
  if (!activeFarmerIdForLedger) return;
  const name = document.getElementById('led-farmer-name')?.innerText || 'کسان';
  await confirmDeregisterFarmer(activeFarmerIdForLedger, name);
  await refreshActiveFarmerLedger();
}

// Modal helpers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

// ==========================================
// 12. COMPLAINTS & IMAGE PROOFS MANAGER
// ==========================================

async function loadComplaints() {
  const tbody = document.getElementById('admin-complaints-table-body');
  if (!tbody) return;

  try {
    const res = await adminFetch('/api/complaints');
    if (res.ok) {
      const complaints = await res.json();
      renderComplaints(complaints);
      loadAdminStats();
    }
  } catch (err) {
    console.error('loadComplaints error:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-rose-500 font-bold">شکایات لوڈ کرنے میں خرابی واقع ہوئی۔</td></tr>`;
  }
}

function renderComplaints(complaints) {
  const tbody = document.getElementById('admin-complaints-table-body');
  if (!tbody) return;

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">کوئی نئی شکایت یا تجویز موصول نہیں ہوئی۔</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const dateStr = c.date ? new Date(c.date).toLocaleString('ur-PK', { dateStyle: 'short', timeStyle: 'short' }) : '-';
    const isResolved = c.status === 'Resolved';
    const statusBadge = isResolved
      ? `<span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-check text-[10px]"></i> حل شدہ</span>`
      : `<span class="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-clock text-[10px]"></i> زیرِ غور</span>`;

    const imgBtn = c.imageUrl
      ? `<button onclick="openComplaintImageViewer('${c.imageUrl}', '${escapeJs(c.farmerName || 'کسان')}', '${dateStr}')" class="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 shadow-2xs cursor-pointer">
          <i class="fa-solid fa-image text-rose-600"></i> تصویر دیکھیں
        </button>`
      : `<span class="text-gray-400 text-xs">تصویر نہیں</span>`;

    const cleanPhone = (c.mobile || '').replace(/\D/g, '').replace(/^0/, '');
    const waLink = cleanPhone ? `https://wa.me/92${cleanPhone}?text=${encodeURIComponent(`السلام علیکم ${c.farmerName || 'کسان بھائی'}! ہارون زرعی مرکز سے آپ کی شکایت کے حوالے سے رابطہ کیا جا رہا ہے...`)}` : '#';

    return `
      <tr class="hover:bg-rose-50/30 transition">
        <td class="p-3.5 font-mono text-xs text-gray-600">${dateStr}</td>
        <td class="p-3.5">
          <div class="font-extrabold text-gray-900">${escapeHtml(c.farmerName || '-')}</div>
          <div class="text-xs font-mono text-brand-800 mt-0.5" dir="ltr">${escapeHtml(c.mobile || '-')}</div>
        </td>
        <td class="p-3.5">
          <span class="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-lg">${escapeHtml(c.category || 'عام شکایت')}</span>
        </td>
        <td class="p-3.5 text-xs text-gray-700 max-w-xs break-words">${escapeHtml(c.message || '')}</td>
        <td class="p-3.5 text-center">${imgBtn}</td>
        <td class="p-3.5 text-center">${statusBadge}</td>
        <td class="p-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5">
            ${cleanPhone ? `<a href="${waLink}" target="_blank" title="واٹس ایپ پر رابطہ کریں" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs p-1.5 rounded-lg transition"><i class="fa-brands fa-whatsapp text-sm"></i></a>` : ''}
            <button onclick="toggleComplaintStatus('${c.id}', '${c.status}')" title="${isResolved ? 'دوبارہ زیرِ غور کریں' : 'حل شدہ مارک کریں'}" class="bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 text-xs p-1.5 rounded-lg transition cursor-pointer">
              <i class="fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}"></i>
            </button>
            <button onclick="deleteComplaint('${c.id}')" title="شکایت ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs p-1.5 rounded-lg transition cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openComplaintImageViewer(imageUrl, farmerName, date) {
  const img = document.getElementById('cmp-modal-img');
  const title = document.getElementById('cmp-modal-title');
  const subtitle = document.getElementById('cmp-modal-subtitle');
  const downloadLink = document.getElementById('cmp-modal-download');

  if (img) img.src = imageUrl;
  if (title) title.innerText = `شکایت رسید: ${farmerName}`;
  if (subtitle) subtitle.innerText = `تاریخ: ${date} | ہارون زرعی مرکز کسان شکایات پورٹل`;
  if (downloadLink) downloadLink.href = imageUrl;

  openModal('modal-complaint-image-viewer');
}

async function toggleComplaintStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Resolved' ? 'Pending' : 'Resolved';
  try {
    const res = await adminFetch(`/api/complaints/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      loadComplaints();
    }
  } catch (err) {
    console.error('toggleComplaintStatus error:', err);
  }
}

async function deleteComplaint(id) {
  if (!confirm('کیا آپ واقعی یہ شکایت ڈیلیٹ کرنا چاہتے ہیں؟')) return;
  try {
    const res = await adminFetch(`/api/complaints/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadComplaints();
    }
  } catch (err) {
    console.error('deleteComplaint error:', err);
  }
}

// Auto-refresh stats and farmer logins periodically when active on Overview
setInterval(() => {
  const overviewSection = document.getElementById('tab-overview');
  if (overviewSection && !overviewSection.classList.contains('hidden')) {
    const adminToken = sessionStorage.getItem('adminToken');
    if (adminToken) {
      loadAdminStats();
      loadFarmerLogins();
    }
  }
}, 15000);

// ==========================================
// 8. FARMER PAYABLES MANAGEMENT (واجب الادا ادائیگیاں)
// ==========================================
let allPayablesCache = [];
let currentPayablesSubTab = 'crops';

async function loadPayables() {
  try {
    const res = await adminFetch('/api/payables');
    if (!res.ok) return;
    allPayablesCache = await res.json();

    // Summary calculations
    let totalRemaining = 0;
    let cropsRemaining = 0;
    let otherRemaining = 0;
    let totalPaid = 0;

    allPayablesCache.forEach(item => {
      const rem = Number(item.remainingBalance) || 0;
      const paid = Number(item.paidAmount) || 0;
      totalRemaining += rem;
      totalPaid += paid;
      if ((item.type || 'crop') === 'crop') {
        cropsRemaining += rem;
      } else {
        otherRemaining += rem;
      }
    });

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setEl('stat-payables-total', `Rs. ${totalRemaining.toLocaleString()}`);
    setEl('stat-payables-crops', `Rs. ${cropsRemaining.toLocaleString()}`);
    setEl('stat-payables-other', `Rs. ${otherRemaining.toLocaleString()}`);
    setEl('stat-payables-paid', `Rs. ${totalPaid.toLocaleString()}`);

    const badgePayables = document.getElementById('badge-total-payables');
    if (badgePayables) badgePayables.innerText = allPayablesCache.length;

    renderPayablesTables();
    populatePayablesFarmerDropdowns();
  } catch (err) {
    console.error('loadPayables error:', err);
  }
}

function switchPayablesSubTab(tab) {
  currentPayablesSubTab = tab;
  const btnCrops = document.getElementById('subtab-btn-pay-crops');
  const btnOther = document.getElementById('subtab-btn-pay-other');
  const paneCrops = document.getElementById('subtab-content-pay-crops');
  const paneOther = document.getElementById('subtab-content-pay-other');

  if (tab === 'crops') {
    if (btnCrops) btnCrops.className = "bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer";
    if (btnOther) btnOther.className = "bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer";
    if (paneCrops) paneCrops.classList.remove('hidden');
    if (paneOther) paneOther.classList.add('hidden');
  } else {
    if (btnCrops) btnCrops.className = "bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer";
    if (btnOther) btnOther.className = "bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer";
    if (paneCrops) paneCrops.classList.add('hidden');
    if (paneOther) paneOther.classList.remove('hidden');
  }
}

function filterPayablesTable() {
  renderPayablesTables();
}

function renderPayablesTables() {
  const searchInput = (document.getElementById('payables-search-input')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('payables-status-filter')?.value || 'all';

  const filtered = allPayablesCache.filter(item => {
    // Status filter
    if (statusFilter !== 'all') {
      const st = (item.paymentStatus || 'Pending').toLowerCase();
      if (statusFilter === 'pending' && st !== 'pending') return false;
      if (statusFilter === 'partial' && st !== 'partial') return false;
      if (statusFilter === 'paid' && st !== 'paid') return false;
    }

    // Search filter
    if (searchInput) {
      const matchName = (item.farmerName || '').toLowerCase().includes(searchInput);
      const matchMobile = (item.farmerMobile || '').toLowerCase().includes(searchInput);
      const matchCrop = (item.cropName || '').toLowerCase().includes(searchInput);
      const matchTitle = (item.title || '').toLowerCase().includes(searchInput);
      const matchNotes = (item.notes || '').toLowerCase().includes(searchInput);
      if (!matchName && !matchMobile && !matchCrop && !matchTitle && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  const cropsList = filtered.filter(p => (p.type || 'crop') === 'crop');
  const otherList = filtered.filter(p => p.type === 'other');

  const badgeCrops = document.getElementById('badge-crops-count');
  if (badgeCrops) badgeCrops.innerText = `${cropsList.length} اندراجات`;

  const badgeOther = document.getElementById('badge-other-count');
  if (badgeOther) badgeOther.innerText = `${otherList.length} اندراجات`;

  renderPayablesCropsTable(cropsList);
  renderPayablesOtherTable(otherList);
}

function renderPayablesCropsTable(cropsList) {
  const tbody = document.getElementById('payables-crops-tbody');
  if (!tbody) return;

  if (cropsList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="p-8 text-center text-gray-400 bg-gray-50/50">
          <i class="fa-solid fa-wheat-awn text-3xl text-emerald-300 block mb-2"></i>
          <span class="font-bold text-xs">کوئی فصل خریداری کا ریکارڈ موجود نہیں ہے۔</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = cropsList.map(item => {
    const isPaid = item.paymentStatus === 'Paid';
    const isPartial = item.paymentStatus === 'Partial';
    const statusBadge = isPaid
      ? `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-check text-[9px]"></i> مکمل ادا شدہ</span>`
      : (isPartial
        ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i> جزوی ادا شدہ</span>`
        : `<span class="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1"><i class="fa-solid fa-circle-exclamation text-[9px]"></i> واجب الادا</span>`);

    const weightText = `${item.weightMaunds || 0} من` + (item.bagsCount ? ` (${item.bagsCount} بوری)` : '');
    const varietyBadge = item.variety ? `<span class="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold mr-1">${escapeHtml(item.variety)}</span>` : '';

    const cleanPhone = (item.farmerMobile || '').replace(/\D/g, '').replace(/^0/, '');
    const slipText = `السلام علیکم ${item.farmerName || 'کسان بھائی'}! ہارون زرعی مرکز (پل 88) کی جانب سے فصل خریداری رسید: جنس: ${item.cropName || 'فصل'}، مقدار: ${weightText}، کل قیمت: Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}، ادا شدہ رقم: Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}، واجب الادا بقایا رقم: Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}۔ شکریہ!`;
    const waLink = cleanPhone ? `https://wa.me/92${cleanPhone}?text=${encodeURIComponent(slipText)}` : '#';

    return `
      <tr class="hover:bg-amber-50/30 transition">
        <td class="p-3 font-mono text-xs text-gray-600">${escapeHtml(item.date || '-')}</td>
        <td class="p-3">
          <div class="font-extrabold text-gray-900">${escapeHtml(item.farmerName || '-')}</div>
          <div class="text-[11px] font-mono text-emerald-800" dir="ltr">${escapeHtml(item.farmerMobile || '-')}</div>
        </td>
        <td class="p-3">
          <div class="font-black text-brand-950 flex items-center gap-1">
            <i class="fa-solid fa-wheat-awn text-emerald-600"></i>
            <span>${escapeHtml(item.cropName || '-')}</span>
            ${varietyBadge}
          </div>
          ${item.notes ? `<div class="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate">${escapeHtml(item.notes)}</div>` : ''}
        </td>
        <td class="p-3 font-bold font-mono text-gray-800">${weightText}</td>
        <td class="p-3 font-bold font-mono text-gray-700">Rs. ${(Number(item.ratePerMaund) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-gray-900">Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-emerald-700">Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono ${Number(item.remainingBalance) > 0 ? 'text-rose-700 text-sm' : 'text-emerald-700'}">Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}</td>
        <td class="p-3 text-center">${statusBadge}</td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            ${!isPaid ? `
              <button type="button" onclick="openRecordPaymentModal('${item.id}')" title="کسان کو رقم ادا کریں" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl transition inline-flex items-center gap-1 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-money-bill-wave text-yellow-300"></i> ادا کریں
              </button>
            ` : ''}
            ${cleanPhone ? `
              <a href="${waLink}" target="_blank" title="واٹس ایپ پر رسید بھیجیں" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 p-1.5 rounded-xl transition">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </a>
            ` : ''}
            <button type="button" onclick="openEditCropPayableModal('${item.id}')" title="اندراج تبدیل کریں" class="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 p-1.5 rounded-xl transition cursor-pointer">
              <i class="fa-solid fa-pen-to-square text-xs text-amber-700"></i>
            </button>
            <button type="button" onclick="deletePayable('${item.id}')" title="اندراج ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-xl transition cursor-pointer">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPayablesOtherTable(otherList) {
  const tbody = document.getElementById('payables-other-tbody');
  if (!tbody) return;

  if (otherList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="p-8 text-center text-gray-400 bg-gray-50/50">
          <i class="fa-solid fa-receipt text-3xl text-indigo-300 block mb-2"></i>
          <span class="font-bold text-xs">کوئی دیگر واجب الادا رقم کا ریکارڈ موجود نہیں ہے۔</span>
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

    const cleanPhone = (item.farmerMobile || '').replace(/\D/g, '').replace(/^0/, '');
    const slipText = `السلام علیکم ${item.farmerName || 'کسان بھائی'}! ہارون زرعی مرکز کی جانب سے ادائیگی تفصیل: مد: ${item.category || item.title || 'واجب الادا'}، کل رقم: Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}، ادا شدہ رقم: Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}، واجب الادا بقایا رقم: Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}۔ شکریہ!`;
    const waLink = cleanPhone ? `https://wa.me/92${cleanPhone}?text=${encodeURIComponent(slipText)}` : '#';

    return `
      <tr class="hover:bg-indigo-50/30 transition">
        <td class="p-3 font-mono text-xs text-gray-600">${escapeHtml(item.date || '-')}</td>
        <td class="p-3">
          <div class="font-extrabold text-gray-900">${escapeHtml(item.farmerName || '-')}</div>
          <div class="text-[11px] font-mono text-indigo-800" dir="ltr">${escapeHtml(item.farmerMobile || '-')}</div>
        </td>
        <td class="p-3">
          <span class="bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-xs px-2.5 py-1 rounded-xl">
            ${escapeHtml(item.category || item.cropName || 'متفرق')}
          </span>
        </td>
        <td class="p-3">
          <div class="font-bold text-gray-900">${escapeHtml(item.title || item.cropName || '-')}</div>
          ${item.notes ? `<div class="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate">${escapeHtml(item.notes)}</div>` : ''}
        </td>
        <td class="p-3 font-black font-mono text-gray-900">Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono text-emerald-700">Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}</td>
        <td class="p-3 font-black font-mono ${Number(item.remainingBalance) > 0 ? 'text-rose-700 text-sm' : 'text-emerald-700'}">Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}</td>
        <td class="p-3 text-center">${statusBadge}</td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            ${!isPaid ? `
              <button type="button" onclick="openRecordPaymentModal('${item.id}')" title="کسان کو رقم ادا کریں" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl transition inline-flex items-center gap-1 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-money-bill-wave text-emerald-200"></i> ادا کریں
              </button>
            ` : ''}
            ${cleanPhone ? `
              <a href="${waLink}" target="_blank" title="واٹس ایپ پر رسید بھیجیں" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 p-1.5 rounded-xl transition">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </a>
            ` : ''}
            <button type="button" onclick="openEditOtherPayableModal('${item.id}')" title="اندراج تبدیل کریں" class="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 p-1.5 rounded-xl transition cursor-pointer">
              <i class="fa-solid fa-pen-to-square text-xs text-amber-700"></i>
            </button>
            <button type="button" onclick="deletePayable('${item.id}')" title="اندراج ڈیلیٹ کریں" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-xl transition cursor-pointer">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populatePayablesFarmerDropdowns() {
  const cropSelect = document.getElementById('crop-pay-farmer-id');
  const otherSelect = document.getElementById('other-pay-farmer-id');

  const optionsHtml = '<option value="">-- کسان منتخب کریں --</option>' +
    allFarmersCache.map(f => `<option value="${f.id}">${escapeHtml(f.name)} (${f.id} - ${escapeHtml(f.mobile || f.village || '')})</option>`).join('');

  if (cropSelect) {
    const curVal = cropSelect.value;
    cropSelect.innerHTML = optionsHtml;
    if (curVal) cropSelect.value = curVal;
  }

  if (otherSelect) {
    const curVal = otherSelect.value;
    otherSelect.innerHTML = optionsHtml;
    if (curVal) otherSelect.value = curVal;
  }
}

function onPayableFarmerSelected(farmerId, type) {
  // Can be used to autofill or show current ledger balance
}

function onPayableCropSelected(cropVal) {
  const nameInput = document.getElementById('crop-pay-crop-name');
  if (nameInput) {
    if (cropVal !== 'دیگر اجناس') {
      nameInput.value = cropVal;
    } else {
      nameInput.value = '';
      nameInput.focus();
    }
  }
}

function onOtherCategoryChanged(categoryVal) {
  const titleInput = document.getElementById('other-pay-title-input');
  if (titleInput && !titleInput.value) {
    titleInput.value = categoryVal;
  }
}

function calculateCropPayableTotal() {
  const maunds = Number(document.getElementById('crop-pay-weight-maunds')?.value) || 0;
  const rate = Number(document.getElementById('crop-pay-rate-maund')?.value) || 0;
  const totalInput = document.getElementById('crop-pay-total');
  const paidInput = document.getElementById('crop-pay-paid');
  const remInput = document.getElementById('crop-pay-remaining');

  let total = Number(totalInput?.value) || 0;
  if (maunds > 0 && rate > 0) {
    total = Math.round(maunds * rate);
    if (totalInput) totalInput.value = total;
  }

  const paid = Number(paidInput?.value) || 0;
  const rem = Math.max(0, total - paid);
  if (remInput) remInput.value = rem;

  const statusSelect = document.getElementById('crop-pay-status');
  if (statusSelect) {
    if (rem === 0 && total > 0) statusSelect.value = 'Paid';
    else if (paid > 0 && rem > 0) statusSelect.value = 'Partial';
    else statusSelect.value = 'Pending';
  }
}

function calculateOtherPayableTotal() {
  const total = Number(document.getElementById('other-pay-total')?.value) || 0;
  const paid = Number(document.getElementById('other-pay-paid')?.value) || 0;
  const remInput = document.getElementById('other-pay-remaining');
  const rem = Math.max(0, total - paid);
  if (remInput) remInput.value = rem;
}

function openAddCropPayableModal() {
  const form = document.getElementById('form-crop-payable');
  if (form) form.reset();
  document.getElementById('crop-pay-id').value = '';
  document.getElementById('modal-crop-pay-title').innerText = 'کسان سے فصل / بیج خریداری کا نیا اندراج';
  
  const dateInput = document.getElementById('crop-pay-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  
  populatePayablesFarmerDropdowns();
  openModal('modal-add-crop-payable');
}

function openEditCropPayableModal(id) {
  const item = allPayablesCache.find(p => p.id === id);
  if (!item) return;

  populatePayablesFarmerDropdowns();

  document.getElementById('crop-pay-id').value = item.id;
  document.getElementById('crop-pay-farmer-id').value = item.farmerId || '';
  document.getElementById('crop-pay-crop-select').value = item.cropName || 'گندم (Wheat)';
  document.getElementById('crop-pay-crop-name').value = item.cropName || '';
  document.getElementById('crop-pay-variety').value = item.variety || '';
  document.getElementById('crop-pay-weight-maunds').value = item.weightMaunds || '';
  document.getElementById('crop-pay-bags').value = item.bagsCount || '';
  document.getElementById('crop-pay-rate-maund').value = item.ratePerMaund || '';
  document.getElementById('crop-pay-total').value = item.totalAmount || '';
  document.getElementById('crop-pay-paid').value = item.paidAmount || 0;
  document.getElementById('crop-pay-remaining').value = item.remainingBalance || 0;
  document.getElementById('crop-pay-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('crop-pay-status').value = item.paymentStatus || 'Pending';
  document.getElementById('crop-pay-notes').value = item.notes || '';
  
  const chk = document.getElementById('crop-pay-adjust-khata');
  if (chk) chk.checked = false;

  document.getElementById('modal-crop-pay-title').innerText = 'فصل خریداری اندراج تبدیل کریں (Edit)';
  openModal('modal-add-crop-payable');
}

function openAddOtherPayableModal() {
  const form = document.getElementById('form-other-payable');
  if (form) form.reset();
  document.getElementById('other-pay-id').value = '';
  document.getElementById('modal-other-pay-title').innerText = 'کسان کو دیگر واجب الادا رقم کا اندراج (Other Payables)';

  const dateInput = document.getElementById('other-pay-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  populatePayablesFarmerDropdowns();
  openModal('modal-add-other-payable');
}

function openEditOtherPayableModal(id) {
  const item = allPayablesCache.find(p => p.id === id);
  if (!item) return;

  populatePayablesFarmerDropdowns();

  document.getElementById('other-pay-id').value = item.id;
  document.getElementById('other-pay-farmer-id').value = item.farmerId || '';
  document.getElementById('other-pay-category').value = item.category || 'متفرق واجب الادا رقم';
  document.getElementById('other-pay-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('other-pay-title-input').value = item.title || item.cropName || '';
  document.getElementById('other-pay-total').value = item.totalAmount || '';
  document.getElementById('other-pay-paid').value = item.paidAmount || 0;
  document.getElementById('other-pay-remaining').value = item.remainingBalance || 0;
  document.getElementById('other-pay-notes').value = item.notes || '';

  document.getElementById('modal-other-pay-title').innerText = 'دیگر واجب الادا رقم ایڈٹ کریں (Edit)';
  openModal('modal-add-other-payable');
}

function openRecordPaymentModal(id) {
  const item = allPayablesCache.find(p => p.id === id);
  if (!item) return;

  document.getElementById('rec-pay-id').value = item.id;
  document.getElementById('rec-pay-farmer-name').innerText = `${item.farmerName || 'کسان'} (${item.farmerMobile || '-'})`;
  document.getElementById('rec-pay-crop-name').innerText = item.title || item.cropName || '-';
  document.getElementById('rec-pay-total-amount').innerText = `Rs. ${(Number(item.totalAmount) || 0).toLocaleString()}`;
  document.getElementById('rec-pay-already-paid').innerText = `Rs. ${(Number(item.paidAmount) || 0).toLocaleString()}`;
  document.getElementById('rec-pay-remaining').innerText = `Rs. ${(Number(item.remainingBalance) || 0).toLocaleString()}`;

  const inputAmt = document.getElementById('rec-pay-amount-input');
  if (inputAmt) {
    inputAmt.value = item.remainingBalance || '';
    inputAmt.max = item.remainingBalance || 0;
  }

  const dateInput = document.getElementById('rec-pay-date-input');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const notesInput = document.getElementById('rec-pay-notes-input');
  if (notesInput) notesInput.value = '';

  openModal('modal-record-payable-payment');
}

async function handleCropPayableSubmit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('crop-pay-id').value;
  const farmerId = document.getElementById('crop-pay-farmer-id').value;
  if (!farmerId) {
    alert('براہ کرم کسان منتخب کریں۔');
    return;
  }

  const selectedCrop = document.getElementById('crop-pay-crop-select').value;
  const cropName = document.getElementById('crop-pay-crop-name').value.trim() || selectedCrop;
  const variety = document.getElementById('crop-pay-variety').value.trim();
  const weightMaunds = Number(document.getElementById('crop-pay-weight-maunds').value) || 0;
  const bagsCount = Number(document.getElementById('crop-pay-bags').value) || 0;
  const ratePerMaund = Number(document.getElementById('crop-pay-rate-maund').value) || 0;
  const totalAmount = Number(document.getElementById('crop-pay-total').value) || 0;
  const paidAmount = Number(document.getElementById('crop-pay-paid').value) || 0;
  const date = document.getElementById('crop-pay-date').value;
  const paymentStatus = document.getElementById('crop-pay-status').value;
  const notes = document.getElementById('crop-pay-notes').value.trim();
  const adjustInKhata = Boolean(document.getElementById('crop-pay-adjust-khata')?.checked);

  const payload = {
    type: 'crop',
    farmerId,
    cropName,
    variety,
    weightMaunds,
    bagsCount,
    ratePerMaund,
    totalAmount,
    paidAmount,
    date,
    paymentStatus,
    notes,
    adjustInKhata
  };

  const url = id ? `/api/payables/${id}` : '/api/payables';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await adminFetch(url, {
      method,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert(id ? 'فصل خریداری کا اندراج کامیابی سے اپڈیٹ ہو گیا!' : 'فصل خریداری کا اندراج کامیابی سے محفوظ ہو گیا!');
      closeModal('modal-add-crop-payable');
      loadPayables();
      loadAllFarmers();
      loadAdminStats();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || 'اندراج محفوظ کرنے میں خرابی واقع ہوئی۔');
    }
  } catch (err) {
    console.error('Crop payable submit error:', err);
    alert('سرور سے رابطہ نہ ہو سکا۔');
  }
}

async function handleOtherPayableSubmit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('other-pay-id').value;
  const farmerId = document.getElementById('other-pay-farmer-id').value;
  if (!farmerId) {
    alert('براہ کرم کسان منتخب کریں۔');
    return;
  }

  const category = document.getElementById('other-pay-category').value;
  const date = document.getElementById('other-pay-date').value;
  const title = document.getElementById('other-pay-title-input').value.trim();
  const totalAmount = Number(document.getElementById('other-pay-total').value) || 0;
  const paidAmount = Number(document.getElementById('other-pay-paid').value) || 0;
  const notes = document.getElementById('other-pay-notes').value.trim();

  const payload = {
    type: 'other',
    farmerId,
    category,
    date,
    title,
    cropName: title,
    totalAmount,
    paidAmount,
    notes
  };

  const url = id ? `/api/payables/${id}` : '/api/payables';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await adminFetch(url, {
      method,
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert(id ? 'واجب الادا ادائیگی کا اندراج کامیابی سے اپڈیٹ ہو گیا!' : 'واجب الادا ادائیگی کا نیا اندراج محفوظ ہو گیا!');
      closeModal('modal-add-other-payable');
      loadPayables();
      loadAdminStats();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || 'اندراج محفوظ کرنے میں خرابی واقع ہوئی۔');
    }
  } catch (err) {
    console.error('Other payable submit error:', err);
    alert('سرور سے رابطہ نہ ہو سکا۔');
  }
}

async function handleRecordPaymentSubmit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('rec-pay-id').value;
  const addPaid = Number(document.getElementById('rec-pay-amount-input').value) || 0;
  const payDate = document.getElementById('rec-pay-date-input').value;
  const method = document.getElementById('rec-pay-method-select').value;
  const payNotes = document.getElementById('rec-pay-notes-input').value.trim();

  if (addPaid <= 0) {
    alert('براہ کرم درست ادائیگی رقم درج کریں۔');
    return;
  }

  const item = allPayablesCache.find(p => p.id === id);
  if (!item) return;

  const newPaid = Number(item.paidAmount || 0) + addPaid;
  const newNotes = [item.notes, `${payDate} کو نقد ${addPaid} روپے بذریعہ ${method} ادا کیے گئے۔ ${payNotes}`].filter(Boolean).join(' | ');

  try {
    const res = await adminFetch(`/api/payables/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        paidAmount: newPaid,
        notes: newNotes
      })
    });
    if (res.ok) {
      alert(`کسان کو ${addPaid.toLocaleString()} روپے کی ادائیگی کامیابی سے درج ہو گئی!`);
      closeModal('modal-record-payable-payment');
      loadPayables();
      loadAdminStats();
    } else {
      alert('ادائیگی درج کرنے میں خرابی واقع ہوئی۔');
    }
  } catch (err) {
    console.error('Record payment error:', err);
    alert('سرور سے رابطہ نہ ہو سکا۔');
  }
}

async function deletePayable(id) {
  if (!confirm('کیا آپ واقعی یہ واجب الادا ادائیگی کا ریکارڈ ڈیلیٹ کرنا چاہتے ہیں؟')) return;

  try {
    const res = await adminFetch(`/api/payables/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadPayables();
      loadAdminStats();
    } else {
      alert('ریکارڈ ڈیلیٹ کرنے میں خرابی واقع ہوئی۔');
    }
  } catch (err) {
    console.error('deletePayable error:', err);
  }
}
