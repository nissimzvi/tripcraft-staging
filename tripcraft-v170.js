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
  function tripCountryIsos() {
    var names = [];
    try { var d = typeof plannerData === 'function' ? plannerData() : null; if (d) names = (d.countries && d.countries.length ? d.countries : [d.country]); } catch (e) {}
    var dr = draft();
    if (!names.length && dr && dr.plannerProfile) names = dr.plannerProfile.countries || [dr.plannerProfile.country || dr.country];
    return names.filter(Boolean).map(countryIso).filter(Boolean);
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
      return { kind: 'airport', main: cityLbl + ' · ' + nameLbl, sub: a[1] + ' · ' + countryLabel(a[3]), value: a[1] + ' (' + a[0] + ')', code: a[0], lat: a[4], lon: a[5] };
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
        '&accept-language=' + (HE ? 'he,en' : 'en') + '&q=' + encodeURIComponent(q) + (isos && isos.length ? '&countrycodes=' + isos.join(',').toLowerCase() : '');
      return fetch(u, { headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('geo ' + r.status); return r.json(); });
    });
  }
  function photonSearch(q, isos) {
    return fetch('https://photon.komoot.io/api/?limit=8&lang=en&q=' + encodeURIComponent(q)).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { return (j.features || []).filter(function (f) { var cc = String((f.properties || {}).countrycode || '').toUpperCase(); return !isos.length || isos.indexOf(cc) >= 0; }); });
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
  function showPart(part) {
    part = Math.max(1, Math.min(3, Number(part) || 1));
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
    var fl = p.flights.arrival_airport ? (p.flights.arrival_airport + ' · ' + p.flights.arrival_time + '  →  ' + p.flights.departure_airport + ' · ' + p.flights.departure_time) : t('ללא טיסות', 'No flights');
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
    return [
      'Follow every user selection exactly. Do not add countries, regions or activities the user excluded.',
      'Use ONLY the transport modes listed in transport. Respect max_daily_drive, comfortable_walking, pace and day_length on every day.',
      'Every item in must_see must appear in the itinerary. Never include anything matching avoid.',
      'If flights are given: day 1 starts after arrival_time at arrival_airport (allow immigration + car pickup); the last day ends at departure_airport at least 3 hours before departure_time.',
      'Lodging: respect lodging.mode, types, price_level, hotel_stars and must_have. For each overnight area recommend exactly 3 real, currently operating hotels that match these filters.',
      'If a selection is impossible, keep the closest valid option and explain it in a note instead of silently ignoring it.'
    ];
  }
  function wrapInvoke() {
    var sb = null; try { sb = typeof tcSupabase === 'function' ? tcSupabase() : null; } catch (e) {}
    if (!sb || !sb.functions || sb.functions.__v170) return;
    var orig = sb.functions.invoke.bind(sb.functions);
    sb.functions.invoke = function (fn, opts) {
      try {
        var body = opts && opts.body;
        if (body && typeof body === 'object' && body.action) {
          var prof = fullProfile();
          if (body.trip && typeof body.trip === 'object' && document.querySelector('.planner-step[data-step="1"]')) {
            if (body.action === 'build_trip' || !body.trip.preferences) {
              body.trip.preferences = prof;
              body.trip.strict_instructions = strictInstructions(prof);
              body.trip.hotel_recommendations_per_area = 3;
              if (prof.must_see.length) body.trip.must = prof.must_see.join(', ');
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
    sb.functions.__v170 = true;
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
  var GEO_KEY = 'tc_geo_v170', geoCache = lsGet(GEO_KEY, {});
  var VAGUE = /^(באירוח|במסעדה|האזור|אזור הלינה|מקום הלינה|הבסיס|בסיס|המלון|לינה|ארוחת|nearby|the area|your hotel|hotel|accommodation)/i;
  function stopQuery(st) { return String(st.place || st.location || st.name || '').replace(/\s*\(([A-Z]{3})\)\s*$/, ' $1').trim(); }
  function geocodeStop(st) {
    if (st && st.lat && st.lon) return Promise.resolve({ lat: +st.lat, lon: +st.lon, exact: st.geoExact !== false });
    var q = stopQuery(st || {}); if (!q || VAGUE.test(q)) return Promise.resolve(null);
    var iata = q.match(/\b([A-Z]{3})$/), ap = iata && window.tcAirportByCode(iata[1]);
    if (ap) { st.lat = ap[4]; st.lon = ap[5]; st.geoExact = true; return Promise.resolve({ lat: ap[4], lon: ap[5], exact: true }); }
    var isos = tripCountryIsos(), key = isos.join(',') + '|' + norm(q);
    if (geoCache[key] !== undefined) { var c = geoCache[key]; if (c) { st.lat = c.lat; st.lon = c.lon; st.geoExact = true; } return Promise.resolve(c); }
    return nominatimSearch(q, isos, 1).then(function (rows) {
      var r = rows && rows[0], c = r ? { lat: +(+r.lat).toFixed(6), lon: +(+r.lon).toFixed(6), exact: true } : null;
      geoCache[key] = c; lsSet(GEO_KEY, geoCache);
      if (c) { st.lat = c.lat; st.lon = c.lon; st.geoExact = true; }
      return c;
    }).catch(function () { return null; });
  }
  function wazeUrl(c, q) { return c ? 'https://www.waze.com/ul?ll=' + c.lat + '%2C' + c.lon + '&navigate=yes&zoom=17' : 'https://www.waze.com/ul?q=' + encodeURIComponent(q) + '&navigate=yes'; }
  function gmapsUrl(c, q) { return c ? 'https://www.google.com/maps/search/?api=1&query=' + c.lat + '%2C' + c.lon : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function dayRouteUrl(day) {
    var pts = (day.stops || []).map(function (s) { return s.lat && s.lon ? s.lat + ',' + s.lon : stopQuery(s); }).filter(Boolean);
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
      var url = kind === 'waze' ? wazeUrl(c, stopQuery(st)) : gmapsUrl(c, stopQuery(st));
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
          '<a href="#" class="tc-btn tc-btn-waze" data-tc-nav="waze" data-day="' + di + '" data-stop="' + si + '">Waze</a><a href="#" class="tc-btn tc-btn-soft" data-tc-nav="gmaps" data-day="' + di + '" data-stop="' + si + '">Google Maps</a>') +
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
        st.name = v[0].trim() || st.name; st.place = v[1].trim() || st.place; st.time = v[2]; st.what = v[3].trim();
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
    return tpl && tpl.indexOf('{url}') >= 0 ? tpl.replace('{url}', encodeURIComponent(base)) : base;
  }
  function renderHotels() {
    var d = draft(), res = $('plannerResult'); if (!d || !res) return;
    var groups = hotelsFromAi(d), box = $('tcHotelPicks');
    if (!groups.length) { if (box) box.remove(); return; }
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
  function forgetWizardDraft() { try { localStorage.removeItem('tripcraft_planner_draft_v57'); } catch (e) {} }
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
  var accountSeq = 0;
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
        '<div class="tc-muted">' + esc([country, p.destination].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(' · ')) + (days ? ' · ' + days + ' ' + t('ימים', 'days') : '') + '</div>' +
        '<div class="tc-trip-dates">' + fmt(p.start) + ' – ' + fmt(p.end) + (HE && p.start ? '<span class="tc-hebdate">' + esc(hebrewDate(p.start)) + '</span>' : '') + '</div></div>' +
        '<div class="tc-trip-actions"><button type="button" class="tc-btn tc-btn-primary" data-acc-open="' + esc(p.tripId) + '">' + t('פתח / ערוך', 'Open / edit') + '</button>' +
        '<button type="button" class="tc-btn tc-btn-soft" data-acc-copy="' + esc(url) + '">🔗 ' + t('העתק קישור', 'Copy link') + '</button>' +
        '<button type="button" class="tc-btn tc-btn-ghost tc-danger-text" data-acc-del="' + esc(p.tripId) + '" data-name="' + esc(p.tripName || '') + '">🗑 ' + t('מחק', 'Delete') + '</button></div></article>';
    }).join('') : '<div class="tc-empty">' + t('עוד אין טיולים בחשבון. בואו נבנה את הראשון!', 'No trips yet. Let’s build your first one!') + '</div>';
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
    relabelCountryChips();
    document.querySelectorAll('footer *').forEach(function (el) { if (el.childNodes.length === 1 && el.firstChild.nodeType === 3 && /V1[0-6]\d/.test(el.textContent)) el.textContent = el.textContent.replace(/V1[0-6]\d/, 'V170'); });
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
