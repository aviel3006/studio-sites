/* =========================================================
   מדידת לק: שתי ידיים מצוירות. בוחרות צבע, גימור, צורה
   וגוון עור, ורואות איך זה ייראה על הציפורניים.
   ========================================================= */
(function () {
  'use strict';
  const svg = document.getElementById('hands');
  if (!svg) return;
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';

  const COLORS = [
    ['Milk', '#EFE3DA'], ['Nude', '#DDB8A6'], ['Ballet', '#F2B8C6'], ['Mauve', '#B98389'],
    ['Rosewood', '#B4646A'], ['Coral', '#E8705F'], ['Rouge', '#C1121F'], ['Cherry', '#9E2B3C'],
    ['Plum', '#5E2A49'], ['Lilac', '#B9A3D0'], ['Sky', '#9CC3D9'], ['Midnight', '#2B2C44'],
    ['Sage', '#8A9A82'], ['Champagne', '#D9B77E'], ['Mocha', '#7A5546'], ['Noir', '#1E1B1E'],
  ];
  const FINISHES = [['gloss', 'מבריק'], ['matte', 'מט'], ['glitter', 'נצנצים'], ['french', 'פרנץ׳']];
  const SHAPES = [['oval', 'אובאל'], ['almond', 'אלמונד'], ['square', 'סקוור'], ['coffin', 'קופין']];
  const SKINS = [['בהיר', '#F3D9C8'], ['בהיר-חם', '#E7BFA0'], ['שזוף', '#C99070'], ['כהה', '#9A6446'], ['כהה מאוד', '#6A4330']];
  const NUDE_BASE = '#F1D2C6';
  // x, y של בסיס האצבע, רוחב, אורך, זווית, שם
  const FINGERS = [
    [-55, -236, 33, 110, -8, 'זרת'],
    [-20, -256, 36, 140, -2.5, 'קמיצה'],
    [16, -262, 37, 154, 1.5, 'אמה'],
    [51, -250, 36, 136, 6.5, 'אצבע'],
    [62, -150, 41, 114, 50, 'אגודל'],
  ];
  const HANDS = [
    ['יד שמאל', 'translate(140 486) rotate(-5)'],
    ['יד ימין', 'translate(480 486) scale(-1 1) rotate(-5)'],
  ];
  const PALM = 'M-46 30L-48-90C-62-130-78-190-74-238Q-72-262-40-270L52-264Q76-256 74-230C76-198 80-168 62-120C55-100 48-78 46-56L46 30Z';
  const n = v => Math.round(v * 10) / 10;

  const byHex = h => COLORS.find(c => c[1].toLowerCase() === String(h).trim().toLowerCase());
  const startHex = getComputedStyle(document.documentElement).getPropertyValue('--polish').trim();
  const start = byHex(startHex) || [($('#shadeName') || {}).textContent || 'הגוון שלך', startHex || '#9E2B3C'];

  const state = {
    nails: Array.from({ length: 10 }, () => ({ c: start, f: 'gloss' })),
    brush: { c: start, f: 'gloss' },
    shape: 'almond', skin: SKINS[1][1], mode: 'all', sel: -1, touched: false,
  };

  /* ---------- גיאומטריה ---------- */
  function fingerPath(w, L, from) {
    const tw = w * 0.84, r = tw / 2, top = -L + r;
    // נקודה על דופן האצבע בגובה from (הקו בין רוחב הבסיס לרוחב הקצה)
    const sx = y => w / 2 - (w / 2 - r) * ((30 - y) / (30 - top));
    if (from === undefined) return `M${n(-w / 2)} 30L${n(-r)} ${n(top)}A${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(top)}L${n(w / 2)} 30Z`;
    return `M${n(-sx(from))} ${from}L${n(-r)} ${n(top)}A${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(top)}L${n(sx(from))} ${from}`;
  }

  function nailGeo(w, L, shape) {
    const tw = w * 0.84, nw = tw * 0.78, h = nw / 2;
    const b = -L + tw * 1.28, k = nw * 0.17;
    const ext = { oval: 0.1, almond: 0.95, square: 0.6, coffin: 0.88 }[shape];
    const t = -L - tw * ext;
    const base = `M${n(-h)} ${n(b - k)}Q0 ${n(b + k)} ${n(h)} ${n(b - k)}`;
    let tip;
    if (shape === 'oval') {
      tip = `L${n(h)} ${n(t + h)}A${n(h)} ${n(h)} 0 0 0 ${n(-h)} ${n(t + h)}Z`;
    } else if (shape === 'almond') {
      const m = t + (b - t) * 0.42;
      tip = `C${n(h * 1.04)} ${n(m)} ${n(h * 0.3)} ${n(t + 3)} 0 ${n(t)}C${n(-h * 0.3)} ${n(t + 3)} ${n(-h * 1.04)} ${n(m)} ${n(-h)} ${n(b - k)}Z`;
    } else if (shape === 'square') {
      tip = `L${n(h * 1.04)} ${n(t + 4)}Q${n(h * 1.04)} ${n(t)} ${n(h * 1.04 - 4)} ${n(t)}L${n(-h * 1.04 + 4)} ${n(t)}Q${n(-h * 1.04)} ${n(t)} ${n(-h * 1.04)} ${n(t + 4)}Z`;
    } else {
      const m = t + (b - t) * 0.5;
      tip = `L${n(h * 1.02)} ${n(m)}L${n(h * 0.62)} ${n(t + 1.5)}Q${n(h * 0.6)} ${n(t)} ${n(h * 0.5)} ${n(t)}L${n(-h * 0.5)} ${n(t)}Q${n(-h * 0.6)} ${n(t)} ${n(-h * 0.62)} ${n(t + 1.5)}L${n(-h * 1.02)} ${n(m)}Z`;
    }
    const smileEdge = shape === 'oval' ? -L + tw * 0.22 : -L + tw * 0.3;
    const french = `M${n(-nw)} ${n(t - 8)}L${n(nw)} ${n(t - 8)}L${n(nw)} ${n(smileEdge)}Q0 ${n(-L - tw * 0.22)} ${n(-nw)} ${n(smileEdge)}Z`;
    const shine = `M${n(-h * 0.46)} ${n(b - nw * 0.42)}Q${n(-h * 0.62)} ${n((b + t) / 2)} ${n(-h * 0.36)} ${n(t + (b - t) * 0.2)}`;
    return { d: base + tip, french, shine, box: [-nw, t - 8, nw * 2, b - t + 20] };
  }

  /* ---------- ציור ---------- */
  function draw() {
    let id = 0;
    const hands = HANDS.map(([hname, tr], hi) => {
      const fingers = FINGERS.map(([x, y, w, L, a, fname], fi) => {
        const i = id++;
        return `<g class="finger" transform="translate(${x} ${y}) rotate(${a})" data-i="${i}" data-w="${w}" data-l="${L}" tabindex="0" role="button" aria-label="${fname}, ${hname}">
          <path class="h-fill" d="${fingerPath(w, L)}"/>
          <path class="h-shade" d="${fingerPath(w, L).replace(/ 30Z$/, ' 0Z').replace(/^M(\S+) 30/, 'M$1 0')}" fill="url(#tryShade)"/>
          <path class="h-line" d="${fingerPath(w, L, -10)}"/>
          <path class="h-crease" d="M${n(-w * 0.22)} ${n(-L * 0.5)}q${n(w * 0.22)} -4 ${n(w * 0.44)} 0M${n(-w * 0.16)} ${n(-L * 0.5 + 5)}q${n(w * 0.16)} -3 ${n(w * 0.32)} 0"/>
          <g class="nail" data-i="${i}"></g>
        </g>`;
      }).join('');
      return `<g class="hand" transform="${tr}" mask="url(#tryFade)">
        <g filter="url(#tryShadow)">
          <path class="h-fill h-palm" d="${PALM}"/>
          <path d="${PALM}" fill="url(#tryPalm)"/>
          ${fingers}
        </g>
      </g>`;
    }).join('');

    svg.innerHTML = `<defs>
      <linearGradient id="tryShade" x1="0" x2="1">
        <stop offset="0" stop-color="#3a1f12" stop-opacity=".16"/><stop offset=".3" stop-color="#fff" stop-opacity=".12"/>
        <stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a1f12" stop-opacity=".2"/>
      </linearGradient>
      <radialGradient id="tryPalm" cx=".42" cy=".42" r=".7">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#3a1f12" stop-opacity=".14"/>
      </radialGradient>
      <linearGradient id="tryFadeG" gradientUnits="userSpaceOnUse" x1="0" y1="-70" x2="0" y2="0">
        <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <mask id="tryFade" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-200" y="-520" width="400" height="560">
        <rect x="-200" y="-520" width="400" height="560" fill="url(#tryFadeG)"/>
      </mask>
      <filter id="tryShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#3a1f12" flood-opacity=".16"/>
      </filter>
      <pattern id="tryGlit" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r="1.1" fill="#fff" opacity=".95"/><circle cx="7.5" cy="1.6" r=".75" fill="#f6e5c6"/>
        <circle cx="5" cy="7.6" r="1.25" fill="#fff" opacity=".6"/><circle cx="9.6" cy="8.8" r=".7" fill="#fff"/>
        <circle cx="1" cy="9.6" r=".6" fill="#e9c98f"/><circle cx="8.6" cy="5" r=".45" fill="#fff" opacity=".8"/>
      </pattern>
    </defs>${hands}`;
    drawNails();
  }

  function drawNails() {
    svg.querySelectorAll('.finger').forEach(fg => {
      const i = +fg.dataset.i, g = nailGeo(+fg.dataset.w, +fg.dataset.l, state.shape);
      const [bx, by, bw, bh] = g.box;
      fg.querySelector('.nail').innerHTML = `
        <clipPath id="tryNc${i}"><path d="${g.d}"/></clipPath>
        <path class="n-base" d="${g.d}"/>
        <g clip-path="url(#tryNc${i})">
          <path class="n-tip" d="${g.french}"/>
          <rect class="n-glit" x="${n(bx)}" y="${n(by)}" width="${n(bw)}" height="${n(bh)}" fill="url(#tryGlit)"/>
        </g>
        <path class="n-gloss" d="${g.d}" fill="url(#gloss)"/>
        <path class="n-shine" d="${g.shine}"/>
        <path class="n-edge" d="${g.d}"/>
        <path class="n-sel" d="${g.d}"/>`;
    });
    paintAll(false);
  }

  function paintNail(i, pop) {
    const el = svg.querySelector(`.nail[data-i="${i}"]`);
    if (!el) return;
    const { c, f } = state.nails[i];
    el.dataset.f = f;
    el.querySelector('.n-base').style.fill = f === 'french' ? NUDE_BASE : c[1];
    el.querySelector('.n-tip').style.fill = c[1];
    el.classList.toggle('sel', state.mode === 'one' && state.sel === i);
    if (pop) {
      el.classList.remove('pop');
      void el.getBBox();
      el.classList.add('pop');
    }
  }
  function paintAll(pop) { for (let i = 0; i < 10; i++) paintNail(i, pop); }

  /* ---------- פקדים ---------- */
  const swatches = $('#trySwatches'), skins = $('#trySkins');
  swatches.innerHTML = COLORS.map(([name, hex]) =>
    `<button type="button" class="sw" style="--c:${hex}" data-hex="${hex}" aria-label="${name}" title="${name}" aria-pressed="false"></button>`).join('');
  skins.innerHTML = SKINS.map(([name, hex]) =>
    `<button type="button" class="sw sw-skin" style="--c:${hex}" data-hex="${hex}" aria-label="גוון עור ${name}" title="${name}" aria-pressed="false"></button>`).join('');
  const seg = (el, items, cur) => {
    el.innerHTML = items.map(([v, label]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${v === cur}">${label}</button>`).join('');
  };
  seg($('#tryFinish'), FINISHES, state.brush.f);
  seg($('#tryShape'), SHAPES, state.shape);
  seg($('#tryMode'), [['all', 'כל הציפורניים'], ['one', 'ציפורן אחת']], state.mode);

  const label = (list, v) => (list.find(x => x[0] === v) || [, ''])[1];
  function sync() {
    const b = state.brush;
    swatches.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed', String(s.dataset.hex === b.c[1])));
    skins.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed', String(s.dataset.hex === state.skin)));
    $('#tryFinish').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x.dataset.v === b.f)));
    $('#tryShape').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x.dataset.v === state.shape)));
    $('#tryMode').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x.dataset.v === state.mode)));
    $('#tryColorName').textContent = b.c[0];
    $('#tryFinishName').textContent = label(FINISHES, b.f);
    $('#tryShapeName').textContent = label(SHAPES, state.shape);
    $('#tryCap').textContent = summary(' · ');
    const hint = $('#tryHint');
    if (state.mode === 'one' && state.sel >= 0) {
      const fg = svg.querySelector(`.finger[data-i="${state.sel}"]`);
      hint.textContent = `עכשיו בחרי צבע ל${fg.getAttribute('aria-label').replace(', ', ' ב')}`;
    } else if (state.mode === 'one') {
      hint.textContent = 'לחצי על ציפורן ואז בחרי לה צבע';
    } else {
      hint.textContent = 'כל צבע שתבחרי ייצבע על כל הציפורניים. רוצה ציפורן בצבע אחר? לחצי עליה.';
    }
    svg.style.setProperty('--skin', state.skin);
  }

  // מכחול: צובע את כל הציפורניים או רק את הנבחרת
  function apply() {
    state.touched = true;
    if (state.mode === 'one') {
      if (state.sel < 0) return;
      state.nails[state.sel] = { ...state.brush };
      paintNail(state.sel, true);
    } else {
      state.nails = state.nails.map(() => ({ ...state.brush }));
      paintAll(true);
    }
  }

  swatches.addEventListener('click', e => {
    const s = e.target.closest('.sw');
    if (!s) return;
    state.brush.c = byHex(s.dataset.hex);
    apply(); sync();
  });
  $('#tryFinish').addEventListener('click', e => {
    const x = e.target.closest('button');
    if (!x) return;
    state.brush.f = x.dataset.v;
    apply(); sync();
  });
  $('#tryShape').addEventListener('click', e => {
    const x = e.target.closest('button');
    if (!x) return;
    state.shape = x.dataset.v; state.touched = true;
    drawNails(); sync();
  });
  skins.addEventListener('click', e => {
    const s = e.target.closest('.sw');
    if (!s) return;
    state.skin = s.dataset.hex;
    sync();
  });
  $('#tryMode').addEventListener('click', e => {
    const x = e.target.closest('button');
    if (!x) return;
    state.mode = x.dataset.v;
    if (state.mode === 'all') state.sel = -1;
    paintAll(false); sync();
  });

  function pickNail(fg) {
    const i = +fg.dataset.i;
    state.mode = 'one';
    state.sel = i;
    state.brush = { ...state.nails[i] };
    paintAll(false); sync();
  }
  svg.addEventListener('click', e => {
    const fg = e.target.closest('.finger');
    if (fg) pickNail(fg);
  });
  svg.addEventListener('keydown', e => {
    const fg = e.target.closest('.finger');
    if (fg && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickNail(fg); }
  });

  // סיכום לטקסט: "Cherry מבריק", או כמה צבעים עם מספר הציפורניים
  function summary(sep) {
    const groups = new Map();
    state.nails.forEach(({ c, f }) => {
      const key = `${c[0]} ${label(FINISHES, f)}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    const parts = [...groups].sort((a, b) => b[1] - a[1]).map(([k, cnt]) => (groups.size > 1 ? `${k} ×${cnt}` : k));
    return [...parts, label(SHAPES, state.shape)].join(sep);
  }

  $('#tryBook').addEventListener('click', () => {
    const note = document.querySelector('#bookForm [name="note"]');
    if (note) {
      const text = `מדדתי באתר: ${summary(', ')}`;
      note.value = text.slice(0, +note.maxLength > 0 ? +note.maxLength : 300);
      note.dispatchEvent(new Event('input', { bubbles: true }));
    }
    $('#tryMsg').textContent = 'הלק שבחרת נוסף להערה בתור. נשאר לבחור טיפול, יום ושעה.';
    $('#booking').scrollIntoView({ behavior: 'smooth' });
  });
  $('#tryReset').addEventListener('click', () => {
    state.brush = { c: start, f: 'gloss' };
    state.nails = state.nails.map(() => ({ ...state.brush }));
    state.mode = 'all'; state.sel = -1; state.shape = 'almond'; state.touched = false;
    $('#tryMsg').textContent = '';
    drawNails(); sync();
  });

  // לפני שנגעו במדידה, היא עוקבת אחרי הגוון שנבחר במניפה למעלה
  const follow = tip => {
    if (state.touched || !tip) return;
    const c = byHex(tip.dataset.c);
    if (!c) return;
    state.brush.c = c;
    state.nails = state.nails.map(() => ({ ...state.brush }));
    paintAll(false); sync();
  };
  document.addEventListener('click', e => follow(e.target.closest && e.target.closest('.fan .tip')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') follow(e.target.closest && e.target.closest('.fan .tip'));
  });

  draw();
  sync();
})();
