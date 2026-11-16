/* =========================================================
   הגדרות האתר — איילון לבנון
   ========================================================= */
window.SITE_CONFIG = {
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: '',
  supabaseAnonKey: '',

  business: {
    "name": "איילון לבנון",
    "phone": "055-9977618",
    "whatsapp": "972559977618",
    "instagram": "eylon_levanon",
    "address": "זכרון יעקב"
  },

  whatsappAuto: false,
  categories: [["solo","אישי"],["group","קבוצתי"]],
  slotMinutes: 30,
  daysAhead: 21,

  demoServices: [
    {"id":"trial","category":"solo","price_max":null,"duration_min":60,"name":"אימון בחינה (חצי מחיר)","price":90,"description":"מכירים, בודקים איפה השחקן עומד ובונים תוכנית"},
    {"id":"solo","category":"solo","price_max":null,"duration_min":60,"name":"אימון אישי 1 על 1","price":180,"description":"טכניקה, פיזיות ומנטליות, לפי תוכנית אישית"},
    {"id":"position","category":"solo","price_max":null,"duration_min":60,"name":"אימון לפי עמדה","price":180,"description":"תרגול ממוקד לעמדה של השחקן במגרש"},
    {"id":"physical","category":"solo","price_max":null,"duration_min":60,"name":"אימון פיזי: כוח וסיבולת","price":160,"description":"מהירות, כוח וסיבולת לשחקני כדורגל"},
    {"id":"group","category":"group","price_max":null,"duration_min":75,"name":"אימון קבוצתי","price":90,"description":"קבוצה קטנה, מחיר לשחקן"}
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {"0":["15:00","21:00"],"1":["15:00","21:00"],"2":["15:00","21:00"],"3":["15:00","21:00"],"4":["15:00","21:00"],"5":["08:00","14:00"],"6":null},
};
