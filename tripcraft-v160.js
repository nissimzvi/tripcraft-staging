/* TripCraft V160 runtime module.
   הערה: יש לבדוק קוד זה בסביבת בדיקות (Staging) לפני הרצה בסביבת ייצור.
   - Real trip editing through the tripcraft-ai Supabase function (action: edit_trip),
     with a local rule-based fallback when the function is unavailable.
   - Each trip allows MAX_EDITS successful AI edits; failed / no-op requests are not counted.
   - Bottom tab bar active state and "focus flow" (wizard / OTP hide the tab bar). */
(function () {
  'use strict';
  var MAX_EDITS = 5;
  var EDIT_TIMEOUT_MS = 150000; // V170: AI edit returns the full itinerary and can take up to ~2 minutes
  var isEn = function () { return String(document.documentElement.lang || 'he').toLowerCase().indexOf('en') === 0; };
  var t = function (he, en) { return isEn() ? en : he; };
  var $ = function (id) { return document.getElementById(id); };
  var P = function () { return window.planner || (typeof planner !== 'undefined' ? planner : null); };
  var escH = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- quota ---------- */
  function normalize(d) {
    if (!d) return d;
    d.maxChanges = MAX_EDITS;
    d.changeCount = Math.max(0, Math.min(Number(d.changeCount || 0), MAX_EDITS));
    return d;
  }
  function left(d) { return Math.max(0, MAX_EDITS - Number((d && d.changeCount) || 0)); }
  function renderQuota() {
    var d = P() && P().draft, q = $('plannerChangeQuota');
    if (!d || !q) return;
    normalize(d);
    var n = left(d);
    q.textContent = n > 0
      ? t('נותרו ' + n + ' מתוך ' + MAX_EDITS + ' עריכות AI', n + ' of ' + MAX_EDITS + ' AI edits left')
      : t('ניצלתם את ' + MAX_EDITS + ' עריכות ה-AI לטיול הזה', 'All ' + MAX_EDITS + ' AI edits for this trip are used');
    q.classList.toggle('is-low', n > 0 && n <= 2);
    q.classList.toggle('is-out', n === 0);
    ['plannerChatInput', 'plannerDayChatInput'].forEach(function (id) {
      var el = $(id); if (!el) return;
      el.disabled = n === 0;
      el.placeholder = n === 0
        ? t('אין עוד עריכות AI לטיול הזה. אפשר עדיין לערוך תחנות ידנית.', 'No AI edits left. You can still edit stops manually.')
        : t('למשל: ביום 2 להוסיף שייט באגם ולוותר על המוזיאון', 'e.g. On day 2 add a lake cruise and drop the museum');
    });
    ['plannerChatSend', 'plannerDayChatSend'].forEach(function (id) { var b = $(id); if (b && b.dataset.busy !== '1') b.disabled = n === 0; });
  }

  var origRender = window.renderPlannerDraft;
  if (typeof origRender === 'function') {
    window.renderPlannerDraft = function () {
      var d = P() && P().draft; normalize(d);
      var r = origRender.apply(this, arguments);
      renderQuota();
      return r;
    };
  }

  /* ---------- itinerary mapping (same schema as build_trip) ---------- */
  function toItinerary(d) {
    return {
      title: d.name || '',
      country: d.country || '',
      hotel_recommendations: ((d.aiItinerary || {}).hotel_recommendations) || [],
      days: (d.days || []).map(function (day) {
        return {
          date: day.date || '', title: day.title || '', overnight_location: day.lodging || '',
          day_summary: day.summary || '', route_summary: day.routeSummary || '',
          activities: (day.stops || []).map(function (s) {
            return { time: s.time || '', name: s.name || s.place || '', location: s.place || '', map_query: s.mapQuery || '', description: s.what || '',
              duration_minutes: Number(s.durationMinutes || 0), drive_minutes: Number(s.driveMinutes || 0),
              notes: s.notes || '', estimated_cost: Number(s.estimatedCost || 0) };
          })
        };
      })
    };
  }
  function fromItinerary(ai, prevDays) {
    return (ai.days || []).map(function (day, i) {
      var prev = (prevDays && prevDays[i]) || {};
      return {
        date: day.date || prev.date || '', title: day.title || prev.title || '',
        lodging: day.overnight_location != null ? day.overnight_location : (prev.lodging || ''),
        summary: day.day_summary || '', routeSummary: day.route_summary || '',
        stops: (day.activities || []).map(function (a) {
          return { time: a.time || '', name: a.name || '', place: a.location || a.name || '', mapQuery: a.map_query || '', what: a.description || a.name || '',
            durationMinutes: Number(a.duration_minutes || 0), driveMinutes: Number(a.drive_minutes || 0),
            notes: a.notes || '', estimatedCost: Number(a.estimated_cost || 0) };
        }).filter(function (s) { return s.place; })
      };
    });
  }
  function tripRequest(d) {
    var p = d.plannerProfile || {};
    return { destination: p.destination || '', start_date: p.start || '', end_date: p.end || '', travelers: p.people || 2,
      language: isEn() ? 'en' : 'he', intensity: p.pace || '', trip_name: d.name || '', group: p.group || '',
      children: p.children || 0, transport: p.transport || '', interests: p.interests || [], must: p.must || '',
      avoid: p.avoid || '', notes: p.free || '', arrival_airport: p.arrivalAirport || '', departure_airport: p.departureAirport || '' };
  }

  /* ---------- remote edit ---------- */
  function remoteEdit(d, instruction, scope, dayIndex) {
    var sb = typeof window.tcSupabase === 'function' ? window.tcSupabase() : null;
    if (!sb || !sb.functions || !sb.functions.invoke) return Promise.reject(new Error('AI_UNAVAILABLE'));
    var fn = (window.TRIPCRAFT_CONFIG && window.TRIPCRAFT_CONFIG.aiFunctionName) || 'tripcraft-ai';
    var user = typeof window.tcCustomer === 'function' ? window.tcCustomer() : null;
    var call = sb.functions.invoke(fn, { body: {
      action: 'edit_trip', trip_id: d.tripId || null, user_id: (user && user.id) || null,
      instruction: instruction, scope: scope, day_index: dayIndex, trip: tripRequest(d), itinerary: toItinerary(d),
      /* legacy fields understood by the V115-era function */ dayIndex: dayIndex, draft: d
    } });
    var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('AI_TIMEOUT')); }, EDIT_TIMEOUT_MS); });
    return Promise.race([call, timer]).then(function (res) {
      if (res && res.error) throw res.error;
      var data = (res && res.data) || {};
      if (data.ok === false) throw new Error(data.error || 'AI_EDIT_FAILED');
      var days = null;
      if (data.itinerary && Array.isArray(data.itinerary.days)) days = fromItinerary(data.itinerary, d.days);
      else if (data.draft && Array.isArray(data.draft.days)) days = data.draft.days;
      if (!days || !days.length) throw new Error('AI_EMPTY');
      return { days: days, itinerary: data.itinerary || null, message: data.message || t('עדכנתי את המסלול לפי הבקשה.', 'I updated the itinerary.'), source: 'ai' };
    });
  }

  /* ---------- local fallback (deterministic, no AI cost) ---------- */
  function dayFromText(text, fallback) {
    var m = String(text).match(/(?:יום|day)\s*(\d+)/i);
    return m ? Number(m[1]) - 1 : fallback;
  }
  function cleanVal(v) { return String(v || '').replace(/(?:ליום|ביום|מיום|to day|from day|on day)\s*\d+/ig, '').replace(/[.!?,]+$/, '').trim(); }
  function localEdit(d, text, scope, dayIndex) {
    var days = clone(d.days || []), idx = scope === 'day' ? dayIndex : dayFromText(text, -1);
    var day = days[idx], msg = '', changed = false, m;
    if ((m = text.match(/(?:להוסיף|תוסיף|הוסף|לשלב|תשלב|add|include)\s+(.+)/i)) && day) {
      var v = cleanVal(m[1]);
      if (v) { day.stops = day.stops || []; day.stops.push({ time: '', place: v, name: v, what: t('נוסף לפי בקשתכם. כדאי לבדוק במפה.', 'Added at your request. Check it on the map.') });
        changed = true; msg = t('הוספתי את ' + v + ' ליום ' + (idx + 1) + '.', 'Added ' + v + ' to day ' + (idx + 1) + '.'); }
    }
    if (!changed && (m = text.match(/(?:להוריד|תוריד|הורד|להסיר|תסיר|הסר|למחוק|תמחק|מחק|לבטל|תבטל|לוותר על|remove|delete|drop|skip)\s+(.+)/i)) && day) {
      var r = cleanVal(m[1]).replace(/^(?:את|the)\s+/i, '').toLowerCase();
      var si = (day.stops || []).findIndex(function (s) { return String(s.place || s.name || '').toLowerCase().indexOf(r) >= 0 || r.indexOf(String(s.place || '').toLowerCase()) >= 0; });
      if (si < 0 && /אחרונ|last/.test(r) && day.stops.length) si = day.stops.length - 1;
      if (si >= 0) { var gone = day.stops.splice(si, 1)[0]; changed = true; msg = t('הסרתי את ' + (gone.place || gone.name) + ' מיום ' + (idx + 1) + '.', 'Removed ' + (gone.place || gone.name) + ' from day ' + (idx + 1) + '.'); }
    }
    if (!changed && /רגוע|פחות עמוס|לרווח|relax|less busy|lighter/i.test(text)) {
      (day ? [day] : days).forEach(function (x) { if ((x.stops || []).length > 3) x.stops = x.stops.slice(0, 3); });
      changed = true; msg = day ? t('ריווחתי את יום ' + (idx + 1) + '.', 'Made day ' + (idx + 1) + ' lighter.') : t('ריווחתי את כל ימי הטיול.', 'Made the whole trip lighter.');
    }
    if (!changed) return Promise.reject(new Error('LOCAL_NO_MATCH'));
    return Promise.resolve({ days: days, message: msg, source: 'local' });
  }

  /* ---------- chat wiring ---------- */
  function bubble(log, cls, html) {
    if (!log) return null;
    log.insertAdjacentHTML('beforeend', '<div class="chatmsg ' + cls + '">' + html + '</div>');
    log.scrollTop = log.scrollHeight;
    return log.lastElementChild;
  }
  function editingDay() { try { return typeof plannerEditingDay !== 'undefined' ? plannerEditingDay : -1; } catch (e) { return -1; } }

  function send(scope) {
    var dayScope = scope === 'day';
    var input = $(dayScope ? 'plannerDayChatInput' : 'plannerChatInput');
    var log = $(dayScope ? 'plannerDayChatLog' : 'plannerChatLog');
    var btn = $(dayScope ? 'plannerDayChatSend' : 'plannerChatSend');
    var d = P() && P().draft;
    var text = String((input && input.value) || '').trim();
    if (!text || !d || (btn && btn.dataset.busy === '1')) return;
    normalize(d);
    if (left(d) === 0) { bubble(log, 'bot', escH(t('ניצלתם את 5 עריכות ה-AI לטיול הזה. אפשר עדיין לערוך תחנות ידנית בפירוט היום.', 'All 5 AI edits are used. You can still edit stops manually in day details.'))); renderQuota(); return; }
    var dayIndex = dayScope ? editingDay() : dayFromText(text, -1);
    if (dayScope && !(d.days || [])[dayIndex]) { bubble(log, 'bot', escH(t('לא מצאתי את היום. סגרו ופתחו שוב את פירוט היום.', 'Day not found. Close and reopen day details.'))); return; }
    bubble(log, 'user', escH(text));
    input.value = '';
    var thinking = bubble(log, 'bot tc-thinking', escH(t('ה-AI מעדכן את המסלול… זה יכול לקחת עד דקה–שתיים.', 'The AI is updating your itinerary… this can take a minute or two.')));
    if (btn) { btn.dataset.busy = '1'; btn.disabled = true; }
    var snapshot = clone(d);
    remoteEdit(snapshot, text, dayScope ? 'day' : 'trip', dayIndex)
      .catch(function (err) {
        // V164: never fall back to the naive local edit - it appended raw text as a stop and still counted the edit.
        console.warn('TripCraft V164: AI edit failed', err && (err.message || err));
        throw new Error('AI_EDIT_FAILED');
      })
      .then(function (res) {
        var cur = P().draft;
        cur.days = res.days;
        if (res.itinerary && Array.isArray(res.itinerary.hotel_recommendations)) cur.aiItinerary = Object.assign({}, cur.aiItinerary || {}, { hotel_recommendations: res.itinerary.hotel_recommendations });
        cur.changeCount = Number(cur.changeCount || 0) + 1;
        cur.changeLog = (cur.changeLog || []).concat([{ at: new Date().toISOString(), text: text.slice(0, 300), scope: scope, day: dayIndex, source: res.source }]);
        if (thinking) thinking.remove();
        var n = left(cur);
        bubble(log, 'bot', escH(res.message) + '<br><small>' + escH(n > 0 ? t('נותרו ' + n + ' עריכות.', n + ' edits left.') : t('זו הייתה העריכה האחרונה.', 'That was the last edit.')) + '</small>');
        window.renderPlannerDraft && window.renderPlannerDraft();
        if (dayScope && typeof window.plannerRenderDayEditor === 'function') { try { window.plannerRenderDayEditor(); } catch (e) {} }
        if (typeof window.tcLogEvent === 'function') window.tcLogEvent('trip_change', { n: cur.changeCount, source: res.source, text: text.slice(0, 160) });
        if (typeof window.tcSaveCurrentTrip === 'function') return window.tcSaveCurrentTrip(false);
      })
      .catch(function (err) {
        if (thinking) thinking.remove();
        var local = err && err.message === 'LOCAL_NO_MATCH';
        bubble(log, 'bot', escH(local
          ? t('לא הצלחתי לבצע את השינוי כרגע. נסו לנסח עם מספר יום ושם מקום, למשל: "ביום 3 להוסיף מפלי קרימל". העריכה לא נספרה.', 'I could not apply that right now. Try naming a day and a place, e.g. "On day 3 add Krimml Falls". This edit was not counted.')
          : t('עריכת AI לא הצליחה כרגע, והמסלול לא השתנה. העריכה לא נספרה. אפשר לערוך תחנות ידנית בכפתורי "עדכן נקודה" / "הסר נקודה".', 'The AI edit did not go through and nothing changed. It was not counted. You can still edit stops manually.')));
      })
      .then(function () { if (btn) { btn.dataset.busy = '0'; } renderQuota(); });
  }

  function rewire(btnId, inputId, scope) {
    var b = $(btnId), i = $(inputId);
    if (b) { var nb = b.cloneNode(true); b.replaceWith(nb); nb.addEventListener('click', function () { send(scope); }); }
    if (i) { var ni = i.cloneNode(true); i.replaceWith(ni); ni.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(scope); } }); }
  }
  rewire('plannerChatSend', 'plannerChatInput', 'trip');
  rewire('plannerDayChatSend', 'plannerDayChatInput', 'day');
  var hint = document.createElement('p');
  hint.className = 'tc-edit-hint';
  hint.textContent = t('כל טיול כולל ' + MAX_EDITS + ' עריכות AI. עריכה ידנית של תחנות בפירוט היום חופשית ולא נספרת.', 'Each trip includes ' + MAX_EDITS + ' AI edits. Manual stop edits in day details are free.');
  var ci = $('plannerChatInput'); if (ci && ci.parentElement) ci.parentElement.insertAdjacentElement('afterend', hint);

  /* ---------- tab bar + focus flow ---------- */
  var app = $('mainApp');
  function syncShell() {
    var page = (app && app.dataset.page) || 'home';
    document.querySelectorAll('.tc-tabbar a[href^="#"]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + page); });
    var otp = $('tcOtpStep'), result = document.querySelector('#plannerResult.show');
    var wizard = page === 'planner' && !result;
    var otpOpen = page === 'login' && otp && !otp.hidden;
    document.body.classList.toggle('tc-focus-flow', !!(wizard || otpOpen));
  }
  if (app) new MutationObserver(syncShell).observe(app, { attributes: true, attributeFilter: ['data-page'] });
  var otpStep = $('tcOtpStep'); if (otpStep) new MutationObserver(syncShell).observe(otpStep, { attributes: true, attributeFilter: ['hidden'] });
  var res = $('plannerResult'); if (res) new MutationObserver(syncShell).observe(res, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('hashchange', function () { setTimeout(syncShell, 0); });
  syncShell();
  /* close the "More" sheet after choosing a destination in it */
  document.querySelectorAll('#tcMobileMenu a').forEach(function (a) { a.addEventListener('click', function () { var tg = $('tcNavToggle'); if (tg) tg.checked = false; }); });

  /* first wizard screen: "Back" leaves the planner, so say so */
  function syncPrevLabel() {
    var prev = $('plannerPrev'); if (!prev || !P()) return;
    var part = Number(document.body.dataset.tcStep1Part || 1);
    var first = P().step === 1 && part <= 1;
    prev.textContent = first ? t('יציאה', 'Exit') : t('הקודם', 'Back');
  }
  ['plannerShowStep', 'showPlannerStep1Part'].forEach(function (name) {
    var f = window[name];
    if (typeof f === 'function') window[name] = function () { var r = f.apply(this, arguments); syncPrevLabel(); return r; };
  });
  document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#plannerNext,#plannerPrev')) setTimeout(syncPrevLabel, 0); });
  syncPrevLabel();


  /* "Previous" on the very first screen leaves the wizard — say so */
  function syncPrev() {
    var b = $('plannerPrev'); if (!b) return;
    var part = 1; try { part = typeof plannerStep1Part !== 'undefined' ? plannerStep1Part : 1; } catch (e) {}
    var first = P() && P().step === 1 && part === 1;
    b.textContent = first ? t('יציאה', 'Exit') : t('הקודם', 'Back');
  }
  ['plannerShowStep', 'showPlannerStep1Part'].forEach(function (name) {
    var f = window[name]; if (typeof f !== 'function') return;
    window[name] = function () { var r = f.apply(this, arguments); syncPrev(); return r; };
  });
  var pv = $('plannerPrev'); if (pv) pv.addEventListener('click', function () { setTimeout(syncPrev, 0); });
  var nx = $('plannerNext'); if (nx) nx.addEventListener('click', function () { setTimeout(syncPrev, 0); });
  syncPrev();

  window.TripCraftV160 = { version: 'V160', maxEdits: MAX_EDITS, renderQuota: renderQuota, localEdit: localEdit };
})();
