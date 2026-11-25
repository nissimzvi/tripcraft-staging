// TripCraft V160 — דוגמה לקובץ ההגדרות. העתיקו ל-tripcraft-config.js ומלאו ערכים.
// הערה: יש לבדוק לפני העלאה לסביבת ייצור.
// מותר כאן רק מזהים ציבוריים. לעולם לא service_role ולא מפתח OpenAI.
window.TRIPCRAFT_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-PUBLISHABLE-ANON-KEY',
  aiFunctionName: 'tripcraft-ai',
  bookingAffiliateTemplate: '',
  // ניתוח תנועה (חדש ב-V160) — מזהים ציבוריים, לא סודות:
  ga4MeasurementId: '',   // למשל 'G-ABC123XYZ' (Google Analytics 4 → Admin → Data streams)
  clarityProjectId: '',   // אופציונלי: Microsoft Clarity → Settings → Project ID (מפות חום והקלטות)
  publicBaseUrl: 'https://nissimzvi.github.io/tripcraft-app-test/',
  version: '160'
};
