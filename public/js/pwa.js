// Haroon Zarai Markaz - Progressive Web App (PWA) Manager
// Handles Service Worker registration, custom install prompt (Android/Chrome/Desktop), iOS Safari guide & Offline alerts

(function () {
  'use strict';

  let deferredPrompt = null;
  const PWA_DISMISS_KEY = 'hzm_pwa_dismissed';

  // 1. REGISTER SERVICE WORKER
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('🌾 [PWA] Service Worker registered with scope:', registration.scope);

          // Check for service worker updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🌾 [PWA] New version available! Reloading...');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('🌾 [PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. CHECK IF RUNNING AS INSTALLED STANDALONE PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) {
    console.log('🌾 [PWA] Running in Standalone App mode');
    document.documentElement.classList.add('pwa-standalone');
    return; // Don't show install banners if already installed
  }

  // 3. LISTEN FOR ANDROID & DESKTOP NATIVE INSTALL PROMPT
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('🌾 [PWA] beforeinstallprompt event captured');

    // Show custom install UI unless dismissed recently
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_KEY);
    if (!isDismissed) {
      setTimeout(showInstallBanner, 2000);
    }

    // Enable any standalone install buttons in header/footer
    document.querySelectorAll('.pwa-install-trigger').forEach((btn) => {
      btn.classList.remove('hidden');
      btn.addEventListener('click', triggerInstallPrompt);
    });
  });

  // 4. TRIGGER NATIVE INSTALL
  async function triggerInstallPrompt() {
    if (!deferredPrompt) {
      // If prompt not available (e.g. user manually clicked header install button)
      showIosOrManualModal();
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log('🌾 [PWA] User install choice:', choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      hideInstallBanner();
      showCelebrationToast('مبارک ہو! ہارون زرعی مرکز ایپ کامیابی سے انسٹال ہو گئی ہے۔');
    }
    deferredPrompt = null;
  }

  // 5. LISTEN FOR APP INSTALLED EVENT
  window.addEventListener('appinstalled', () => {
    console.log('🌾 [PWA] App installed successfully');
    hideInstallBanner();
    hideIosModal();
    deferredPrompt = null;
    showCelebrationToast('مبارک ہو! ہارون زرعی مرکز ایپ آپ کی ہوم اسکرین پر شامل ہو چکی ہے۔');
  });

  // 6. DETECT IOS SAFARI (iPhone/iPad)
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !window.MSStream &&
    !isStandalone;

  if (isIos) {
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_KEY);
    if (!isDismissed) {
      setTimeout(showIosBanner, 3000);
    }
  }

  // 7. CREATE & SHOW CUSTOM MODERN INSTALL BANNER (ANDROID / DESKTOP)
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.dir = 'rtl';
    banner.className =
      'fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-400 transition-all duration-300 transform translate-y-8 opacity-0 flex flex-col gap-3 font-sans text-right';

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="HZM Logo" class="w-13 h-13 rounded-2xl shadow-md border-2 border-amber-300 shrink-0">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h4 class="font-black text-gray-900 text-sm sm:text-base font-urdu">ہارون زرعی مرکز موبائل ایپ</h4>
          </div>
          <p class="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-snug">
            فاسٹ موبائل ایپ انسٹال کریں اور انٹرنیٹ کے بغیر بھی کھاتہ و ریٹ چیک کریں!
          </p>
        </div>
        <button type="button" id="pwa-dismiss-btn" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer" title="بند کریں">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button type="button" id="pwa-confirm-install-btn" class="flex-1 bg-gradient-to-r from-emerald-600 to-brand-700 hover:from-emerald-700 hover:to-brand-800 text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
          <i class="fa-solid fa-download text-amber-300"></i>
          <span>ابھی انسٹال کریں (Install App)</span>
        </button>
        <button type="button" id="pwa-later-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer">
          بعد میں
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Fade-in animation
    requestAnimationFrame(() => {
      banner.classList.remove('translate-y-8', 'opacity-0');
      banner.classList.add('translate-y-0', 'opacity-100');
    });

    // Event Listeners
    document.getElementById('pwa-confirm-install-btn')?.addEventListener('click', triggerInstallPrompt);
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', dismissInstallBanner);
    document.getElementById('pwa-later-btn')?.addEventListener('click', dismissInstallBanner);
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('translate-y-8', 'opacity-0');
      setTimeout(() => banner.remove(), 300);
    }
  }

  function dismissInstallBanner() {
    hideInstallBanner();
    sessionStorage.setItem(PWA_DISMISS_KEY, 'true');
  }

  // 8. SHOW IOS SAFARI INSTALL GUIDE BANNER
  function showIosBanner() {
    if (document.getElementById('pwa-ios-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.dir = 'rtl';
    banner.className =
      'fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-400 transition-all duration-300 transform translate-y-8 opacity-0 flex flex-col gap-2.5 font-sans text-right';

    banner.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/icons/apple-touch-icon.png" alt="HZM" class="w-10 h-10 rounded-xl shadow-xs border border-amber-300">
          <div>
            <h4 class="font-black text-gray-900 text-sm font-urdu">آئی فون پر ایپ انسٹال کریں</h4>
            <span class="text-[10px] text-emerald-700 font-bold">Safari Browser Guide</span>
          </div>
        </div>
        <button type="button" id="pwa-ios-close-btn" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div class="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs text-gray-700 space-y-1.5 font-medium">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
          <span>نیچے سفاری کے شیئر بٹن <i class="fa-solid fa-arrow-up-from-bracket text-blue-600 font-bold mx-1"></i> پر کلک کریں۔</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
          <span>تھوڑا نیچے سکرول کر کے <strong class="text-gray-900 font-bold">"Add to Home Screen" <i class="fa-regular fa-square-plus text-emerald-600 mx-1"></i></strong> دبائیں۔</span>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.classList.remove('translate-y-8', 'opacity-0');
      banner.classList.add('translate-y-0', 'opacity-100');
    });

    document.getElementById('pwa-ios-close-btn')?.addEventListener('click', () => {
      banner.classList.add('translate-y-8', 'opacity-0');
      setTimeout(() => banner.remove(), 300);
      sessionStorage.setItem(PWA_DISMISS_KEY, 'true');
    });
  }

  function hideIosModal() {
    const banner = document.getElementById('pwa-ios-banner');
    if (banner) banner.remove();
  }

  function showIosOrManualModal() {
    if (isIos) {
      showIosBanner();
    } else {
      showCelebrationToast('ایپ انسٹال کرنے کے لیے براؤزر کے مینو (3 ڈاٹس) میں "Install App" یا "Add to Home Screen" منتخب کریں۔');
    }
  }

  // 9. CELEBRATION / NOTIFICATION TOAST
  function showCelebrationToast(msg) {
    const toast = document.createElement('div');
    toast.dir = 'rtl';
    toast.className =
      'fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-emerald-800 to-brand-900 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-3 text-xs sm:text-sm font-bold font-urdu animate-bounce';
    toast.innerHTML = `
      <i class="fa-solid fa-circle-check text-amber-300 text-lg"></i>
      <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // 10. OFFLINE / ONLINE STATUS ALERTS
  window.addEventListener('offline', () => {
    let offlineBar = document.getElementById('pwa-offline-bar');
    if (!offlineBar) {
      offlineBar = document.createElement('div');
      offlineBar.id = 'pwa-offline-bar';
      offlineBar.dir = 'rtl';
      offlineBar.className =
        'fixed top-0 left-0 right-0 z-[9999] bg-rose-600 text-white py-1.5 px-4 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 font-urdu';
      offlineBar.innerHTML = `
        <i class="fa-solid fa-wifi text-[11px] animate-pulse"></i>
        <span>آپ آف لائن ہیں۔ محفوظ شدہ کھاتہ ڈیٹا لوڈ کیا جا رہا ہے۔</span>
      `;
      document.body.prepend(offlineBar);
    }
  });

  window.addEventListener('online', () => {
    const offlineBar = document.getElementById('pwa-offline-bar');
    if (offlineBar) {
      offlineBar.className =
        'fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white py-1.5 px-4 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 font-urdu';
      offlineBar.innerHTML = `
        <i class="fa-solid fa-circle-check text-[11px]"></i>
        <span>انٹرنیٹ کنکشن بحال ہو گیا ہے!</span>
      `;
      setTimeout(() => offlineBar.remove(), 3000);
    }
  });

  // Expose global trigger for any button with onclick="window.triggerPwaInstall()"
  window.triggerPwaInstall = triggerInstallPrompt;
})();
