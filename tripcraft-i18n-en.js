/* TripCraft V170 - English UI dictionary for index-en.html (translates leftover Hebrew UI text).
   NOTE: review before production deployment. */
(function () {
  'use strict';
  if ((document.documentElement.lang || '').indexOf('en') !== 0) return;
  var D = {
    'התקן אפליקציה': 'Install app', 'עברית': 'עברית',
    'אשף תכנון, עריכת ימים ושיחה עם עוזר התכנון.': 'Planning wizard, day editing and a chat with the planning assistant.',
    'יבוא טיול': 'Import a trip', 'Excel / Word / PDF לתבנית TripCraft.': 'Excel / Word / PDF into the TripCraft template.',
    'ניהול': 'Admin', 'בדיקות, טיולים מיובאים והכנה להרשאות Admin.': 'Checks, imported trips and admin permissions.',
    '🔐 פרטיות ואבטחה בתכנון': '🔐 Privacy and security by design', '♿ ממשק נגיש ורספונסיבי': '♿ Accessible, responsive interface',
    '💳 תשלום דרך ספק סליקה': '💳 Payment through a payment provider', '🧠 AI כחלק מהטיול': '🧠 AI built into your trip',
    '📚 היסטוריית טיולים אישית': '📚 Personal trip history', '📱 הטיול זמין גם מהנייד': '📱 Your trip on your phone',
    'בנו טיול חדש': 'Build a new trip', 'ראו הצעות לטיולים': 'See trip ideas', 'HTML מלא': 'Full HTML',
    '8 ימים': '8 days', '25 ימים': '25 days', '10 ימים': '10 days', '7 ימים': '7 days', '12 ימים': '12 days',
    'סלובקיה + בודפשט': 'Slovakia + Budapest', 'מסלול מוכן ·': 'Ready itinerary ·', 'מסלול קיים עם הימים, המפות והניווט.': 'A ready itinerary with days, maps and navigation.',
    'ויאטנם + תאילנד': 'Vietnam + Thailand', 'מסלול קיים עם כל דפי הימים.': 'A ready itinerary with every day page.', 'יוון': 'Greece',
    'מסלול קיים עם המפה והניווט.': 'A ready itinerary with map and navigation.', 'איטליה': 'Italy', 'דולומיטים': 'Dolomites',
    'מסלול אגמים, מעברי הרים, רכבלים ועיירות.': 'Lakes, mountain passes, cable cars and villages.', 'אוסטריה': 'Austria', 'חבל טירול + מינכן': 'Tyrol + Munich',
    'מסלול אלפיני עם אגמים, רכבלים, מפלים ועיירות.': 'An alpine route with lakes, cable cars, waterfalls and villages.', 'ארה״ב': 'USA',
    'מפלי ניאגרה – וושינגטון – ניו יורק': 'Niagara Falls – Washington – New York', 'מסלול קלאסי בין טבע, ערים ואטרקציות.': 'A classic route of nature, cities and attractions.',
    'המלצות לינה לפי מסגרת הטיול, מספר הלילות והעדפת רמת המלון. החיפוש נפתח ב־Booking.': 'Stay recommendations by trip frame, nights and hotel level. Search opens on Booking.',
    '🏨 לינה חכמה': '🏨 Smart stays',
    'TripCraft מציע אזורי לינה — לא כופה מלון. אפשר לבחור כמה שפחות החלפות, טיול כוכב או להתקדם עם המסלול. בחירה במלון מעדכנת את התקציב ללא טיסות.': 'TripCraft suggests stay areas — it never forces a hotel. Choose fewer hotel changes, a single base, or move along the route. Picking a hotel updates the budget (excluding flights).',
    'בנו טיול כדי לראות את אזורי הלינה המומלצים.': 'Build a trip to see the recommended stay areas.',
    'AI Planner · שלב ראשון': 'AI Planner · Step one', 'יעד הטיול': 'Destination', 'בחרו מדינות ואזור מרכזי': 'Choose countries and a main region',
    'שם הטיול שלכם': 'Your trip name', 'מדינה': 'Country', 'אפשר להוסיף מדינה נוספת רק אם הטיול חוצה גבול': 'Add another country only if the trip crosses a border',
    '+ הוסף': '+ Add', 'אזור': 'Region', '(אופציונלי)': '(optional)', 'טיסות (אופציונלי)': 'Flights (optional)',
    'אם אין טיסות, משאירים את שני השדות ריקים': 'No flights? Leave both fields empty', 'תאריכים': 'Dates', 'מתי תרצו לטייל': 'When do you want to travel',
    'TripCheck יבדוק התאמה בין היעד לשדות התעופה.': 'TripCheck verifies the airports match the destination.',
    'הבחירות נשמרות בטיול. אחרי רכישה אפשר לפתוח את הטיול מהחשבון ולעדכן אותו בלי להקליד הכול מחדש.': 'Your choices are saved with the trip. Reopen it from your account and update it without retyping.',
    'זוג': 'Couple', 'משפחה': 'Family', 'חברים': 'Friends', 'יחיד': 'Solo', 'רב־דורי': 'Multi-generation',
    'כמה נוסעים מכל גיל?': 'How many travellers of each age?', 'מבוגרים': 'Adults', 'צעירים': 'Young adults', 'נוער': 'Teens', 'ילדים': 'Kids', 'תינוקות': 'Babies', 'כלבים': 'Dogs', 'חיות מחמד': 'Pets',
    'אין צורך להקליד גיל. הבחירה לפי קבוצות גיל מאפשרת ל־TripCraft להתאים קצב, הליכות, אטרקציות וימי נסיעה.': 'No need to type ages. Age groups let TripCraft tailor pace, walks, attractions and driving days.',
    'באילו אמצעי תחבורה תרצו להשתמש?': 'Which transport would you like to use?', 'אפשר לבחור כמה': 'Choose any', 'רכב': 'Car', 'רכבת': 'Train',
    'תחבורה ציבורית': 'Public transport', 'הליכה': 'Walking', 'טיסות פנימיות': 'Domestic flights', 'מעבורת / שייט': 'Ferry / boat', 'מונית / הסעה': 'Taxi / transfer',
    'אורך יום טיול': 'Day length', 'נופים וטבע': 'Scenery & nature', 'עיירות וכפרים': 'Towns & villages', 'אגמים ומפלים': 'Lakes & waterfalls', 'ערים': 'Cities',
    'קולינריה': 'Culinary', 'גסטרונומיה': 'Gastronomy', 'שופינג': 'Shopping', 'אטרקציות ואדרנלין': 'Attractions & adrenaline', 'תרבות ומוזיאונים': 'Culture & museums', 'הליכות': 'Walks',
    'חוף': 'Beach', 'טיולים רגליים': 'Hiking', 'ספורט אתגרי': 'Extreme sports', 'פארקי מים ואטרקציות לילדים': 'Water parks & kids attractions', 'ספורט מים': 'Water sports',
    'שייט': 'Boat trips', 'היסטוריה וטירות': 'History & castles', 'תיאטרון ומופעים': 'Theatre & shows', 'צילום': 'Photography', 'ספא ובריאות': 'Spa & wellness', 'חיי לילה': 'Nightlife', 'יין': 'Wine',
    '4. תרצו ש-TripCraft יתכנן גם את הלינה?': '4. Should TripCraft plan your stays too?', 'מה תרצו לעשות עם הלינה?': 'What would you like to do about lodging?',
    'כן — תציע ותתכנן לינה': 'Yes — suggest and plan stays', 'כבר יש לי מקומות לינה': 'I already have lodging', 'אחליט ואוסיף אחר כך': 'I’ll decide later', 'לא — דלג על שלב הלינה': 'No — skip lodging',
    'איזו לינה לחפש?': 'What kind of lodging?', 'מלון': 'Hotel', 'דירה': 'Apartment', 'וילה': 'Villa', 'ריזורט': 'Resort', 'בית נופש': 'Holiday home', 'הוסטל': 'Hostel',
    'רמת מחיר': 'Price level', 'יוקרתי': 'Luxury', 'ביניים': 'Mid-range', 'חסכוני': 'Budget', 'זול מאוד': 'Very cheap',
    'מה חשוב במקום הלינה?': 'What matters at the stay?', 'ארוחת בוקר': 'Breakfast', 'ארוחת בוקר וערב (חצי פנסיון)': 'Breakfast & dinner (half board)', 'הכל כלול': 'All inclusive',
    'ביטול חינם': 'Free cancellation', 'חניה': 'Parking', 'בריכה': 'Pool', 'ספא': 'Spa', 'מטבח': 'Kitchen', 'מרכזי': 'Central', 'נוף': 'View', 'משפחתי': 'Family friendly', 'נגיש': 'Accessible', 'כשרות': 'Kosher',
    'כמה חדרים תרצו?': 'How many rooms?', 'המערכת תציע מספר חדרים לפי הרכב הנוסעים, ותוכלו לשנות.': 'We suggest rooms by group size — you can change it.',
    'הרכב לחיפוש המלונות': 'Group for hotel search', 'זוג אחד · חדר אחד': 'One couple · one room', 'מה חשוב יותר?': 'What matters more?',
    'כמה מותר לסטות מהמסלול בשביל לינה?': 'Maximum detour for a stay?', 'שם המלון / הדירה שכבר הזמנתם': 'Hotel / apartment you already booked',
    'אפשר להקליד גם אם אין התאמה מדויקת. אם יש כמה לינות, סדר ההקלדה משמש את TripCraft כעוגני המסלול.': 'Free text works too. With several stays, the order you type them anchors the route.',
    'חשוב:': 'Important:', '5. מה חשוב לנו לדעת?': '5. What should we know?', 'איך אתם מעדיפים לישון?': 'How do you prefer to stay?', 'רמת מלון מועדפת': 'Preferred hotel level',
    'לא חשוב / תן המלצה': 'No preference', '3 כוכבים': '3 stars', '4 כוכבים': '4 stars', '5 כוכבים': '5 stars', 'דירה / אפרטהוטל': 'Apartment / aparthotel',
    'לכלול מלונות בתקציב?': 'Include hotels in the budget?',
    'המנוע יעדיף את סגנון הלינה שבחרתם, אבל יתריע אם טיול כוכב יוצר נסיעות לא סבירות. במסלול מתקדם יציע מעבר מלון רק כשזה חוסך זמן משמעותי.': 'We follow your lodging style, but warn if a single base creates unreasonable drives. On moving routes we only change hotels when it saves real time.',
    'מה חשוב לכם בטיול?': 'What matters on this trip?', 'בלי ימים עמוסים': 'No packed days', 'מעט החלפות מלון': 'Few hotel changes', 'זמן חופשי': 'Free time', 'מסלול יעיל': 'Efficient route', 'כבישים נופיים': 'Scenic roads',
    'ממה להימנע?': 'What to avoid?', 'טרקים קשים': 'Hard treks', 'נהיגה ארוכה': 'Long drives', 'כבישים קשים': 'Difficult roads', 'מדרגות רבות': 'Many stairs', 'יקר מדי': 'Too expensive', 'קימה מוקדמת': 'Early starts',
    'מקומות שחייבים להיות בטיול': 'Must-see places', 'אירועים / טיסות / אילוצים בתאריך מסוים': 'Events / flights / fixed-date constraints',
    'מלל חופשי כאן מיועד בעיקר לאילוצים קשיחים — טיסות פנימיות, אירועים, הזמנות או נקודות בזמן. TripCraft ישמור אותם וישבץ את המסלול סביבם.': 'Use this for hard constraints — domestic flights, events, bookings or fixed times. TripCraft plans the route around them.',
    '6. לינות ומחירים — לפני האישור הסופי': '6. Stays and prices — before final approval',
    'זהו שלב בחירה אמיתי לפני אישור הטיול. TripCraft מציג היכן מומלץ לישון, מספר לילות וטווח מחיר; בחיבור Booking יוצגו מלונות זמינים ותעריף חי.': 'A real choice before approval: where to stay, how many nights and the price range. With Booking connected you see live availability.',
    'המחירים בשלב זה הם הערכה בלבד.': 'Prices at this stage are estimates only.',
    'בחיבור Booking יוצגו זמינות ותעריף עדכניים. אפשר לבחור מלון, להחליף, או להשאיר את הלינה להמשך.': 'Booking shows current availability and rates. Pick a hotel, switch, or leave it for later.',
    'גם אחרי התכנון אפשר לשנות הכול. אם מוסיפים או מחליפים לינה מאוחר יותר, TripCraft בודק את הסטייה מהמסלול. חריגה מהגבול שבחרתם תוצג כאזהרה לפני חישוב המסלול מחדש.': 'Everything stays editable. If you add or change a stay later, TripCraft checks the detour and warns before re-planning.',
    '7. סקירה ואישור לפני בניית הטיול': '7. Review and approve before building', '💬 עוזר התכנון': '💬 Planning assistant',
    'אחרי יצירת הטיול תוכלו לשנות ימים, יעדים, לינות ואילוצים. שינוי שמשפיע על המסלול יחושב מחדש ויוצג לאישור.': 'After the trip is built you can change days, places, stays and constraints. Route-changing edits are recalculated for your approval.',
    'הטיול נשאר ניתן לעריכה': 'Your trip stays editable', 'בונים לכם את הטיול...': 'Building your trip...', 'מנתחים את ההעדפות שלכם': 'Analysing your preferences',
    'TripCraft מתאים קצב, גילאים, מרחקים, לינות ואטרקציות ומכין את הטיול המלא.': 'TripCraft matches pace, ages, distances, stays and attractions to prepare your full trip.',
    'טיול חדש': 'New trip', '5 עריכות AI לטיול': '5 AI edits per trip', 'שמור טיול': 'Save trip', 'יציאה ללא שמירה': 'Leave without saving',
    'הטיול עדיין לא נשמר.': 'The trip is not saved yet.', 'שמרו כדי לקבל קישור קבוע ולהמשיך אליו מהחשבון, או בחרו יציאה ללא שמירה.': 'Save to get a permanent link and continue from your account, or leave without saving.',
    'הקישור האישי לטיול:': 'Your personal trip link:', 'העתק קישור': 'Copy link', '✓ הטיול נשמר אוטומטית בחשבון שלכם.': '✓ The trip was saved to your account.',
    '✓ הטיול נשמר בהצלחה.': '✓ Trip saved.', 'ניתן לצפות בו, לערוך או למחוק אותו דרך החשבון שלי.': 'View, edit or delete it from My account.',
    'מהחשבון שלי תוכלו לפתוח, לערוך או למחוק את הטיול בכל עת.': 'Open, edit or delete it from My account at any time.', 'חזרה לחשבון שלי': 'Back to my account',
    'הדביקו פוסט, לינק או המלצה. TripCraft יציע לאיזה יום לשבץ אותו, ויתריע אם הוא נראה רחוק או לא הגיוני למסלול.': 'Paste a post, link or tip. TripCraft suggests which day it fits and warns if it looks too far.',
    'הטיול הראשוני מוכן. כתבו לי מה תרצו לשנות.': 'Your first draft is ready. Tell me what to change.',
    'היבוא עובד רק בפורמט TripCraft האחיד.': 'Import works only with the TripCraft template.', 'המערכת בודקת את המבנה לפני יצירת הטיול.': 'The structure is checked before the trip is created.',
    'פורמטים מותרים': 'Allowed formats', '.csv עם פסיקים ·': 'comma .csv ·', '.docx עם טבלה ·': '.docx with a table ·', 'PDF טבלאי עם אותן כותרות.': 'tabular PDF with the same headers.',
    'חמשת הטורים, בסדר הזה:': 'Five columns, in this order:', 'תאריך': 'Date', 'מאיפה': 'From', 'לאן': 'To', 'לינה (עיר או מלון)': 'Stay (city or hotel)', 'מה עושים (מלל)': 'What we do (text)',
    'איסוף רכב, עצירה בגורד וסיור ערב.': 'Car pickup, stop in Gordes and an evening walk.',
    'המערכת תזהה את היום, תאמת נקודות, תכין Waze ו־Google Maps, תייצר טיול בתבנית TripCraft ותציג את הטיול המלא לעריכה ושיתוף.': 'We detect each day, verify places, prepare Waze and Google Maps links and build a TripCraft trip ready to edit and share.',
    'הורד תבנית CSV': 'Download CSV template', 'רק בפורמט האחיד:': 'Template format only:', '.xlsx / .xls / .csv (פסיקים) / .docx / .pdf': '.xlsx / .xls / .csv (comma) / .docx / .pdf',
    'איך לקרוא לטיול?': 'Trip name?', 'שנה': 'Year', 'כלל פרסום:': 'Publishing rule:', 'לא נשמרים מחירים/כסף ולא שמות מלונות. בלינה נשמרת רק העיירה/האזור.': 'No prices or hotel names are stored — only the town/area of each stay.',
    'זהו Preview בתבנית הסטנדרטית. אחרי אישור, הטיול יופיע ב״הצעות לטיולים״ באותו מבנה: טיול → ימים → פירוט יום.': 'This is a preview in the standard template. After approval it appears under Trip ideas: trip → days → day details.',
    'פיילוט TripCraft:': 'TripCraft pilot:', 'הפרטים נדרשים כדי לשמור את הטיול שלכם, לאפשר עדכונים ולקבל פידבקים ומשוב שיעזרו לנו לשפר את המערכת. כל השדות חובה למעט טלפון.': 'We need these details to save your trip, send updates and collect feedback. All fields are required except phone.',
    'כניסה ל-TripCraft': 'Sign in to TripCraft', 'אימייל': 'Email', 'נבדוק אם כבר נרשמתם': 'We’ll check if you’re registered',
    'אם החשבון קיים, נשלח מיד קוד OTP. אם לא, נבקש שם וטלפון אופציונלי וניצור חשבון.': 'Existing account: we send a one-time code. New: we ask for your name (phone optional) and create the account.',
    'בדוק ושלח קוד': 'Check and send code', 'האימייל עדיין לא רשום.': 'This email isn’t registered yet.', 'השלימו את הפרטים כדי לפתוח חשבון ולשלוח קוד OTP.': 'Complete your details to open an account and get a code.',
    'שם פרטי': 'First name', 'שם משפחה': 'Last name', 'טלפון (לא חובה)': 'Phone (optional)', 'הירשם ושלח קוד': 'Sign up and send code', '← חזור לתיקון האימייל': '← Back to fix the email',
    'הזנת קוד אימות': 'Enter verification code', 'שלחנו קוד האימות אל:': 'We sent the code to:', 'אמת והמשך': 'Verify and continue', 'שלח קוד חדש בעוד 60 שנ׳': 'Resend code in 60s',
    'לא קיבלתם? בדקו גם בספאם. לאחר 60 שניות ניתן לשלוח קוד חדש.': 'Didn’t get it? Check spam. You can request a new code after 60 seconds.',
    'כדי להמשיך יש להזין אימייל.': 'Enter your email to continue.', 'TripCraft תבדוק אם החשבון קיים. משתמש קיים יקבל OTP וייכנס לטיולים שלו; משתמש חדש ישלים שם פרטי ושם משפחה ואז יקבל OTP.': 'TripCraft checks if your account exists. Existing users get a code; new users add their name and then get a code.',
    'כניסה / הרשמה': 'Sign in / Sign up', 'בחירת תאריכים': 'Choose dates', 'בחרו תאריך יציאה': 'Choose departure date', 'בחרו תאריך חזרה': 'Choose return date', 'יציאה': 'Departure', 'חזרה': 'Return', 'אישור': 'Done',
    'טיול': 'Trip', 'סגור וחזור': 'Close', 'תכנית לפי ימים': 'Day-by-day plan', 'לחץ על יום כדי לפתוח פירוט מלא.': 'Tap a day for full details.', '🗺️ כל המסלול במפה': '🗺️ Whole route on the map',
    'מצב לא מקוון — חלק מהמידע נשמר במכשיר': 'Offline — some data is stored on this device', 'בית': 'Home', 'השראה': 'Ideas', 'תכנון': 'Plan', 'הטיולים שלי': 'My trips', 'עוד': 'More',
    'עריכת יום': 'Edit day', 'כותרת היום': 'Day title', 'שמור כותרת': 'Save title', 'סגור': 'Close', 'שלח': 'Send', '☔ בנה חלופת גשם ליום הזה': '☔ Build a rainy-day alternative',
    'פתח פירוט יום': 'Open day', '☔ חלופת גשם': '☔ Rain plan', 'איפה ישנים?': 'Where to stay?', 'יום': 'Day', 'נוסעים': 'travellers',
    'יום מלא — לנצל את היום': 'Full day — make the most of it', 'גמיש — לפי היעד': 'Flexible — by destination', 'חצי יום — יותר זמן חופשי': 'Half day — more free time',
    'רגוע': 'Relaxed', 'מאוזן': 'Balanced', 'אינטנסיבי': 'Intense', 'עד שעה': 'Up to 1 hour', '1–3 שעות': '1–3 hours', '3–5 שעות': '3–5 hours', 'אין מגבלה מיוחדת': 'No particular limit',
    'עד שעתיים': 'Up to 2 hours', 'עד 4 שעות': 'Up to 4 hours', 'עד 6 שעות': 'Up to 6 hours', 'לא מפריע לנו יום ארוך מדי פעם': 'A long day now and then is fine',
    'מחיר': 'Price', 'איזון מחיר ואיכות': 'Balance of price and quality', 'דירוג ואיכות': 'Rating and quality', 'רק על המסלול / באזור הלינה': 'Only on the route / in the stay area',
    'עד 10 דקות': 'Up to 10 minutes', 'עד 20 דקות': 'Up to 20 minutes', 'לא משנה': 'Doesn’t matter', 'תן ל-TripCraft לבחור חכם': 'Let TripCraft choose smartly',
    'כמה שפחות החלפות מלון': 'As few hotel changes as possible', 'טיול כוכב — בסיס אחד כשזה הגיוני': 'Single base when it makes sense', 'מתקדמים עם המסלול ומחליפים לפי הצורך': 'Move along the route as needed',
    'כן — הצג הערכת לינה': 'Yes — show a lodging estimate', 'לא בשלב זה': 'Not now',
    'PH:למשל: אוסטריה וגרמניה 2027': 'e.g. Austria & Germany 2027', 'PH:הקלידו מדינה ובחרו מהרשימה': 'Type a country and pick it', 'PH:למשל: האלפים היוליאניים, בלד, טירול — אפשר גם להשאיר ריק': 'e.g. Julian Alps, Bled, Tyrol — or leave empty',
    'PH:אפשר להקליד בעברית או באנגלית': 'Type a city, airport or code', 'PH:למשל: אגם קומו, ניס (NCE), מפלי ניאגרה — הוסיפו נקודות חובה': 'e.g. Lake Como, Nice, Niagara Falls',
    'PH:למשל: בתאריך 18/03 אני טס מהאנוי לדה נאנג בשעה 15:15. TripCraft יתייחס לזה כאילוץ קשיח במסלול.': 'e.g. On 18/03 I fly Hanoi → Da Nang at 15:15. TripCraft treats this as a hard constraint.',
    'PH:הדבק כאן פוסט / לינק / המלצה לכל הטיול': 'Paste a post / link / tip for the whole trip', 'PH:למשל: יום 2 עמוס מדי, תוריד תחנה אחת': 'e.g. Day 2 is too busy, drop one stop',
    'PH:למשל: דולומיטים איטליה': 'e.g. Dolomites Italy', 'PH:איטליה': 'Italy', 'PH:כתוב חופשי על היום הזה': 'Write freely about this day', 'PH:אותו שדה או שדה אחר': 'Same or another airport', 'PH:עיר / שדה / קוד': 'City / airport / code',
    'אותו שדה בחזרה — סמנו ✓ למילוי אוטומטי': 'Same airport on return — tick to fill automatically', 'נוחתים ב־ (אופציונלי)': 'Landing at (optional)', 'חוזרים מ־ (אופציונלי)': 'Departing from (optional)',
    'שעת נחיתה': 'Landing time', 'שעת המראה בחזרה': 'Return takeoff time', '(חובה אם הוזנה טיסה)': '(required if a flight is entered)', 'תאריך יציאה': 'Departure date', 'תאריך חזרה': 'Return date',
    'הבא': 'Next', 'הקודם': 'Back', 'בנה טיול': 'Build trip', 'סוג הקבוצה': 'Group type', '2. מי נוסע?': '2. Who is travelling?', '3. איך אתם אוהבים לטייל?': '3. How do you like to travel?',
    'מה מעניין אתכם?': 'What interests you?', 'קצב': 'Pace', 'הליכה יומית נוחה': 'Comfortable daily walking', 'נהיגה יומית רצויה': 'Preferred daily driving', '1. לאן ומתי נוסעים?': '1. Where and when?',
    'מחפש… / Searching…': 'Searching…',
    'בנה טיול חדש': 'Build a new trip', 'התנתק': 'Sign out', 'הטיולים שלי': 'My trips', 'החשבון שלי': 'My account',
    'כל טיול נשמר אוטומטית בחשבון. אפשר לפתוח ולערוך אותו, להעתיק את הקישור האישי או למחוק אותו.': 'Every trip is saved to your account automatically. Open and edit it, copy its personal link or delete it.',
    'כאן נשמרת היסטוריית הטיולים שלכם — שם הטיול, היעד, התאריכים והקישור האישי, גם לאחר שהטיול הסתיים.': 'Your trip history lives here — name, destination, dates and personal link, even after the trip is over.',
    'הקישור הועתק': 'Link copied',
    'אם תבחרו מלונות אחר כך, TripCraft יחשב מחדש את המסלול. אם מקום הלינה החדש חורג מאזור הלינה או מזמן הסטייה שבחרתם, תופיע התרעה לפני השינוי ולא נעדכן את המסלול בלי אישורכם.': 'If you pick hotels later, TripCraft recalculates the route. If the new stay is outside the stay area or the detour limit you chose, you will be warned before anything changes — the route is never updated without your approval.', 'פתח / ערוך טיול': 'Open / edit trip', 'מחק טיול': 'Delete trip', 'לא נמצאה התאמה מדויקת. אפשר להמשיך להקליד.': 'No exact match. Keep typing.'
  };
  var ATTR = { 'אפשרויות נגישות': 'Accessibility options', 'סגור': 'Close', 'סגור תפריט': 'Close menu', 'ניווט ראשי': 'Main navigation', 'שלבי יעד, טיסות ותאריכים': 'Destination, dates and flights steps', 'חודש קודם': 'Previous month', 'חודש הבא': 'Next month', 'תפריט': 'Menu', 'פתח תפריט': 'Open menu', 'הסר': 'Remove' };
  var PH = {}, TX = {};
  Object.keys(D).forEach(function (k) { if (k.indexOf('PH:') === 0) PH[k.slice(3)] = D[k]; else if (k.indexOf('OPT:') !== 0) TX[k] = D[k]; });
  var HEB = /[֐-׿]/;
  function tr(root) {
    if (!root || !root.querySelectorAll) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (node) {
      var p = node.parentElement; if (!p || /^(SCRIPT|STYLE)$/.test(p.tagName) || p.closest('[data-tc-no-i18n],.tc-hebdate,.lang-link,[lang="he"]')) return;
      var raw = node.nodeValue; if (!HEB.test(raw)) return;
      var key = raw.replace(/\s+/g, ' ').trim();
      if (TX[key] && TX[key] !== key) { var nv = raw.replace(raw.trim(), TX[key]); if (nv !== raw) node.nodeValue = nv; }
      else if (/^\d+ ימים · \d+ נוסעים · /.test(key)) node.nodeValue = key.replace(/(\d+) ימים · (\d+) נוסעים · (.*)/, function (_, a, b, c) { return a + ' days · ' + b + ' travellers · ' + (TX[c] || c); });
    });
    root.querySelectorAll('[placeholder]').forEach(function (e) { var k = e.placeholder.trim(); if (PH[k] && PH[k] !== k) e.placeholder = PH[k]; });
    root.querySelectorAll('[aria-label],[title]').forEach(function (e) { ['aria-label', 'title'].forEach(function (at) { var v = e.getAttribute(at); if (v && HEB.test(v)) { var k = v.trim(), tv = ATTR[k] || TX[k]; if (tv && tv !== k) e.setAttribute(at, tv); } }); });
    root.querySelectorAll('option').forEach(function (o) { var k = o.textContent.trim(); if (TX[k] && TX[k] !== k) o.textContent = TX[k]; });
  }
  function run() { tr(document.body); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  var timer = 0;
  new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 120); })
    .observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.tcI18nEn = { dict: D, translate: tr };
})();
