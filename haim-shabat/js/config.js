/* =========================================================
   הגדרות האתר — זה הקובץ היחיד שצריך לערוך
   ========================================================= */
window.SITE_CONFIG = {
  // חיבור ל-Supabase (Project Settings → API).
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: 'https://ajfpfvxxknavtjqrnkyp.supabase.co',
  supabaseAnonKey: 'sb_publishable_JFuSUJYXW5PUKjtsFV-M7A_38fW0qHg',

  business: {
    name: 'חיים שבת',
    phone: '052-8243427',
    whatsapp: '972528243427',       // בפורמט בינלאומי, בלי 0 ובלי +
    instagram: 'haim.shabat1',      // שם משתמש בלי @
    address: 'העצמאות 75, קרית אתא',
  },

  // אישור תור אוטומטי ללקוח, אחרי שהגדרתם אותו ב-Supabase:
  // 'sms' (ראו supabase/sms.md) / 'whatsapp' (ראו supabase/whatsapp.md) / '' = כבוי
  autoConfirm: '',

  slotMinutes: 20,   // כל כמה דקות מתחיל תור (9:30, 9:50, 10:10...)
  daysAhead: 21,     // כמה ימים קדימה אפשר לקבוע

  // משמשים רק במצב הדגמה. באתר האמיתי המחירון והשעות נערכים מעמוד הניהול.
  // המחירון מהשלט במספרה. category: men = גברים, women = נשים. price_max = המחיר השני בשלט (אם יש)
  demoServices: [
    { id: 'haircut', name: 'תספורת גבר', category: 'men', price: 70, price_max: null, duration_min: 30 },
    { id: 'beard-short', name: 'זקן קצר', category: 'men', price: 20, price_max: null, duration_min: 15 },
    { id: 'beard-long', name: 'זקן ארוך', category: 'men', price: 50, price_max: null, duration_min: 20 },
    { id: 'women-cut', name: 'תספורת אישה', category: 'women', price: 130, price_max: null, duration_min: 45 },
    { id: 'blow-short', name: 'פן קצר', category: 'women', price: 60, price_max: null, duration_min: 30 },
    { id: 'blow-long', name: 'פן ארוך', category: 'women', price: 70, price_max: null, duration_min: 45 },
    { id: 'blow-xlong', name: 'פן ארוך מאוד', category: 'women', price: 120, price_max: null, duration_min: 60 },
    { id: 'root-color', name: 'צבע שורש ללא פן', category: 'women', price: 170, price_max: 250, duration_min: 90 },
    { id: 'full-color', name: 'צבע שלם ללא פן', category: 'women', price: 230, price_max: 280, duration_min: 120 },
    { id: 'highlights-short', name: 'גוונים קצר', category: 'women', price: 450, price_max: 600, duration_min: 150 },
    { id: 'highlights-long', name: 'גוונים ארוך', category: 'women', price: 700, price_max: 1200, duration_min: 180 },
    { id: 'straightening', name: 'החלקה', category: 'women', price: 800, price_max: 1500, duration_min: 180 },
    { id: 'antibreak', name: 'שיקום אנטיבריק', category: 'women', price: 250, price_max: null, duration_min: 60 },
    { id: 'hyaluron', name: 'החלקה הילורן', category: 'women', price: 1300, price_max: 2000, duration_min: 210 },
    { id: 'keratin', name: 'החלקה קרטין', category: 'women', price: 1000, price_max: 1500, duration_min: 210 },
    { id: 'wash', name: 'שטיפה', category: 'women', price: 160, price_max: 250, duration_min: 15 },
    { id: 'styling', name: 'סירוק', category: 'women', price: 350, price_max: 450, duration_min: 45 },
    { id: 'extensions', name: 'שזירה', category: 'women', price: 3500, price_max: 4500, duration_min: 240 },
    { id: 'extensions-care', name: 'טיפול בשזירה', category: 'women', price: 1000, price_max: null, duration_min: 120 },
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {
    0: ['09:30', '19:30'],
    1: ['09:30', '19:30'],
    2: ['09:30', '19:30'],
    3: ['09:30', '19:30'],
    4: ['09:30', '19:30'],
    5: ['08:00', '14:00'],
    6: null,
  },
};
