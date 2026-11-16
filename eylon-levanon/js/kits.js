/* =========================================================
   מדים: לחיצה על ערכת מדים צובעת את החולצה ואת כל האתר
   + הכדור בהירו (אפשר לבעוט בו) + הטיה תלת־ממדית של החולצה
   ========================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  const kits = [...document.querySelectorAll('#kits .kit')];
  const nameEl = document.getElementById('kitName');
  const jersey = document.getElementById('jersey');
  const KEY = 'eylonlevanon-kit';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function luminance(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const f = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f((n >> 16 & 255) / 255) + 0.7152 * f((n >> 8 & 255) / 255) + 0.0722 * f((n & 255) / 255);
  }

  function paint(kit, animate) {
    if (!kit) return;
    const { shirt, trim, accent, n } = kit.dataset;
    root.style.setProperty('--shirt', shirt);
    root.style.setProperty('--trim', trim);
    root.style.setProperty('--kit', accent);
    root.style.setProperty('--on-kit', luminance(accent) > 0.35 ? '#06110A' : '#FFFFFF');
    kits.forEach(k => {
      const on = k === kit;
      k.classList.toggle('on', on);
      k.setAttribute('aria-checked', String(on));
    });
    if (nameEl) nameEl.textContent = `מדים ${n}`;
    if (animate && jersey && !still) {
      jersey.classList.remove('swap');
      void jersey.offsetWidth;
      jersey.classList.add('swap');
    }
  }

  if (kits.length) {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
    paint(kits.find(k => k.dataset.n === saved) || kits[0], false);
    kits.forEach(k => k.addEventListener('click', () => {
      paint(k, true);
      try { localStorage.setItem(KEY, k.dataset.n); } catch (e) { /* מצב פרטי */ }
    }));
    document.getElementById('kits').addEventListener('keydown', e => {
      const i = kits.findIndex(k => k.classList.contains('on'));
      const step = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = kits[(i + step + kits.length) % kits.length];
      next.focus();
      next.click();
    });
  }

  /* ---------- הטיית החולצה לפי העכבר ---------- */
  const art = document.getElementById('heroArt');
  if (art && jersey && !still && matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    art.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        jersey.style.setProperty('--ry', `${(x * 22).toFixed(2)}deg`);
        jersey.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
      });
    });
    art.addEventListener('pointerleave', () => {
      jersey.style.setProperty('--ry', '0deg');
      jersey.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- בעיטה בכדור ---------- */
  const ball = document.getElementById('ball');
  if (ball) {
    let kicks = 0;
    ball.addEventListener('click', () => {
      if (still) return;
      kicks++;
      ball.classList.remove('kick', 'kick2');
      void ball.offsetWidth;
      ball.classList.add(kicks % 2 ? 'kick' : 'kick2');
    });
    ball.addEventListener('animationend', e => {
      if (e.animationName.startsWith('kick')) ball.classList.remove('kick', 'kick2');
    });
  }
})();
