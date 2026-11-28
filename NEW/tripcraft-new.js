/*
 * TripCraft NEW (V200) – home page, popular destinations, book-ahead, sharing,
 * build-then-sign-in flow and 30-minute idle sign-out.
 * NOTE: review before production deployment.
 */
(function () {
  'use strict';
  if (window.TC_NEW) return;
  window.TC_NEW = { version: '200' };
  var HE = (document.documentElement.lang || 'he').indexOf('en') !== 0;
  function t(he, en) { return HE ? he : en; }
  function $(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function me() { try { return window.tcCustomer && window.tcCustomer(); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- 1. Popular destinations (passport-stamp cards) ---------- */
  var DEST = [
    { iso: 'IT', he: 'איטליה', en: 'Italy', days: '7–10', seasonHe: 'אפריל–יוני · ספט׳–אוק׳', seasonEn: 'Apr–Jun · Sep–Oct', tagHe: 'אוכל, ערים ואגמים', tagEn: 'Food, cities & lakes', hue: 14 },
    { iso: 'GR', he: 'יוון', en: 'Greece', days: '6–9', seasonHe: 'מאי–יוני · ספטמבר', seasonEn: 'May–Jun · Sep', tagHe: 'איים, חופים ורכב', tagEn: 'Islands, beaches, road trip', hue: 205 },
    { iso: 'AT', he: 'אוסטריה', en: 'Austria', days: '6–8', seasonHe: 'יוני–ספט׳ · חורף לסקי', seasonEn: 'Jun–Sep · winter ski', tagHe: 'אלפים ומשפחות', tagEn: 'Alps & families', hue: 150 },
    { iso: 'TH', he: 'תאילנד', en: 'Thailand', days: '10–16', seasonHe: 'נובמבר–מרץ', seasonEn: 'Nov–Mar', tagHe: 'איים, מקדשים, שווקים', tagEn: 'Islands, temples, markets', hue: 38 },
    { iso: 'PT', he: 'פורטוגל', en: 'Portugal', days: '7–10', seasonHe: 'אפריל–יוני · ספט׳–אוק׳', seasonEn: 'Apr–Jun · Sep–Oct', tagHe: 'חופים, ליסבון ופורטו', tagEn: 'Coast, Lisbon & Porto', hue: 0 },
    { iso: 'FR', he: 'צרפת', en: 'France', days: '6–10', seasonHe: 'אפריל–יוני · ספטמבר', seasonEn: 'Apr–Jun · Sep', tagHe: 'פריז, פרובאנס, ריביירה', tagEn: 'Paris, Provence, Riviera', hue: 225 },
    { iso: 'GE', he: 'גאורגיה', en: 'Georgia', days: '6–8', seasonHe: 'מאי–אוקטובר', seasonEn: 'May–Oct', tagHe: 'הרים, יין וטבע', tagEn: 'Mountains, wine, nature', hue: 350 },
    { iso: 'VN', he: 'ויאטנם', en: 'Vietnam', days: '14–21', seasonHe: 'פברואר–אפריל', seasonEn: 'Feb–Apr', tagHe: 'מצפון לדרום', tagEn: 'North to south', hue: 120 },
    { iso: 'CY', he: 'קפריסין', en: 'Cyprus', days: '3–5', seasonHe: 'אפריל–נובמבר', seasonEn: 'Apr–Nov', tagHe: 'קצר, קרוב, חופים', tagEn: 'Short, close, beaches', hue: 190 },
    { iso: 'CZ', he: 'צ׳כיה', en: 'Czechia', days: '4–6', seasonHe: 'אפריל–אוק׳ · דצמבר', seasonEn: 'Apr–Oct · December', tagHe: 'פראג וכפרים', tagEn: 'Prague & villages', hue: 265 },
    { iso: 'US', he: 'ארה״ב', en: 'USA', days: '12–18', seasonHe: 'מאי–אוקטובר', seasonEn: 'May–Oct', tagHe: 'ערים ופארקים לאומיים', tagEn: 'Cities & national parks', hue: 215 },
    { iso: 'IL', he: 'ישראל', en: 'Israel', days: '2–4', seasonHe: 'כל השנה', seasonEn: 'All year', tagHe: 'צפון, דרום וחופשה קצרה', tagEn: 'North, south, short breaks', hue: 210 }
  ];
  function flag(iso) { return String(iso || '').toUpperCase().replace(/./g, function (c) { return String.fromCodePoint(127397 + c.charCodeAt(0)); }); }
  function countryValue(iso) {
    var row = (window.TC_COUNTRIES_FULL || []).find(function (c) { return c[0] === iso; });
    return row ? row[1] : '';
  }
  function destSection() {
    return '<div class="tc-home-section tcn-dest" id="tcnDest"><div class="tc-home-section-head"><span>' + t('יעדים פופולריים', 'Popular destinations') + '</span><h2>' + t('לאן טסים? בחרו יעד ונתחיל לבנות', 'Where to? Pick a destination and start building') + '</h2><p>' + t('לחיצה על יעד פותחת את התכנון כשהיעד כבר בפנים. אתם רק מוסיפים תאריכים ומי נוסע.', 'Tap a destination to open the planner with it already filled in. You add the dates and who is travelling.') + '</p></div>' +
      '<div class="tcn-dest-grid">' + DEST.map(function (d, i) {
        return '<button type="button" class="tcn-stamp" data-tcn-dest="' + d.iso + '" style="--h:' + d.hue + '">' +
          '<span class="tcn-stamp-flag" aria-hidden="true">' + flag(d.iso) + '</span>' +
          '<span class="tcn-stamp-name">' + esc(t(d.he, d.en)) + '</span>' +
          '<span class="tcn-stamp-tag">' + esc(t(d.tagHe, d.tagEn)) + '</span>' +
          '<span class="tcn-stamp-meta"><b dir="ltr">' + d.days + '</b> ' + t('ימים', 'days') + ' · ' + esc(t(d.seasonHe, d.seasonEn)) + '</span>' +
          '<span class="tcn-stamp-cta">' + t('בנה טיול ל' + d.he, 'Plan ' + d.en) + ' ←</span>' +
          '<span class="tcn-stamp-mark" aria-hidden="true">TRIPCRAFT ✈ ' + String(i + 1).padStart(2, '0') + '</span></button>';
      }).join('') + '</div></div>';
  }
  function openPlannerFor(iso) {
    var d = DEST.find(function (x) { return x.iso === iso; }); if (!d) return;
    try { if (window.tcStartCleanTripGuest) window.tcStartCleanTripGuest(); } catch (e) {}
    location.hash = '#planner';
    setTimeout(function () {
      var val = countryValue(iso) || d.he;
      var box = $('countryChoices');
      // a destination card starts a fresh trip: drop countries, region, must-sees and airports left from a previous trip
      if (box) [].forEach.call(box.querySelectorAll('input:checked'), function (x) { if (x.value !== val) { x.checked = false; x.dispatchEvent(new Event('change', { bubbles: true })); } });
      ['plDestination', 'plMust', 'plArrivalAirport', 'plDepartureAirport', 'plArrivalTime', 'plDepartureTime'].forEach(function (id) { var f = $(id); if (f && f.value) { f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); } });
      [].forEach.call(document.querySelectorAll('#plMustChips .tc-chip, .tc-must-chips .tc-chip'), function (c) { c.remove(); });
      var name0 = $('plTripName'); if (name0) name0.value = '';
      var inp = box && [].find.call(box.querySelectorAll('input'), function (x) { return x.value === val; });
      if (inp) { if (!inp.checked) { inp.checked = true; inp.dispatchEvent(new Event('change', { bubbles: true })); } }
      else if (window.tcAddCountry) window.tcAddCountry(val);
      var name = $('plTripName'); if (name && !name.value) { name.value = t('טיול ל' + d.he, 'Trip to ' + d.en); name.dispatchEvent(new Event('input', { bubbles: true })); }
      var first = $('plDestination') || name; if (first) first.focus();
      try { window.tcToast && window.tcToast(t('✓ ' + d.he + ' נבחרה. עכשיו בוחרים אזור ותאריכים.', '✓ ' + d.en + ' selected. Now choose a region and dates.')); } catch (e) {}
    }, 350);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tcn-dest]'); if (!b) return;
    e.preventDefault(); openPlannerFor(b.getAttribute('data-tcn-dest'));
  });

  /* ---------- 2. FAQ (honest about the AI) ---------- */
  var FAQ = [
    [t('כמה זה עולה?', 'How much does it cost?'), t('כרגע בניית טיול ב-TripCraft היא בחינם. ההרשמה נדרשת כדי לשמור את הטיול בחשבון שלכם ולחזור אליו מכל מכשיר.', 'Building a trip on TripCraft is currently free. Signing up is needed to save the trip to your account and open it on any device.')],
    [t('מה אני מקבל בסוף?', 'What do I get?'), t('מסלול יום־אחר־יום עם שעות, זמני נסיעה, ניווט ב-Waze וב-Google Maps לכל תחנה, 3 מלונות מומלצים לכל אזור לינה, הערכת תקציב, ורשימה של מה שחייבים להזמין מראש.', 'A day-by-day plan with times, drive times, Waze and Google Maps for every stop, 3 recommended hotels per stay, a budget estimate, and a list of what to book in advance.')],
    [t('ה-AI ממציא מקומות?', 'Does the AI make places up?'), t('ה-AI מתבסס על מקומות אמיתיים, ואחרי הבנייה המסלול עובר בדיקה נוספת. ובכל זאת: מקום שלא נמצא לו מיקום מדויק מסומן אצלנו בבירור, ולא מוסתר.', 'The AI works with real places, and every itinerary gets an extra check after it is built. Still, a place without an exact location is clearly marked, never hidden.')],
    [t('מה ה-AI לא עושה?', 'What does the AI not do?'), t('הוא לא מזמין בשבילכם כרטיסים או מלונות, ולא יודע אם מקום נסגר אתמול או שינה שעות. לכן לפני שטסים – בדקו שעות פתיחה והזמינו את מה שמסומן "להזמין מראש".', 'It does not book tickets or hotels for you, and it cannot know if a place closed yesterday or changed its hours. Before you fly, check opening hours and book everything marked "Book ahead".')],
    [t('אפשר לשנות את המסלול?', 'Can I change the plan?'), t('כן. כותבים לעוזר בשפה חופשית ("להחליף את יום 3 ביום חוף", "פחות נסיעות") והוא משנה רק את מה שביקשתם. אפשר גם לערוך כל תחנה בעצמכם.', 'Yes. Tell the assistant in plain words ("make day 3 a beach day", "less driving") and it changes only what you asked. You can also edit any stop yourself.')],
    [t('זה עובד גם לטיול בארץ?', 'Does it work for trips in Israel?'), t('כן. בטיול בארץ אין שלב טיסות, והמסלול מתחיל מהבית.', 'Yes. Trips in Israel skip the flights step and start from home.')],
    [t('איך משתפים את הטיול?', 'How do I share a trip?'), t('מ"החשבון שלי" או מעמוד הטיול: "העתק קישור" ושולחים למי שנוסע איתכם.', 'From My account or the trip page: "Copy link" and send it to your travel mates.')]
  ];
  function faqSection() {
    return '<div class="tc-home-section tcn-faq" id="tcnFaq"><div class="tc-home-section-head"><span>' + t('שאלות נפוצות', 'FAQ') + '</span><h2>' + t('בלי אותיות קטנות', 'No small print') + '</h2></div><div class="tcn-faq-list">' +
      FAQ.map(function (q, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</div>' +
      '<div class="tcn-cta-band"><div><b>' + t('הטיול הבא שלכם מתחיל כאן', 'Your next trip starts here') + '</b><span>' + t('ממלאים כמה שאלות, נרשמים בסוף – והמסלול מוכן תוך כשתי דקות.', 'Answer a few questions, sign up at the end – your plan is ready in about two minutes.') + '</span></div><a class="tcn-btn-coral" href="#planner" data-tcn-plan>' + t('בנה טיול חדש', 'Build a trip') + '</a></div></div>';
  }
  function setupHome() {
    var content = document.querySelector('.tc-home-content'); if (!content || $('tcnDest')) return;
    var first = content.querySelector('.tc-home-section');
    if (first) first.insertAdjacentHTML('beforebegin', destSection()); else content.insertAdjacentHTML('afterbegin', destSection());
    content.insertAdjacentHTML('beforeend', faqSection());
    var g = content.querySelector('.tc-guides .tc-home-section-head');
    if (g) {
      var span = g.querySelector('span'), h2 = g.querySelector('h2'), p = g.querySelector('p');
      if (span) span.textContent = t('השראה', 'Inspiration');
      if (h2) h2.textContent = t('טיולים שתכננו וטיילנו בהם', 'Trips we planned and travelled');
      if (p) p.textContent = t('מסלולים אמיתיים מהשטח: איפה ישנו, כמה נסענו ומה היה שווה. פתחו לקבלת השראה.', 'Real trips from the road: where we slept, how far we drove and what was worth it.');
    }
    // the Vietnam photo with app overlays -> cleaned crop
    [].forEach.call(document.querySelectorAll('img[src*="assets/vietnam.jpg"]'), function (im) { im.src = 'vietnam-clean.jpg'; });
    var kicker = document.querySelector('.home-kicker'); if (kicker) kicker.classList.add('tcn-kicker');
    var hero = $('home'); if (hero) hero.classList.add('tcn-hero');
    var trust = document.querySelector('.home-trust');
    if (trust && !trust.dataset.tcn) { trust.dataset.tcn = '1'; trust.insertAdjacentHTML('beforeend', '<span>🎟 ' + t('להזמין מראש – מסומן', 'Book-ahead flagged') + '</span><span>🏨 ' + t('3 מלונות לכל אזור', '3 hotels per stay') + '</span>'); }
  }

  /* ---------- 3. Build first, sign in at the end ---------- */
  var BUILD_AFTER_LOGIN = 'tcn_build_after_login';
  window.tcStartCleanTripGuest = function () { /* the wizard stays as the guest filled it */ };
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#planner"]');
    if (!a || me() || a.closest('#planner')) return;
    // guests may open the planner; sign-in is requested only when building
    e.preventDefault(); e.stopImmediatePropagation();
    location.hash = '#planner';
    try { window.tcMenu && window.tcMenu(false); } catch (x) {}
  }, true);
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#plannerBuild'); if (!b || me()) return;
    ss(BUILD_AFTER_LOGIN, '1');
    // v170 handler sends the guest to #login and stores the return path
  }, true);
  function guestBuildNote() {
    var step = document.querySelector('.planner-step[data-step="7"]'); if (!step || $('tcnGuestNote')) return;
    step.insertAdjacentHTML('beforeend', '<div id="tcnGuestNote" class="tcn-guest-note" hidden>🔒 ' + t('כדי לבנות ולשמור את הטיול נבקש להתחבר במייל (קוד חד־פעמי, לוקח דקה). כל מה שמילאתם נשמר.', 'To build and save the trip we will ask you to sign in by email (one-time code, takes a minute). Everything you filled in is kept.') + '</div>');
  }
  function syncGuestNote() { var n = $('tcnGuestNote'); if (n) n.hidden = !!me(); }
  function resumeBuildAfterLogin() {
    if (ss(BUILD_AFTER_LOGIN) !== '1' || !me() || location.hash !== '#planner') return;
    ss(BUILD_AFTER_LOGIN, null);
    setTimeout(function () {
      var b = $('plannerBuild'); if (!b) return;
      try { window.tcToast && window.tcToast(t('✓ התחברתם. בונים את הטיול עכשיו…', '✓ Signed in. Building your trip now…')); } catch (e) {}
      b.hidden = false; b.disabled = false; b.click();
    }, 700);
  }

  /* ---------- 4. 30 minutes without activity = sign out ---------- */
  // index.html uses TC_AUTH_MAX_IDLE = 30 min; activity (click/typing/scroll/touch) keeps the session alive (tripcraft-v170 touchAuth).

  /* ---------- 6. Book ahead: box on the trip page ---------- */
  var BOOK_RE = /^\s*(?:🎟\s*)?(?:להזמין מראש|הזמנה מראש|book ahead|book in advance)\s*[:：\-–]\s*/i;
  function bookAheadItems(d) {
    var out = [];
    (d && d.days || []).forEach(function (day, di) {
      (day.stops || []).forEach(function (st) {
        var n = String(st.notes || '');
        if (BOOK_RE.test(n)) out.push({ di: di, date: day.date, name: st.name || st.place, text: n.replace(BOOK_RE, '') });
      });
    });
    return out;
  }
  function draft() { try { return planner && planner.draft; } catch (e) { return null; } }
  function renderTripExtras() {
    var d = draft(), res = $('plannerResult'); if (!d || !res || !d.days) return;
    var anchor = $('tcHotelPicks') || $('plannerDraftDays'); if (!anchor) return;
    var items = bookAheadItems(d), box = $('tcnBookAhead');
    if (items.length) {
      if (!box) { box = document.createElement('section'); box.id = 'tcnBookAhead'; box.className = 'tcn-book'; anchor.insertAdjacentElement('beforebegin', box); }
      box.innerHTML = '<div class="tcn-book-head"><span class="tcn-book-icon">🎟</span><div><h3>' + t('לפני שטסים: ' + items.length + ' דברים להזמין מראש', 'Before you fly: ' + items.length + ' things to book ahead') + '</h3><p>' + t('אלה מקומות שבדרך כלל נגמרים בהם הכרטיסים או שצריך שמירת מקום. כדאי לסגור אותם עכשיו.', 'These places usually sell out or need a reservation. Lock them in now.') + '</p></div></div><ol>' +
        items.map(function (x) { return '<li><b>' + t('יום', 'Day') + ' ' + (x.di + 1) + ' · ' + esc(x.name) + '</b><span>' + esc(x.text) + '</span></li>'; }).join('') + '</ol>';
    } else if (box) box.remove();
    var share = $('tcnShare');
    if (d.tripId && (d.status === 'ready' || /save/.test(String(d.buildStatus || '')))) {
      var base = (window.TRIPCRAFT_CONFIG && window.TRIPCRAFT_CONFIG.publicBaseUrl) || (location.origin + location.pathname);
      var link = base.replace(/[?#].*$/, '') + '#trip/' + encodeURIComponent(d.tripId);
      if (!share) { share = document.createElement('div'); share.id = 'tcnShare'; share.className = 'tcn-share'; (box || anchor).insertAdjacentElement('beforebegin', share); }
      share.innerHTML = '<span>' + t('שתפו את הטיול עם מי שנוסע איתכם:', 'Share the trip with your travel mates:') + '</span><button type="button" class="tc-btn tc-btn-soft" data-tcn-copy="' + esc(link) + '">🔗 ' + t('העתק קישור', 'Copy link') + '</button>';
    } else if (share) share.remove();
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-tcn-copy]'); if (!c) return;
    var v = c.getAttribute('data-tcn-copy');
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { window.tcToast && window.tcToast(t('✓ הקישור הועתק', '✓ Link copied')); }, function () { window.prompt(t('העתיקו את הקישור:', 'Copy the link:'), v); });
  });

  /* ---------- 7. Logo = home page, always ---------- */
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.tc-logo-link, [data-tc-home-logo]'); if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { var m = $('plannerDayModal'); if (m && m.open && m.close) m.close(); } catch (x) {}
    try { window.tcMenu && window.tcMenu(false); } catch (x) {}
    if (location.hash !== '#home') location.hash = '#home'; else { try { window.applyPageFocus && window.applyPageFocus(); } catch (x) {} }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, true);

  /* ---------- 8. One-time code: paste always gives all 6 digits ---------- */
  function otpField() { return $('tcOtpCode'); }
  document.addEventListener('paste', function (e) {
    var f = otpField(); if (!f || e.target !== f) return;
    var txt = ((e.clipboardData || window.clipboardData) || { getData: function () { return ''; } }).getData('text') || '';
    var digits = txt.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    f.value = digits; f.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
  document.addEventListener('input', function (e) {
    var f = otpField(); if (!f || e.target !== f) return;
    var clean = f.value.replace(/\D/g, '').slice(0, 6); if (clean !== f.value) f.value = clean;
  }, true);
  function fixOtpField() { var f = otpField(); if (f && f.getAttribute('maxlength') !== '12') { f.setAttribute('maxlength', '12'); } }

  /* ---------- 9. Build button visible right away on the summary step ---------- */
  function topBuildButton() {
    var step = document.querySelector('.planner-step[data-step="7"]'); if (!step || $('tcnBuildTop')) return;
    var head = step.querySelector('h2, h3') || step.firstElementChild;
    var wrap = document.createElement('div'); wrap.className = 'tcn-build-top';
    wrap.innerHTML = '<span>' + t('הכל נראה טוב? אפשר לבנות עכשיו, או לגלול ולבדוק את הפרטים.', 'All good? Build now, or scroll down to review the details.') + '</span><button type="button" id="tcnBuildTop" class="tcn-btn-coral">✨ ' + t('בנה את הטיול', 'Build my trip') + '</button>';
    if (head && head.parentNode === step) head.insertAdjacentElement('afterend', wrap); else step.insertBefore(wrap, step.firstChild);
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#tcnBuildTop')) return;
    e.preventDefault();
    var b = $('plannerBuild'); if (b) b.click(); // same flow as the bottom button
  });

  /* ---------- boot ---------- */
  function wrapRender() {
    var orig = window.renderPlannerDraft; if (typeof orig !== 'function' || orig.__tcn) return;
    var w = function () { var r = orig.apply(this, arguments); try { renderTripExtras(); } catch (e) { console.warn('TCN extras', e); } return r; };
    w.__tcn = true; window.renderPlannerDraft = w; try { renderPlannerDraft = w; } catch (e) {}
  }
  function tick() { setupHome(); guestBuildNote(); topBuildButton(); syncGuestNote(); resumeBuildAfterLogin(); fixOtpField(); }
  function boot() {
    wrapRender(); tick();
    window.addEventListener('hashchange', function () { setTimeout(tick, 120); setTimeout(tick, 900); });
    setInterval(syncGuestNote, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
