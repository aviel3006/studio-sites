/* =========================================================
   עמודי המידע (פרטיות, נגישות): פרטי העסק מתוך config.js
   ========================================================= */
(function () {
  'use strict';
  const biz = window.SITE_CONFIG.business;
  const links = {
    phone: `tel:${biz.phone.replace(/[^\d+]/g, '')}`,
    whatsapp: `https://wa.me/${biz.whatsapp}`,
  };
  document.querySelectorAll('[data-biz]').forEach(el => {
    const k = el.dataset.biz;
    el.textContent = k === 'instagram' ? '@' + biz.instagram : biz[k];
  });
  document.querySelectorAll('[data-biz-link]').forEach(el => {
    el.href = links[el.dataset.bizLink];
    if (el.dataset.bizLink !== 'phone') { el.target = '_blank'; el.rel = 'noopener'; }
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();
