/* =========================================================
   חבילת הקלפים בהירו + אתגר הקפיצות
   ========================================================= */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const KEY = 'idanalbum';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(`${KEY}-${k}`); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(`${KEY}-${k}`, v); } catch { /* מצב פרטי */ } },
  };

  /* ---------- חבילת קלפים ---------- */
  const SKILLS = [
    ['sk-ball', 'כדרור'], ['sk-goal', 'בעיטה לשער'], ['sk-bolt', 'מהירות'],
    ['sk-pass', 'מסירה'], ['sk-foot', 'רגל חלשה'], ['sk-eye', 'ראיית משחק'],
    ['sk-glove', 'שוערות'], ['sk-star', 'ביטחון'], ['sk-brain', 'קבלת החלטות'],
  ];
  const stage = $('#pack'), packBtn = $('#packBtn'), repack = $('#repack');
  const skillCards = [...document.querySelectorAll('#cards .c-skill')];
  const coach = $('#cards .c-coach');
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function deal() {
    const pool = [...SKILLS].sort(() => Math.random() - 0.5).slice(0, skillCards.length);
    skillCards.forEach((el, i) => {
      const [ic, name] = pool[i], rate = rnd(71, 93), up = rnd(4, 11);
      const tier = rate >= 87 ? ['gold', 'זהב'] : rate >= 79 ? ['silver', 'כסף'] : ['bronze', 'ארד'];
      el.className = `card c-skill t-${tier[0]}`;
      el.innerHTML = `<div class="sk-in">
        <div class="sk-head"><b class="sk-rate">${rate}</b><small>${tier[1]}</small></div>
        <svg class="sk-ic"><use href="#${ic}"/></svg>
        <span class="sk-name">${name}</span>
        <small class="sk-up">+${up} אחרי חודש</small>
      </div>`;
    });
  }

  let opened = false;
  function openPack() {
    if (opened) return;
    opened = true;
    stage.classList.add('open');
    packBtn.tabIndex = -1;
    setTimeout(() => { repack.hidden = false; stage.classList.add('settled'); }, still ? 0 : 1700);
  }
  deal();
  packBtn.addEventListener('click', openPack);
  // פותחים לבד אחרי רגע, כדי שגם מי שלא לוחץ יראה את הקלפים
  setTimeout(openPack, still ? 0 : 1400);

  repack.addEventListener('click', () => {
    if (stage.classList.contains('swap')) return;
    stage.classList.add('swap');
    setTimeout(deal, still ? 0 : 320);
    setTimeout(() => stage.classList.remove('swap'), still ? 0 : 700);
  });

  // הטיה והברק ההולוגרפי בקלף של המאמן
  if (!still && matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', e => {
      const r = coach.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      coach.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
      coach.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
      coach.style.setProperty('--hx', `${x * 100}%`);
    });
    stage.addEventListener('pointerleave', () => {
      coach.style.removeProperty('--rx');
      coach.style.removeProperty('--ry');
      coach.style.removeProperty('--hx');
    });
  }

  /* ---------- אתגר הקפיצות ---------- */
  const court = $('#court'), ball = $('#jBall'), shadow = $('#jShadow'), msg = $('#jMsg'), pop = $('#jPop');
  const scoreEl = $('#jScore'), bestEl = $('#jBest'), medals = [...document.querySelectorAll('#jMedals li')];
  const G = 1750, KICK = 790;
  let W = 0, H = 0, R = 0, floor = 0;
  let x = 0, y = 0, vx = 0, vy = 0, rot = 0, running = false, score = 0, last = 0;
  let best = Number(store.get('juggle')) || 0;

  function measure() {
    W = court.clientWidth;
    H = court.clientHeight;
    R = ball.offsetWidth / 2;
    floor = H - Math.round(H * 0.14) - R;
  }
  function draw() {
    ball.style.transform = `translate(${x - R}px, ${y - R}px) rotate(${rot}deg)`;
    const lift = Math.max(0, Math.min(1, (floor - y) / (H * 0.8)));
    shadow.style.transform = `translateX(${x - R}px) scale(${1 - lift * 0.6})`;
    shadow.style.opacity = String(0.5 - lift * 0.35);
  }
  function showScore() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    medals.forEach(li => li.classList.toggle('got', best >= Number(li.dataset.at)));
  }
  function rest() {
    measure();
    x = W / 2; y = floor; vx = vy = 0;
    draw();
  }
  function popText(text, big) {
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y - R - 8}px`;
    pop.className = `jpop${big ? ' big' : ''}`;
    void pop.offsetWidth;
    pop.classList.add('go');
  }

  function kick(px) {
    if (!running) {
      running = true;
      score = 0;
      court.classList.add('playing');
      last = performance.now();
      requestAnimationFrame(step);
    }
    const dx = (x - px) / R;
    vy = -(KICK + Math.random() * 70);
    vx = Math.max(-430, Math.min(430, vx * 0.35 + dx * 280 + (Math.random() - 0.5) * 70));
    score++;
    if (score > best) { best = score; store.set('juggle', best); }
    const medal = medals.find(li => Number(li.dataset.at) === score);
    popText(medal ? `${medal.textContent.replace(/\d+/, '').trim()}!` : String(score), Boolean(medal));
    showScore();
    ball.classList.remove('hit');
    void ball.offsetWidth;
    ball.classList.add('hit');
  }

  function end() {
    running = false;
    court.classList.remove('playing');
    y = floor;
    vx = vy = 0;
    draw();
    msg.innerHTML = score >= 10
      ? `<b>${score} קפיצות!</b><small>כמעט מקצוען. לחצו על הכדור לעוד ניסיון</small>`
      : `<b>${score} ${score === 1 ? 'קפיצה' : 'קפיצות'}</b><small>לחצו על הכדור לעוד ניסיון</small>`;
  }

  function step(t) {
    if (!running) return;
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    vy += G * dt;
    x += vx * dt;
    y += vy * dt;
    if (x < R) { x = R; vx = Math.abs(vx) * 0.8; }
    if (x > W - R) { x = W - R; vx = -Math.abs(vx) * 0.8; }
    if (y < R) { y = R; vy = Math.abs(vy) * 0.4; }
    rot += vx * dt * 1.6;
    if (y >= floor && vy > 0) { end(); return; }
    draw();
    requestAnimationFrame(step);
  }

  court.addEventListener('pointerdown', e => {
    const r = court.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    if (Math.hypot(px - x, py - y) > R * 1.7) return;
    e.preventDefault();
    kick(px);
  });
  // מקלדת: Enter / רווח על הכדור
  ball.addEventListener('click', e => { if (e.detail === 0) kick(x + (Math.random() - 0.5) * R); });

  $('#jBook').addEventListener('click', () => {
    const note = document.querySelector('#bookForm input[name="note"]');
    if (note && best > 0 && !note.value) note.value = `השיא שלי באתגר הקפיצות: ${best}`;
    $('#booking').scrollIntoView({ behavior: 'smooth' });
  });

  addEventListener('resize', () => {
    const wasRunning = running;
    if (!wasRunning) { rest(); return; }
    measure();
    x = Math.min(Math.max(x, R), W - R);
    draw();
  });

  showScore();
  rest();
  // הגופנים והפריסה יכולים לזוז אחרי הטעינה
  addEventListener('load', () => { if (!running) rest(); });
})();
