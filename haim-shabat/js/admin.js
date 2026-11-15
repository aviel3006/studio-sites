/* =========================================================
   עמוד ניהול: תורים, תמונות, הודעות, מחירון ושעות
   ========================================================= */
(async function () {
  'use strict';
  const api = window.API;

  const $ = (s, el = document) => el.querySelector(s);
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const shift = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = s => { const d = parseISO(s); return `יום ${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`; };
  const fmtDateTime = s => { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waLink = phone => `https://wa.me/${phone.replace(/[^\d]/g, '').replace(/^0/, '972')}`;

  let toastTimer;
  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
  }
  const fail = err => { console.error(err); toast(err.message || 'משהו השתבש', 'error'); };

  if (!api.live) { $('#demoNote').hidden = false; $('#demoPill').hidden = false; }

  /* ---------- כניסה ---------- */
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target.elements, btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      await api.signIn(f.email.value.trim(), f.password.value);
      showApp();
    } catch (err) {
      toast(/invalid login/i.test(err.message) ? 'אימייל או סיסמה שגויים' : err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
  $('#logoutBtn').addEventListener('click', async () => { await api.signOut(); location.reload(); });

  /* ---------- לשוניות ---------- */
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== 'p-' + tab.dataset.tab; });
    if (tab.dataset.tab === 'messages') loadMessages();
  }));

  /* ---------- תורים ---------- */
  let services = [], day = iso(new Date());
  function setDay(d) {
    day = d;
    $('#dayInput').value = d;
    $('#dayLabel').textContent = (d === iso(new Date()) ? 'היום · ' : '') + fmtDate(d);
    loadAppts();
  }
  $('#dayInput').addEventListener('change', e => e.target.value && setDay(e.target.value));
  $('#dayPrev').addEventListener('click', () => setDay(shift(day, -1)));
  $('#dayNext').addEventListener('click', () => setDay(shift(day, 1)));
  $('#todayBtn').addEventListener('click', () => setDay(iso(new Date())));

  async function loadAppts() {
    const list = $('#apptList');
    list.innerHTML = '<p class="muted">טוען…</p>';
    try {
      const rows = await api.listAppointments(day), active = rows.filter(r => r.status !== 'cancelled');
      $('#apptSummary').innerHTML = `<span class="pill">${active.length} תורים</span><span class="pill">צפי הכנסה: ${active.reduce((s, r) => s + (r.price || 0), 0)}₪</span>`;
      list.innerHTML = rows.length ? rows.map(apptHtml).join('') : '<div class="empty">אין תורים ביום הזה.</div>';
    } catch (err) { list.innerHTML = ''; fail(err); }
  }
  function apptHtml(r) {
    const t = new Date(r.starts_at);
    const confirmLink = r.status === 'booked' ? window.WhatsApp.confirmationLink(r, window.SITE_CONFIG.business) : null;
    const actions = r.status === 'booked'
      ? '<button class="btn btn-ghost btn-sm" data-act="done">בוצע</button><button class="btn btn-ghost btn-sm" data-act="cancelled">ביטול</button>'
      : `<span class="pill">${r.status === 'done' ? 'בוצע' : 'בוטל'}</span><button class="btn btn-ghost btn-sm" data-act="booked">החזרה</button>`;
    return `<article class="appt ${r.status}" data-id="${esc(r.id)}">
      <div class="appt-time">${pad(t.getHours())}:${pad(t.getMinutes())}</div>
      <div>
        <div class="appt-name">${esc(r.customer_name)}</div>
        <div class="appt-sub">${esc(r.service_name)} · ${r.duration_min} דק׳${r.price != null ? ` · ${r.price}₪` : ''} · <span dir="ltr">${esc(r.phone)}</span></div>
        ${r.note ? `<div class="appt-note">״${esc(r.note)}״</div>` : ''}
        ${r.notified_at ? `<div class="appt-wa ok">✓ אישור נשלח ללקוח${{ sms: ' ב-SMS', whatsapp: ' בוואטסאפ' }[window.SITE_CONFIG.autoConfirm] || ''}</div>` : r.notify_error ? '<div class="appt-wa err">האישור האוטומטי לא נשלח – אפשר לשלוח ידנית</div>' : ''}
      </div>
      <div class="appt-actions">
        <a class="iconbtn" href="tel:${esc(r.phone)}" aria-label="חיוג"><svg class="i"><use href="#i-phone"/></svg></a>
        ${confirmLink ? `<a class="btn btn-ghost btn-sm" href="${esc(confirmLink)}" target="_blank" rel="noopener"><svg class="i"><use href="#i-wa"/></svg>אישור בוואטסאפ</a>` : ''}
        ${actions}
      </div>
    </article>`;
  }
  $('#apptList').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'cancelled' && !confirm('לבטל את התור? השעה תתפנה לאחרים.')) return;
    try { await api.setAppointmentStatus(b.closest('.appt').dataset.id, b.dataset.act); loadAppts(); }
    catch (err) { fail(err); }
  });

  function fillServiceSelect() {
    $('#svcSelect').innerHTML = services.filter(s => s.active)
      .map(s => `<option value="${esc(s.id)}">${esc(s.name)} · ${s.duration_min} דק׳</option>`).join('');
  }
  $('#addApptForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target.elements;
    try {
      await api.book({
        serviceId: f.service.value, date: day, time: f.slot.value,
        name: f.cname.value.trim() || 'חסום', phone: f.cphone.value.trim() || '0000000000', note: f.cnote.value.trim(),
      });
      e.target.reset();
      toast('התור נוסף');
      loadAppts();
    } catch (err) { fail(err); }
  });

  /* ---------- תמונות ---------- */
  let gallery = [];
  async function loadGallery() {
    try {
      gallery = await api.getGallery();
      $('#admGallery').innerHTML = gallery.length
        ? gallery.map(g => `<figure class="adm-shot" data-id="${esc(g.id)}">
            <img src="${esc(g.url)}" alt="${esc(g.caption || '')}" loading="lazy">
            ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}
            <button class="iconbtn" type="button" aria-label="מחיקת תמונה"><svg class="i"><use href="#i-trash"/></svg></button>
          </figure>`).join('')
        : '<div class="empty" style="grid-column:1/-1">עוד אין תמונות. העלה את הראשונה!</div>';
    } catch (err) { fail(err); }
  }
  $('#admGallery').addEventListener('click', async e => {
    const b = e.target.closest('.iconbtn');
    if (!b) return;
    const item = gallery.find(g => g.id === b.closest('.adm-shot').dataset.id);
    if (!item || !confirm('למחוק את התמונה מהאתר?')) return;
    try { await api.deletePhoto(item); loadGallery(); } catch (err) { fail(err); }
  });

  // הקטנה לפני העלאה: תמונה מהטלפון יורדת מכמה מגה לכ-300KB
  function compress(file, max = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(blob => (blob ? resolve({ blob, width: c.width, height: c.height }) : reject(new Error('לא הצלחנו לעבד את התמונה'))), 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error(`הקובץ ${file.name} לא נתמך`));
      img.src = URL.createObjectURL(file);
    });
  }
  async function uploadFiles(fileList) {
    const files = [...fileList].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const caption = $('#captionInput').value.trim(), st = $('#uploadStatus');
    let done = 0;
    for (const file of files) {
      st.textContent = `מעלה ${done + 1} מתוך ${files.length}…`;
      try { await api.uploadPhoto(await compress(file, api.live ? 1600 : 1000), caption); done++; }
      catch (err) { fail(err); }
    }
    st.textContent = done ? `הועלו ${done} תמונות ✓` : '';
    $('#captionInput').value = '';
    $('#fileInput').value = '';
    loadGallery();
  }
  $('#fileInput').addEventListener('change', e => uploadFiles(e.target.files));
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => uploadFiles(e.dataTransfer.files));

  /* ---------- הודעות ---------- */
  async function loadMessages() {
    try {
      const rows = await api.listMessages(), unread = rows.filter(m => !m.is_read).length;
      $('#msgCount').textContent = unread;
      $('#msgCount').hidden = !unread;
      $('#msgList').innerHTML = rows.length ? rows.map(m => `
        <article class="msg ${m.is_read ? '' : 'unread'}" data-id="${esc(m.id)}">
          <header><b>${esc(m.name)}</b><time>${fmtDateTime(m.created_at)}</time></header>
          <p>${esc(m.body)}</p>
          <footer>
            ${m.phone ? `<a class="btn btn-ghost btn-sm" href="tel:${esc(m.phone)}">חיוג</a><a class="btn btn-ghost btn-sm" href="${waLink(m.phone)}" target="_blank" rel="noopener">וואטסאפ</a>` : ''}
            ${m.is_read ? '' : '<button class="btn btn-ghost btn-sm" data-act="read">סימון כנקרא</button>'}
            <button class="btn btn-ghost btn-sm" data-act="del">מחיקה</button>
          </footer>
        </article>`).join('') : '<div class="empty">אין הודעות.</div>';
    } catch (err) { fail(err); }
  }
  $('#msgList').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.closest('.msg').dataset.id;
    try {
      if (b.dataset.act === 'read') await api.markMessageRead(id);
      else if (confirm('למחוק את ההודעה?')) await api.deleteMessage(id);
      loadMessages();
    } catch (err) { fail(err); }
  });

  /* ---------- הגדרות: מחירון ---------- */
  function renderServices() {
    $('#svcList').innerHTML = services.map(s => `
      <div class="svc-row" data-id="${esc(s.id)}">
        <input class="in" name="name" value="${esc(s.name)}" aria-label="שם השירות" maxlength="40">
        <select class="in" name="category" aria-label="קהל"><option value="men" ${(s.category || 'men') === 'men' ? 'selected' : ''}>גברים</option><option value="women" ${s.category === 'women' ? 'selected' : ''}>נשים</option></select>
        <label class="mini"><input class="in" name="price" type="number" min="0" value="${s.price}" aria-label="מחיר"><span>₪</span></label>
        <label class="mini"><input class="in" name="price_max" type="number" min="0" value="${s.price_max ?? ''}" placeholder="עד" aria-label="מחיר עד (לא חובה)"><span>₪</span></label>
        <label class="mini"><input class="in" name="duration_min" type="number" min="10" max="240" step="5" value="${s.duration_min}" aria-label="משך בדקות"><span>דק׳</span></label>
        <label class="check"><input type="checkbox" name="active" ${s.active ? 'checked' : ''}>פעיל</label>
        <button class="btn btn-primary btn-sm" type="button" data-act="save">שמירה</button>
        <button class="iconbtn" type="button" data-act="del" aria-label="מחיקת שירות"><svg class="i"><use href="#i-trash"/></svg></button>
      </div>`).join('');
  }
  $('#svcList').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const row = b.closest('.svc-row'), s = services.find(x => x.id === row.dataset.id);
    try {
      if (b.dataset.act === 'save') {
        const q = n => row.querySelector(`[name="${n}"]`);
        const next = {
          ...s, name: q('name').value.trim(), category: q('category').value,
          price_max: Number(q('price_max').value) > Number(q('price').value) ? Number(q('price_max').value) : null,
          price: Math.max(0, Number(q('price').value) || 0), duration_min: Number(q('duration_min').value) || 30,
          active: q('active').checked,
        };
        if (!next.name) return toast('לשירות צריך שם', 'error');
        if (next.duration_min < 10 || next.duration_min > 240) return toast('משך בין 10 ל-240 דקות', 'error');
        delete next.isNew;
        await api.saveService(next);
        Object.assign(s, next);
        delete s.isNew;
        toast('נשמר');
      } else {
        if (!confirm(`למחוק את "${s.name}"? אפשר גם רק לבטל את הסימון "פעיל".`)) return;
        if (!s.isNew) await api.deleteService(s.id);
        services = services.filter(x => x !== s);
        renderServices();
      }
      fillServiceSelect();
    } catch (err) { fail(err); }
  });
  $('#addSvc').addEventListener('click', () => {
    services.push({ id: 'svc-' + Date.now().toString(36), name: 'שירות חדש', category: 'men', price: 50, price_max: null, duration_min: 30, sort: services.length + 1, active: true, isNew: true });
    renderServices();
    $('#svcList').lastElementChild.querySelector('input').select();
  });

  /* ---------- הגדרות: שעות פתיחה ---------- */
  async function renderHoursEditor() {
    const hours = await api.getHours();
    $('#hoursList').innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const h = hours[i];
      return `<div class="hours-row ${h ? '' : 'off'}" data-dow="${i}">
        <b>${DAYS[i]}</b>
        <label class="check"><input type="checkbox" name="open" ${h ? 'checked' : ''}>פתוח</label>
        <input class="in" type="time" name="opens" step="900" value="${h ? h[0] : '09:30'}" aria-label="פתיחה">
        <span>עד</span>
        <input class="in" type="time" name="closes" step="900" value="${h ? h[1] : '19:30'}" aria-label="סגירה">
      </div>`;
    }).join('');
  }
  $('#hoursList').addEventListener('change', e => {
    if (e.target.name === 'open') e.target.closest('.hours-row').classList.toggle('off', !e.target.checked);
  });
  $('#saveHours').addEventListener('click', async () => {
    const rows = [...document.querySelectorAll('.hours-row')];
    for (const r of rows) {
      const open = r.querySelector('[name="open"]').checked, o = r.querySelector('[name="opens"]').value, c = r.querySelector('[name="closes"]').value;
      if (open && (!o || !c || o >= c)) return toast(`שעות לא תקינות ביום ${DAYS[r.dataset.dow]}`, 'error');
    }
    try {
      for (const r of rows) {
        const open = r.querySelector('[name="open"]').checked;
        await api.saveHours(Number(r.dataset.dow), open ? r.querySelector('[name="opens"]').value : null, open ? r.querySelector('[name="closes"]').value : null);
      }
      toast('שעות הפתיחה נשמרו');
    } catch (err) { fail(err); }
  });

  /* ---------- הגדרות: ימים סגורים ---------- */
  async function renderBlocked() {
    try {
      const rows = await api.getBlockedDays();
      $('#blockList').innerHTML = rows.length
        ? rows.map(b => `<li><span>${fmtDate(b.day)}${b.reason ? ' · ' + esc(b.reason) : ''}</span><button class="btn btn-ghost btn-sm" type="button" data-day="${esc(b.day)}">פתיחה מחדש</button></li>`).join('')
        : '<li class="muted">אין ימים סגורים.</li>';
    } catch (err) { fail(err); }
  }
  $('#blockForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target.elements;
    if (!f.day.value) return;
    try { await api.blockDay(f.day.value, f.reason.value.trim()); e.target.reset(); renderBlocked(); toast('היום נחסם'); }
    catch (err) { fail(err); }
  });
  $('#blockList').addEventListener('click', async e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    try { await api.unblockDay(b.dataset.day); renderBlocked(); } catch (err) { fail(err); }
  });

  /* ---------- הפעלה ---------- */
  async function showApp() {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;
    try { services = await api.getAllServices(); } catch (err) { fail(err); }
    fillServiceSelect();
    renderServices();
    setDay(iso(new Date()));
    loadGallery();
    loadMessages();
    renderHoursEditor().catch(fail);
    renderBlocked();
  }

  let signedIn = false;
  try { signedIn = await api.isSignedIn(); } catch (err) { console.error(err); }
  if (signedIn) showApp(); else $('#loginView').hidden = false;
})();
