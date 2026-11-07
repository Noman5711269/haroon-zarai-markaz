// Haroon Zarai Markaz - Progressive Web App (PWA) Manager
// Handles Service Worker registration, custom install prompt (Android/Chrome/Desktop), iOS Safari guide & Offline alerts

(function () {
  'use strict';

  const isAdmin = window.location.pathname.startsWith('/admin');
  const PWA_DISMISS_KEY = isAdmin ? 'hzm_pwa_admin_dismissed' : 'hzm_pwa_customer_dismissed';

  // Check if prompt was already captured by early head script
  let deferredPrompt = window._deferredPwaPrompt || null;

  // 1. REGISTER SERVICE WORKER & AUTO UPDATE CACHE
  if ('serviceWorker' in navigator) {
    // Purge obsolete PWA caches automatically
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name !== 'hzm-pwa-v1.3.0') {
            console.log('🧹 [PWA Client] Deleting stale cache:', name);
            caches.delete(name);
          }
        });
      });
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('🌾 [PWA] Service Worker registered with scope:', registration.scope);
          // Force immediate check for updated worker
          registration.update().catch(() => {});

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🌾 [PWA] New version installed! Reloading to show fresh logo and assets...');
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('🌾 [PWA] Service Worker registration failed:', err);
        });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  // 2. CHECK IF RUNNING AS INSTALLED STANDALONE PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) {
    console.log('🌾 [PWA] Running in Standalone App mode');
    document.documentElement.classList.add('pwa-standalone');
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.pwa-install-trigger').forEach((btn) => {
        btn.classList.add('hidden');
      });
    });
  }

  // 3. LISTEN FOR NATIVE BEFOREINSTALLPROMPT
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window._deferredPwaPrompt = e;
    console.log('🌾 [PWA] beforeinstallprompt event captured');

    // Show custom install UI unless dismissed or already standalone
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_KEY);
    if (!isDismissed && !isStandalone) {
      setTimeout(showInstallBanner, 1500);
    }
  });

  // Attach click listeners to all install trigger buttons
  function attachButtonTriggers() {
    document.querySelectorAll('.pwa-install-trigger').forEach((btn) => {
      if (!isStandalone) {
        btn.classList.remove('hidden');
      }
      btn.onclick = (e) => {
        e.preventDefault();
        triggerInstallPrompt();
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachButtonTriggers);
  } else {
    attachButtonTriggers();
  }

  // 4. TRIGGER NATIVE OR GUIDED INSTALL
  async function triggerInstallPrompt() {
    console.log('🌾 [PWA] triggerInstallPrompt called. deferredPrompt present?', !!deferredPrompt);

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log('🌾 [PWA] User install choice:', choiceResult.outcome);

        if (choiceResult.outcome === 'accepted') {
          hideInstallBanner();
          const successMsg = isAdmin
            ? 'مبارک ہو! ایڈمن کنٹرول پینل ایپ کامیابی سے انسٹال ہو گئی ہے۔'
            : 'مبارک ہو! ہارون زرعی مرکز ایپ کامیابی سے انسٹال ہو گئی ہے۔';
          showCelebrationToast(successMsg);
        }
        deferredPrompt = null;
        window._deferredPwaPrompt = null;
        return;
      } catch (err) {
        console.warn('🌾 [PWA] Native prompt error:', err);
      }
    }

    // If native prompt is not available (e.g. Chrome Desktop Omnibox, iOS Safari, or prompt not triggered)
    showHelpfulInstallGuideModal();
  }

  // Expose global trigger immediately
  window.triggerPwaInstall = triggerInstallPrompt;

  // 5. LISTEN FOR APP INSTALLED EVENT
  window.addEventListener('appinstalled', () => {
    console.log('🌾 [PWA] App installed successfully');
    hideInstallBanner();
    hideHelpfulModal();
    deferredPrompt = null;
    window._deferredPwaPrompt = null;
    const installedMsg = isAdmin
      ? 'مبارک ہو! ایڈمن کنٹرول پینل ایپ آپ کی ہوم اسکرین پر شامل ہو چکی ہے۔'
      : 'مبارک ہو! ہارون زرعی مرکز ایپ آپ کی ہوم اسکرین پر شامل ہو چکی ہے۔';
    showCelebrationToast(installedMsg);
    // Hide buttons once installed
    document.querySelectorAll('.pwa-install-trigger').forEach((btn) => btn.classList.add('hidden'));
  });

  // 6. DETECT PLATFORM
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) && !window.MSStream;
  const isAndroid = /android/.test(window.navigator.userAgent.toLowerCase());

  if (isIos && !isStandalone) {
    const isDismissed = sessionStorage.getItem(PWA_DISMISS_KEY);
    if (!isDismissed) {
      setTimeout(showIosBanner, 3000);
    }
  }

  // 7. CREATE & SHOW CUSTOM MODERN INSTALL BANNER (ANDROID / DESKTOP)
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner') || isStandalone) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.dir = 'rtl';

    const borderClass = isAdmin ? 'border-2 border-amber-400' : 'border-2 border-emerald-400';
    banner.className =
      `fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl ${borderClass} transition-all duration-300 transform translate-y-8 opacity-0 flex flex-col gap-3 font-sans text-right`;

    const appTitle = isAdmin ? 'ایڈمن کنٹرول پینل ایپ' : 'ہارون زرعی مرکز موبائل ایپ';
    const appDesc = isAdmin
      ? 'ایڈمن پورٹل کو براہ راست موبائل یا کمپیوٹر پر بغیر براؤزر کے الگ فل اسکرین ایپ کی طرح انسٹال کریں!'
      : 'فاسٹ موبائل ایپ انسٹال کریں اور انٹرنیٹ کے بغیر بھی کھاتہ و ریٹ چیک کریں!';
    const appBtnText = isAdmin ? 'ایڈمن ایپ انسٹال کریں (Install Admin App)' : 'ابھی انسٹال کریں (Install App)';
    const btnGradient = isAdmin
      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-gray-950 font-black'
      : 'bg-gradient-to-r from-emerald-600 to-brand-700 hover:from-emerald-700 hover:to-brand-800 text-white font-extrabold';
    const badgeColor = isAdmin ? 'bg-amber-500' : 'bg-emerald-500';

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="HZM Logo" class="w-13 h-13 rounded-2xl shadow-md border-2 border-amber-300 shrink-0">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${badgeColor} animate-pulse"></span>
            <h4 class="font-black text-gray-900 text-sm sm:text-base font-urdu">${appTitle}</h4>
          </div>
          <p class="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-snug">
            ${appDesc}
          </p>
        </div>
        <button type="button" id="pwa-dismiss-btn" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer" title="بند کریں">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button type="button" id="pwa-confirm-install-btn" class="flex-1 ${btnGradient} text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
          <i class="fa-solid fa-download ${isAdmin ? 'text-brand-950' : 'text-amber-300'}"></i>
          <span>${appBtnText}</span>
        </button>
        <button type="button" id="pwa-later-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer">
          بعد میں
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.classList.remove('translate-y-8', 'opacity-0');
      banner.classList.add('translate-y-0', 'opacity-100');
    });

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

  // 8. INTERACTIVE STEP-BY-STEP INSTALL GUIDE MODAL (FOR ALL DEVICES)
  function showHelpfulInstallGuideModal() {
    let modal = document.getElementById('pwa-helpful-install-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'pwa-helpful-install-modal';
    modal.dir = 'rtl';
    modal.className =
      'fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans';

    const targetAppName = isAdmin ? 'ہارون زرعی مرکز (ایڈمن کنٹرول پورٹل)' : 'ہارون زرعی مرکز (کسان پورٹل)';

    let platformStepsHtml = '';

    if (isIos) {
      platformStepsHtml = `
        <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 text-right">
          <div class="flex items-center gap-2 font-black text-amber-900 text-sm">
            <i class="fa-brands fa-apple text-xl text-amber-600"></i>
            <span>آئی فون (Safari Browser) پر انسٹال کرنے کا طریقہ:</span>
          </div>
          <ol class="space-y-2.5 text-xs text-gray-800 leading-relaxed list-decimal list-inside pr-1 font-bold">
            <li>نیچے سفاری بار پر موجود <strong>شیئر بٹن</strong> (<i class="fa-solid fa-arrow-up-from-bracket text-blue-600 text-sm mx-1"></i>) دبائیں۔</li>
            <li>تھوڑا نیچے اسکرول کر کے <strong>"Add to Home Screen"</strong> (<i class="fa-regular fa-square-plus text-emerald-600 text-sm mx-1"></i>) منتخب کریں۔</li>
            <li>اوپر دائیں کونے میں <strong>"Add"</strong> پر کلک کریں۔ ایڈمن ایپ آپ کی ہوم اسکرین پر آ جائے گی!</li>
          </ol>
        </div>
      `;
    } else if (isAndroid) {
      platformStepsHtml = `
        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 text-right">
          <div class="flex items-center gap-2 font-black text-emerald-900 text-sm">
            <i class="fa-brands fa-android text-xl text-emerald-600"></i>
            <span>اینڈرائیڈ موبائل (Google Chrome) پر انسٹال کرنے کا طریقہ:</span>
          </div>
          <ol class="space-y-2.5 text-xs text-gray-800 leading-relaxed list-decimal list-inside pr-1 font-bold">
            <li>کروم براؤزر کے اوپر دائیں کونے میں <strong>3 ڈاٹس</strong> (<strong class="text-base text-gray-900 font-mono">⋮</strong>) پر کلک کریں۔</li>
            <li>مینو میں سے <strong>"Install app" (ایپ انسٹال کریں)</strong> یا <strong>"Add to Home screen"</strong> دبائیں۔</li>
            <li>پاپ اپ پر <strong>"Install"</strong> منتخب کریں! ایپ خودکار آپ کے موبائل میں انسٹال ہو جائے گی۔</li>
          </ol>
        </div>
      `;
    } else {
      // Desktop / PC (Chrome, Edge, Brave, etc.)
      platformStepsHtml = `
        <div class="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 space-y-3 text-right">
          <div class="flex items-center gap-2 font-black text-blue-900 text-sm">
            <i class="fa-solid fa-laptop text-xl text-blue-600"></i>
            <span>کمپیوٹر یا لیپ ٹاپ (Chrome / Edge) پر انسٹال کرنے کا طریقہ:</span>
          </div>
          <ol class="space-y-2.5 text-xs text-gray-800 leading-relaxed list-decimal list-inside pr-1 font-bold">
            <li>اوپر براؤزر کی ایڈریس بار (URL بار) میں دائیں طرف موجود <strong>انسٹال آئیکن 🖥️ یا ⬇️</strong> پر کلک کریں۔</li>
            <li>یا براؤزر کے اوپر دائیں کونے میں <strong>3 ڈاٹس (⋮)</strong> پر کلک کریں اور <strong>"Save and share" -> "Install ${isAdmin ? 'ایڈمن پینل' : 'ہارون زرعی مرکز'}"</strong> دبائیں۔</li>
            <li>پاپ اپ پر <strong>"Install"</strong> پر کلک کریں۔ ایپ بغیر براؤزر کے الگ ونڈو میں کھل جائے گی!</li>
          </ol>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl border-2 ${isAdmin ? 'border-amber-400' : 'border-emerald-400'} max-w-md w-full p-5 sm:p-6 text-center space-y-4">
        
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="Logo" class="w-11 h-11 rounded-2xl shadow-xs border border-amber-300 shrink-0">
            <div class="text-right">
              <h3 class="font-black text-gray-900 text-sm sm:text-base font-urdu leading-tight">${targetAppName}</h3>
              <p class="text-[11px] text-gray-500 font-bold">ایپ انسٹال کرنے کی آسان گائیڈ</p>
            </div>
          </div>
          <button type="button" id="btn-close-helpful-guide" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        ${platformStepsHtml}

        <div class="pt-1">
          <button type="button" id="btn-confirm-helpful-guide" class="w-full ${isAdmin ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-gray-950 font-black' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold'} py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer">
            سمجھ آ گیا (بند کریں)
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-close-helpful-guide')?.addEventListener('click', hideHelpfulModal);
    document.getElementById('btn-confirm-helpful-guide')?.addEventListener('click', hideHelpfulModal);
  }

  function hideHelpfulModal() {
    const modal = document.getElementById('pwa-helpful-install-modal');
    if (modal) modal.remove();
  }

  // 9. SHOW IOS SAFARI INSTALL GUIDE BANNER (BOTTOM POPUP)
  function showIosBanner() {
    if (document.getElementById('pwa-ios-banner') || isStandalone) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.dir = 'rtl';
    const borderClass = isAdmin ? 'border-2 border-amber-400' : 'border-2 border-emerald-400';
    banner.className =
      `fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl ${borderClass} transition-all duration-300 transform translate-y-8 opacity-0 flex flex-col gap-2.5 font-sans text-right`;

    const iosTitle = isAdmin ? 'آئی فون پر ایڈمن ایپ انسٹال کریں' : 'آئی فون پر ایپ انسٹال کریں';
    const iosBadge = isAdmin ? 'Admin Safari Guide' : 'Safari Browser Guide';

    banner.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/icons/apple-touch-icon.png" alt="HZM" class="w-10 h-10 rounded-xl shadow-xs border border-amber-300">
          <div>
            <h4 class="font-black text-gray-900 text-sm font-urdu">${iosTitle}</h4>
            <span class="text-[10px] text-emerald-700 font-bold">${iosBadge}</span>
          </div>
        </div>
        <button type="button" id="pwa-ios-close-btn" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer" title="بند کریں">
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

  // 10. CELEBRATION / NOTIFICATION TOAST
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

  // 11. OFFLINE / ONLINE STATUS ALERTS
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

})();
