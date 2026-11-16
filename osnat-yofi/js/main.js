/* =========================================================
   האתר הציבורי: מחירון, גלריה, קביעת תור, יצירת קשר
   ========================================================= */
(async function () {
  'use strict';
  const cfg = window.SITE_CONFIG, api = window.API, biz = cfg.business;

  const $ = (s, el = document) => el.querySelector(s);
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const MONTHS_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmtMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const validPhone = s => /^(0\d{8,9}|\+?972\d{8,9})$/.test(s.replace(/[\s-]/g, ''));

  let toastTimer;
  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
  }

  /* ---------- פרטי העסק ---------- */
  const links = {
    phone: `tel:${biz.phone.replace(/[^\d+]/g, '')}`,
    whatsapp: `https://wa.me/${biz.whatsapp}`,
    instagram: `https://instagram.com/${biz.instagram}`,
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address)}`,
    waze: `https://waze.com/ul?q=${encodeURIComponent(biz.address)}&navigate=yes`,
  };
  document.querySelectorAll('[data-biz]').forEach(el => {
    const k = el.dataset.biz;
    el.textContent = k === 'instagram' ? '@' + biz.instagram : biz[k];
  });
  document.querySelectorAll('[data-biz-link]').forEach(el => {
    el.href = links[el.dataset.bizLink];
    if (el.dataset.bizLink !== 'phone') { el.target = '_blank'; el.rel = 'noopener'; }
  });
  $('#year').textContent = new Date().getFullYear();

  /* ---------- תפריט מובייל ---------- */
  const nav = $('#nav'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', nav.classList.toggle('open')));
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- אנימציית כניסה ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  document.querySelectorAll('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('is-in')));

  /* ---------- נתונים ---------- */
  const state = { services: [], hours: {}, blocked: new Set(), service: null, date: null, time: null, busy: [], booked: null };
  try {
    const [services, hours, blocked] = await Promise.all([api.getServices(), api.getHours(), api.getBlockedDays()]);
    state.services = services;
    state.hours = hours;
    blocked.forEach(b => state.blocked.add(b.day));
  } catch (err) {
    console.error(err);
    toast('לא הצלחנו לטעון את הנתונים. נסו לרענן את הדף.', 'error');
    state.services = cfg.demoServices;
    state.hours = cfg.demoHours;
  }
  state.service = state.services[0] || null;

  const isOpenDay = d => Boolean(state.hours[d.getDay()]) && !state.blocked.has(iso(d));
  function hasTimeLeft(d) {
    if (iso(d) !== iso(new Date())) return true;
    const h = state.hours[d.getDay()], dur = state.service ? state.service.duration_min : cfg.slotMinutes;
    return nowMin() + 15 <= toMin(h[1]) - dur;
  }
  function dayList() {
    const out = [], d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < cfg.daysAhead; i++) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }

  /* ---------- מחירון ---------- */
  const CATS = cfg.categories || [['hands', 'ידיים'], ['feet', 'רגליים']];
  const catOf = s => s.category || CATS[0][0];
  const priceText = s => (s.price_max && s.price_max > s.price ? `${s.price}–${s.price_max}` : `${s.price}`);
  let menuCat = CATS[0][0];

  function renderMenu() {
    const cats = CATS.filter(([c]) => state.services.some(s => catOf(s) === c));
    if (!cats.some(([c]) => c === menuCat) && cats.length) menuCat = cats[0][0];
    $('#menuTabs').hidden = cats.length < 2;
    $('#menuTabs').innerHTML = cats.map(([c, label]) =>
      `<button type="button" role="tab" class="menu-tab" data-cat="${c}" aria-selected="${c === menuCat}">${label}<small>${state.services.filter(s => catOf(s) === c).length}</small></button>`).join('');
    const list = state.services.filter(s => catOf(s) === menuCat);
    $('#menu').classList.toggle('two-col', list.length > 5);
    $('#menu').innerHTML = list.map(s => `
      <li><button type="button" class="menu-row" data-id="${esc(s.id)}">
        <span class="menu-main">
          <span class="menu-name">${esc(s.name)}</span>
          ${s.description ? `<span class="menu-desc">${esc(s.description)}</span>` : ''}
        </span>
        <span class="menu-cut" aria-hidden="true"><svg class="i menu-sc"><use href="#i-scissors"/></svg></span>
        <span class="menu-price" dir="ltr">${priceText(s)}<small>₪</small></span>
        <span class="menu-meta">
          <span class="menu-dur"><svg class="i"><use href="#i-clock"/></svg>${s.duration_min} דק׳</span>
          <span class="menu-go">לקביעת תור ←</span>
        </span>
      </button></li>`).join('');
  }
  $('#menuTabs').addEventListener('click', e => {
    const t = e.target.closest('.menu-tab');
    if (!t || t.dataset.cat === menuCat) return;
    menuCat = t.dataset.cat;
    renderMenu();
  });
  $('#menu').addEventListener('click', e => {
    const b = e.target.closest('.menu-row');
    if (!b) return;
    selectService(b.dataset.id);
    $('#booking').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- שלב 1: שירות ---------- */
  let bookCat = CATS[0][0];
  function renderChips() {
    const cats = CATS.filter(([c]) => state.services.some(s => catOf(s) === c));
    if (!cats.some(([c]) => c === bookCat) && cats.length) bookCat = cats[0][0];
    const tabs = cats.length < 2 ? '' : `<div class="menu-tabs" role="tablist" aria-label="טיפולים לפי סוג">${cats.map(([c, label]) =>
      `<button type="button" role="tab" class="menu-tab" data-cat="${c}" aria-selected="${c === bookCat}">${label}</button>`).join('')}</div>`;
    $('#svcChips').innerHTML = tabs + `<div class="chips-row">${state.services.filter(s => catOf(s) === bookCat).map(s =>
      `<button type="button" class="chip" data-id="${esc(s.id)}" aria-pressed="${state.service?.id === s.id}">${esc(s.name)} <small dir="ltr">${priceText(s)}₪</small></button>`
    ).join('')}</div>`;
  }
  $('#svcChips').addEventListener('click', e => {
    const t = e.target.closest('.menu-tab');
    if (t) { bookCat = t.dataset.cat; renderChips(); return; }
    const b = e.target.closest('.chip');
    if (b) selectService(b.dataset.id);
  });
  function selectService(id) {
    state.service = state.services.find(s => s.id === id) || state.service;
    if (state.service) bookCat = catOf(state.service);
    if (state.booked) resetBooking();
    renderChips();
    renderSlots();
  }

  /* ---------- שלב 2: יום ---------- */
  function renderDays() {
    $('#days').innerHTML = dayList().map((d, i) => {
      const key = iso(d), open = isOpenDay(d);
      return `<button type="button" class="day" data-date="${key}" ${open ? '' : 'disabled'} aria-pressed="${state.date === key}" aria-label="יום ${DAYS[d.getDay()]} ${d.getDate()} ב${MONTHS[d.getMonth()]}${open ? '' : ' – סגור'}">
        <small>${i === 0 ? 'היום' : i === 1 ? 'מחר' : DAYS_SHORT[d.getDay()]}</small><b>${d.getDate()}</b><small>${MONTHS_SHORT[d.getMonth()]}</small>
      </button>`;
    }).join('');
  }
  $('#days').addEventListener('click', e => {
    const b = e.target.closest('.day');
    if (b && !b.disabled) selectDate(b.dataset.date);
  });
  function selectDate(key) {
    state.date = key;
    state.time = null;
    if (state.booked) resetBooking();
    renderDays();
    return loadBusy();
  }

  /* ---------- שלב 3: שעה ---------- */
  let busyReq = 0;
  async function loadBusy(silent = false) {
    const req = ++busyReq, picked = state.time;
    if (!silent) {
      $('#slots').innerHTML = '<p class="slots-msg">בודק שעות פנויות…</p>';
      renderTicket();
    }
    try {
      const busy = await api.getBusy(state.date);
      if (req !== busyReq) return;
      state.busy = busy;
    } catch (err) {
      if (req !== busyReq || silent) return;
      console.error(err);
      state.busy = [];
      toast('לא הצלחנו לבדוק שעות פנויות', 'error');
    }
    renderSlots();
    if (silent && picked && !state.time && !state.booked) toast(`השעה ${picked} נתפסה הרגע על ידי מישהו אחר. בחרו שעה אחרת.`, 'error');
  }
  // מי שמשאיר את הדף פתוח רואה תורים שנקבעו בינתיים
  const refreshBusy = () => {
    if (document.hidden) return;
    if (state.date) loadBusy(true);
    renderNextSlot();
  };
  setInterval(refreshBusy, 60000);
  document.addEventListener('visibilitychange', refreshBusy);
  function computeSlots(date = state.date, busy = state.busy, dur = state.service ? state.service.duration_min : cfg.slotMinutes) {
    const d = parseISO(date), h = state.hours[d.getDay()];
    if (!h) return [];
    const close = toMin(h[1]), isToday = date === iso(new Date()), cutoff = nowMin() + 15;
    const out = [];
    for (let m = toMin(h[0]); m + dur <= close; m += cfg.slotMinutes) {
      if (isToday && m < cutoff) continue;
      out.push({ m, free: !busy.some(b => m < b.end && m + dur > b.start) });
    }
    return out;
  }
  function renderSlots() {
    const el = $('#slots');
    if (!state.date) { el.innerHTML = '<p class="slots-msg">בחרו יום כדי לראות שעות.</p>'; renderTicket(); return; }
    const slots = computeSlots();
    if (state.time && !slots.some(s => s.free && fmtMin(s.m) === state.time)) state.time = null;
    if (!slots.length) {
      el.innerHTML = '<p class="slots-msg">לא נשארו היום שעות לקביעה. בחרו יום אחר.</p>';
      renderTicket();
      return;
    }
    const anyFree = slots.some(s => s.free), anyTaken = slots.some(s => !s.free);
    el.innerHTML = (anyFree ? '' : '<p class="slots-msg">כל השעות ביום הזה תפוסות. נסו יום אחר.</p>')
      + slots.map(s => {
          const t = fmtMin(s.m);
          return s.free
            ? `<button type="button" class="slot" data-time="${t}" aria-pressed="${state.time === t}">${t}</button>`
            : `<button type="button" class="slot taken" disabled aria-label="${t} – תפוס" title="השעה הזאת כבר שמורה"><span>${t}</span></button>`;
        }).join('')
      + (anyTaken ? '<p class="slots-legend" aria-hidden="true"><span class="lg"></span>פנוי<span class="lg taken"></span>תפוס</p>' : '');
    renderTicket();
  }
  $('#slots').addEventListener('click', e => {
    const b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    if (state.booked) resetBooking();
    state.time = b.dataset.time;
    renderSlots();
  });

  /* ---------- כרטיס התור ---------- */
  const steps = document.querySelectorAll('.step');
  function renderTicket() {
    const src = state.booked || state, s = src.service;
    $('#tService').textContent = s ? s.name : '—';
    $('#tDur').textContent = s ? `${s.duration_min} דקות` : '—';
    $('#tPrice').innerHTML = s ? `<span dir="ltr">${priceText(s)}₪</span>` : '—';
    if (src.date) {
      const d = parseISO(src.date);
      $('#tDay').textContent = `${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`;
    } else $('#tDay').textContent = '—';
    $('#tTime').innerHTML = src.time
      ? `<span dir="ltr">${src.time}${s ? '–' + fmtMin(toMin(src.time) + s.duration_min) : ''}</span>`
      : '—';
    steps[0].classList.toggle('done', Boolean(state.service));
    steps[1].classList.toggle('done', Boolean(state.date));
    steps[2].classList.toggle('done', Boolean(state.time));
  }

  /* ---------- שלב 4: שליחה ---------- */
  const form = $('#bookForm'), fld = form.elements;
  function invalid(input, msg) {
    input.closest('.field').classList.add('invalid');
    input.focus();
    toast(msg, 'error');
  }
  form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));
  $('#msgForm').addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (state.booked) return;
    const name = fld.fullname.value.trim(), phone = fld.phone.value.trim(), note = fld.note.value.trim();
    if (!state.service) return toast('בחרי טיפול', 'error');
    if (!state.date) return toast('בחרי יום', 'error');
    if (!state.time) {
      toast('בחרי שעה', 'error');
      $('#slots').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (name.length < 2) return invalid(fld.fullname, 'נא למלא שם מלא');
    if (!validPhone(phone)) return invalid(fld.phone, 'מספר הטלפון לא נראה תקין');

    const btn = $('#bookBtn');
    btn.disabled = true;
    btn.textContent = 'שומר את התור…';
    try {
      const id = await api.book({ serviceId: state.service.id, date: state.date, time: state.time, name, phone, note });
      state.booked = { id: String(id), service: state.service, date: state.date, time: state.time };
      fld.note.value = '';
      showBooked();
      renderNextSlot();
      loadBusy();
    } catch (err) {
      toast(err.message || 'משהו השתבש. נסו שוב.', 'error');
      loadBusy();
    } finally {
      btn.disabled = false;
      btn.textContent = 'אישור וקביעת תור';
    }
  });

  function showBooked() {
    const t = $('#ticket');
    $('#tNum').textContent = '#' + state.booked.id.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase();
    $('#stubPending').hidden = true;
    $('#stubDone').hidden = false;
    $('#waNote').hidden = !(api.live && cfg.whatsappAuto);
    renderTicket();
    t.classList.add('booked');
    $('#live').textContent = `התור נקבע ליום ${$('#tDay').textContent} בשעה ${state.booked.time}`;
    toast('התור נקבע! מחכה לך');
    if (matchMedia('(max-width: 960px)').matches) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function resetBooking() {
    state.booked = null;
    $('#ticket').classList.remove('booked');
    $('#stubPending').hidden = false;
    $('#stubDone').hidden = true;
  }
  $('#againBtn').addEventListener('click', () => {
    resetBooking();
    state.time = null;
    renderSlots();
    $('#booking').scrollIntoView({ behavior: 'smooth' });
  });
  $('#icsBtn').addEventListener('click', () => {
    const b = state.booked;
    if (!b) return;
    const [hh, mm] = b.time.split(':').map(Number), d = parseISO(b.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm);
    const end = new Date(start.getTime() + b.service.duration_min * 60000);
    const f = x => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//osnat-yofi//Booking//HE', 'BEGIN:VEVENT',
      `UID:${b.id}@osnat-yofi`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
      `SUMMARY:${b.service.name} אצל ${biz.name}`,
      `LOCATION:${biz.address.replace(/[,;]/g, m => '\\' + m)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:תזכורת לתור', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'tor-osnat-yofi.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  /* ---------- שעות פתיחה + "פתוח עכשיו" ---------- */
  function renderHours() {
    const today = new Date().getDay();
    $('#hoursTable').innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const h = state.hours[i];
      return `<tr class="${i === today ? 'today' : ''} ${h ? '' : 'closed'}">
        <td>יום ${DAYS[i]}${i === today ? ' · היום' : ''}</td>
        <td>${h ? `<span dir="ltr">${h[0]}–${h[1]}</span>` : 'סגור'}</td>
      </tr>`;
    }).join('');
  }
  function renderStatus() {
    const el = $('#openStatus'), label = el.querySelector('small span:last-child'), value = el.querySelector('b');
    const now = new Date(), nm = nowMin(), h = state.hours[now.getDay()];
    const openNow = h && !state.blocked.has(iso(now)) && nm >= toMin(h[0]) && nm < toMin(h[1]);
    el.classList.toggle('open', Boolean(openNow));
    if (openNow) { label.textContent = 'פתוח עכשיו'; value.textContent = `עד ${h[1]}`; return; }
    label.textContent = 'סגור כרגע';
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const hh = state.hours[d.getDay()];
      if (!hh || state.blocked.has(iso(d)) || (i === 0 && nm >= toMin(hh[0]))) continue;
      value.textContent = `נפתח ${i === 0 ? 'היום' : i === 1 ? 'מחר' : `ב${DAYS_SHORT[d.getDay()]}`} ${hh[0]}`;
      return;
    }
    value.textContent = '—';
  }

  /* ---------- Hero: מחיר התחלתי, כתובת, התור הפנוי הקרוב ---------- */
  function renderFacts() {
    const prices = state.services.map(s => s.price).filter(p => p > 0);
    $('#fromPrice').textContent = prices.length ? `${Math.min(...prices)}₪` : '—';
    $('#shortAddress').textContent = biz.address.split(',')[0];
  }
  // התור הפנוי הקרוב לגברים ולנשים, מחושב מהיומן: שעות פתיחה, ימים סגורים ותורים תפוסים.
  // לכל קהל בודקים את השירות הראשון שלו במחירון  לפי האורך שלו.
  let nextSlots = [];
  async function findNextSlots() {
    const reps = CATS.map(([c, label]) => ({ c, label, svc: state.services.find(s => catOf(s) === c) })).filter(r => r.svc);
    const found = {}, today = parseISO(iso(new Date()));
    for (const d of dayList().filter(isOpenDay).slice(0, 14)) {
      if (reps.every(r => found[r.c])) break;
      const key = iso(d), busy = await api.getBusy(key);
      for (const r of reps) {
        if (found[r.c]) continue;
        const free = computeSlots(key, busy, r.svc.duration_min).find(s => s.free);
        if (free) found[r.c] = { date: key, time: fmtMin(free.m), offset: Math.round((d - today) / 864e5) };
      }
    }
    return reps.map(r => ({ ...r, slot: found[r.c] || null }));
  }
  async function renderNextSlot() {
    try { nextSlots = await findNextSlots(); } catch (err) { console.error(err); return; }
    $('#nextCard').hidden = !nextSlots.length;
    $('#nextRows').innerHTML = nextSlots.map((r, i) => {
      if (!r.slot) return `<div class="next-row empty"><span class="next-cat">${r.label}</span><b>אין תור פנוי בשבועיים הקרובים</b></div>`;
      const d = parseISO(r.slot.date);
      const when = r.slot.offset === 0 ? 'היום' : r.slot.offset === 1 ? 'מחר' : `יום ${DAYS_SHORT[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`;
      return `<a class="next-row" href="#booking" data-i="${i}" aria-label="${r.label}: ${esc(r.svc.name)} ${when} בשעה ${r.slot.time} – לקביעה">
        <span class="next-cat">${r.label}<small>${esc(r.svc.name)}</small></span>
        <b>${when} · <span dir="ltr">${r.slot.time}</span></b>
        <span class="next-go" aria-hidden="true">←</span>
      </a>`;
    }).join('');
  }
  $('#nextRows').addEventListener('click', async e => {
    const row = e.target.closest('a.next-row');
    if (!row) return;
    e.preventDefault();
    const { svc, slot } = nextSlots[Number(row.dataset.i)];
    selectService(svc.id);
    $('#booking').scrollIntoView({ behavior: 'smooth' });
    await selectDate(slot.date);
    if (computeSlots().some(s => s.free && fmtMin(s.m) === slot.time)) {
      state.time = slot.time;
      renderSlots();
    } else {
      toast('התור הזה נתפס הרגע. בחרו שעה אחרת.', 'error');
      renderNextSlot();
    }
  });

  // מצגת העבודות האחרונות בתוך המראה
  function renderHeroShow() {
    const shots = photos.slice(0, 5);
    if (!shots.length) return;
    const el = $('#heroShow');
    el.innerHTML = shots.map((p, i) => `<img src="${esc(p.url)}" alt="" class="${i === 0 ? 'on' : ''}">`).join('')
      + `<div class="mirror-cap" id="heroCap">${esc(shots[0].caption || 'מהסטודיו')}</div>`;
    if (shots.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    setInterval(() => {
      const imgs = el.querySelectorAll('img');
      imgs[i].classList.remove('on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('on');
      $('#heroCap').textContent = shots[i].caption || 'מהסטודיו';
    }, 4500);
  }

  /* ---------- גלריה ---------- */
  const PAGE = 12;
  const PLACEHOLDERS = (cfg.galleryPlaceholders || ['לק ג׳ל', 'בנייה', 'פרנץ׳', 'ניל ארט', 'פדיקור', 'מניקור']).map(x => [x]);
  let photos = [], shown = PAGE;

  function renderGallery() {
    const el = $('#gallery');
    el.classList.toggle('is-empty', !photos.length && api.live);
    if (!photos.length) {
      el.innerHTML = api.live
        ? '<p class="gallery-empty">התמונות בדרך. בינתיים – אפשר להציץ באינסטגרם.</p>'
        : PLACEHOLDERS.map(([cap]) => `<div class="shot ph"><svg class="ph-logo" aria-hidden="true"><use href="#logo-mini"/></svg><small class="ph-note">תמונה לדוגמה</small><span class="shot-cap">${cap}</span></div>`).join('');
      $('#moreBtn').hidden = true;
      return;
    }
    el.innerHTML = photos.slice(0, shown).map((p, i) => `
      <button type="button" class="shot" data-i="${i}" aria-label="הגדלת תמונה${p.caption ? ': ' + esc(p.caption) : ''}">
        <img src="${esc(p.url)}" alt="${esc(p.caption || 'עבודה של ' + biz.name)}" loading="lazy" decoding="async" ${p.width ? `width="${p.width}" height="${p.height}"` : ''}>
        ${p.caption ? `<span class="shot-cap">${esc(p.caption)}</span>` : ''}
      </button>`).join('');
    $('#moreBtn').hidden = shown >= photos.length;
  }
  async function loadGallery() {
    try { photos = await api.getGallery(); }
    catch (err) { console.error(err); photos = []; }
    renderGallery();
    renderHeroShow();
  }
  $('#moreBtn').addEventListener('click', () => { shown += PAGE; renderGallery(); });

  const lb = $('#lightbox');
  let lbIndex = 0, lastFocus = null, touchX = 0;
  function openLb(i) {
    if (lb.hidden) lastFocus = document.activeElement;
    lbIndex = (i + photos.length) % photos.length;
    const p = photos[lbIndex];
    $('#lbImg').src = p.url;
    $('#lbImg').alt = p.caption || 'עבודה של ' + biz.name;
    $('#lbCap').textContent = p.caption || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus();
  }
  $('#gallery').addEventListener('click', e => {
    const b = e.target.closest('button.shot');
    if (b) openLb(Number(b.dataset.i));
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => openLb(lbIndex - 1));
  $('#lbNext').addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') openLb(lbIndex + 1);
    else if (e.key === 'ArrowRight') openLb(lbIndex - 1);
  });
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) openLb(lbIndex + (dx > 0 ? 1 : -1));
  });

  /* ---------- טופס יצירת קשר ---------- */
  const mf = $('#msgForm');
  mf.addEventListener('submit', async e => {
    e.preventDefault();
    const el = mf.elements, name = el.mname.value.trim(), phone = el.mphone.value.trim(), body = el.mbody.value.trim();
    if (name.length < 2) return invalid(el.mname, 'נא למלא שם');
    if (!validPhone(phone)) return invalid(el.mphone, 'מספר הטלפון לא נראה תקין');
    if (body.length < 2) return invalid(el.mbody, 'נא לכתוב הודעה');
    const btn = mf.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api.sendMessage({ name, phone, body });
      mf.reset();
      toast('ההודעה נשלחה. אחזור אליך בהקדם!');
    } catch (err) {
      toast(err.message || 'השליחה נכשלה. נסו שוב.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- הפעלה ---------- */
  renderMenu();
  renderChips();
  renderDays();
  renderHours();
  renderStatus();
  renderFacts();
  setInterval(renderStatus, 60000);
  const firstDay = dayList().find(d => isOpenDay(d) && hasTimeLeft(d));
  if (firstDay) selectDate(iso(firstDay)); else renderSlots();
  loadGallery();
  renderNextSlot();
})();
