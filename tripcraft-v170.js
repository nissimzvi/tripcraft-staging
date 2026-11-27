/*
 * TripCraft V170 - final UX / data / navigation layer.
 * Loaded last by index.html and index-en.html; overrides older layers in place.
 * NOTE: review and test before deploying to the production site.
 */
(function () {
  'use strict';
  if (window.TC_V170) return;
  window.TC_V170 = { version: '170' };

  var LANG = (document.documentElement.lang || 'he').indexOf('en') === 0 ? 'en' : 'he';
  var HE = LANG === 'he';
  // Language toggle = real page switch (Hebrew page / English page), so nothing stays half-translated
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-lang]');
    if (!b) return;
    var want = b.getAttribute('data-lang') === 'en' ? 'en' : 'he';
    e.preventDefault(); e.stopImmediatePropagation();
    try { localStorage.setItem('tc_v433_lang', want); } catch (x) {}
    if (want === LANG) return;
    var q = new URLSearchParams(location.search); q.delete('lang'); q.delete('r'); var s = q.toString();
    location.href = new URL(want === 'en' ? 'index-en.html' : './', location.href).pathname + (s ? '?' + s : '') + location.hash;
  }, true);
  // EN toggle on the Hebrew page: load the full English dictionary too
  if (!HE && !window.TC_I18N_EN && ![].some.call(document.scripts, function (x) { return /tripcraft-i18n-en\.js/.test(x.src); })) {
    try { var i18s = document.createElement('script'); i18s.src = 'tripcraft-i18n-en.js?v=191'; document.head.appendChild(i18s); } catch (e) {}
  }
  function t(he, en) { return HE ? he : en; }
  function $(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function P() { try { return planner; } catch (e) { return null; } }
  function draft() { var p = P(); return p && p.draft; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoParts(s) { var m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; }
  function isoDate(s) { var p = isoParts(s); return p ? new Date(p.y, p.m - 1, p.d, 12) : null; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ================================================================
   * 1. UI kit: toast + in-page dialogs (replace native alert/confirm/prompt)
   * ================================================================ */
  var nativeAlert = window.alert.bind(window), nativeConfirm = window.confirm.bind(window);
  function toast(msg, kind) {
    var box = $('tcToastStack');
    if (!box) { box = document.createElement('div'); box.id = 'tcToastStack'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    if (Array.prototype.some.call(box.children, function (c) { return c.textContent === msg; })) return;
    var el = document.createElement('div');
    el.className = 'tc-toast tc-toast-' + (kind || 'ok');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 300); }, kind === 'error' ? 4200 : 2600);
  }
  window.tcToast = function (msg, ok) { toast(msg, ok === false ? 'error' : 'ok'); };

  function dialog(opts) {
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var wrap = document.createElement('div');
      wrap.className = 'tc-dialog-backdrop';
      var fields = (opts.fields || []).map(function (f, i) {
        var input = f.multiline
          ? '<textarea id="tcDlgF' + i + '" rows="3">' + esc(f.value || '') + '</textarea>'
          : '<input id="tcDlgF' + i + '" type="' + (f.type || 'text') + '" value="' + esc(f.value || '') + '">';
        return '<label class="tc-dialog-field"><span>' + esc(f.label) + '</span>' + input + '</label>';
      }).join('');
      wrap.innerHTML = '<div class="tc-dialog" role="dialog" aria-modal="true" aria-labelledby="tcDlgTitle">' +
        (opts.icon ? '<div class="tc-dialog-icon">' + opts.icon + '</div>' : '') +
        '<h3 id="tcDlgTitle">' + esc(opts.title || '') + '</h3>' +
        (opts.message ? '<p>' + esc(opts.message).replace(/\n/g, '<br>') + '</p>' : '') + fields +
        '<div class="tc-dialog-actions">' +
        (opts.cancel === false ? '' : '<button type="button" class="tc-btn tc-btn-ghost" data-r="0">' + esc(opts.cancelText || t('ביטול', 'Cancel')) + '</button>') +
        '<button type="button" class="tc-btn ' + (opts.danger ? 'tc-btn-danger' : 'tc-btn-primary') + '" data-r="1">' + esc(opts.okText || t('אישור', 'OK')) + '</button>' +
        '</div></div>';
      document.body.appendChild(wrap);
      document.body.classList.add('tc-dialog-open');
      function done(ok) {
        var vals = (opts.fields || []).map(function (_, i) { var e = $('tcDlgF' + i); return e ? e.value : ''; });
        wrap.classList.remove('in');
        setTimeout(function () { wrap.remove(); if (!document.querySelector('.tc-dialog-backdrop')) document.body.classList.remove('tc-dialog-open'); }, 180);
        try { prev && prev.focus && prev.focus({ preventScroll: true }); } catch (e) {}
        resolve(opts.fields ? (ok ? vals : null) : ok);
      }
      wrap.addEventListener('click', function (e) {
        var b = e.target.closest('[data-r]');
        if (b) done(b.dataset.r === '1');
        else if (e.target === wrap && opts.cancel !== false) done(false);
      });
      function onKey(e) {
        if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey, true); return; }
        if (e.key === 'Escape' && opts.cancel !== false) { e.stopImmediatePropagation(); e.preventDefault(); document.removeEventListener('keydown', onKey, true); done(false); }
        else if (e.key === 'Enter' && wrap.contains(e.target) && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); document.removeEventListener('keydown', onKey, true); done(true); }
      }
      document.addEventListener('keydown', onKey, true);
      requestAnimationFrame(function () {
        wrap.classList.add('in');
        var first = wrap.querySelector('input,textarea') || wrap.querySelector('[data-r="1"]');
        first && first.focus();
      });
    });
  }
  window.tcDialog = dialog;
  window.tcConfirm = function (message, o) { return dialog(Object.assign({ title: t('לאישורכם', 'Please confirm'), message: message }, o || {})); };
  window.tcAlert = function (message, o) { return dialog(Object.assign({ title: t('שימו לב', 'Notice'), message: message, cancel: false, okText: t('הבנתי', 'Got it') }, o || {})); };
  // Non-blocking replacement for alert(): same call sites, nicer UI.
  window.alert = function (msg) { window.tcAlert(String(msg == null ? '' : msg)); };

  // Run fn while native confirm() is pre-approved (after our own async confirmation).
  function withConfirmApproved(fn) {
    var c = window.confirm; window.confirm = function () { return true; };
    try { var r = fn(); if (r && typeof r.then === 'function') return r.finally(function () { window.confirm = c; }); window.confirm = c; return r; }
    catch (e) { window.confirm = c; throw e; }
  }

  /* ================================================================
   * 1b. Session: stay signed in while active and across tabs (Supabase session is the real auth)
   * ================================================================ */
  var AUTH_OK = 'tc_v142_auth_ok', AUTH_LAST = 'tc_v142_last_activity';
  function hasSupabaseSession() {
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) { var v = JSON.parse(localStorage.getItem(k) || 'null'); var exp = v && (v.expires_at || (v.currentSession && v.currentSession.expires_at)); if (v && (v.refresh_token || (v.currentSession && v.currentSession.refresh_token))) return true; if (exp && exp * 1000 > Date.now()) return true; } } } catch (e) {}
    return false;
  }
  function touchAuth() {
    try { if (localStorage.getItem('tc_v433_customer') && hasSupabaseSession()) { localStorage.setItem(AUTH_LAST, String(Date.now())); sessionStorage.setItem(AUTH_OK, '1'); } } catch (e) {}
  }
  touchAuth(); // runs before the older idle guard resolves, so a valid session is never thrown out
  var lastTouch = 0;
  ['click', 'keydown', 'input', 'touchstart', 'scroll'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (Date.now() - lastTouch > 20000) { lastTouch = Date.now(); touchAuth(); } }, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') touchAuth(); }, true);
  window.addEventListener('focus', touchAuth, true);

  /* ================================================================
   * 2. Dates: correct weekday + Hebrew calendar date (shown in grey)
   * ================================================================ */
  var HE_DAYS = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
  var EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function weekday(s) {
    var d = isoDate(s);
    if (!d) { try { d = typeof dateObj === 'function' ? dateObj(String(s || '')) : null; } catch (e) { d = null; } }
    return d ? (HE ? HE_DAYS : EN_DAYS)[d.getDay()] : '';
  }
  window.weekdayForDate = weekday;
  try { weekdayForDate = weekday; } catch (e) {}

  function gematria(n) {
    var map = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
    var out = '';
    n = n % 1000;
    while (n > 0) {
      if (n === 15) { out += 'טו'; break; }
      if (n === 16) { out += 'טז'; break; }
      for (var i = 0; i < map.length; i++) if (n >= map[i][0]) { out += map[i][1]; n -= map[i][0]; break; }
    }
    return out.length > 1 ? out.slice(0, -1) + '״' + out.slice(-1) : out + '׳';
  }
  var hebFmt = null;
  try { hebFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  function hebrewDate(s) {
    var d = isoDate(s);
    if (!d || !hebFmt) return '';
    try {
      var parts = hebFmt.formatToParts(d), day = 0, month = '', year = 0;
      parts.forEach(function (p) { if (p.type === 'day') day = +p.value; else if (p.type === 'month') month = p.value; else if (p.type === 'year') year = +p.value; });
      if (!day || !month) return '';
      return gematria(day) + ' ' + month.replace(/^ב/, '') + ' ' + gematria(year);
    } catch (e) { return ''; }
  }
  window.tcHebrewDate = hebrewDate;
  function hebSpan(s) { var h = HE ? hebrewDate(s) : ''; return h ? '<span class="tc-hebdate">' + esc(h) + '</span>' : ''; }
  function niceDate(s) { try { return typeof displayPlannerDate === 'function' ? displayPlannerDate(s) : s; } catch (e) { return s; } }

  /* ================================================================
   * 3. Countries (full list) + airports (full table) + place search
   * ================================================================ */
  var COUNTRIES = window.TC_COUNTRIES_FULL || [];
  var COUNTRY_BY_NAME = {};
  COUNTRIES.forEach(function (c) { [c[1], c[2]].concat(c[3] || []).forEach(function (n) { COUNTRY_BY_NAME[norm(n)] = c; }); });
  function norm(v) { return String(v || '').toLowerCase().normalize('NFKD').replace(/[֑-ׇ]/g, '').replace(/[׳’'״"`.\-]/g, '').replace(/\s+/g, ' ').trim(); }
  function countryIso(name) { var c = COUNTRY_BY_NAME[norm(name)]; return c ? c[0] : ''; }
  function countryLabel(iso) { var c = COUNTRIES.find(function (x) { return x[0] === iso; }); return c ? (HE ? c[1] : c[2]) : iso; }
  window.tcCountryIso = countryIso;
  function resultVisible() { var r = $('plannerResult'), d = draft(); return !!(r && r.offsetParent !== null && d && d.days && d.days.length); }
  function tripCountryIsos() {
    // On an open trip use THAT trip's countries; in the new-trip wizard use the wizard's
    if (resultVisible()) { var fromDraft = draftCountryIsos(); if (fromDraft.length) return fromDraft; }
    var names = [];
    try { var d = typeof plannerData === 'function' ? plannerData() : null; if (d) names = (d.countries && d.countries.length ? d.countries : [d.country]); } catch (e) {}
    var out = names.filter(Boolean).map(countryIso).filter(Boolean);
    return out.length ? out : draftCountryIsos();
  }

  var AIRPORTS = window.TC_AIRPORTS_FULL || [];
  function airportSearch(q) {
    var n = norm(q); if (!n) return [];
    var up = String(q).trim().toUpperCase(), isos = tripCountryIsos(), scored = [];
    for (var i = 0; i < AIRPORTS.length; i++) {
      var a = AIRPORTS[i], s = 0;
      if (a[0] === up) s = 1000;
      else {
        var heCity = norm(a[7]), heName = norm(a[6]), city = norm(a[2]), name = norm(a[1]);
        if (heCity && heCity.indexOf(n) === 0) s = 700;
        else if (city.indexOf(n) === 0) s = 650;
        else if (heName && heName.indexOf(n) === 0) s = 600;
        else if (heCity && heCity.indexOf(n) > 0) s = 400;
        else if (heName && heName.indexOf(n) > 0) s = 380;
        else if (city.indexOf(n) > 0) s = 350;
        else if (name.indexOf(n) >= 0) s = 300;
      }
      if (!s) continue;
      if (a[8] === 1) s += 60;
      if (isos.indexOf(a[3]) >= 0) s += 400;
      scored.push([s, a]);
    }
    scored.sort(function (x, y) { return y[0] - x[0]; });
    return scored.slice(0, 8).map(function (x) {
      var a = x[1], cityLbl = HE ? (a[7] || a[2]) : a[2], nameLbl = HE && a[6] && norm(a[6]) !== norm(a[7]) ? a[6] : a[1];
      return { kind: 'airport', main: cityLbl + ' · ' + nameLbl, sub: (HE ? a[1] + ' · ' : '') + countryLabel(a[3]), value: a[1] + ' (' + a[0] + ')', code: a[0], lat: a[4], lon: a[5] };
    });
  }
  window.tcAirportLocal = airportSearch;
  try { tcAirportLocal = airportSearch; } catch (e) {}
  window.tcAirportByCode = function (code) { return AIRPORTS.find(function (a) { return a[0] === code; }) || null; };

  // Geo search: Nominatim for Hebrew text (Photon has no Hebrew), Photon for Latin text.
  // Production note: for high traffic switch to a commercial geocoder (Google Places / Mapbox).
  var lastNominatim = 0;
  function nominatimSearch(q, isos, limit) {
    var wait = Math.max(0, lastNominatim + 1100 - Date.now());
    return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
      lastNominatim = Date.now();
      var u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=' + (limit || 6) +
        '&accept-language=' + (HE ? 'he,en' : 'en') + '&q=' + encodeURIComponent(String(q).replace(/[׳’`]/g, "'").replace(/״/g, '"')) + (isos && isos.length ? '&countrycodes=' + isos.join(',').toLowerCase() : '');
      return fetch(u, { headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('geo ' + r.status); return r.json(); });
    });
  }
  function photonSearch(q, isos) {
    return fetch('https://photon.komoot.io/api/?limit=8&lang=en&q=' + encodeURIComponent(q)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { return (j.features || []).filter(function (f) { var cc = String((f.properties || {}).countrycode || '').toUpperCase(); return !isos.length || isos.indexOf(cc) >= 0; }); });
  }
  function wikiSearch(q) {
    var lang = /[\u0590-\u05FF]/.test(q) ? 'he' : 'en';
    var u = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=6&prop=coordinates%7Cdescription&coprimary=primary&gsrsearch=' + encodeURIComponent(q);
    return fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      return Object.keys((j.query || {}).pages || {}).map(function (k) { return j.query.pages[k]; })
        .filter(function (pg) { return pg.coordinates && pg.coordinates[0]; })
        .sort(function (a, b) { return a.index - b.index; })
        .map(function (pg) { return { kind: 'city', main: pg.title, sub: pg.description || '', value: pg.title, lat: pg.coordinates[0].lat, lon: pg.coordinates[0].lon, wiki: true }; });
    }).catch(function () { return []; });
  }
  function placeSearch(q, restrictToTrip) {
    q = String(q || '').trim(); if (q.length < 2) return Promise.resolve([]);
    var isos = restrictToTrip ? tripCountryIsos() : [];
    var heb = /[֐-׿]/.test(q);
    var p = heb ? nominatimSearch(q, isos, 7).then(function (rows) {
      return rows.map(function (r) {
        var a = r.address || {}, name = r.name || String(r.display_name || '').split(',')[0];
        var area = [a.city || a.town || a.village || a.county, a.state, a.country].filter(function (v, i, arr) { return v && v !== name && arr.indexOf(v) === i; }).join(' · ');
        return { kind: 'city', main: name, sub: area, value: name, lat: +r.lat, lon: +r.lon, cc: String(a.country_code || '').toUpperCase() };
      });
    }) : photonSearch(q, isos).then(function (fs) {
      return fs.map(function (f) {
        var p = f.properties || {}, c = (f.geometry || {}).coordinates || [], name = p.name || p.city || q;
        var area = [p.city, p.state, p.country].filter(function (v, i, arr) { return v && v !== name && arr.indexOf(v) === i; }).join(' · ');
        return { kind: 'city', main: name, sub: area, value: name, lat: c[1], lon: c[0], cc: String(p.countrycode || '').toUpperCase() };
      });
    });
    return p.catch(function () { return []; }).then(function (list) {
      return list.length ? list : wikiSearch(q);
    }).then(function (list) {
      var seen = {}; return list.filter(function (x) { var k = norm(x.main + '|' + x.sub); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 7);
    });
  }
  window.tcPlaceSearch = placeSearch;
  // Older autocomplete calls tcPhoton(q,type): airports come from the full local table now.
  window.tcPhoton = function (q, type) { return type === 'airport' ? Promise.resolve([]) : placeSearch(q, true); };
  try { tcPhoton = window.tcPhoton; } catch (e) {}

  /* ---- country picker: full list ---- */
  function enhanceCountrySearch() {
    var input = $('plCountrySearch'), list = $('plCountrySearchList');
    if (!input || !list || input.dataset.v170) return;
    input.dataset.v170 = '1';
    var fresh = input.cloneNode(true); input.replaceWith(fresh); input = fresh;
    function render() {
      var q = norm(input.value);
      if (!q) { list.classList.remove('show'); return; }
      var hits = COUNTRIES.filter(function (c) { return [c[1], c[2], c[0]].concat(c[3] || []).some(function (n) { return norm(n).indexOf(q) === 0; }); })
        .concat(COUNTRIES.filter(function (c) { return [c[1], c[2]].concat(c[3] || []).some(function (n) { var x = norm(n); return x.indexOf(q) > 0; }); }));
      var seen = {}; hits = hits.filter(function (c) { if (seen[c[0]]) return false; seen[c[0]] = 1; return true; }).slice(0, 8);
      list.innerHTML = hits.length ? hits.map(function (c) {
        return '<div class="ac-item" role="option" data-c="' + esc(c[1]) + '"><span class="ac-icon">' + flag(c[0]) + '</span><span><div class="ac-main">' + esc(HE ? c[1] : c[2]) + '</div><div class="ac-sub">' + esc(HE ? c[2] : c[0]) + '</div></span></div>';
      }).join('') : '<div class="ac-empty">' + t('לא נמצאה מדינה בשם הזה', 'No matching country') + '</div>';
      list.classList.add('show');
      list.querySelectorAll('[data-c]').forEach(function (el) {
        var pick = function (e) { e.preventDefault(); addCountry(el.dataset.c); input.value = ''; list.classList.remove('show'); };
        el.addEventListener('pointerdown', pick); el.addEventListener('click', pick);
      });
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', function () { setTimeout(function () { list.classList.remove('show'); }, 180); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var f = list.querySelector('[data-c]'); if (f) { addCountry(f.dataset.c); input.value = ''; list.classList.remove('show'); } } });
    var addBtn = $('addCountryBtn');
    if (addBtn) { var nb = addBtn.cloneNode(true); addBtn.replaceWith(nb); nb.addEventListener('click', function () { var f = list.querySelector('[data-c]'); if (input.value.trim()) { render(); f = list.querySelector('[data-c]'); } if (f) { addCountry(f.dataset.c); input.value = ''; list.classList.remove('show'); } else toast(t('בחרו מדינה מהרשימה', 'Pick a country from the list'), 'error'); }); }
  }
  function flag(iso) { try { return String.fromCodePoint.apply(null, iso.split('').map(function (c) { return 127397 + c.charCodeAt(0); })); } catch (e) { return '📍'; } }
  function addCountry(name) {
    var box = $('countryChoices'); if (!box) return;
    var existing = Array.prototype.find.call(box.querySelectorAll('input'), function (x) { return norm(x.value) === norm(name); });
    if (!existing) {
      var iso = countryIso(name);
      var l = document.createElement('label');
      l.innerHTML = '<input type="checkbox" value="' + esc(name) + '"><span>' + flag(iso) + ' ' + esc(HE ? name : countryLabel(iso)) + '</span>';
      box.appendChild(l); existing = l.querySelector('input');
    }
    existing.checked = true;
    existing.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ---- must-see places: chips + autocomplete restricted to trip countries ---- */
  function enhanceMustField() {
    var orig = $('plMust'); if (!orig || orig.dataset.v170) return;
    orig.dataset.v170 = '1'; orig.type = 'hidden';
    var wrap = document.createElement('div');
    wrap.className = 'tc-chipfield';
    wrap.innerHTML = '<div class="tc-chips" id="tcMustChips"></div><div class="ac-wrap"><input id="tcMustInput" autocomplete="off" placeholder="' + esc(t('הקלידו מקום ובחרו מהרשימה (Enter להוספה חופשית)', 'Type a place and pick it (Enter adds free text)')) + '"><div class="ac-list" id="tcMustInputList"></div></div>';
    orig.insertAdjacentElement('afterend', wrap);
    var input = $('tcMustInput'), list = $('tcMustInputList'), timer = 0, seq = 0;
    function items() { return String(orig.value || '').split(/\s*[,،;\n]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); }
    function setItems(arr) { orig.value = arr.join(', '); orig.dispatchEvent(new Event('input', { bubbles: true })); renderChips(); }
    function renderChips() {
      $('tcMustChips').innerHTML = items().map(function (x, i) { return '<span class="tc-chip">📍 ' + esc(x) + '<button type="button" aria-label="' + esc(t('הסר', 'Remove')) + '" data-i="' + i + '">×</button></span>'; }).join('');
    }
    $('tcMustChips').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var a = items(); a.splice(+b.dataset.i, 1); setItems(a); });
    function add(v) { v = String(v || '').trim(); if (!v) return; var a = items(); if (a.some(function (x) { return norm(x) === norm(v); })) return; a.push(v); setItems(a); input.value = ''; list.classList.remove('show'); }
    input.addEventListener('input', function () {
      var q = input.value.trim(), my = ++seq; clearTimeout(timer);
      if (q.length < 2) { list.classList.remove('show'); return; }
      timer = setTimeout(function () {
        list.innerHTML = '<div class="ac-loading">' + t('מחפש…', 'Searching…') + '</div>'; list.classList.add('show');
        placeSearch(q, true).then(function (res) {
          if (my !== seq) return;
          list.innerHTML = res.length ? res.map(function (r, i) { return '<div class="ac-item" data-i="' + i + '"><span class="ac-icon">📍</span><span><div class="ac-main">' + esc(r.main) + '</div><div class="ac-sub">' + esc(r.sub) + '</div></span></div>'; }).join('')
            : '<div class="ac-empty">' + t('לא נמצא במדינות הטיול. Enter יוסיף כטקסט חופשי.', 'Not found in the trip countries. Press Enter to add as free text.') + '</div>';
          list.querySelectorAll('[data-i]').forEach(function (el) { var pick = function (e) { e.preventDefault(); add(res[+el.dataset.i].main); }; el.addEventListener('pointerdown', pick); el.addEventListener('click', pick); });
        });
      }, 450);
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(input.value); } });
    input.addEventListener('blur', function () { setTimeout(function () { list.classList.remove('show'); }, 180); });
    window.tcRenderMustChips = renderChips;
    renderChips();
  }

  /* ================================================================
   * 4. Wizard: order Destination -> Dates -> Flights (times after dates)
   * ================================================================ */
  var PART_CLASS = { 1: '.v59-destination', 2: '.v59-dates', 3: '.v59-flights' };
  function isDomestic() { try { var c = plannerData().countries || []; return c.length > 0 && c.every(function (x) { return countryIso(x) === 'IL'; }); } catch (e) { return false; } }
  function syncDomestic() {
    var dom = isDomestic(), nav = document.querySelector('.step1-subnav span[data-part="3"]');
    if (nav) nav.style.display = dom ? 'none' : '';
    var sub = document.querySelector('.step1-subnav'); if (sub) sub.style.gridTemplateColumns = dom ? 'repeat(2,1fr)' : '';
    if (dom) ['plArrivalAirport', 'plDepartureAirport', 'plArrivalTime', 'plDepartureTime'].forEach(function (id) { var e = $(id); if (e && e.value) { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); } });
    return dom;
  }
  window.tcIsDomesticTrip = isDomestic;
  var goingBack = false;
  function showPart(part) {
    part = Math.max(1, Math.min(3, Number(part) || 1));
    if (part === 3 && !goingBack && syncDomestic()) { try { plannerStep1Part = 3; plannerShowStep(2); } catch (e) {} return; }
    try { plannerStep1Part = part; } catch (e) {}
    var step = document.querySelector('.planner-step[data-step="1"]');
    if (step) {
      Object.keys(PART_CLASS).forEach(function (k) { var el = step.querySelector(PART_CLASS[k]); if (el) el.classList.toggle('tc-part-active', +k === part); });
      step.querySelectorAll('.step1-subnav span').forEach(function (x) { x.classList.toggle('active', Number(x.dataset.part) === part); x.classList.toggle('done', Number(x.dataset.part) < part); });
    }
    document.body.dataset.tcStep1Part = String(part);
    try { plannerPrev.disabled = false; } catch (e) {}
    if (part === 3) renderFlightContext();
    requestAnimationFrame(function () { var pl = $('planner'); pl && pl.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }
  window.showPlannerStep1Part = showPart;
  try { showPlannerStep1Part = showPart; } catch (e) {}

  function fixSubnav() {
    var nav = document.querySelector('.step1-subnav'); if (!nav || nav.dataset.v170) return;
    nav.dataset.v170 = '1';
    var labels = { 1: t('יעד', 'Destination'), 2: t('תאריכים', 'Dates'), 3: t('טיסות ושעות', 'Flights & times') };
    nav.querySelectorAll('span[data-part]').forEach(function (s) {
      s.textContent = s.dataset.part + ' · ' + labels[s.dataset.part];
      s.setAttribute('role', 'button'); s.tabIndex = 0;
      s.addEventListener('click', function () {
        var target = +s.dataset.part, cur = 1; try { cur = plannerStep1Part; } catch (e) {}
        if (target < cur) showPart(target);
        else if (target > cur) { for (var p = cur; p < target; p++) if (!validatePart(p)) return; showPart(target); }
      });
    });
  }
  function renderFlightContext() {
    var sec = document.querySelector('.v59-flights'); if (!sec) return;
    var box = $('tcFlightContext');
    if (!box) { box = document.createElement('div'); box.id = 'tcFlightContext'; box.className = 'tc-context'; var title = sec.querySelector('.v59-topic-title'); (title || sec.firstChild) && (title ? title.insertAdjacentElement('afterend', box) : sec.prepend(box)); }
    var s = ($('plStart') || {}).value, e = ($('plEnd') || {}).value;
    box.innerHTML = s && e ? '🗓 ' + t('נחיתה ב־', 'Landing on ') + '<b>' + esc(weekday(s) + ' ' + niceDate(s)) + '</b>' + hebSpan(s) + ' · ' + t('המראה חזרה ב־', 'Return on ') + '<b>' + esc(weekday(e) + ' ' + niceDate(e)) + '</b>' + hebSpan(e) : '';
  }

  var softWarnAccepted = {};
  function validatePart(part) {
    var d; try { d = plannerData(); } catch (e) { return true; }
    if (part === 1) {
      if (!String(($('plTripName') || {}).value || '').trim()) { fieldError('plTripName', t('נא להזין שם לטיול.', 'Please enter a trip name.')); return false; }
      if (!d.country) { fieldError('plCountrySearch', t('נא לבחור מדינה מהרשימה.', 'Please choose a country from the list.')); return false; }
    }
    if (part === 2) {
      if (!d.start || !d.end) { toast(t('נא לבחור תאריך יציאה ותאריך חזרה.', 'Please choose departure and return dates.'), 'error'); openCalendar(); return false; }
      if (d.start < todayIso()) { toast(t('תאריך היציאה כבר עבר. בחרו תאריך עתידי.', 'The departure date is in the past.'), 'error'); openCalendar(); return false; }
      var a = isoDate(d.start), b = isoDate(d.end), diff = Math.round((b - a) / 86400000);
      if (!(diff > 0)) { toast(t('תאריך החזרה חייב להיות אחרי תאריך היציאה.', 'Return must be after departure.'), 'error'); openCalendar(); return false; }
      if (diff + 1 > 30) { window.tcAlert(t('אפשר לתכנן עד 30 ימים בטיול אחד. לטיול ארוך יותר פצלו אותו לשני טיולים.', 'Trips are limited to 30 days. Split longer journeys into two trips.')); openCalendar(); return false; }
      if (diff <= 1 && !softWarnAccepted.short) {
        window.tcConfirm(t('הטיול קצר מאוד (' + (diff + 1) + ' ימים). להמשיך?', 'This trip is very short (' + (diff + 1) + ' days). Continue?'), { okText: t('כן, להמשיך', 'Continue') })
          .then(function (ok) { if (ok) { softWarnAccepted.short = true; showPart(3); } });
        return false;
      }
    }
    if (part === 3) {
      if (isDomestic()) return true;
      if (d.arrivalAirport || d.departureAirport) {
        if (!d.arrivalTime || !d.departureTime) { fieldError(!d.arrivalTime ? 'plArrivalTime' : 'plDepartureTime', t('הזנתם טיסה — נא להזין שעת נחיתה ושעת המראה בחזרה.', 'Flights entered: landing and return takeoff times are required.')); return false; }
        try {
          var chk = airportCompatibility(d.destination, d.arrivalAirport, d.departureAirport || d.arrivalAirport);
          if (chk && chk.warn && !softWarnAccepted.airport) {
            window.tcConfirm(chk.message, { okText: t('להמשיך בכל זאת', 'Continue anyway') }).then(function (ok) { if (ok) { softWarnAccepted.airport = true; try { plannerGoNext(); } catch (e) {} } });
            return false;
          }
        } catch (e) {}
      }
    }
    return true;
  }
  function fieldError(id, msg) { var el = $(id); toast(msg, 'error'); if (el) { el.classList.add('tc-invalid'); el.focus && el.focus(); setTimeout(function () { el.classList.remove('tc-invalid'); }, 2500); } }
  function openCalendar() { var b = $('plStartDisplay'); b && b.click(); }
  window.validatePlannerStep1Part = validatePart;
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#plannerPrev')) return;
    var st = 0; try { st = planner.step; } catch (x) {}
    if (st === 2 && isDomestic()) { e.preventDefault(); e.stopImmediatePropagation(); try { plannerStep1Part = 2; } catch (x) {} goingBack = true; try { plannerShowStep(1); } catch (x) {} goingBack = false; showPart(2); }
  }, true);
  try { validatePlannerStep1Part = validatePart; } catch (e) {}
  var origValidateStep = window.validatePlannerStep;
  window.validatePlannerStep = function () {
    var st = 1; try { st = planner.step; } catch (e) {}
    if (st === 1) return validatePart(1) && validatePart(2) && validatePart(3);
    if (st === 2) {
      var bands = travelerBands();
      if ((bands.adult || 0) + (bands.young || 0) < 1) { toast(t('בטיול חייב להיות לפחות מבוגר אחד (21+).', 'At least one adult (21+) is required.'), 'error'); return false; }
    }
    return origValidateStep ? origValidateStep() : true;
  };
  try { validatePlannerStep = window.validatePlannerStep; } catch (e) {}

  /* ---- travellers: never below one adult ---- */
  function travelerBands() { try { return JSON.parse(($('plAgesBands') || {}).value || '{}'); } catch (e) { return {}; } }
  document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#countryChoices')) setTimeout(syncDomestic, 0); }, true);
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#travelerBands .traveler-band button'); if (!btn) return;
    setTimeout(function () {
      var b = travelerBands();
      if ((b.adult || 0) + (b.young || 0) < 1) {
        var card = document.querySelector('#travelerBands .traveler-band[data-band="adult"]'), out = card && card.querySelector('output');
        if (out) { out.textContent = '1'; try { syncTravelerBands(); } catch (x) {} }
        toast(t('חייב להיות לפחות מבוגר אחד בטיול.', 'At least one adult is required.'), 'error');
      }
    }, 0);
  }, true);

  /* ---- calendar: block past dates ---- */
  function markPastDays() {
    var grid = $('tcCalendarGrid'); if (!grid) return;
    var today = todayIso();
    grid.querySelectorAll('[data-date]').forEach(function (b) { var past = b.dataset.date < today; b.classList.toggle('tc-past', past); b.disabled = past; b.setAttribute('aria-disabled', past ? 'true' : 'false'); if (HE && !b.dataset.heb) { b.dataset.heb = '1'; var h = hebrewDate(b.dataset.date); if (h) b.title = h; } });
  }
  function watchCalendar() {
    var grid = $('tcCalendarGrid'); if (!grid || grid.dataset.v170) return;
    grid.dataset.v170 = '1';
    new MutationObserver(markPastDays).observe(grid, { childList: true });
    grid.addEventListener('click', function (e) { var b = e.target.closest('[data-date]'); if (b && b.dataset.date < todayIso()) { e.stopImmediatePropagation(); e.preventDefault(); toast(t('אי אפשר לבחור תאריך שעבר.', 'Past dates cannot be selected.'), 'error'); } }, true);
    markPastDays();
  }
  function decorateDateDisplays() {
    ['plStart', 'plEnd'].forEach(function (id) {
      var input = $(id), disp = $(id + 'Display'); if (!input || !disp) return;
      var holder = disp.parentElement, tag = holder.querySelector('.tc-hebdate-line');
      if (!tag) { tag = document.createElement('div'); tag.className = 'tc-hebdate-line'; disp.insertAdjacentElement('afterend', tag); }
      tag.textContent = HE && input.value ? (weekday(input.value) + ' · ' + hebrewDate(input.value)) : (input.value ? weekday(input.value) : '');
    });
  }

  /* ================================================================
   * 5. Summary before build: everything the AI receives, in plain language
   * ================================================================ */
  var VALUE_LABELS = {
    balanced: t('מאוזן', 'Balanced'), relaxed: t('רגוע', 'Relaxed'), intense: t('אינטנסיבי', 'Intense'), packed: t('עמוס', 'Packed'),
    car: t('רכב', 'Car'), train: t('רכבת', 'Train'), walking: t('הליכה', 'Walking'), public: t('תחבורה ציבורית', 'Public transport'), transit: t('תחבורה ציבורית', 'Public transport'),
    flights: t('טיסות פנימיות', 'Domestic flights'), domestic_flights: t('טיסות פנימיות', 'Domestic flights'), taxi: t('מונית / הסעה', 'Taxi / transfer'), ferry: t('מעבורת / שייט', 'Ferry / boat'),
    smart: t('TripCraft יבחר חכם', 'Smart choice by TripCraft'), recommend: t('TripCraft יציע ויתכנן', 'TripCraft recommends'), existing: t('יש לי מקומות לינה', 'I already have lodging'), later: t('אחליט אחר כך', 'Decide later'), skip: t('ללא תכנון לינה', 'No lodging planning'),
    full: t('יום מלא', 'Full day'), any: t('ללא הגבלה', 'No limit')
  };
  function label(v) { if (Array.isArray(v)) return v.map(label).join(', '); var s = String(v == null ? '' : v).trim(); return VALUE_LABELS[s] || VALUE_LABELS[s.toLowerCase()] || s; }
  function choiceLabels(containerId) {
    return Array.prototype.map.call(document.querySelectorAll('#' + containerId + ' input:checked'), function (i) {
      var l = i.closest('label'); var txt = l ? l.textContent.replace(/[✓✔]/g, '').trim() : i.value; return txt || label(i.value);
    });
  }
  function selectText(id) { var s = $(id); if (!s) return ''; if (s.tagName === 'SELECT') { var o = s.options[s.selectedIndex]; return o ? o.textContent.trim() : ''; } return s.value; }
  function fullProfile() {
    var d = {}; try { d = plannerData(); } catch (e) {}
    var b = travelerBands();
    return {
      trip_name: String(($('plTripName') || {}).value || '').trim(),
      countries: d.countries || [d.country], region: d.region || d.destination || '',
      start: d.start, end: d.end,
      flights: { arrival_airport: d.arrivalAirport || '', arrival_time: d.arrivalTime || '', departure_airport: d.departureAirport || d.arrivalAirport || '', departure_time: d.departureTime || '' },
      group_type: d.group, travelers_by_age: b, total_travelers: d.people, children: d.children,
      transport: choiceLabels('transportChoices'), day_length: selectText('plDayLength'), pace: selectText('plPace') || label(d.pace),
      comfortable_walking: selectText('plWalk'), max_daily_drive: selectText('plDrive'),
      interests: choiceLabels('interestChoices'), priorities: choiceLabels('tripPriorityChoices'), avoid: choiceLabels('avoidChoices'),
      must_see: String(d.must || '').split(/\s*,\s*/).filter(Boolean), constraints_free_text: d.free || '',
      ai_notes: aiNotesValue(),
      lodging: {
        mode: label((document.querySelector('input[name=plLodgingMode]:checked') || {}).value || ''),
        types: choiceLabels('lodgingTypeChoices'), price_level: choiceLabels('lodgingBudgetChoices'), must_have: choiceLabels('lodgingFilterChoices'),
        hotel_stars: choiceLabels('hotelStarChoices'), style: selectText('plLodgingStyle'), include_in_budget: selectText('plIncludeHotels'),
        rooms: (($('plRooms') || {}).value || ''), max_detour: selectText('plLodgingDetour'), priority: selectText('plLodgingPriority'),
        existing: (($('plExistingLodging') || {}).value || '')
      }
    };
  }
  window.tcFullProfile = fullProfile;
  function summaryRow(k, v) { if (v == null || v === '' || (Array.isArray(v) && !v.length)) return ''; return '<div class="tc-sum-row"><span>' + esc(k) + '</span><b>' + esc(Array.isArray(v) ? v.join(' · ') : v) + '</b></div>'; }
  function renderSummary() {
    var box = $('plannerSummary'); if (!box) return;
    var p = fullProfile(), b = p.travelers_by_age || {}, bandNames = { adult: t('מבוגרים', 'Adults'), young: t('צעירים', 'Young adults'), teen: t('נוער', 'Teens'), kid: t('ילדים', 'Kids'), baby: t('תינוקות', 'Babies'), dogs: t('כלבים', 'Dogs') };
    var trav = Object.keys(b).filter(function (k) { return b[k] > 0; }).map(function (k) { return b[k] + ' ' + bandNames[k]; }).join(' · ');
    var nights = p.start && p.end ? Math.round((isoDate(p.end) - isoDate(p.start)) / 86400000) : 0;
    var fl = isDomestic() ? t('טיול בארץ — ללא טיסות', 'Domestic trip — no flights') : p.flights.arrival_airport ? (p.flights.arrival_airport + ' · ' + p.flights.arrival_time + '  →  ' + p.flights.departure_airport + ' · ' + p.flights.departure_time) : t('ללא טיסות', 'No flights');
    var html = '<div class="tc-sum-hero"><div><small>' + t('שם הטיול', 'Trip') + '</small><h3>' + esc(p.trip_name || '—') + '</h3></div><div class="tc-sum-dates">' + esc(niceDate(p.start)) + ' – ' + esc(niceDate(p.end)) + '<small>' + (nights + 1) + ' ' + t('ימים', 'days') + ' · ' + nights + ' ' + t('לילות', 'nights') + '</small>' + (HE && p.start ? '<span class="tc-hebdate">' + esc(hebrewDate(p.start)) + ' – ' + esc(hebrewDate(p.end)) + '</span>' : '') + '</div></div>';
    html += '<div class="tc-sum-grid">';
    var cLabels = (p.countries || []).filter(Boolean).map(function (c) { var iso = countryIso(c); return iso ? flag(iso) + ' ' + countryLabel(iso) : c; });
    var regionLbl = p.region && (p.countries || []).indexOf(p.region) < 0 ? p.region : t('כל המדינה', 'Whole country');
    html += '<section><h4>🌍 ' + t('יעד וטיסות', 'Destination & flights') + '</h4>' + summaryRow(t('מדינות', 'Countries'), cLabels) + summaryRow(t('אזור', 'Region'), regionLbl) + summaryRow(t('טיסות', 'Flights'), fl) + '</section>';
    html += '<section><h4>👥 ' + t('מי נוסע', 'Travellers') + '</h4>' + summaryRow(t('הרכב', 'Group'), label(p.group_type)) + summaryRow(t('נוסעים', 'Travellers'), trav) + '</section>';
    html += '<section><h4>🧭 ' + t('סגנון', 'Style') + '</h4>' + summaryRow(t('תחבורה', 'Transport'), p.transport) + summaryRow(t('אורך יום', 'Day length'), p.day_length) + summaryRow(t('קצב', 'Pace'), p.pace) + summaryRow(t('הליכה יומית', 'Daily walking'), p.comfortable_walking) + summaryRow(t('נהיגה יומית', 'Daily driving'), p.max_daily_drive) + summaryRow(t('תחומי עניין', 'Interests'), p.interests) + '</section>';
    html += '<section><h4>⭐ ' + t('העדפות', 'Preferences') + '</h4>' + summaryRow(t('חשוב לנו', 'Important'), p.priorities) + summaryRow(t('להימנע', 'Avoid'), p.avoid) + summaryRow(t('מקומות חובה', 'Must see'), p.must_see) + summaryRow(t('אילוצים', 'Constraints'), p.constraints_free_text) + '</section>';
    var L = p.lodging;
    html += '<section><h4>🏨 ' + t('לינה', 'Lodging') + '</h4>' + summaryRow(t('מצב', 'Mode'), L.mode) + summaryRow(t('סוג', 'Type'), L.types) + summaryRow(t('רמת מחיר', 'Price level'), L.price_level) + summaryRow(t('דרגת מלון', 'Hotel level'), L.hotel_stars) + summaryRow(t('חשוב במקום', 'Must have'), L.must_have) + summaryRow(t('חדרים', 'Rooms'), L.rooms) + summaryRow(t('סטייה מהמסלול', 'Max detour'), L.max_detour) + summaryRow(t('מקומות קיימים', 'Existing lodging'), L.existing) + '</section>';
    html += '</div><div class="tc-sum-note">✓ ' + t('ה-AI מקבל את כל הבחירות האלה כהנחיות מחייבות, ומציע 3 מלונות לכל אזור לינה לפי מה שבחרתם.', 'The AI receives all of these as binding instructions and suggests 3 hotels per stay area.') + '</div>';
    box.innerHTML = html;
  }
  window.renderPlannerSummary = renderSummary;
  try { renderPlannerSummary = renderSummary; } catch (e) {}

  /* ================================================================
   * 6. AI requests: send the full profile + strict instructions; progress phases
   * ================================================================ */
  function strictInstructions(p) {
    var dom = false; try { dom = isDomestic(); } catch (e) {}
    return (dom ? ['This is a DOMESTIC trip inside Israel for travelers who live in Israel: there are NO flights and NO airports. Day 1 starts from home in the morning and the last day ends back home; plan by car or the chosen transport, with realistic Israeli driving times, Shabbat/holiday opening hours and kosher-friendly options when relevant.'] : []).concat([
      'Follow every user selection exactly. Do not add countries, regions or activities the user excluded.',
      'Use ONLY the transport modes listed in transport. Respect max_daily_drive, comfortable_walking, pace and day_length on every day.',
      'Every item in must_see must appear in the itinerary. Never include anything matching avoid.',
      'If flights are given: day 1 starts after arrival_time at arrival_airport (allow immigration + car pickup); the last day ends at departure_airport at least 3 hours before departure_time.',
      'Lodging: respect lodging.mode, types, price_level, hotel_stars and must_have. For each overnight area recommend exactly 3 real, currently operating hotels that match these filters.',
      'ai_notes are the traveler\'s own notes, written in their words. They are BINDING: apply every single one of them in the plan. If one cannot be applied, say exactly why in important_notes.',
      'If a selection is impossible, keep the closest valid option and explain it in a note instead of silently ignoring it.'
    ]);
  }
  function wrapInvoke() {
    var sb = null; try { sb = typeof tcSupabase === 'function' ? tcSupabase() : null; } catch (e) {}
    if (!sb || !sb.functions) return;
    // supabase-js creates a new FunctionsClient on every access of sb.functions,
    // so the enrichment must live on the prototype, not on one instance.
    var proto = Object.getPrototypeOf(sb.functions);
    if (!proto || proto.__v170) return;
    var protoInvoke = proto.invoke;
    proto.__v170 = true;
    proto.invoke = function (fn, opts) {
      var orig = protoInvoke.bind(this);
      try {
        var body = opts && opts.body;
        if (body && typeof body === 'object' && body.action) {
          var prof = fullProfile();
          var isBuild = body.action === 'build_trip' || body.action === 'build_trip_async' || body.action === 'trip_skeleton';
          if (body.trip && typeof body.trip === 'object' && !isBuild && !body.trip.preferences) {
            // edits / rain / verify / hotels of an existing trip: use the preferences saved with THAT trip
            var dd = draft(), pp = dd && dd.plannerProfile;
            if (pp) { body.trip.preferences = Object.assign({}, pp, { ai_notes: pp.aiNotes || '' }); body.trip.ai_notes = pp.aiNotes || ''; body.trip.strict_instructions = strictInstructions(pp); }
          }
          if (body.trip && typeof body.trip === 'object' && isBuild && document.querySelector('.planner-step[data-step="1"]')) {
            {
              body.trip.preferences = prof;
              body.trip.strict_instructions = strictInstructions(prof);
              body.trip.hotel_recommendations_per_area = 3;
              if (prof.must_see.length && !body.trip.part) body.trip.must = prof.must_see.join(', ');
              try { if (isDomestic()) { body.trip.domestic = true; body.trip.arrival_airport = ''; body.trip.departure_airport = ''; body.trip.arrival_time = ''; body.trip.departure_time = ''; } } catch (e) {}
              if (prof.ai_notes) { body.trip.ai_notes = prof.ai_notes; body.trip.notes = [body.trip.notes, 'הערות הנוסע (מחייב): ' + prof.ai_notes].filter(Boolean).join('\n'); }
            }
          }
          if (body.action === 'build_trip') phase(4, null, 82);
          if (body.action === 'verify_trip') phase(86, t('בודקים ומאמתים את המסלול', 'Checking and verifying the itinerary'), 94);
        }
      } catch (e) { console.warn('V170 invoke enrich failed', e); }
      return orig(fn, opts).then(function (res) {
        try { if (opts && opts.body && opts.body.action === 'verify_trip') phase(95, t('שומרים את הטיול בחשבון שלכם', 'Saving the trip to your account'), 99); } catch (e) {}
        return res;
      });
    };
  }

  // progress overlay that follows the real phases and never freezes
  var prog = { cur: 0, cap: 82, msg: null, at: 0, timer: 0 };
  var STEPS = [[0, t('מנתחים את ההעדפות שלכם', 'Analysing your preferences')], [10, t('מתאימים את הקצב', 'Matching the pace')], [22, t('בונים חלוקת ימים', 'Building the days')], [36, t('בודקים מרחקים', 'Checking distances')], [50, t('בוחרים אזורי לינה ומלונות', 'Choosing stay areas and hotels')], [64, t('מכינים מסלול מפורט', 'Preparing the detailed plan')]];
  function progRender() {
    var b = $('tripBuildBar'), p = $('tripBuildPct'), s = $('tripBuildStatus'); if (!b) return;
    var v = Math.min(99, Math.floor(prog.cur)); b.style.width = v + '%'; if (p) p.textContent = v + '%';
    var m = prog.msg; if (!m) { m = STEPS[0][1]; STEPS.forEach(function (x) { if (prog.cur >= x[0]) m = x[1]; }); }
    if (Date.now() - prog.at > 75000) m += ' · ' + t('זה לוקח קצת יותר מהרגיל, ממשיכים לעבוד', 'taking a little longer than usual');
    if (s) s.textContent = m;
  }
  function phase(v, m, cap) { prog.cur = Math.max(prog.cur, v); if (cap) prog.cap = cap; prog.msg = m || null; prog.at = Date.now(); progRender(); }
  window.tcProgPhase = phase;
  window.runTripBuildProgress = function () {
    var o = $('tripBuildOverlay'); if (!o) return Promise.resolve();
    clearInterval(prog.timer); prog.cur = 3; prog.cap = 82; prog.msg = null; prog.at = Date.now();
    o.classList.add('show'); o.setAttribute('aria-hidden', 'false'); progRender();
    prog.timer = setInterval(function () { if (!o.classList.contains('show')) { clearInterval(prog.timer); return; } prog.cur = Math.min(prog.cap, prog.cur + Math.max(0.03, (prog.cap - prog.cur) * 0.012)); progRender(); }, 400);
    return Promise.resolve();
  };
  try { runTripBuildProgress = window.runTripBuildProgress; } catch (e) {}
  window.tcV163FinishProgress = function () {
    clearInterval(prog.timer);
    var o = $('tripBuildOverlay'), b = $('tripBuildBar'), p = $('tripBuildPct'), s = $('tripBuildStatus'); if (!o) return Promise.resolve();
    if (b) b.style.width = '100%'; if (p) p.textContent = '100%'; if (s) s.textContent = t('הטיול נשמר ואומת', 'Trip saved and verified');
    return new Promise(function (r) { setTimeout(function () { o.classList.remove('show'); o.setAttribute('aria-hidden', 'true'); r(); }, 300); });
  };

  /* ================================================================
   * 7. Accurate navigation: geocode each stop inside the trip countries
   * ================================================================ */
  var GEO_KEY = 'tc_geo_v177', geoCache = lsGet(GEO_KEY, {});
  try { localStorage.removeItem('tc_geo_v170'); } catch (e) {}
  // Countries of the trip that is OPEN on the result page (not the new-trip wizard)
  function resultCountryIsos() { var o = draftCountryIsos(); return o.length ? o : tripCountryIsos(); }
  function draftCountryIsos() {
    var dr = draft(), names = [];
    if (dr) { var pp = dr.plannerProfile || {}; names = [].concat(pp.countries || [], pp.country || [], dr.country || [], (dr.aiItinerary || {}).country || []); }
    var out = [];
    names.forEach(function (n) {
      String(n || '').split(/\s*[,/&·]\s*|\s+and\s+/i).forEach(function (part) {
        part = part.trim(); if (!part) return;
        var iso = countryIso(part) || (/^ו/.test(part) ? countryIso(part.slice(1)) : '');
        if (!iso) part.split(/\s+ו/).forEach(function (q) { var i2 = countryIso(q.trim()); if (i2 && out.indexOf(i2) < 0) out.push(i2); });
        else if (out.indexOf(iso) < 0) out.push(iso);
      });
    });
    return out;
  }
  // Rough bounding box per country, built from its airports (+2° margin)
  var bboxCache = {};
  function countryBox(iso) {
    if (bboxCache[iso] !== undefined) return bboxCache[iso];
    var b = null;
    (window.TC_AIRPORTS_FULL || []).forEach(function (a) { if (a[3] !== iso) return; var la = +a[4], lo = +a[5]; if (!b) b = [la, la, lo, lo]; else { b[0] = Math.min(b[0], la); b[1] = Math.max(b[1], la); b[2] = Math.min(b[2], lo); b[3] = Math.max(b[3], lo); } });
    return (bboxCache[iso] = b ? [b[0] - 2, b[1] + 2, b[2] - 2, b[3] + 2] : null);
  }
  function inTripCountries(c, isos) {
    if (!c || !isos || !isos.length) return true;
    var known = false;
    for (var i = 0; i < isos.length; i++) { var b = countryBox(isos[i]); if (!b) continue; known = true; if (c.lat >= b[0] && c.lat <= b[1] && c.lon >= b[2] && c.lon <= b[3]) return true; }
    return !known;
  }
  var VAGUE = /^(באירוח|במסעדה|האזור|אזור הלינה|מקום הלינה|הבסיס|בסיס|המלון|לינה|ארוחת|nearby|the area|your hotel|hotel|accommodation)/i;
  function stopQuery(st) { return String(st.place || st.location || st.name || '').replace(/\s*\(([A-Z]{3})\)\s*$/, ' $1').trim(); }
  function geocodeStop(st) {
    var isos = resultCountryIsos();
    if (st && st.lat && st.lon) {
      var have = { lat: +st.lat, lon: +st.lon, exact: st.geoExact !== false };
      if (inTripCountries(have, isos)) return Promise.resolve(have);
      delete st.lat; delete st.lon; delete st.geoExact; // stored point is outside the trip's countries – find it again
    }
    var q = stopQuery(st || {}); if (!q || VAGUE.test(q)) return Promise.resolve(null);
    var iata = q.match(/\b([A-Z]{3})$/), ap = iata && window.tcAirportByCode(iata[1]);
    if (ap) { st.lat = ap[4]; st.lon = ap[5]; st.geoExact = true; return Promise.resolve({ lat: ap[4], lon: ap[5], exact: true }); }
    if (!isos.length) return Promise.resolve(null); // never search the whole world – Waze/Maps get the text instead
    var mq = String(st.mapQuery || '').trim();
    var key = isos.join(',') + '|' + norm(mq || q);
    if (geoCache[key] !== undefined && inTripCountries(geoCache[key], isos)) { var c = geoCache[key]; if (c) { st.lat = c.lat; st.lon = c.lon; st.geoExact = true; } return Promise.resolve(c); }
    var head = q.split(/\s*[,،;|(–—]\s*|\s+-\s+|\s+ליד\s+|\s+near\s+/i)[0].trim();
    return (mq ? geoLookup(mq, isos) : Promise.resolve(null)).then(function (c) { return c || geoLookup(q, isos); }).then(function (c) {
      if (c || !head || head === q || head.length < 2 || VAGUE.test(head)) return c;
      return geoLookup(head, isos); // e.g. "ספאטה, ליד נמל התעופה" → "ספאטה"
    }).then(function (c) {
      geoCache[key] = c; lsSet(GEO_KEY, geoCache);
      if (c) { st.lat = c.lat; st.lon = c.lon; st.geoExact = true; }
      return c;
    }).catch(function () { return null; });
  }
  function geoLookup(q, isos) {
    return nominatimSearch(q, isos, 1).then(function (rows) {
      var r = rows && rows[0];
      if (r) return { lat: +(+r.lat).toFixed(6), lon: +(+r.lon).toFixed(6), exact: true };
      if (q.split(/\s+/).length > 4) return null;
      return wikiSearch(q).then(function (w) {
        var nq = norm(q).replace(/[^\p{L}\p{N} ]/gu, ''), hit = w.find(function (x) { var nt = norm(x.main).replace(/\s*\(.*\)$/, '').replace(/[^\p{L}\p{N} ]/gu, ''); return nt && (nt === nq || (nt.length > 3 && nq.indexOf(nt) === 0 && nq.length - nt.length < 12)); });
        return hit ? { lat: +(+hit.lat).toFixed(6), lon: +(+hit.lon).toFixed(6), exact: true } : null;
      });
    }).then(function (c) { return c && inTripCountries(c, isos) ? c : null; }).catch(function () { return null; });
  }
  function wazeUrl(c, q) { return c ? 'https://www.waze.com/ul?ll=' + c.lat + '%2C' + c.lon + '&navigate=yes&zoom=17' : 'https://www.waze.com/ul?q=' + encodeURIComponent(q) + '&navigate=yes'; }
  function gmapsUrl(c, q) { return c ? 'https://www.google.com/maps/search/?api=1&query=' + c.lat + '%2C' + c.lon : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function dayRouteUrl(day) {
    var pts = (day.stops || []).map(function (s) { return s.lat && s.lon ? s.lat + ',' + s.lon : (s.mapQuery || stopQuery(s)); }).filter(Boolean);
    if (pts.length < 2) return pts.length ? gmapsUrl(null, pts[0]) : '';
    return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + encodeURIComponent(pts[0]) + '&destination=' + encodeURIComponent(pts[pts.length - 1]) + (pts.length > 2 ? '&waypoints=' + pts.slice(1, -1).map(encodeURIComponent).join('%7C') : '');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-tc-nav]'); if (!a) return;
    e.preventDefault();
    var d = draft(), di = +a.dataset.day, si = +a.dataset.stop, st = d && d.days[di] && d.days[di].stops[si]; if (!st) return;
    var kind = a.dataset.tcNav, w = window.open('about:blank', '_blank');
    geocodeStop(st).then(function (c) {
      if (!c) toast(t('לא נמצא מיקום מדויק למקום הזה — פותח חיפוש לפי שם.', 'No exact location found; opening a name search.'), 'error');
      var q = String(st.mapQuery || '').trim() || stopQuery(st), iso = resultCountryIsos()[0], cn = iso ? countryLabel(iso) : '';
      if (!c && !st.mapQuery && cn && q.indexOf(cn) < 0) q += ', ' + cn; // text search always carries the trip's country
      var url = kind === 'waze' ? wazeUrl(c, q) : gmapsUrl(c, q);
      if (w) w.location.href = url; else location.href = url;
      if (c) scheduleSave();
    });
  });
  function geocodeDay(di) {
    var d = draft(); if (!d || !d.days[di]) return;
    var stops = d.days[di].stops || [], changed = false;
    stops.reduce(function (p, st, si) {
      return p.then(function () {
        var had = !!(st.lat && st.lon);
        return geocodeStop(st).then(function (c) {
          if (c && !had) changed = true;
          var card = document.querySelector('.tc-stop[data-stop="' + si + '"]');
          if (card) card.classList.toggle('tc-geo-ok', !!c), card.classList.toggle('tc-geo-none', !c);
        });
      });
    }, Promise.resolve()).then(function () { if (changed) scheduleSave(); });
  }
  var saveTimer = 0;
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { try { window.tcSaveCurrentTrip && window.tcSaveCurrentTrip(false); } catch (e) {} }, 1500); }

  /* ================================================================
   * 8. Day details: clean layout, buttons that never overflow
   * ================================================================ */
  function money(n) { n = Number(n || 0); return n ? '≈ ' + n.toLocaleString(HE ? 'he-IL' : 'en-US') + ' ₪' : ''; }
  function renderDay() {
    var d = draft(), di = -1; try { di = plannerEditingDay; } catch (e) {}
    if (!d || di < 0 || !d.days[di]) return;
    var day = d.days[di], modal = $('plannerDayModal'); if (!modal) return;
    modal.classList.add('tc-v170-day');
    var title = $('plannerDayModalTitle');
    if (title) title.innerHTML = '<span class="tc-day-badge">' + t('יום', 'Day') + ' ' + (di + 1) + '</span> ' + esc(weekday(day.date)) + ' · ' + esc(niceDate(day.date)) + hebSpan(day.date);
    var sub = title && title.nextElementSibling; if (sub && !sub.dataset.v170) { sub.dataset.v170 = '1'; sub.className = 'tc-day-sub'; sub.textContent = t('פירוט היום: מפה, תחנות, ניווט ועריכה', 'Day details: map, stops, navigation and edits'); }
    var route = dayRouteUrl(day);
    var rb = $('plannerDayRouteBox');
    if (rb) rb.innerHTML = '<div class="tc-day-summary">' + (day.summary ? '<p>' + esc(day.summary) + '</p>' : '') + (day.routeSummary ? '<p class="tc-muted">🧭 ' + esc(day.routeSummary) + '</p>' : '') +
      (day.lodging ? '<div class="tc-day-lodging">🏨 <b>' + t('לינה', 'Stay') + ':</b> ' + esc(day.lodging) + '</div>' : '') + '</div>' +
      '<div class="tc-actions">' + (route ? '<a class="tc-btn tc-btn-soft" target="_blank" rel="noopener" href="' + esc(route) + '">🗺 ' + t('מסלול היום ב-Google Maps', 'Day route in Google Maps') + '</a>' : '') +
      (day.lodging ? '<button type="button" class="tc-btn tc-btn-soft" data-tc-hotels-day="' + di + '">🏨 ' + t('מלונות לאזור', 'Hotels for this area') + '</button>' : '') + '</div>' + checksHtml(di);
    var box = $('plannerDayStopsEditor');
    if (box) box.innerHTML = (day.stops || []).length ? '<ol class="tc-timeline">' + day.stops.map(function (st, si) {
      var meta = [];
      if (st.durationMinutes) meta.push('⏱ ' + st.durationMinutes + ' ' + t('דק׳', 'min'));
      if (st.driveMinutes) meta.push('🚗 ' + st.driveMinutes + ' ' + t('דק׳ נסיעה', 'min drive'));
      if (st.estimatedCost) meta.push('💰 ' + money(st.estimatedCost));
      var vague = VAGUE.test(stopQuery(st)), geo = st.lat && st.lon;
      return '<li class="tc-stop' + (geo ? ' tc-geo-ok' : '') + '" data-stop="' + si + '">' +
        '<div class="tc-stop-time">' + esc(st.time || '—') + '</div>' +
        '<div class="tc-stop-body"><h4>' + esc(st.name || st.place) + '</h4>' +
        (st.place && st.place !== st.name ? '<div class="tc-stop-place">📍 ' + esc(st.place) + '</div>' : '') +
        (st.what && st.what !== st.name ? '<p>' + esc(st.what) + '</p>' : '') +
        (meta.length ? '<div class="tc-meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
        (st.notes ? '<div class="tc-note">ℹ️ ' + esc(st.notes) + '</div>' : '') +
        '<div class="tc-stop-actions">' +
        (vague ? '<span class="tc-geo-hint">' + t('מיקום כללי — בחרו מקום מדויק דרך "עדכן"', 'General area — set an exact place via Edit') + '</span>' :
          '<span class="tc-geo-hint tc-geo-fail">' + t('לא נמצא מיקום מדויק — עדכנו את המקום כדי לנווט', 'No exact location — edit the place to navigate') + '</span><a href="#" class="tc-btn tc-btn-waze" data-tc-nav="waze" data-day="' + di + '" data-stop="' + si + '">Waze</a><a href="#" class="tc-btn tc-btn-soft" data-tc-nav="gmaps" data-day="' + di + '" data-stop="' + si + '">Google Maps</a>') +
        '<button type="button" class="tc-btn tc-btn-ghost" data-tc-edit-stop="' + si + '">✏️ ' + t('עדכן', 'Edit') + '</button>' +
        '<button type="button" class="tc-btn tc-btn-ghost tc-danger-text" data-tc-remove-stop="' + si + '">🗑 ' + t('הסר', 'Remove') + '</button>' +
        '</div></div></li>';
    }).join('') + '</ol>' : '<div class="tc-empty">' + t('אין עדיין תחנות ביום הזה.', 'No stops yet.') + '</div>';
    var inp = $('plannerDayChatInput'); if (inp) inp.placeholder = t('למשל: להוסיף שייט באגם ולוותר על המוזיאון', 'e.g. add a lake cruise and skip the museum');
    geocodeDay(di);
  }
  function checksHtml(di) {
    var d = draft(), v = d && d.verification, checks = v && Array.isArray(v.checks) ? v.checks.filter(function (c) { return Number(c.day_number) === di + 1; }) : [];
    if (!checks.length) return '';
    return '<details class="tc-checks"><summary>✓ TripCheck · ' + checks.length + ' ' + t('בדיקות ליום הזה', 'checks for this day') + '</summary>' + checks.map(function (c) { return '<div class="tc-check"><b>' + esc(c.item || '') + '</b><div>' + esc(c.finding || '') + '</div>' + (c.recommended_change ? '<div class="tc-muted">' + t('המלצה', 'Tip') + ': ' + esc(c.recommended_change) + '</div>' : '') + '</div>'; }).join('') + '</details>';
  }
  window.plannerRenderDayEditor = renderDay;
  try { plannerRenderDayEditor = renderDay; } catch (e) {}
  var origOpenDay = window.tcV140OpenDay;
  window.tcV140OpenDay = function (i) {
    if (origOpenDay) origOpenDay(i); else try { plannerEditDay(i); } catch (e) {}
    try { plannerEditingDay = Number(i); } catch (e) {}
    renderDay();
    document.body.classList.add('tc-modal-open');
  };
  document.addEventListener('click', function (e) {
    if (e.target.closest('#plannerDayModalClose')) document.body.classList.remove('tc-modal-open');
    var ed = e.target.closest('[data-tc-edit-stop]'); if (ed) { e.preventDefault(); editStop(+ed.dataset.tcEditStop); }
    var rm = e.target.closest('[data-tc-remove-stop]'); if (rm) { e.preventDefault(); removeStop(+rm.dataset.tcRemoveStop); }
  });
  function curDay() { var d = draft(), di = -1; try { di = plannerEditingDay; } catch (e) {} return d && d.days[di] ? d.days[di] : null; }
  function removeStop(si) {
    var day = curDay(); if (!day || !day.stops[si]) return;
    window.tcConfirm(t('להסיר את "' + (day.stops[si].name || day.stops[si].place) + '" מהיום?', 'Remove "' + (day.stops[si].name || day.stops[si].place) + '" from this day?'), { okText: t('הסר', 'Remove'), danger: true }).then(function (ok) {
      if (!ok) return; day.stops.splice(si, 1); afterManualEdit(t('התחנה הוסרה', 'Stop removed'));
    });
  }
  function editStop(si) {
    var day = curDay(), st = day && day.stops[si]; if (!st) return;
    dialog({ title: t('עדכון תחנה', 'Edit stop'), okText: t('שמור', 'Save'), fields: [
      { label: t('שם', 'Name'), value: st.name || '' }, { label: t('מקום מדויק (לניווט)', 'Exact place (for navigation)'), value: st.place || '' },
      { label: t('שעה', 'Time'), value: st.time || '', type: 'time' }, { label: t('תיאור', 'Description'), value: st.what || '', multiline: true }] })
      .then(function (v) {
        if (!v) return;
        var placeChanged = v[1].trim() !== (st.place || '');
        var oldPlace = st.place;
        st.name = v[0].trim() || st.name; st.place = v[1].trim() || st.place;
        if (st.place !== oldPlace) { delete st.mapQuery; delete st.lat; delete st.lon; delete st.geoExact; } st.time = v[2]; st.what = v[3].trim();
        if (placeChanged) { delete st.lat; delete st.lon; delete st.geoExact; }
        day.stops.sort(function (a, b) { return String(a.time || '99').localeCompare(String(b.time || '99')); });
        afterManualEdit(t('התחנה עודכנה', 'Stop updated'));
      });
  }
  window.plannerRemoveStop = removeStop; window.plannerEditStop = editStop;
  try { plannerRemoveStop = removeStop; plannerEditStop = editStop; } catch (e) {}
  function afterManualEdit(msg) {
    renderDay(); try { renderPlannerDraft(); } catch (e) {}
    Promise.resolve(window.tcSaveCurrentTrip ? window.tcSaveCurrentTrip(false) : true).then(function (ok) { toast(ok === false ? t('השינוי לא נשמר — נסו שוב', 'Not saved — try again') : msg + ' ✓', ok === false ? 'error' : 'ok'); });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#plannerApplyDayTitle')) return;
    setTimeout(function () { renderDay(); Promise.resolve(window.tcSaveCurrentTrip && window.tcSaveCurrentTrip(false)).then(function () { toast(t('הכותרת נשמרה ✓', 'Title saved ✓')); }); }, 50);
  });

  /* ================================================================
   * 9. Trip result page: dates, photos, hotels, save flow
   * ================================================================ */
  var THEMES = [['🏔', /הר|אלפ|פסג|רכבל|mountain|alp|peak/i], ['🌊', /אגם|ים|חוף|נהר|lake|sea|beach|river|coast/i], ['🍷', /יין|יקב|wine|vineyard/i], ['🏛', /עיר|מוזיאון|קתדר|עתיק|city|museum|old town|cathedral/i], ['✈️', /נחית|טיס|שדה|airport|flight|landing/i], ['🌿', /טבע|יער|פארק|nature|forest|park|valley|עמק/i]];
  function themeIcon(day) { var txt = [day.title, day.summary].join(' '); for (var i = 0; i < THEMES.length; i++) if (THEMES[i][1].test(txt)) return THEMES[i][0]; return '🧭'; }
  function enhanceResult() {
    var d = draft(); if (!d) return;
    var rows = document.querySelectorAll('#plannerDraftDays .day-row');
    rows.forEach(function (row, i) {
      var day = d.days[i]; if (!day) return;
      var wd = row.querySelector('.day-weekday'); if (wd) wd.textContent = weekday(day.date);
      var dt = row.querySelector('.day-date');
      if (dt && HE && !row.querySelector('.tc-hebdate')) dt.insertAdjacentHTML('afterend', hebSpan(day.date));
      var ph = row.querySelector('.day-photo');
      if (ph && !ph.dataset.v170) { ph.dataset.v170 = '1'; ph.style.backgroundImage = ''; ph.classList.add('tc-day-art'); ph.innerHTML = '<span>' + themeIcon(day) + '</span><b>' + (i + 1) + '</b>'; }
      var gm = row.querySelector('.day-mini-meta a[href*="google.com/maps"]'); if (gm) { var r = dayRouteUrl(day); if (r) gm.href = r; }
    });
    renderHotels();
    healMissingEnrichment(d);
    var saved = d.status === 'ready' || /save/.test(String(d.buildStatus || ''));
    var disc = $('plannerDiscardTrip'); if (disc) disc.hidden = saved;
    var unsaved = $('tcV108SaveNotice'); if (unsaved) unsaved.style.display = saved ? 'none' : '';
    var sv = $('plannerSaveTrip'); if (sv && !sv.dataset.busy) sv.textContent = saved ? t('שמור שינויים', 'Save changes') : t('שמור טיול', 'Save trip');
    var q = $('plannerChangeQuota'); if (q) { var left = Math.max(0, (d.maxChanges || 5) - (d.changeCount || 0)); q.textContent = t('נותרו ' + left + ' מתוך ' + (d.maxChanges || 5) + ' עריכות AI', left + ' of ' + (d.maxChanges || 5) + ' AI edits left'); }
    var meta = $('plannerResultMeta'); if (meta && d.days.length && HE && !meta.dataset.v170) { meta.dataset.v170 = '1'; var f = d.days[0].date, l = d.days[d.days.length - 1].date; meta.insertAdjacentHTML('beforeend', '<span class="tc-result-dates"> · ' + esc(niceDate(f)) + ' – ' + esc(niceDate(l)) + '</span>' + (f ? '<span class="tc-hebdate">' + esc(hebrewDate(f)) + ' – ' + esc(hebrewDate(l)) + '</span>' : '')); }
  }
  function hotelsFromAi(d) {
    var ai = d.aiItinerary || {};
    var list = ai.hotel_recommendations || ai.hotels || ai.lodging_recommendations || [];
    return Array.isArray(list) ? list : [];
  }
  function bookingUrl(name, area, ci, co, adults, rooms) {
    var tpl = String((window.TRIPCRAFT_CONFIG || {}).bookingAffiliateTemplate || '');
    var q = [name, area].filter(Boolean).join(', ');
    var base = 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(q) + (ci ? '&checkin=' + ci : '') + (co ? '&checkout=' + co : '') + '&group_adults=' + (adults || 2) + '&no_rooms=' + (rooms || 1) + '&lang=' + (HE ? 'he' : 'en-gb');
    base = withBookingAid(base);
    return tpl && tpl.indexOf('{url}') >= 0 ? tpl.replace('{url}', encodeURIComponent(base)) : base;
  }
  // Booking affiliate: set TRIPCRAFT_CONFIG.bookingAid (the aid number from the Booking Partner Centre).
  // Every booking.com link then carries aid + a label that identifies TripCraft and the trip.
  function bookingAid() { return String((window.TRIPCRAFT_CONFIG || {}).bookingAid || '').replace(/\D/g, ''); }
  function withBookingAid(url) {
    var aid = bookingAid(); if (!aid) return url;
    try {
      var u = new URL(url); if (!/(^|\.)booking\.com$/i.test(u.hostname)) return url;
      u.searchParams.set('aid', aid);
      var d = draft(); u.searchParams.set('label', 'tripcraft' + (d && d.tripId ? '-' + d.tripId : '') + '-' + (HE ? 'he' : 'en'));
      return u.toString();
    } catch (e) { return url; }
  }
  window.tcWithBookingAid = withBookingAid;
  // any older booking.com link on the page gets the affiliate parameters at click time
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="booking.com"]'); if (!a || !bookingAid()) return;
    var fixed = withBookingAid(a.href); if (fixed !== a.href) a.href = fixed;
  }, true);
  function renderHotels() {
    var d = draft(), res = $('plannerResult'); if (!d || !res) return;
    var groups = hotelsFromAi(d), box = $('tcHotelPicks');
    if (!groups.length) {
      var st = hotelState[d.tripId];
      if (!st) { if (box) box.remove(); return; }
      if (!box) { box = document.createElement('section'); box.id = 'tcHotelPicks'; box.className = 'tc-hotels'; var dd = $('plannerDraftDays'); dd ? dd.insertAdjacentElement('beforebegin', box) : res.appendChild(box); }
      box.innerHTML = st === 'loading'
        ? '<div class="tc-hotel-wait" role="status"><span class="tc-spin" aria-hidden="true"></span><div><b>🏨 ' + t('מחפשים עבורכם 3 מלונות לכל אזור לינה…', 'Finding 3 hotels for each stay…') + '</b><p>' + t('זה לוקח בערך דקה. אפשר להמשיך לגלול ולעבוד על המסלול – המלונות יופיעו כאן לבד.', 'This takes about a minute. Keep browsing — the hotels will appear here automatically.') + '</p></div></div>'
        : '<div class="tc-hotel-wait tc-hotel-failed" role="status"><div><b>🏨 ' + t('לא הצלחנו להביא מלונות כרגע', 'We couldn’t load hotels right now') + '</b><p>' + t('אפשר לנסות שוב – זה לא נספר כעריכה.', 'You can try again — it doesn’t count as an edit.') + '</p></div><button type="button" class="tc-btn tc-btn-primary" data-hotels-retry>' + t('נסה שוב', 'Try again') + '</button></div>';
      return;
    }
    if (!box) { box = document.createElement('section'); box.id = 'tcHotelPicks'; box.className = 'tc-hotels'; var days = $('plannerDraftDays'); days ? days.insertAdjacentElement('beforebegin', box) : res.appendChild(box); }
    var prof = d.plannerProfile || {}, b = prof.agesBands || {}, adults = (b.adult || 0) + (b.young || 0) || prof.people || 2;
    box.innerHTML = '<div class="tc-sec-head"><h3>🏨 ' + t('3 מלונות מומלצים לכל אזור לינה', '3 recommended hotels per stay') + '</h3><p>' + t('נבחרו לפי סוג הלינה, רמת המחיר והדרישות שסימנתם. המחירים והזמינות מתעדכנים ב-Booking.', 'Picked by your lodging type, price level and must-haves. Live prices on Booking.') + '</p></div>' +
      groups.map(function (g) {
        var area = g.area || g.location || g.overnight_location || '', ci = g.check_in || g.checkin || '', co = g.check_out || g.checkout || '';
        return '<div class="tc-hotel-area"><div class="tc-hotel-area-head"><b>📍 ' + esc(area) + '</b>' + (ci ? '<span>' + esc(niceDate(ci)) + ' – ' + esc(niceDate(co)) + (g.nights ? ' · ' + g.nights + ' ' + t('לילות', 'nights') : '') + '</span>' : '') + '</div><div class="tc-hotel-grid">' +
          (g.hotels || []).slice(0, 3).map(function (h, i) {
            return '<article class="tc-hotel-card"><div class="tc-hotel-rank">' + (i + 1) + '</div><h4>' + esc(h.name) + '</h4>' +
              '<div class="tc-meta">' + (h.stars ? '<span>' + '★'.repeat(Math.min(5, +h.stars || 0)) + '</span>' : '') + (h.type ? '<span>' + esc(h.type) + '</span>' : '') + (h.price_range || h.price ? '<span>' + esc(h.price_range || h.price) + '</span>' : '') + '</div>' +
              (h.why || h.reason ? '<p>' + esc(h.why || h.reason) + '</p>' : '') +
              (h.matches && h.matches.length ? '<div class="tc-tags">' + h.matches.map(function (m) { return '<span>✓ ' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
              '<a class="tc-btn tc-btn-booking" target="_blank" rel="noopener sponsored" href="' + esc(bookingUrl(h.name, area, ci, co, adults, prof.rooms)) + '">' + t('בדקו מחיר וזמינות ב-Booking', 'Check price on Booking') + '</a></article>';
          }).join('') + '</div></div>';
      }).join('');
  }
  var origRender = window.renderPlannerDraft;
  if (typeof origRender === 'function') {
    window.renderPlannerDraft = function () { var r = origRender.apply(this, arguments); try { enhanceResult(); } catch (e) { console.warn('V170 result enhance', e); } return r; };
    try { renderPlannerDraft = window.renderPlannerDraft; } catch (e) {}
  }
  var origDayRoute = window.plannerDayRoute;
  window.plannerDayRoute = function (day, profile) { var r = dayRouteUrl(day || {}); return r || (origDayRoute ? origDayRoute(day, profile) : '#'); };
  try { plannerDayRoute = window.plannerDayRoute; } catch (e) {}

  // Save trip button: toast + go to My Account (both languages)
  function wireSave() {
    var b = $('plannerSaveTrip'); if (!b || b.dataset.v170) return;
    var nb = b.cloneNode(true); nb.dataset.v170 = '1'; b.replaceWith(nb);
    nb.addEventListener('click', function () {
      if (nb.dataset.busy === '1') return;
      nb.dataset.busy = '1'; var lbl = nb.textContent; nb.textContent = t('שומרים…', 'Saving…'); nb.disabled = true;
      Promise.resolve().then(function () { return window.tcSaveCurrentTrip(false); }).catch(function (e) { console.error(e); return false; }).then(function (ok) {
        nb.dataset.busy = ''; nb.disabled = false; nb.textContent = lbl;
        if (ok) { forgetWizardDraft(); toast(t('✓ הטיול נשמר', '✓ Trip saved')); setTimeout(function () { try { tcRenderAccount(); } catch (e) {} location.hash = '#account'; window.scrollTo({ top: 0, behavior: 'smooth' }); }, 1200); }
        else toast(t('הטיול לא נשמר. נסו שוב.', 'The trip was not saved. Please try again.'), 'error');
      });
    });
  }

  /* ================================================================
   * 10. New trip always starts clean (no leftovers from the previous trip)
   * ================================================================ */
  function forgetWizardDraft() { try { localStorage.removeItem('tripcraft_planner_draft_v57'); localStorage.removeItem('tc_v170_ai_notes'); } catch (e) {} }
  var origSave = window.tcSaveCurrentTrip;
  if (typeof origSave === 'function' && !origSave.__v170) {
    window.tcSaveCurrentTrip = function () { return Promise.resolve(origSave.apply(this, arguments)).then(function (ok) { if (ok) forgetWizardDraft(); return ok; }); };
    window.tcSaveCurrentTrip.__v170 = true;
    try { tcSaveCurrentTrip = window.tcSaveCurrentTrip; } catch (e) {}
  }
  var origClean = window.tcStartCleanTrip;
  window.tcStartCleanTrip = function () {
    forgetWizardDraft(); softWarnAccepted = {};
    if (origClean) origClean();
    var m = $('plMust'); if (m) m.value = '';
    window.tcRenderMustChips && window.tcRenderMustChips();
    ['plFree', 'plTripName', 'plDestination'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
    document.querySelectorAll('#countryChoices input').forEach(function (x) { x.checked = false; x.dispatchEvent(new Event('change', { bubbles: true })); });
    decorateDateDisplays();
    showPart(1);
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#planner"], [data-tc-new-trip]'); if (!a) return;
    var d = draft();
    if (d && d.tripId) { e.preventDefault(); window.tcStartCleanTrip(); location.hash = '#planner'; }
  }, true);

  /* ================================================================
   * 11. My Account: newest first, current links, in-page confirmations
   * ================================================================ */
  function fmt(s) { return s ? esc(niceDate(s)) : '—'; }
  function tripUrl(id) { try { return tcPersonalTripUrl(id); } catch (e) { return '#trip/' + id; } }
  var origAccount = window.tcRenderAccount;
  window.tcRenderAccount = function () {
    if (origAccount) origAccount();
    var box = $('tcAccountBody'); var u = null; try { u = tcCustomer(); } catch (e) {}
    if (!box || !u) return;
    var my = ++accountSeq;
    loadMyTrips(u).then(function (trips) { if (my === accountSeq) paintAccount(box, trips); });
  };
  var accountSeq = 0, accountObserved = false;
  function observeAccount() {
    var box = $('tcAccountBody'); if (!box || accountObserved) return; accountObserved = true;
    var t0 = 0;
    function check() {
      if (!box.querySelector('.tc-v141-account-trip')) return;
      clearTimeout(t0);
      t0 = setTimeout(function () {
        var u = null; try { u = tcCustomer(); } catch (e) {}
        var my = ++accountSeq;
        (lastTrips.length ? Promise.resolve(lastTrips) : loadMyTrips(u)).then(function (tr) { if (my === accountSeq) paintAccount(box, tr); });
      }, 30);
    }
    new MutationObserver(check).observe(box, { childList: true, subtree: true });
    check();
  }
  function loadMyTrips(u) {
    var sb = null; try { sb = tcSupabase(); } catch (e) {}
    if (!sb || !u || !u.id) return Promise.resolve([]);
    return sb.from('trips').select('id,name,destination,start_date,end_date,draft,updated_at').eq('user_id', u.id).order('updated_at', { ascending: false })
      .then(function (r) {
        if (r.error) throw r.error;
        return (r.data || []).filter(function (x) { var st = String(((x.draft || {}).status) || '').toLowerCase(), bs = String(((x.draft || {}).buildStatus) || '').toLowerCase(); return String(x.id).indexOf('TC-PREFLIGHT-') !== 0 && st !== 'building' && st !== 'pending' && bs !== 'building'; })
          .map(function (x) { return { tripId: x.id, tripName: x.name, destination: x.destination, start: x.start_date, end: x.end_date, tripDraft: x.draft, updated_at: x.updated_at }; });
      }).catch(function (e) { console.warn('V170 trips load failed', e); return null; });
  }
  var lastTrips = [];
  function paintAccount(box, trips) {
    if (trips === null) return; // keep whatever the older renderer showed
    lastTrips = trips;
    var list = box.querySelector('.tc-trip-list');
    var html = trips.length ? trips.map(function (p) {
      var dr = p.tripDraft || {}, days = (dr.days || []).length, url = tripUrl(p.tripId), country = (dr.plannerProfile || {}).country || dr.country || '';
      return '<article class="tc-trip-card"><div class="tc-trip-art">' + flag(countryIso(country) || 'UN') + '</div><div class="tc-trip-info"><h3>' + esc(p.tripName || dr.name || p.tripId) + '</h3>' +
        '<div class="tc-muted">' + esc([countryIso(country) ? countryLabel(countryIso(country)) : country, p.destination === country ? '' : p.destination].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(' · ')) + (days ? ' · ' + days + ' ' + t('ימים', 'days') : '') + '</div>' +
        '<div class="tc-trip-dates">' + fmt(p.start) + ' – ' + fmt(p.end) + (HE && p.start ? '<span class="tc-hebdate">' + esc(hebrewDate(p.start)) + '</span>' : '') + '</div></div>' +
        '<div class="tc-trip-actions"><button type="button" class="tc-btn tc-btn-primary" data-acc-open="' + esc(p.tripId) + '">' + t('פתח / ערוך', 'Open / edit') + '</button>' +
        '<button type="button" class="tc-btn tc-btn-soft" data-acc-copy="' + esc(url) + '">🔗 ' + t('העתק קישור', 'Copy link') + '</button>' +
        '<button type="button" class="tc-btn tc-btn-ghost tc-danger-text" data-acc-del="' + esc(p.tripId) + '" data-name="' + esc(p.tripName || '') + '">🗑 ' + t('מחק', 'Delete') + '</button></div></article>';
    }).join('') : '<div class="tc-empty">' + t('עוד אין טיולים בחשבון. בואו נבנה את הראשון!', 'No trips yet. Let’s build your first one!') + '</div>';
    var pending = jobsGet().map(function (j) {
      var sec = Math.round((Date.now() - j.startedAt) / 1000), pct = j.state === 'failed' ? 100 : Math.min(95, Math.round(100 * (1 - Math.exp(-sec / 40))));
      var prof = j.profile || {}, country = (prof.countries && prof.countries[0]) || prof.country || '';
      return '<article class="tc-trip-card tc-trip-pending' + (j.state === 'failed' ? ' tc-trip-failed' : '') + '" data-job="' + esc(j.id) + '"><div class="tc-trip-art">' + flag(countryIso(country) || 'UN') + '</div><div class="tc-trip-info"><h3>' + esc(j.name) + '</h3>' +
        '<div class="tc-muted">' + (j.state === 'failed' ? t('הבנייה נכשלה', 'Build failed') : t('הטיול נבנה עכשיו… אפשר להמשיך לגלוש', 'Your trip is being built… keep browsing')) + '</div>' +
        '<div class="tc-trip-dates">' + fmt(prof.start) + ' – ' + fmt(prof.end) + '</div>' +
        '<div class="tc-build-progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i><span>' + pct + '%</span></div></div>' +
        '<div class="tc-trip-actions">' + (j.state === 'failed' ? '<button type="button" class="tc-btn tc-btn-primary" data-job-retry="' + esc(j.id) + '">' + t('נסה שוב', 'Retry') + '</button><button type="button" class="tc-btn tc-btn-ghost" data-job-dismiss="' + esc(j.id) + '">' + t('הסר', 'Remove') + '</button>'
          : '<button type="button" class="tc-btn tc-btn-primary" disabled>' + t('פתח / ערוך', 'Open / edit') + '</button><button type="button" class="tc-btn tc-btn-soft" disabled>🔗 ' + t('העתק קישור', 'Copy link') + '</button><button type="button" class="tc-btn tc-btn-ghost" disabled>🗑 ' + t('מחק', 'Delete') + '</button>') + '</div></article>';
    }).join('');
    if (pending) html = pending + (trips.length ? html : '');
    var old = box.querySelectorAll('.tc-v141-account-trip'); old.forEach(function (o) { o.remove(); });
    if (!list) { list = document.createElement('div'); list.className = 'tc-trip-list'; box.appendChild(list); }
    list.innerHTML = html;
  }
  try { tcRenderAccount = window.tcRenderAccount; } catch (e) {}
  function openTrip(id) {
    var rec = lastTrips.find(function (x) { return x.tripId === id; });
    if (!rec || !rec.tripDraft) { try { tcOpenPurchasedTrip(id); } catch (x) {} return; }
    try {
      planner.draft = JSON.parse(JSON.stringify(rec.tripDraft)); planner.draft.tripId = id; planner.currentTripId = id;
      try { tcFillPlannerFromDraft(planner.draft); } catch (x) {}
      location.hash = '#planner';
      setTimeout(function () { try { renderPlannerDraft(); } catch (x) {} var r = $('plannerResult'); r && r.scrollIntoView({ behavior: 'smooth' }); }, 120);
    } catch (x) { try { tcOpenPurchasedTrip(id); } catch (y) {} }
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-acc-open]'); if (o) { openTrip(o.dataset.accOpen); return; }
    var c = e.target.closest('[data-acc-copy]'); if (c) { (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.accCopy) : Promise.reject()).then(function () { toast(t('הקישור הועתק ✓', 'Link copied ✓')); }, function () { window.tcAlert(c.dataset.accCopy, { title: t('הקישור לטיול', 'Trip link') }); }); return; }
    var del = e.target.closest('[data-acc-del]'); if (del) {
      window.tcConfirm(t('למחוק את הטיול "' + del.dataset.name + '"? לא ניתן לבטל פעולה זו.', 'Delete "' + del.dataset.name + '"? This cannot be undone.'), { okText: t('מחק לצמיתות', 'Delete'), danger: true, icon: '🗑' }).then(function (ok) {
        if (!ok) return;
        Promise.resolve(withConfirmApproved(function () { return tcDeleteTrip(del.dataset.accDel); })).then(function () { toast(t('הטיול נמחק', 'Trip deleted')); setTimeout(window.tcRenderAccount, 400); });
      });
    }
  });

  /* ================================================================
   * 11b. Traveller notes for the AI - prominent at creation and when updating
   * ================================================================ */
  function aiNotesValue() { var el = $('tcAiNotes'); var v = el ? el.value.trim() : ''; if (!v) { var d = draft(); v = d && d.plannerProfile && d.plannerProfile.aiNotes || ''; } return String(v).slice(0, 3000); }
  var NOTE_EXAMPLES = HE ? ['אנחנו לא אוכלים בשר', 'חשוב לנו לסיים כל יום עד 18:00', 'יש לנו ילד בן 4 — צריך מנוחת צהריים', 'רוצים לפחות יום אחד בלי נסיעות', 'מעדיפים מסעדות מקומיות ולא תיירותיות', 'רוצים ערב רומנטי אחד עם נוף']
    : ['We don’t eat meat', 'We want to finish each day by 6pm', 'We have a 4-year-old — midday rest needed', 'At least one day without driving', 'Local restaurants, not touristy ones', 'One romantic evening with a view'];
  function buildNotesCard() {
    var step7 = document.querySelector('.planner-step[data-step="7"]'), sum = $('plannerSummary');
    var freeGrid = $('plFree') && $('plFree').closest('.planner-grid');
    if ((!freeGrid && (!step7 || !sum)) || $('tcAiNotesCard')) return;
    var card = document.createElement('section');
    card.id = 'tcAiNotesCard'; card.className = 'tc-notes-card';
    card.innerHTML = '<div class="tc-notes-head"><span class="tc-notes-icon">📝</span><div><h3>' + t('הערות כלליות ל-AI — כל מה שחשוב לכם', 'General notes for the AI — everything that matters to you') + '</h3><p>' +
      t('כתבו כאן במילים שלכם: הרגלים, בקשות מיוחדות, אוכל, קצב, מה לא לעשות. ה-AI מתכנן לפי ההערות האלה כהנחיות מחייבות. (אירוע או טיסה בתאריך מסוים – בשדה שמעל.)', 'Write in your own words: habits, special requests, food, pace, what to avoid. The AI treats these notes as binding instructions. (An event or flight on a specific date goes in the field above.)') + '</p></div></div>' +
      '<textarea id="tcAiNotes" rows="6" maxlength="3000" placeholder="' + esc(t('למשל: אנחנו קמים מאוחר, לא אוהבים מוזיאונים, רוצים ערב רומנטי אחד ושקיעה מנקודת תצפית…', 'e.g. We wake up late, don’t like museums, want one romantic evening and a sunset viewpoint…')) + '"></textarea>' +
      '<div class="tc-notes-examples"><small>' + t('רעיונות — לחצו כדי להוסיף:', 'Ideas — tap to add:') + '</small>' + NOTE_EXAMPLES.map(function (x) { return '<button type="button" class="tc-chip-btn">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<div class="tc-notes-count"><span id="tcAiNotesCount">0</span>/3000</div>';
    if (freeGrid) freeGrid.insertAdjacentElement('afterend', card); else step7.insertBefore(card, sum); // right under the existing date-specific notes
    var ta = $('tcAiNotes'), cnt = $('tcAiNotesCount');
    try { ta.value = localStorage.getItem('tc_v170_ai_notes') || ''; } catch (e) {}
    function sync() { cnt.textContent = ta.value.length; try { localStorage.setItem('tc_v170_ai_notes', ta.value); } catch (e) {} }
    ta.addEventListener('input', sync); sync();
    card.querySelectorAll('.tc-chip-btn').forEach(function (b) { b.addEventListener('click', function () { ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + b.textContent; sync(); ta.focus(); }); });
    var s1 = document.querySelector('.planner-step[data-step="1"] .step1-subnav');
    if (false && s1 && !$('tcNotesTeaser')) s1.insertAdjacentHTML('afterend', '<div id="tcNotesTeaser" class="tc-context">📝 ' + t('בסוף האשף יש מקום להערות חופשיות ל-AI — שם כותבים כל מה שחשוב לכם.', 'At the end of the wizard there is room for your own notes to the AI.') + '</div>');
  }
  function notesForDraft() {
    var d = draft(); if (!d) return;
    d.plannerProfile = d.plannerProfile || {};
    var v = ($('tcAiNotes') || {}).value; v = v ? v.trim() : '';
    if (v && !d.plannerProfile.aiNotes) d.plannerProfile.aiNotes = v;
  }
  function buildNotesUpdateCard() {
    var d = draft(), res = $('plannerResult'); if (!d || !res) return;
    var card = $('tcNotesUpdate');
    if (!card) {
      card = document.createElement('section'); card.id = 'tcNotesUpdate'; card.className = 'tc-notes-card tc-notes-update';
      var head = res.querySelector('.planner-result-head'); head ? head.insertAdjacentElement('afterend', card) : res.prepend(card);
    }
    var notes = (d.plannerProfile || {}).aiNotes || '', hist = (d.changeLog || []).filter(function (c) { return c.scope === 'trip' || c.scope === 'notes'; }).slice(-3);
    var left = Math.max(0, (d.maxChanges || 5) - (d.changeCount || 0));
    card.innerHTML = '<div class="tc-notes-head"><span class="tc-notes-icon">📝</span><div><h3>' + t('הערות ועדכונים לטיול', 'Notes & updates for this trip') + '</h3><p>' +
      t('כתבו מה לשנות או מה עוד חשוב לכם — ה-AI יעדכן את כל הטיול לפי ההערות.', 'Write what to change or what else matters — the AI updates the whole trip accordingly.') + '</p></div></div>' +
      (notes ? '<div class="tc-notes-saved"><b>' + t('ההערות שלכם שה-AI כבר קיבל:', 'Notes the AI already has:') + '</b><div>' + esc(notes).replace(/\n/g, '<br>') + '</div></div>' : '') +
      (hist.length ? '<div class="tc-notes-hist">' + hist.map(function (h) { return '<div>✓ ' + esc(h.text) + '</div>'; }).join('') + '</div>' : '') +
      '<textarea id="tcNotesUpdateText" rows="4" maxlength="2000" placeholder="' + esc(t('למשל: להוסיף יום רגוע באמצע, להחליף את המסעדה ביום 3 במשהו צמחוני, לסיים את יום 2 מוקדם יותר…', 'e.g. add a relaxed day in the middle, make day 3 dinner vegetarian, finish day 2 earlier…')) + '"></textarea>' +
      '<div class="tc-notes-actions"><span class="tc-muted">' + t('נותרו ' + left + ' עדכוני AI לטיול', left + ' AI updates left') + '</span><button type="button" class="tc-btn tc-btn-primary" id="tcNotesUpdateBtn"' + (left ? '' : ' disabled') + '>✨ ' + t('עדכן את הטיול לפי ההערות', 'Update the trip from these notes') + '</button></div>';
    $('tcNotesUpdateBtn').addEventListener('click', function () {
      var txt = ($('tcNotesUpdateText').value || '').trim();
      if (txt.length < 3) { toast(t('כתבו קודם מה לעדכן', 'Write what to update first'), 'error'); return; }
      var input = $('plannerChatInput'), send = $('plannerChatSend');
      if (!input || !send) { toast(t('העדכון לא זמין כרגע', 'Updates are unavailable right now'), 'error'); return; }
      var dd = draft(); dd.plannerProfile = dd.plannerProfile || {};
      dd.plannerProfile.aiNotes = [dd.plannerProfile.aiNotes, txt].filter(Boolean).join('\n');
      input.value = (HE ? 'עדכון לפי הערות הנוסע (לכל הטיול): ' : 'Update from traveller notes (whole trip): ') + txt;
      send.click();
      $('tcNotesUpdateText').value = '';
      toast(t('ה-AI מעדכן את הטיול… זה יכול לקחת עד דקה–שתיים', 'The AI is updating your trip… this may take a minute or two'));
      var log = $('plannerChatLog'); log && log.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  // keep notes with the trip when it is saved, and refresh the update card after each render
  var saveWithNotes = window.tcSaveCurrentTrip;
  if (typeof saveWithNotes === 'function' && !saveWithNotes.__notes) {
    window.tcSaveCurrentTrip = function () { try { notesForDraft(); } catch (e) {} return saveWithNotes.apply(this, arguments); };
    window.tcSaveCurrentTrip.__notes = true; window.tcSaveCurrentTrip.__v170 = true;
    try { tcSaveCurrentTrip = window.tcSaveCurrentTrip; } catch (e) {}
  }
  var renderWithNotes = window.renderPlannerDraft;
  window.renderPlannerDraft = function () { try { notesForDraft(); } catch (e) {} var r = renderWithNotes.apply(this, arguments); try { buildNotesUpdateCard(); } catch (e) { console.warn('notes card', e); } return r; };
  try { renderPlannerDraft = window.renderPlannerDraft; } catch (e) {}
  var cleanWithNotes = window.tcStartCleanTrip;
  window.tcStartCleanTrip = function () { try { localStorage.removeItem('tc_v170_ai_notes'); } catch (e) {} var ta = $('tcAiNotes'); if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input')); } return cleanWithNotes.apply(this, arguments); };

  /* ================================================================
   * 11c. Background builds: the trip is built on the server; the user can keep browsing
   * ================================================================ */
  var JOBS_KEY = 'tc_v171_jobs', JOB_MAX_MS = 210000;
  function jobsGet() { return lsGet(JOBS_KEY, []); }
  function jobsSet(a) { lsSet(JOBS_KEY, a); renderJobBar(); if (location.hash === '#account') setTimeout(function () { try { window.tcRenderAccount(); } catch (e) {} }, 50); }
  function jobUpdate(id, patch) { jobsSet(jobsGet().map(function (j) { return j.id === id ? Object.assign({}, j, patch) : j; })); }
  function jobRemove(id) { jobsSet(jobsGet().filter(function (j) { return j.id !== id; })); }
  function fnName() { return (window.TRIPCRAFT_CONFIG && window.TRIPCRAFT_CONFIG.aiFunctionName) || 'tripcraft-ai'; }
  function sbc() { try { return tcSupabase(); } catch (e) { return null; } }
  function me() { try { return tcCustomer(); } catch (e) { return null; } }

  function renderJobBar() {
    var jobs = jobsGet(), bar = $('tcJobBar');
    if (!jobs.length || location.hash === '#account') { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'tcJobBar'; bar.setAttribute('role', 'status'); var hdr = document.querySelector('.tc-header'); hdr ? hdr.insertAdjacentElement('afterend', bar) : document.body.prepend(bar); }
    bar.innerHTML = jobs.map(function (j) {
      var sec = Math.round((Date.now() - j.startedAt) / 1000), pct = Math.min(95, Math.round(100 * (1 - Math.exp(-sec / 40))));
      if (j.state === 'failed') return '<div class="tc-job tc-job-fail">⚠️ ' + esc(t('בניית "' + j.name + '" נכשלה', 'Building "' + j.name + '" failed')) + ' <button type="button" class="tc-btn tc-btn-soft" data-job-retry="' + esc(j.id) + '">' + t('נסה שוב', 'Retry') + '</button> <button type="button" class="tc-btn tc-btn-ghost" data-job-dismiss="' + esc(j.id) + '">' + t('סגור', 'Dismiss') + '</button></div>';
      return '<div class="tc-job"><span class="tc-job-spin" aria-hidden="true"></span><span>' + esc(t('הטיול "' + j.name + '" נבנה ברקע — אפשר להמשיך לגלוש', '"' + j.name + '" is being built in the background — keep browsing')) + '</span><span class="tc-job-pct">' + pct + '%</span><div class="tc-job-track"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
  }
  setInterval(function () {
    if (!jobsGet().some(function (j) { return j.state !== 'failed'; })) return;
    renderJobBar();
    document.querySelectorAll('.tc-trip-pending[data-job]').forEach(function (card) {
      var j = jobsGet().find(function (q) { return q.id === card.dataset.job; }); if (!j || j.state === 'failed') return;
      var pct = Math.min(95, Math.round(100 * (1 - Math.exp(-((Date.now() - j.startedAt) / 1000) / 40)))), bar = card.querySelector('.tc-build-progress');
      if (bar) { bar.querySelector('i').style.width = pct + '%'; bar.querySelector('span').textContent = pct + '%'; bar.setAttribute('aria-valuenow', pct); }
    });
  }, 1000);

  function notify(title, body) {
    try { if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') new Notification(title, { body: body, icon: 'icons/icon-192.png' }); } catch (e) {}
  }
  function mapDays(ai) {
    return (ai.days || []).map(function (day) {
      return { date: day.date || '', title: day.title || '', lodging: day.overnight_location || '', summary: day.day_summary || '', routeSummary: day.route_summary || '',
        stops: (day.activities || []).map(function (a) { return { time: a.time || '', name: a.name || '', place: a.location || a.name || '', mapQuery: a.map_query || '', what: a.description || a.name || '', durationMinutes: Number(a.duration_minutes || 0), driveMinutes: Number(a.drive_minutes || 0), notes: a.notes || '', estimatedCost: Number(a.estimated_cost || 0) }; }).filter(function (s) { return s.place; }) };
    });
  }
  function staysFrom(days) {
    var out = [], cur = null;
    days.forEach(function (d, i) {
      var loc = String(d.lodging || '').trim(); if (i === days.length - 1) loc = ''; // last day: no overnight
      if (cur && loc && norm(loc) === norm(cur.area)) { cur.nights++; cur.check_out = nextDay(d.date); return; }
      if (loc) { cur = { area: loc, check_in: d.date, check_out: nextDay(d.date), nights: 1 }; out.push(cur); } else cur = null;
    });
    return out;
  }
  function nextDay(iso) { var d = isoDate(iso); if (!d) return ''; d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  // save a draft object without disturbing whatever trip the user is looking at now
  // Background saves run one at a time: overlapping saves used to restore the wrong draft and drop hotels/verification.
  var saveChain = Promise.resolve();
  var latestById = {};
  function saveDraftObject(obj) {
    latestById[obj.tripId] = obj;
    var run = function () {
      var p = P(); if (!p) return false;
      var cur = latestById[obj.tripId] || obj;
      var prev = p.draft, showing = prev && prev.tripId === cur.tripId;
      if (showing && prev !== cur) { Object.assign(prev, cur); cur = prev; latestById[cur.tripId] = cur; }
      p.draft = cur;
      return Promise.resolve(window.tcSaveCurrentTrip(false)).catch(function () { return false; }).then(function (ok) {
        if (!showing) p.draft = prev; else { try { renderPlannerDraft(); } catch (e) {} }
        return ok;
      });
    };
    var next = saveChain.then(run, run);
    saveChain = next.catch(function () {});
    return next;
  }
  var healing = {}, hotelState = {};
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('[data-hotels-retry]')) return;
    var d = draft(); if (!d) return; healing[d.tripId] = false; healMissingEnrichment(d, true);
  });
  function wantsHotels(d) { var m = ((d && d.plannerProfile) || {}).lodgingMode; return m !== 'skip' && m !== 'existing'; }
  function healMissingEnrichment(d, force) {
    if (!d || !d.tripId || !d.aiItinerary || healing[d.tripId] || (d.enrichedAt && !force)) return;
    var hasHotels = ((d.aiItinerary || {}).hotel_recommendations || []).length > 0 || !wantsHotels(d);
    if (d.verification && hasHotels) return;
    if (!me()) return;
    // (enrichInBackground marks the trip as in progress)
    var pr = d.plannerProfile || {};
    var request = { country: pr.country || d.country, region: pr.region || '', destination: pr.destination || pr.country || d.country, start_date: pr.start || (d.days[0] || {}).date, end_date: pr.end || (d.days[d.days.length - 1] || {}).date,
      travelers: pr.people || 2, language: HE ? 'he' : 'en', trip_name: d.name, group: pr.group, transport: pr.transport, interests: pr.interests, must: pr.must, avoid: pr.avoid, notes: pr.free || '' };
    if (!hasHotels) { hotelState[d.tripId] = 'loading'; try { renderHotels(); } catch (e) {} }
    toast(hasHotels ? t('משלימים בדיקת מסלול ברקע…', 'Verifying the itinerary in the background…') : t('משלימים לטיול מלונות ובדיקה ברקע…', 'Adding hotels and verification in the background…'));
    enrichInBackground(d, request, { skipVerify: !!d.verification, skipHotels: hasHotels });
  }
  function enrichInBackground(obj, request, opt) {
    opt = opt || {};
    if (healing[obj.tripId]) return; healing[obj.tripId] = true; // one enrichment per trip at a time
    if (!wantsHotels(obj)) opt.skipHotels = true;
    if (!opt.skipHotels) hotelState[obj.tripId] = 'loading';
    var sb = sbc(); if (!sb) return;
    var u = me(), base = { trip_id: obj.tripId, user_id: (u && u.id) || null, trip: request };
    var verify = opt.skipVerify ? Promise.resolve(null) : sb.functions.invoke(fnName(), { body: Object.assign({ action: 'verify_trip', itinerary: obj.aiItinerary }, base) }).then(function (r) { return r && r.data && r.data.ok ? r.data : null; }).catch(function () { return null; });
    var hotels = opt.skipHotels ? Promise.resolve(null) : sb.functions.invoke(fnName(), { body: Object.assign({ action: 'hotels', stays: staysFrom(obj.days) }, base) }).then(function (r) { return r && r.data && r.data.ok ? r.data : null; }).catch(function () { return null; });
    Promise.all([verify, hotels]).then(function (res) {
      var p = P(), target = p && p.draft && p.draft.tripId === obj.tripId ? p.draft : (latestById[obj.tripId] || obj);
      if (!res[0] || !res[1]) console.warn('V172 enrichment partial', obj.tripId, !!res[0], !!res[1]);
      if (res[0]) { target.verification = res[0].verification || null; target.aiUsage = Object.assign({}, target.aiUsage, { verify: res[0].usage || null, verifyCostUsd: res[0].cost_usd || 0 }); }
      if (res[1]) { target.aiItinerary = Object.assign({}, target.aiItinerary, { hotel_recommendations: res[1].hotel_recommendations || [] }); }
      if (!opt.skipHotels) hotelState[obj.tripId] = (res[1] && (res[1].hotel_recommendations || []).length) ? null : 'failed';
      if (!(res[0] || res[1])) healing[obj.tripId] = false; // allow a later retry only if nothing was saved
      try { var cd = draft(); if (cd && cd.tripId === obj.tripId) renderHotels(); } catch (e) {}
      target.buildStatus = 'verified-save';
      if (res[0] || res[1]) target.enrichedAt = new Date().toISOString();
      if (res[0] || res[1]) saveDraftObject(target).then(function () { if (res[1] && (res[1].hotel_recommendations || []).length) toast(t('🏨 המלונות המומלצים נוספו לטיול', '🏨 Recommended hotels were added')); });
    });
  }
  function materialize(job, payload) {
    var ai = payload && payload.itinerary; if (!ai || !Array.isArray(ai.days) || !ai.days.length) return Promise.reject(new Error('EMPTY'));
    var prof = job.profile || {};
    var obj = { tripId: job.tripId, name: job.name || ai.title, country: prof.country || ai.country || '', year: String(prof.start || '').slice(0, 4), sourceType: 'ai', status: 'ready', buildStatus: 'built',
      plannerProfile: Object.assign({}, prof, { aiNotes: job.aiNotes || prof.aiNotes || '' }), changeCount: 0, maxChanges: 5, days: mapDays(ai), aiItinerary: ai,
      aiUsage: { build: payload.usage || null, buildCostUsd: payload.cost_usd || 0 }, verification: null };
    var p = P(), onPlanner = location.hash === '#planner' && (!p.draft || !p.draft.tripId || p.draft.tripId === job.tripId);
    if (onPlanner) { p.draft = obj; p.currentTripId = obj.tripId; }
    return saveDraftObject(obj).then(function (ok) {
      if (!ok) throw new Error('SAVE_FAILED');
      forgetWizardDraft(); jobRemove(job.id);
      if (onPlanner) { try { renderPlannerDraft(); } catch (e) {} }
      toastAction(t('✓ הטיול "' + obj.name + '" מוכן!', '✓ "' + obj.name + '" is ready!'), t('פתח את הטיול', 'Open trip'), function () { lastTrips = []; openTripObject(obj); });
      notify('TripCraft', t('הטיול "' + obj.name + '" מוכן', '"' + obj.name + '" is ready'));
      try { if (location.hash === '#account') window.tcRenderAccount(); } catch (e) {}
      enrichInBackground(obj, job.request);
    });
  }
  function openTripObject(obj) {
    var p = P(); p.draft = obj; p.currentTripId = obj.tripId;
    try { tcFillPlannerFromDraft(obj); } catch (e) {}
    location.hash = '#planner';
    setTimeout(function () { try { renderPlannerDraft(); } catch (e) {} var r = $('plannerResult'); r && r.scrollIntoView({ behavior: 'smooth' }); }, 150);
  }
  function toastAction(msg, label, fn) {
    var box = $('tcToastStack') || (function () { toast(' ', 'ok'); return $('tcToastStack'); })();
    var el = document.createElement('div'); el.className = 'tc-toast tc-toast-ok tc-toast-action';
    el.innerHTML = '<span>' + esc(msg) + '</span><button type="button">' + esc(label) + '</button>';
    el.style.pointerEvents = 'auto'; box.appendChild(el); requestAnimationFrame(function () { el.classList.add('in'); });
    el.querySelector('button').addEventListener('click', function () { el.remove(); fn(); });
    setTimeout(function () { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 300); }, 12000);
  }
  var polling = {};
  function poll(job) {
    if (polling[job.id]) return; polling[job.id] = true;
    (function tick() {
      var cur = jobsGet().find(function (j) { return j.id === job.id; });
      if (!cur || cur.state === 'failed') { delete polling[job.id]; return; }
      var sb = sbc(); if (!sb || !me()) { setTimeout(tick, 5000); return; }
      sb.from('tripcraft_build_jobs').select('status,result,error').eq('id', job.id).maybeSingle().then(function (r) {
        var row = r && r.data;
        if (row && row.status === 'done') { delete polling[job.id]; materialize(cur, row.result).catch(function (e) { fail(cur, e && e.message); }); return; }
        if ((row && row.status === 'failed') || Date.now() - cur.startedAt > JOB_MAX_MS) { delete polling[job.id]; fail(cur, row && row.error); return; }
        setTimeout(tick, 4000);
      }, function () { setTimeout(tick, 6000); });
    })();
  }
  function fail(job, why) {
    console.warn('V171 build job failed', why);
    jobUpdate(job.id, { state: 'failed', error: String(why || '') });
    toast(t('בניית הטיול "' + job.name + '" נכשלה. אפשר לנסות שוב מהפס העליון.', 'Building "' + job.name + '" failed. You can retry from the top bar.'), 'error');
    notify('TripCraft', t('בניית הטיול נכשלה', 'The trip build failed'));
  }
  /* ---- V180: fast builds – long trips are built in parallel parts from a shared day plan ---- */
  var PART_DAYS = 4;
  function datesFrom(a, b) { var out = [], d = a; for (var i = 0; d && i < 60; i++) { out.push(d); if (d === b) break; d = nextDay(d); } return out; }
  function invokeTimed(body, ms) {
    var sb = sbc();
    return Promise.race([sb.functions.invoke(fnName(), { body: body }), new Promise(function (_, rej) { setTimeout(function () { rej(new Error('TIMEOUT')); }, ms); })]);
  }
  function partRequests(request, skeleton) {
    var all = datesFrom(request.start_date, request.end_date), n = Math.ceil(all.length / PART_DAYS), size = Math.ceil(all.length / n), parts = [];
    var plan = {}; (skeleton || []).forEach(function (d) { if (d && d.date) plan[d.date] = d; });
    for (var k = 0; k < n; k++) {
      var ds = all.slice(k * size, (k + 1) * size); if (!ds.length) continue;
      var q = JSON.parse(JSON.stringify(request)); q.start_date = ds[0]; q.end_date = ds[ds.length - 1];
      if (k > 0) { q.arrival_airport = ''; q.arrival_time = ''; }
      if (k < n - 1) { q.departure_airport = ''; q.departure_time = ''; }
      var prev = plan[all[k * size - 1]], others = all.filter(function (d) { return ds.indexOf(d) < 0 && plan[d]; }).map(function (d) { return plan[d].focus; }).filter(Boolean);
      var txt = 'MULTI-PART BUILD (binding): this is part ' + (k + 1) + ' of ' + n + ' of ONE continuous trip (' + request.start_date + ' to ' + request.end_date + '). Build ONLY the days ' + ds[0] + ' to ' + ds[ds.length - 1] + '. Follow this fixed day plan exactly:\n' +
        ds.map(function (d) { var p = plan[d] || {}; return '- ' + d + ': ' + (p.focus || '') + ' | overnight: ' + (p.overnight_location || '-'); }).join('\n') +
        (k > 0 ? '\nThe first day starts in the morning at ' + ((prev && prev.overnight_location) || 'the previous overnight location') + ' – the travelers slept there; there is NO arrival flight in this part.' : '') +
        (k < n - 1 ? '\nThe last day ends with the overnight shown above – there is NO departure flight and no return to the airport in this part.' : '') +
        '\nMust-see places and the traveler notes were already assigned to specific days in this plan – include only what belongs to your days.' +
        (others.length ? '\nThese places belong to OTHER days – do not use them here: ' + others.join('; ') : '');
      q.notes = [q.notes, txt].filter(Boolean).join('\n'); q.part = { index: k + 1, total: n }; q.must = '';
      parts.push({ req: q, state: 'queued', tries: 0 });
    }
    return parts;
  }
  function queuePart(job, i) {
    var u = me(), part = job.parts[i];
    part.tries = (part.tries || 0) + 1; part.state = 'running'; part.startedAt = Date.now(); delete part.jobId;
    return invokeTimed({ action: 'build_trip_async', trip_id: job.tripId, user_id: (u && u.id) || null, trip: part.req }, 30000).then(function (r) {
      var d = r && r.data; if (!d || !d.ok || !d.job_id) throw new Error((d && d.error) || 'QUEUE_FAILED');
      part.jobId = d.job_id;
    });
  }
  function saveJob(job) { var all = jobsGet(), found = false; all = all.map(function (j) { if (j.id === job.id) { found = true; return job; } return j; }); if (!found) all.push(job); jobsSet(all); }
  function startJob(request, profile, name, tripId, aiNotes) {
    var sb = sbc(), u = me(); if (!sb || !u) return Promise.reject(new Error(t('אין חיבור לחשבון', 'Not signed in')));
    var job = { id: 'grp-' + Date.now(), tripId: tripId, name: name, startedAt: Date.now(), state: 'running', profile: profile, request: request, aiNotes: aiNotes, parts: [] };
    var nDays = datesFrom(request.start_date, request.end_date).length;
    saveJob(job);
    function skeletonOnce() { return invokeTimed({ action: 'trip_skeleton', trip_id: tripId, user_id: u.id || null, trip: JSON.parse(JSON.stringify(request)) }, 60000).then(function (r) { var d = r && r.data; return d && d.ok && d.days && d.days.length ? d.days : null; }).catch(function () { return null; }); }
    var planP = nDays > PART_DAYS ? skeletonOnce().then(function (sk) { return sk || skeletonOnce(); }) : Promise.resolve(null);
    return planP.then(function (skeleton) {
      job.parts = skeleton ? partRequests(request, skeleton) : [{ req: request, state: 'queued', tries: 0 }]; job.skeleton = skeleton || null;
      return Promise.all(job.parts.map(function (_, i) { return queuePart(job, i); }));
    }).then(function () { saveJob(job); pollGroup(job); return job; }, function (e) { jobRemove(job.id); throw e; });
  }
  function mergeParts(results, skeleton) {
    var first = results[0], last = results[results.length - 1], days = [];
    results.forEach(function (r) { (r.days || []).forEach(function (d) { days.push(d); }); });
    // same overnight in the plan = same name everywhere (parts may phrase it differently)
    var plan = {}; (skeleton || []).forEach(function (x) { if (x && x.date) plan[x.date] = norm(x.overnight_location || ''); });
    var canon = {};
    days.forEach(function (d) { var k = plan[d.date]; if (!k || !d.overnight_location) return; if (!canon[k]) canon[k] = d.overnight_location; else d.overnight_location = canon[k]; });
    days.forEach(function (d, i) { d.day_number = i + 1; });
    var m = Object.assign({}, first, { days: days, end_date: last.end_date || first.end_date });
    var notes = []; results.forEach(function (r) { (r.important_notes || []).forEach(function (x) { if (notes.indexOf(x) < 0) notes.push(x); }); }); m.important_notes = notes;
    var c0 = first.estimated_trip_cost;
    if (typeof c0 === 'number') m.estimated_trip_cost = results.reduce(function (a, r) { return a + (+r.estimated_trip_cost || 0); }, 0);
    else if (c0 && typeof c0 === 'object') { var sum = {}; Object.keys(c0).forEach(function (k) { sum[k] = typeof c0[k] === 'number' ? results.reduce(function (a, r) { return a + (+((r.estimated_trip_cost || {})[k]) || 0); }, 0) : c0[k]; }); m.estimated_trip_cost = sum; }
    if (results.length > 1) m.summary = results.map(function (r) { return r.summary; }).filter(Boolean).join(' ');
    return m;
  }
  window.tcV180 = { partRequests: partRequests, mergeParts: mergeParts, datesFrom: datesFrom };
  function pollGroup(job) {
    if (polling[job.id]) return; polling[job.id] = true;
    (function tick() {
      var cur = jobsGet().find(function (j) { return j.id === job.id; });
      if (!cur || cur.state === 'failed') { delete polling[job.id]; return; }
      var sb = sbc(); if (!sb || !me()) { setTimeout(tick, 5000); return; }
      var ids = cur.parts.map(function (p) { return p.jobId; }).filter(Boolean);
      if (!ids.length) { setTimeout(tick, 4000); return; }
      sb.from('tripcraft_build_jobs').select('id,status,result,error').in('id', ids).then(function (r) {
        var rows = (r && r.data) || [], retries = [];
        cur.parts.forEach(function (p, i) {
          var row = rows.find(function (x) { return x.id === p.jobId; }); if (p.state === 'done') return;
          if (row && row.status === 'done' && row.result && row.result.itinerary) { p.state = 'done'; p.result = row.result; return; }
          var bad = (row && row.status === 'failed') || (Date.now() - (p.startedAt || cur.startedAt) > JOB_MAX_MS);
          if (bad) { if (p.tries < 2) retries.push(i); else p.state = 'failed'; }
        });
        if (cur.parts.some(function (p) { return p.state === 'failed'; })) { delete polling[job.id]; saveJob(cur); fail(cur, 'PART_FAILED'); return; }
        var next = retries.length ? Promise.all(retries.map(function (i) { return queuePart(cur, i); })) : Promise.resolve();
        next.then(function () {
          saveJob(cur);
          if (cur.parts.every(function (p) { return p.state === 'done'; })) {
            delete polling[job.id];
            var res = cur.parts.map(function (p) { return p.result; });
            var payload = { itinerary: mergeParts(res.map(function (x) { return x.itinerary; }), cur.skeleton), usage: res.map(function (x) { return x.usage; }), cost_usd: res.reduce(function (a, x) { return a + (+x.cost_usd || 0); }, 0) };
            materialize(cur, payload).catch(function (e) { fail(cur, e && e.message); });
            return;
          }
          setTimeout(tick, 4000);
        }, function (e) { delete polling[job.id]; fail(cur, e && e.message); });
      }, function () { setTimeout(tick, 6000); });
    })();
  }
  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-job-retry]'), x = e.target.closest('[data-job-dismiss]');
    if (x) { jobRemove(x.dataset.jobDismiss); return; }
    if (r) { var j = jobsGet().find(function (q) { return q.id === r.dataset.jobRetry; }); if (!j) return; jobRemove(j.id); startJob(j.request, j.profile, j.name, j.tripId, j.aiNotes).then(function () { toast(t('הבנייה התחילה מחדש ברקע', 'Build restarted in the background')); }, function (er) { toast(String(er.message || er), 'error'); }); }
  });

  // "Build trip": queue on the server and free the user immediately
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#plannerBuild'); if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!me()) { try { sessionStorage.setItem('tc_return_after_login', '#planner'); sessionStorage.setItem('tc_after_login_action', 'build_trip'); } catch (x) {} location.hash = '#login'; return; }
    if (btn.dataset.busy === '1') return;
    var d; try { d = plannerData(); } catch (x) { return; }
    if (!d.tripName || !d.country || !d.start || !d.end) { window.tcAlert(t('חסרים שם טיול, מדינה או תאריכים.', 'Trip name, country or dates are missing.')); return; }
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (x) {}
    btn.dataset.busy = '1'; btn.disabled = true; var label = btn.textContent; btn.textContent = t('שולח לבנייה…', 'Sending…');
    var p = P(), tripId = (p.currentTripId && !(p.draft && p.draft.tripId === p.currentTripId && p.draft.status === 'ready')) ? p.currentTripId : (window.tcNewTripId ? window.tcNewTripId() : 'TC-' + Date.now());
    var lang = HE ? 'he' : 'en';
    var request = { country: d.country, region: d.region || '', destination: d.destination, geographic_bound: { country: d.country, strict: true, allow_cross_border: (d.countries || []).length > 1, allowed_countries: d.countries },
      start_date: d.start, end_date: d.end, travelers: d.people, language: lang, intensity: d.pace, trip_name: d.tripName, group: d.group, children: d.children, transport: d.transport, interests: d.interests,
      must: d.must, avoid: d.avoid, notes: d.free, arrival_airport: d.arrivalAirport || '', departure_airport: d.departureAirport || d.arrivalAirport || '', arrival_time: d.arrivalTime || '', departure_time: d.departureTime || '' };
    Promise.resolve(window.tcV163SavePreflight ? window.tcV163SavePreflight() : true)
      .then(function () { return startJob(request, d, d.tripName, tripId, aiNotesValue()); })
      .then(function () {
        p.currentTripId = null;
        toast(t('✓ הטיול נבנה עכשיו ב"החשבון שלי". אפשר להמשיך לגלוש — נודיע כשהוא מוכן (בערך דקה).', '✓ Your trip is being built in My account. Keep browsing — we’ll let you know when it’s ready (about a minute).'));
        location.hash = '#account'; window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function () { try { window.tcRenderAccount(); } catch (e) {} }, 300);
      })
      .catch(function (er) { window.tcAlert(t('לא הצלחנו להתחיל את בניית הטיול: ', 'Could not start the build: ') + (er && er.message || er)); })
      .then(function () { btn.dataset.busy = ''; btn.disabled = false; btn.textContent = label; });
  }, true);
  function resumeJobs() { jobsGet().forEach(function (j) { if (j.state === 'failed') return; if (j.parts) { if (j.parts.length && j.parts.every(function (p) { return p.jobId || p.state === 'done'; })) pollGroup(j); else jobUpdate(j.id, { state: 'failed' }); } else poll(j); }); renderJobBar(); }

  /* ================================================================
   * 11d. Accessibility (V175): working toggles, saved, keyboard, skip link
   * ================================================================ */
  var A11Y_KEY = 'tc_a11y_v175';
  var A11Y = [
    ['tcTextPlus', 'tc-large-text'], ['tcContrast', 'tc-high-contrast'], ['tcUnderline', 'tc-links-underlined'],
    ['tcNoMotion', 'tc-no-motion', 'עצירת אנימציות', 'Pause animations'], ['tcReadable', 'tc-readable-font', 'גופן קריא', 'Readable font'],
    ['tcBigCursor', 'tc-big-cursor', 'סמן גדול', 'Large cursor']
  ];
  function a11ySave() { lsSet(A11Y_KEY, A11Y.map(function (a) { return a[1]; }).filter(function (c) { return document.body.classList.contains(c); })); }
  function a11ySync() { A11Y.forEach(function (a) { var b = document.getElementById(a[0]); if (b) b.setAttribute('aria-pressed', document.body.classList.contains(a[1]) ? 'true' : 'false'); }); }
  function a11yPanelOpen(open) {
    var p = document.getElementById('tcA11yPanel'), b = document.getElementById('tcA11yBtn'); if (!p) return;
    p.classList.toggle('open', open); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var f = p.querySelector('button'); if (f) f.focus(); } else if (b) b.focus();
  }
  function setupA11y() {
    var p = document.getElementById('tcA11yPanel'), grid = p && p.querySelector('.a11y-grid'), reset = document.getElementById('tcA11yReset');
    if (grid && !document.getElementById('tcNoMotion')) {
      A11Y.forEach(function (a) {
        if (!a[2] || document.getElementById(a[0])) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn soft'; b.id = a[0];
        b.setAttribute('data-he', a[2]); b.setAttribute('data-en', a[3]); b.textContent = t(a[2], a[3]);
        grid.insertBefore(b, reset || null);
      });
    }
    if (p) { p.setAttribute('aria-modal', 'false'); }
    A11Y.forEach(function (a) {
      var b = document.getElementById(a[0]); if (!b || b.dataset.v175) return; b.dataset.v175 = '1';
      b.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        document.body.classList.toggle(a[1]); a11ySync(); a11ySave();
      }, true);
    });
    if (reset && !reset.dataset.v175) {
      reset.dataset.v175 = '1';
      reset.addEventListener('click', function () { A11Y.forEach(function (a) { document.body.classList.remove(a[1]); }); a11ySync(); a11ySave(); });
    }
    var saved = lsGet(A11Y_KEY, []); if (Array.isArray(saved)) saved.forEach(function (c) { document.body.classList.add(c); });
    a11ySync();
    // skip link
    if (!document.getElementById('tcSkip')) {
      var sk = document.createElement('a'); sk.id = 'tcSkip'; sk.className = 'tc-skip'; sk.href = '#main';
      sk.textContent = t('דלג לתוכן הראשי', 'Skip to main content');
      sk.addEventListener('click', function (e) {
        e.preventDefault(); var m = document.querySelector('main section.active, main .panel.active, main') || document.body;
        m.setAttribute('tabindex', '-1'); m.focus();
      });
      document.body.insertBefore(sk, document.body.firstChild);
    }
    // hidden mobile menu must not be focusable
    var mm = document.getElementById('tcMobileMenu');
    if (mm) {
      var syncInert = function () { var hidden = mm.getAttribute('aria-hidden') === 'true' && !mm.classList.contains('open'); if (hidden) mm.setAttribute('inert', ''); else mm.removeAttribute('inert'); };
      syncInert(); new MutationObserver(syncInert).observe(mm, { attributes: true, attributeFilter: ['aria-hidden', 'class'] });
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.tc-legal-toc a'); if (!a) return;
    e.preventDefault(); var el = document.querySelector(a.getAttribute('href')); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var p = document.getElementById('tcA11yPanel'); if (p && p.classList.contains('open')) { a11yPanelOpen(false); return; }
    var mm = document.getElementById('tcMobileMenu'); if (mm && mm.classList.contains('open') && window.tcMenu) window.tcMenu(false);
  });
  document.addEventListener('click', function (e) {
    var p = document.getElementById('tcA11yPanel'); if (!p || !p.classList.contains('open')) return;
    if (e.target.closest('#tcA11yPanel, #tcA11yBtn')) return; a11yPanelOpen(false);
  });

  /* ================================================================
   * 12. Boot
   * ================================================================ */
  function relabelCountryChips() {
    if (HE) return;
    document.querySelectorAll('#countryChoices label, #selectedCountries .selected-country').forEach(function (l) {
      var inp = l.querySelector('input'), sp = l.querySelector('span'), v = inp ? inp.value : (l.dataset.country || '');
      var iso = countryIso(v); if (!iso || !sp || sp.dataset.v170) return;
      sp.dataset.v170 = '1'; sp.textContent = flag(iso) + ' ' + countryLabel(iso);
    });
  }
  function boot() {
    relabelCountryChips(); observeAccount(); buildNotesCard(); resumeJobs(); setupA11y();
    document.querySelectorAll('footer *').forEach(function (el) { if (el.childNodes.length === 1 && el.firstChild.nodeType === 3 && /V1\d\d/.test(el.textContent)) el.textContent = el.textContent.replace(/V1\d\d/, 'V180'); });
    enhanceCountrySearch(); enhanceMustField(); fixSubnav(); watchCalendar(); wireSave(); wrapInvoke(); decorateDateDisplays();
    ['plStart', 'plEnd'].forEach(function (id) { var el = $(id); if (el && !el.dataset.v170) { el.dataset.v170 = '1'; el.addEventListener('change', function () { decorateDateDisplays(); renderFlightContext(); }); } });
    try { var cur = plannerStep1Part; showPartSilently(cur); } catch (e) {}
    if (draft()) try { enhanceResult(); } catch (e) {}
  }
  function showPartSilently(part) {
    var step = document.querySelector('.planner-step[data-step="1"]'); if (!step) return;
    Object.keys(PART_CLASS).forEach(function (k) { var el = step.querySelector(PART_CLASS[k]); if (el) el.classList.toggle('tc-part-active', +k === part); });
    step.querySelectorAll('.step1-subnav span').forEach(function (x) { x.classList.toggle('active', Number(x.dataset.part) === part); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('hashchange', function () { setTimeout(function () { wrapInvoke(); wireSave(); if (location.hash === '#account') try { window.tcRenderAccount(); } catch (e) {} }, 60); });
  setTimeout(boot, 1500);
})();
