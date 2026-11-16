/* =========================================================
   הגדרות האתר — עומרי דהן
   ========================================================= */
window.SITE_CONFIG = {
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: '',
  supabaseAnonKey: '',

  business: {
    "name": "עומרי דהן",
    "phone": "052-2208515",
    "whatsapp": "972522208515",
    "instagram": "",
    "address": "פתח תקווה"
  },

  whatsappAuto: false,
  categories: [["solo","אישי"],["group","קבוצתי"]],
  slotMinutes: 30,
  daysAhead: 21,

  demoServices: [
    {"id":"solo","category":"solo","price_max":null,"duration_min":60,"name":"אימון אישי","price":180,"description":"אחד על אחד, לפי תוכנית שבנויה בדיוק לשחקן"},
    {"id":"trial","category":"solo","price_max":null,"duration_min":45,"name":"אימון היכרות + הערכת יכולות","price":120,"description":"בודקים איפה השחקן עומד ובונים יחד תוכנית"},
    {"id":"gk","category":"solo","price_max":null,"duration_min":60,"name":"אימון שוערים","price":180,"description":"יציאות, תגובה, משחק רגל ועמידה בשער"},
    {"id":"duo","category":"group","price_max":null,"duration_min":60,"name":"אימון זוגי","price":130,"description":"שני חברים, מחיר לשחקן"},
    {"id":"small","category":"group","price_max":null,"duration_min":75,"name":"קבוצה קטנה (3–5)","price":90,"description":"תרגול במצבי משחק אמיתיים, מחיר לשחקן"}
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {"0":["15:00","21:00"],"1":["15:00","21:00"],"2":["15:00","21:00"],"3":["15:00","21:00"],"4":["15:00","21:00"],"5":["08:00","14:00"],"6":null},
};
