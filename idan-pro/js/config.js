/* =========================================================
   הגדרות האתר — Idan Football
   ========================================================= */
window.SITE_CONFIG = {
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: '',
  supabaseAnonKey: '',

  business: {
    "name": "Idan Football",
    "phone": "052-870-2166",
    "whatsapp": "972528702166",
    "instagram": "",
    "address": "תיאום מקום בוואטסאפ"
  },

  whatsappAuto: false,
  categories: [["solo","אישי"],["group","קבוצתי"]],
  slotMinutes: 30,
  daysAhead: 21,

  demoServices: [
    {"id":"trial","category":"solo","price_max":null,"duration_min":60,"name":"אבחון ראשוני + אימון היכרות","price":150,"description":"בודקים איפה השחקן עומד ובונים לו תוכנית"},
    {"id":"solo","category":"solo","price_max":null,"duration_min":60,"name":"אימון אישי 1 על 1","price":180,"description":"לפי התוכנית האישית, מותאם לתפקיד על המגרש"},
    {"id":"plan","category":"solo","price_max":null,"duration_min":60,"name":"תוכנית פיתוח שחקן (8 אימונים)","price":1290,"description":"8 אימונים אישיים עם מעקב התקדמות"},
    {"id":"duo","category":"group","price_max":null,"duration_min":60,"name":"אימון זוגי","price":130,"description":"שני חברים, מחיר לשחקן"},
    {"id":"small","category":"group","price_max":null,"duration_min":75,"name":"קבוצה קטנה (3–5)","price":90,"description":"תרגול במצבי משחק אמיתיים, מחיר לשחקן"}
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {"0":["15:00","21:00"],"1":["15:00","21:00"],"2":["15:00","21:00"],"3":["15:00","21:00"],"4":["15:00","21:00"],"5":["08:00","14:00"],"6":null},
};
