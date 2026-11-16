/* =========================================================
   מניפת הגוונים: לחיצה על ציפורן צובעת את האתר בגוון שלה
   ========================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  const tips = [...document.querySelectorAll('.fan .tip')];
  const nameEl = document.getElementById('shadeName');
  const KEY = 'tehilanails-shade';
  if (!tips.length) return;

  function luminance(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const f = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f((n >> 16 & 255) / 255) + 0.7152 * f((n >> 8 & 255) / 255) + 0.0722 * f((n & 255) / 255);
  }

  function paint(hex, save) {
    const tip = tips.find(t => t.dataset.c.toLowerCase() === hex.toLowerCase()) || tips[0];
    hex = tip.dataset.c;
    const light = luminance(hex) > 0.4;
    root.style.setProperty('--polish', hex);
    root.style.setProperty('--on-polish', light ? '#241A1D' : '#FFFFFF');
    // גוון בהיר מדי לטקסט על רקע בהיר: מכהים אותו לכותרות
    root.style.setProperty('--polish-ink', light ? `color-mix(in oklab, ${hex} 45%, #241A1D)` : hex);
    tips.forEach(t => {
      const on = t === tip;
      t.classList.toggle('on', on);
      t.setAttribute('aria-pressed', String(on));
    });
    if (nameEl) nameEl.textContent = tip.dataset.n;
    if (save) { try { localStorage.setItem(KEY, hex); } catch (e) { /* מצב פרטי */ } }
  }

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  paint(saved || getComputedStyle(root).getPropertyValue('--polish').trim(), false);

  tips.forEach(t => {
    t.addEventListener('click', () => paint(t.dataset.c, true));
    t.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paint(t.dataset.c, true); }
    });
  });
})();
