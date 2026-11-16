/* =========================================================
   נוסח הודעת אישור התור בוואטסאפ
   אותו נוסח נשלח אוטומטית (supabase/functions/send-whatsapp)
   ומכפתור "אישור בוואטסאפ" בעמוד הניהול
   ========================================================= */
(function () {
  'use strict';
  const TZ = 'Asia/Jerusalem';

  function confirmationText(appt, biz) {
    const start = new Date(appt.starts_at);
    const date = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(start);
    const time = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(start);
    const firstName = String(appt.customer_name || '').trim().split(/\s+/)[0];
    return [
      `היי ${firstName} 👋`,
      `התור שלך אצל ${biz.name} נקבע ✂️`,
      '',
      `🗓️ ${date}`,
      `🕐 ${time}`,
      `💈 ${appt.service_name}`,
      `📍 ${biz.address}`,
      '',
      `ניווט: https://waze.com/ul?q=${encodeURIComponent(biz.address)}&navigate=yes`,
      'לביטול או שינוי – פשוט עונים להודעה הזאת.',
      '',
      'It’s all about you',
    ].join('\n');
  }

  // מספר ישראלי → פורמט בינלאומי בלי + (0521234567 → 972521234567)
  function intlPhone(phone) {
    const d = String(phone || '').replace(/\D/g, '');
    const n = d.startsWith('972') ? d : d.startsWith('0') ? '972' + d.slice(1) : d;
    return /^972[1-9]\d{7,8}$/.test(n) && !/^9720*$/.test(n) && !/^972(\d)\1+$/.test(n) ? n : null;
  }

  window.WhatsApp = {
    confirmationText,
    intlPhone,
    confirmationLink: (appt, biz) => {
      const to = intlPhone(appt.phone);
      return to ? `https://wa.me/${to}?text=${encodeURIComponent(confirmationText(appt, biz))}` : null;
    },
  };
})();
