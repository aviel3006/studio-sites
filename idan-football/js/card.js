/* =========================================================
   כרטיס שחקן: ממלאים שם, עמדה, גיל ומה לשפר,
   ורואים את הכרטיס "היום" ו"אחרי 12 אימונים"
   ========================================================= */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const card = $('#pcard');
  if (!card) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STATS = [['pace', 'מהירות'], ['drib', 'כדרור'], ['shot', 'בעיטה'], ['pass', 'מסירה'], ['def', 'הגנה'], ['phys', 'כושר']];
  const POS = {
    gk: { label: 'שוער', short: 'GK', base: { pace: 55, drib: 42, shot: 48, pass: 56, def: 66, phys: 60 } },
    df: { label: 'מגן', short: 'DF', base: { pace: 60, drib: 50, shot: 46, pass: 58, def: 66, phys: 64 } },
    mf: { label: 'קשר', short: 'MF', base: { pace: 61, drib: 62, shot: 56, pass: 66, def: 52, phys: 58 } },
    fw: { label: 'חלוץ', short: 'FW', base: { pace: 66, drib: 63, shot: 65, pass: 54, def: 38, phys: 58 } },
  };
  const AGES = [['kids', '6–9', -14], ['young', '10–13', -7], ['teen', '14–18', 0], ['adult', 'בוגרים', 2]];
  const FOCUS = [['pace', 'מהירות'], ['drib', 'כדרור'], ['shot', 'בעיטה לשער'], ['pass', 'מסירות'], ['def', 'הגנה'], ['phys', 'כושר'], ['weak', 'רגל חלשה']];
  // "רגל חלשה" משפרת גם בעיטה וגם כדרור
  const boosts = k => st.focus.includes(k) || (st.focus.includes('weak') && (k === 'shot' || k === 'drib'));

  const st = { name: '', no: '10', pos: 'mf', age: 'young', focus: ['drib', 'shot'], when: 'now' };
  const shown = {};

  function seg(el, list, key) {
    el.innerHTML = list.map(([v, label]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${st[key] === v}">${label}</button>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      st[key] = b.dataset.v;
      el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      render();
    });
  }
  seg($('#labPos'), Object.entries(POS).map(([k, p]) => [k, p.label]), 'pos');
  seg($('#labAge'), AGES, 'age');

  const focusEl = $('#labFocus');
  focusEl.innerHTML = FOCUS.map(([v, label]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${st.focus.includes(v)}">${label}</button>`).join('');
  focusEl.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const v = b.dataset.v;
    if (st.focus.includes(v)) st.focus = st.focus.filter(x => x !== v);
    else { st.focus.push(v); if (st.focus.length > 2) st.focus.shift(); }
    focusEl.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(st.focus.includes(x.dataset.v))));
    render();
  });

  $('#labName').addEventListener('input', e => { st.name = e.target.value.trim(); render(); });
  $('#labNo').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
    st.no = e.target.value || '10';
    render();
  });
  $('#pcWhen').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.when === st.when) return;
    st.when = b.dataset.when;
    $('#pcWhen').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    if (st.when === 'after' && !still) {
      card.classList.remove('upgrade');
      void card.offsetWidth;
      card.classList.add('upgrade');
    }
    render();
  });

  function values() {
    const p = POS[st.pos], ageAdj = AGES.find(a => a[0] === st.age)[2];
    const out = {};
    STATS.forEach(([k]) => {
      let v = p.base[k] + ageAdj;
      if (st.when === 'after') v += boosts(k) ? 15 : 5;
      out[k] = Math.max(25, Math.min(94, v));
    });
    const w = st.pos === 'gk' ? { def: 3, phys: 2, pass: 1, pace: 1 } : st.pos === 'df' ? { def: 3, phys: 2, pace: 1, pass: 1 }
      : st.pos === 'mf' ? { pass: 3, drib: 2, shot: 1, pace: 1, phys: 1 } : { shot: 3, pace: 2, drib: 2, phys: 1 };
    const tw = Object.values(w).reduce((a, b) => a + b, 0);
    out.ovr = Math.round(Object.entries(w).reduce((a, [k, x]) => a + out[k] * x, 0) / tw);
    return out;
  }

  function countTo(el, key, to) {
    const from = shown[key] ?? to;
    shown[key] = to;
    if (still || from === to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 700;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statsEl = $('#pcStats');
  statsEl.innerHTML = STATS.map(([k, label]) => `<li data-k="${k}"><b>0</b><span>${label}</span><i><em></em></i></li>`).join('');

  function render() {
    const v = values(), after = st.when === 'after';
    countTo($('#pcOvr'), 'ovr', v.ovr);
    $('#pcPos').textContent = POS[st.pos].short;
    $('#pcBadge').textContent = after ? 'אחרי 12 אימונים' : 'היום';
    card.classList.toggle('is-after', after);
    $('#pcName').textContent = st.name || 'השחקן שלך';
    const shirtName = $('#pcShirtName'), label = st.name || 'PLAYER';
    shirtName.textContent = label;
    if (label.length > 6) {
      shirtName.setAttribute('textLength', String(Math.min(230, label.length * 30)));
      shirtName.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    } else shirtName.removeAttribute('textLength');
    $('#pcShirtNo').textContent = st.no;
    statsEl.querySelectorAll('li').forEach(li => {
      const k = li.dataset.k, val = v[k];
      countTo(li.querySelector('b'), k, val);
      li.querySelector('em').style.width = `${val}%`;
      li.classList.toggle('up', after && boosts(k));
    });
  }

  $('#labBook').addEventListener('click', () => {
    const form = document.getElementById('bookForm');
    const focus = st.focus.map(f => FOCUS.find(x => x[0] === f)[1]).join(' ו');
    const age = AGES.find(a => a[0] === st.age)[1];
    const note = `כרטיס שחקן: ${st.name || 'שחקן'} #${st.no}, ${POS[st.pos].label}, גיל ${age}${focus ? `. רוצה לשפר: ${focus}` : ''}`;
    if (form && form.elements.note) form.elements.note.value = note.slice(0, 300);
    document.getElementById('booking').scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
  });

  /* הטיה עדינה של הכרטיס לפי העכבר + ברק הולוגרפי */
  if (!still && matchMedia('(pointer: fine)').matches) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
      card.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  }

  render();
})();
