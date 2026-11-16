/* =========================================================
   הגדרות האתר — אייל זדה
   ========================================================= */
window.SITE_CONFIG = {
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: '',
  supabaseAnonKey: '',

  business: {
    "name": "אייל זדה",
    "phone": "054-6959209",
    "whatsapp": "972546959209",
    "instagram": "elitafootballers",
    "address": "תיאום מקום בוואטסאפ"
  },

  whatsappAuto: false,
  categories: [["solo","אישי"],["group","קבוצות ואירועים"],["online","ליווי אונליין"]],
  slotMinutes: 30,
  daysAhead: 21,

  demoServices: [
    {"id":"solo","category":"solo","price_max":null,"duration_min":60,"name":"אימון אישי","price":180,"description":"אחד על אחד, תוכנית לשחקני עלית"},
    {"id":"analysis","category":"solo","price_max":null,"duration_min":60,"name":"ניתוח משחק אנליסטי","price":200,"description":"צופים במשחק של השחקן ובונים יחד מה לשפר"},
    {"id":"small","category":"group","price_max":null,"duration_min":75,"name":"קבוצה קטנה","price":90,"description":"3–5 שחקנים, מחיר לשחקן"},
    {"id":"party","category":"group","price_max":900,"duration_min":120,"name":"הפעלת יום הולדת כדורגל","price":650,"description":"טורניר, אתגרים ופרסים לכל הילדים"},
    {"id":"nutrition","category":"online","price_max":null,"duration_min":45,"name":"תפריט תזונה לשחקן","price":250,"description":"פגישה ותפריט מותאם לגיל ולעומס האימונים"},
    {"id":"gym","category":"online","price_max":null,"duration_min":45,"name":"תוכנית אימון לחדר כושר","price":200,"description":"תוכנית כוח ומהירות שמתאימה לכדורגלן"}
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {"0":["15:00","21:00"],"1":["15:00","21:00"],"2":["15:00","21:00"],"3":["15:00","21:00"],"4":["15:00","21:00"],"5":["08:00","14:00"],"6":null},
};
