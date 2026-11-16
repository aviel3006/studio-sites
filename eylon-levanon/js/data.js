/* =========================================================
   שכבת הנתונים: Supabase כשהוא מוגדר, אחרת מצב הדגמה (localStorage)
   לשני המצבים אותו ממשק — window.API
   ========================================================= */
(function () {
  'use strict';
  const cfg = window.SITE_CONFIG;
  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  const live = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

  /* ---------- Supabase ---------- */
  function liveApi() {
    const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
    const photoUrl = path => sb.storage.from('gallery').getPublicUrl(path).data.publicUrl;

    return {
      live: true,

      async getServices() {
        return ok(await sb.from('services').select('*').eq('active', true).order('sort'));
      },
      async getAllServices() {
        return ok(await sb.from('services').select('*').order('sort'));
      },
      async getHours() {
        const rows = ok(await sb.from('opening_hours').select('*'));
        return Object.fromEntries(rows.map(r => [r.dow, r.opens && r.closes ? [r.opens.slice(0, 5), r.closes.slice(0, 5)] : null]));
      },
      async getBlockedDays() {
        return ok(await sb.from('blocked_days').select('day, reason').gte('day', isoDate(new Date())).order('day'));
      },
      async getBusy(date) {
        return ok(await sb.rpc('get_busy', { p_date: date })).map(r => ({ start: r.start_min, end: r.end_min }));
      },
      async book(b) {
        return ok(await sb.rpc('book_appointment', {
          p_service: b.serviceId, p_date: b.date, p_time: b.time,
          p_name: b.name, p_phone: b.phone, p_note: b.note || null,
        }));
      },
      async sendMessage(m) {
        ok(await sb.rpc('send_message', { p_name: m.name, p_phone: m.phone, p_body: m.body }));
      },
      async getGallery() {
        return ok(await sb.from('gallery').select('*').order('created_at', { ascending: false }))
          .map(g => ({ ...g, url: photoUrl(g.path) }));
      },

      // ניהול
      async signIn(email, password) {
        ok(await sb.auth.signInWithPassword({ email, password }));
        if (!ok(await sb.rpc('is_admin'))) {
          await sb.auth.signOut();
          throw new Error('למשתמש הזה אין הרשאת ניהול');
        }
      },
      async isSignedIn() {
        const { data } = await sb.auth.getSession();
        return Boolean(data.session) && ok(await sb.rpc('is_admin'));
      },
      async signOut() { await sb.auth.signOut(); },
      async listAppointments(date) {
        const from = new Date(date + 'T00:00:00'), to = new Date(from);
        to.setDate(to.getDate() + 1);
        return ok(await sb.from('appointments').select('*')
          .gte('starts_at', from.toISOString()).lt('starts_at', to.toISOString()).order('starts_at'));
      },
      async setAppointmentStatus(id, status) {
        ok(await sb.from('appointments').update({ status }).eq('id', id));
      },
      async listMessages() {
        return ok(await sb.from('messages').select('*').order('created_at', { ascending: false }).limit(200));
      },
      async markMessageRead(id) { ok(await sb.from('messages').update({ is_read: true }).eq('id', id)); },
      async deleteMessage(id) { ok(await sb.from('messages').delete().eq('id', id)); },
      async uploadPhoto(img, caption) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        ok(await sb.storage.from('gallery').upload(path, img.blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
        ok(await sb.from('gallery').insert({ path, caption: caption || null, width: img.width, height: img.height }));
      },
      async deletePhoto(item) {
        ok(await sb.storage.from('gallery').remove([item.path]));
        ok(await sb.from('gallery').delete().eq('id', item.id));
      },
      async saveService(s) { ok(await sb.from('services').upsert(s)); },
      async deleteService(id) { ok(await sb.from('services').delete().eq('id', id)); },
      async saveHours(dow, opens, closes) { ok(await sb.from('opening_hours').upsert({ dow, opens, closes })); },
      async blockDay(day, reason) { ok(await sb.from('blocked_days').upsert({ day, reason: reason || null })); },
      async unblockDay(day) { ok(await sb.from('blocked_days').delete().eq('day', day)); },
    };
  }

  /* ---------- מצב הדגמה ---------- */
  function demoApi() {
    const KEY = 'eylonlevanon-demo-v1';
    let db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db) db = seed();

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(db)); }
      catch (e) { throw new Error('אין מספיק מקום בדפדפן (מצב הדגמה). מחקו כמה תמונות.'); }
    }
    function seed() {
      const d = {
        services: cfg.demoServices.map((s, i) => ({ ...s, sort: i + 1, active: true })),
        hours: { ...cfg.demoHours },
        blocked: [],
        appts: [],
        messages: [{ id: uid(), name: 'אבי', phone: '0521234567', body: 'היי, הבן שלי בן 11, משחק קשר. יש מקום לאימון אישי ביום שישי בבוקר?', is_read: false, created_at: new Date().toISOString() }],
        gallery: [],
      };
      const t = new Date(); t.setDate(t.getDate() + 1);
      [['16:00', 'איתי'], ['17:30', 'רועי'], ['19:00', 'עומר']].forEach(([time, name]) => {
        const s = d.services[0], [h, m] = time.split(':').map(Number);
        const start = new Date(t.getFullYear(), t.getMonth(), t.getDate(), h, m);
        d.appts.push({ id: uid(), service_id: s.id, service_name: s.name, price: s.price, duration_min: s.duration_min, starts_at: start.toISOString(), customer_name: name, phone: '0500000000', note: null, status: 'booked' });
      });
      return d;
    }
    const busyFor = date => db.appts
      .filter(a => a.status !== 'cancelled' && isoDate(new Date(a.starts_at)) === date)
      .map(a => { const s = new Date(a.starts_at), m = s.getHours() * 60 + s.getMinutes(); return { start: m, end: m + a.duration_min }; });
    const blobToDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

    return {
      live: false,
      async getServices() { return db.services.filter(s => s.active).sort((a, b) => a.sort - b.sort); },
      async getAllServices() { return [...db.services].sort((a, b) => a.sort - b.sort); },
      async getHours() { return { ...db.hours }; },
      async getBlockedDays() { const t = isoDate(new Date()); return db.blocked.filter(b => b.day >= t).sort((a, b) => a.day.localeCompare(b.day)); },
      async getBusy(date) { return busyFor(date); },
      async book(b) {
        const s = db.services.find(x => x.id === b.serviceId && x.active);
        if (!s) throw new Error('השירות שנבחר לא קיים');
        const phone = (b.phone || '').replace(/[^\d+]/g, '');
        if ((b.name || '').trim().length < 2) throw new Error('נא למלא שם מלא');
        if (phone.length < 9 || phone.length > 13) throw new Error('מספר הטלפון לא תקין');
        if (db.blocked.some(x => x.day === b.date)) throw new Error('סגור לאימונים בתאריך הזה');
        const [y, mo, da] = b.date.split('-').map(Number), [hh, mm] = b.time.split(':').map(Number);
        const start = new Date(y, mo - 1, da, hh, mm);
        const h = db.hours[start.getDay()];
        if (!h) throw new Error('סגור לאימונים ביום הזה');
        const sm = toMin(b.time), em = sm + s.duration_min;
        if (sm < toMin(h[0]) || em > toMin(h[1])) throw new Error('השעה מחוץ לשעות הפעילות');
        if (start < new Date()) throw new Error('השעה הזאת כבר עברה');
        if (busyFor(b.date).some(x => sm < x.end && em > x.start)) throw new Error('השעה הזאת נתפסה הרגע. נא לבחור שעה אחרת');
        const id = uid();
        db.appts.push({ id, service_id: s.id, service_name: s.name, price: s.price, duration_min: s.duration_min, starts_at: start.toISOString(), customer_name: b.name.trim(), phone, note: b.note || null, status: 'booked' });
        save();
        return id;
      },
      async sendMessage(m) {
        db.messages.unshift({ id: uid(), name: m.name, phone: m.phone, body: m.body, is_read: false, created_at: new Date().toISOString() });
        save();
      },
      async getGallery() { return [...db.gallery].sort((a, b) => b.created_at.localeCompare(a.created_at)); },

      async signIn(email, password) {
        if (!email || !password) throw new Error('נא למלא אימייל וסיסמה');
        sessionStorage.setItem('eylonlevanon-demo-admin', '1');
      },
      async isSignedIn() { return sessionStorage.getItem('eylonlevanon-demo-admin') === '1'; },
      async signOut() { sessionStorage.removeItem('eylonlevanon-demo-admin'); },
      async listAppointments(date) {
        return db.appts.filter(a => isoDate(new Date(a.starts_at)) === date).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      },
      async setAppointmentStatus(id, status) { const a = db.appts.find(x => x.id === id); if (a) a.status = status; save(); },
      async listMessages() { return db.messages; },
      async markMessageRead(id) { const m = db.messages.find(x => x.id === id); if (m) m.is_read = true; save(); },
      async deleteMessage(id) { db.messages = db.messages.filter(x => x.id !== id); save(); },
      async uploadPhoto(img, caption) {
        const item = { id: uid(), path: '', caption: caption || null, width: img.width, height: img.height, url: await blobToDataUrl(img.blob), created_at: new Date().toISOString() };
        db.gallery.push(item);
        try { save(); } catch (e) { db.gallery.pop(); throw e; }
      },
      async deletePhoto(item) { db.gallery = db.gallery.filter(x => x.id !== item.id); save(); },
      async saveService(s) { const i = db.services.findIndex(x => x.id === s.id); if (i >= 0) db.services[i] = s; else db.services.push(s); save(); },
      async deleteService(id) { db.services = db.services.filter(x => x.id !== id); save(); },
      async saveHours(dow, opens, closes) { db.hours[dow] = opens && closes ? [opens, closes] : null; save(); },
      async blockDay(day, reason) { db.blocked = db.blocked.filter(b => b.day !== day); db.blocked.push({ day, reason: reason || null }); save(); },
      async unblockDay(day) { db.blocked = db.blocked.filter(b => b.day !== day); save(); },
    };
  }

  window.API = live ? liveApi() : demoApi();
})();
