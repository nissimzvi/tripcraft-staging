# TripCraft V160

> הערה: יש לבדוק את כל הקבצים בסביבת בדיקות לפני העלאה לסביבת ייצור.

נבנה על בסיס V144 מהמאגר (הגרסה האחרונה שבה מנוע האפליקציה היה קיים).

## מה תוקן
1. הרשמת משתמש חדש: בדיקת השדות קראה שדה שלא קיים (tcEmail) ולכן כל הרשמה נחסמה.
2. משתמש חדש: Supabase מחזיר 422 (otp_disabled) ולא 400, ולכן לא נפתח טופס ההרשמה.
3. שמירת טיול נכשלה ("tcTripDatesFromDraft is not defined").
4. עריכה עם AI הייתה הדמיה. עכשיו: עד 5 עריכות AI לטיול, נספרות רק עריכות שהצליחו, נשמרות בענן.
5. כל מבקר נכנס למצב Admin דמו בטעינה.
6. סקריפט Booking/CJ נחסם ב-CSP.
7. מנגנון ניתוב כפול הוסר; 15 שכבות CSS הוחלפו בקובץ אחד: tripcraft-v160.css.
8. נוסף ניתוח תנועה: Google Analytics 4 ו-Microsoft Clarity (אופציונלי) עם הודעת הסכמה.

## הגדרות נדרשות
- tripcraft-config.js: להוסיף ga4MeasurementId (ואופציונלית clarityProjectId). ראו tripcraft-config.example.js.
- Supabase → Authentication → Email Templates: בתבניות Magic Link וגם Confirm signup להוסיף {{ .Token }} כדי שיישלח קוד בן 6 ספרות.
- Supabase → Authentication → SMTP: חיבור SMTP משלכם (למשל Resend) — השרת המובנה מוגבל לכמה מיילים בשעה.
- פונקציית tripcraft-ai צריכה לתמוך ב-action: "edit_trip" (מקבלת instruction, itinerary ומחזירה {ok:true, itinerary}).
  כל עוד היא לא תומכת, העריכה עוברת לעריכה מקומית בסיסית (הוספה/הסרה/ריווח לפי מספר יום).

## העלאה
להעלות את תוכן התיקייה לשורש המאגר, בלי לדרוס את tripcraft-config.js הקיים (רק להוסיף לו את שדות האנליטיקס).
