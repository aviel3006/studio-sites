/* =========================================================
   הגדרות האתר — Bambi Nails
   ========================================================= */
window.SITE_CONFIG = {
  // כל עוד השדות ריקים האתר עובד במצב הדגמה ושומר הכל בדפדפן בלבד.
  supabaseUrl: '',
  supabaseAnonKey: '',

  business: {
    "name": "Bambi Nails",
    "phone": "054-6894929",
    "whatsapp": "972546894929",
    "instagram": "",
    "address": "כצנלסון 59, גבעתיים"
  },

  whatsappAuto: false,
  categories: [["hands","ידיים"],["feet","רגליים"]],
  slotMinutes: 30,
  daysAhead: 21,

  demoServices: [
    {"id":"gel","name":"לק ג׳ל","category":"hands","price":120,"price_max":null,"duration_min":60},
    {"id":"build","name":"בנייה בג׳ל","category":"hands","price":220,"price_max":null,"duration_min":100},
    {"id":"fill","name":"מילוי","category":"hands","price":170,"price_max":null,"duration_min":80},
    {"id":"mani","name":"מניקור קלאסי","category":"hands","price":70,"price_max":null,"duration_min":40},
    {"id":"remove","name":"הסרת ג׳ל","category":"hands","price":40,"price_max":null,"duration_min":20},
    {"id":"art","name":"ניל ארט (תוספת)","category":"hands","price":30,"price_max":80,"duration_min":20},
    {"id":"pedi","name":"פדיקור רפואי","category":"feet","price":150,"price_max":null,"duration_min":60},
    {"id":"gel-feet","name":"לק ג׳ל ברגליים","category":"feet","price":110,"price_max":null,"duration_min":45}
  ],
  // 0 = ראשון ... 6 = שבת. null = סגור
  demoHours: {"0":["09:00","19:00"],"1":["09:00","19:00"],"2":["09:00","19:00"],"3":["09:00","19:00"],"4":["09:00","19:00"],"5":["08:30","13:30"],"6":null},
};
