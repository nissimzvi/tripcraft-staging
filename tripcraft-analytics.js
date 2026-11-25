/* TripCraft V160 — traffic analytics (Google Analytics 4 + optional Microsoft Clarity).
   הערה: יש לבדוק קוד זה בסביבת בדיקות לפני הרצה בסביבת ייצור.
   IDs come from tripcraft-config.js (public measurement IDs, not secrets):
     ga4MeasurementId: 'G-XXXXXXXXXX', clarityProjectId: 'xxxxxxxxxx'
   Nothing is loaded until the visitor accepts the analytics notice. */
(function () {
  'use strict';
  var KEY = 'tc_analytics_consent';
  var cfg = window.TRIPCRAFT_CONFIG || {};
  var GA = String(cfg.ga4MeasurementId || '').trim();
  var CL = String(cfg.clarityProjectId || '').trim();
  var en = function () { return String(document.documentElement.lang || '').indexOf('en') === 0; };
  var started = false;
  function consent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function page() { var a = document.getElementById('mainApp'); return (a && a.dataset.page) || 'home'; }

  function track(name, params) {
    if (!started) return;
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
    try { if (window.clarity) window.clarity('event', name); } catch (e) {}
  }
  function pageview() {
    track('page_view', { page_title: document.title + ' · ' + page(), page_location: location.origin + location.pathname + '#' + page(), page_path: '/' + page() });
  }
  function start() {
    if (started || (!GA && !CL)) return;
    started = true;
    if (GA) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      /* SPA: page views are sent manually on every screen change */
      window.gtag('config', GA, { send_page_view: false, anonymize_ip: true });
    }
    if (CL) {
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', CL);
    }
    pageview();
  }

  /* screen changes */
  var app = document.getElementById('mainApp'), last = null;
  if (app) new MutationObserver(function () { if (page() !== last) { last = page(); pageview(); } }).observe(app, { attributes: true, attributeFilter: ['data-page'] });

  /* business events already logged by the app */
  var MAP = { trip_built: 'trip_built', trip_change: 'trip_ai_edit', login_verified: 'login', trip_saved: 'trip_saved' };
  var orig = window.tcLogEvent;
  window.tcLogEvent = function (type, data) {
    try { if (MAP[type]) track(MAP[type], { days: data && data.days, edit_number: data && data.n, source: data && data.source }); } catch (e) {}
    return typeof orig === 'function' ? orig.apply(this, arguments) : undefined;
  };
  /* funnel + revenue clicks */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/booking\.com|anrdoezrs|dpbolvw|jdoqocy|kqzyfj|tkqlhce/i.test(href) || a.classList.contains('booking-cta')) track('booking_click', { page: page() });
    else if (a.id === 'plannerBuild') track('build_trip_click');
    else if (a.id === 'tcCheckEmail' || a.id === 'tcRegisterOtp') track(a.id === 'tcRegisterOtp' ? 'sign_up_start' : 'login_start');
    else if (href === '#planner') track('plan_trip_click', { from: page() });
  }, true);

  /* consent notice */
  function banner() {
    if (!GA && !CL) return;
    var c = consent();
    if (c === 'granted') { start(); return; }
    if (c === 'denied') return;
    var b = document.createElement('div');
    b.className = 'tc-consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<p>' + (en() ? 'We use analytics cookies to understand how TripCraft is used and improve it.' : 'אנחנו משתמשים בעוגיות לניתוח תנועה כדי להבין איך משתמשים ב-TripCraft ולשפר אותו.') +
      ' <a href="#legal">' + (en() ? 'Privacy' : 'פרטיות') + '</a></p><div class="tc-consent-actions"><button type="button" class="btn soft" data-c="denied">' +
      (en() ? 'Decline' : 'לא תודה') + '</button><button type="button" class="btn" data-c="granted">' + (en() ? 'Accept' : 'אישור') + '</button></div>';
    b.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-c'); if (!v) return;
      setConsent(v); b.remove(); if (v === 'granted') start();
    });
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
  window.TripCraftAnalytics = { track: track, enabled: function () { return started; }, ids: { ga4: !!GA, clarity: !!CL } };
})();
