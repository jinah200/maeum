/* ============================================================
 *  온라인 마음쉼터 — v6
 *  숲길 · 쉼터 10곳 · 예쁜 아바타 · 동물 친구들 · 하이파이브
 *  마음 동전 · 숲속 가게 · 함께 꽃밭 · 마음 날씨 · 빗소리 · 명언 계단
 *  서버: Google Apps Script(시트 모드) / 없으면 로컬 모드(혼자 보기)
 * ============================================================ */
(function () {
  'use strict';

  /* ===================== 기본 도구 ===================== */
  const A = window.ART;
  const QUOTES = window.QUOTES || [];
  const cfg = window.CONFIG || {};
  const sheetMode = !!cfg.APPS_SCRIPT_URL;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (n) => Math.floor(Math.random() * n);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const isTouch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 공간 없음 */ } },
  };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ===================== 상수 ===================== */
  const W = 5760, SPEED = 250, DSPEED = 0.85, NEAR = 130, STAR_AT = 5;
  const KIND_HOPE = '바람', KIND_LETGO = '내려놓기';
  const ADJ = ['느린', '따뜻한', '조용한', '포근한', '맑은', '다정한', '싱그러운', '잔잔한', '반짝이는', '수줍은', '너그러운', '차분한', '말랑한', '산뜻한', '고요한', '부드러운'];
  const NOUN = ['걸음', '바람', '새벽', '구름', '오솔길', '햇살', '이슬', '나뭇잎', '달빛', '시냇물', '솔방울', '민들레', '별빛', '도토리', '꽃잎', '숲길'];
  const EMO = ['', '👋', '💚', '😊', '🙏', '🙌'];
  const ZONES = [
    { id: 'plaza', x: 360, name: '쉼터 광장', short: '광장', icon: '🪧', tint: '#f4e7cf' },
    { id: 'shop', x: 840, name: '숲속 가게', short: '가게', icon: '🏪', tint: '#d6efe4' },
    { id: 'links', x: 1340, name: '링크 나눔터', short: '나눔터', icon: '🎁', tint: '#fbdcd9', big: true },
    { id: 'tree', x: 1880, name: '숨 쉬는 나무', short: '숨 고르기', icon: '🌳', tint: '#ddeed0' },
    { id: 'spring', x: 2360, name: '마음 구슬 샘', short: '마음 구슬', icon: '🫧', tint: '#dbecf5' },
    { id: 'lantern', x: 2840, name: '염원 등불터', short: '염원', icon: '🏮', tint: '#fbe6c4' },
    { id: 'garden', x: 3380, name: '함께 꽃밭', short: '꽃밭', icon: '🌷', tint: '#fadde4' },
    { id: 'pond', x: 3920, name: '마음 날씨 연못', short: '마음 날씨', icon: '🪷', tint: '#d6edf2' },
    { id: 'rain', x: 4400, name: '빗소리 정자', short: '빗소리', icon: '☔', tint: '#dfe7ec' },
    { id: 'stair', x: 4880, name: '명언 계단', short: '명언 계단', icon: '🪜', tint: '#f1e4cc' },
    { id: 'hill', x: 5380, name: '별빛 언덕', short: '별빛 언덕', icon: '⭐', tint: '#e6def5' },
  ];
  const zoneById = (id) => ZONES.find((z) => z.id === id);
  const PURPOSES = ['수업용', '일상 상식', '음악', '기타'];
  const PURPOSE_ICON = ['📚', '💡', '🎵', '🔗'];
  const LEVELS = ['유', '초', '중', '고'];
  const LEVEL_NAME = ['유치원', '초등', '중등', '고등'];
  const SUBJECTS = ['국', '수', '사', '과', '영', '음', '미', '체', '실', '기타'];
  const SUBJECT_NAME = ['국어', '수학', '사회', '과학', '영어', '음악', '미술', '체육', '실과', '기타'];

  /* ===================== 나 ===================== */
  let sid = null;
  try { sid = localStorage.getItem('ms_session'); } catch (e) { /* */ }
  if (!sid) {
    sid = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem('ms_session', sid); } catch (e) { /* */ }
  }
  const LOOK_N = { a: ADJ.length, b: NOUN.length, s: A.SKIN.length, h: A.HAIR.length, hs: A.STYLE_NAMES.length, o: A.OUTFIT.length, ot: A.TYPE_NAMES.length };
  const randomProfile = () => ({ a: randInt(ADJ.length), b: randInt(NOUN.length), s: randInt(3), h: randInt(A.HAIR.length), hs: randInt(6), o: randInt(A.OUTFIT.length), ot: randInt(4) });
  const nameOf = (p) => ADJ[p.a] + ' ' + NOUN[p.b];
  function validProfile(p) {
    if (!p || typeof p !== 'object') return null;
    const out = {};
    for (const k in LOOK_N) {
      const v = p[k] === undefined ? 0 : p[k];
      if (!Number.isInteger(v) || v < 0 || v >= LOOK_N[k]) return null;
      out[k] = v;
    }
    return out;
  }
  let profile = validProfile(store.get('ms_profile', null));
  const me = { x: 420, d: 0.55, facing: 1, target: null, zone: '', el: null, e: 0, hf: '', ev: 0, emoUntil: 0, pet: null };

  /* ===================== 마음 동전 ===================== */
  const EARN = {
    wish: { name: '염원 올리기', ico: '🏮', each: 5, max: 20 },
    emp: { name: '공감 보내기', ico: '🤍', each: 1, max: 10 },
    star: { name: '내 마음이 별이 됨', ico: '⭐', each: 5, max: 15 },
    hf: { name: '하이파이브', ico: '🙌', each: 2, max: 10 },
    breath: { name: '숨 세 번 고르기', ico: '🌳', each: 1, max: 5 },
    beads: { name: '구슬 한 바퀴', ico: '🫧', each: 1, max: 5 },
    mood: { name: '마음 날씨 남기기', ico: '🪷', each: 2, max: 2 },
    rain: { name: '빗소리 쉼 끝까지', ico: '☔', each: 2, max: 6 },
    stair: { name: '명언 계단 10칸', ico: '🪜', each: 1, max: 22 },
    stairDone: { name: '108계단 완주', ico: '🎉', each: 10, max: 10 },
    pet: { name: '동물 쓰다듬기', ico: '🐑', each: 1, max: 5 },
  };
  const wallet = Object.assign({ coins: 0, owned: { acc: [0], pet: [0] }, c: 0, p: 0, day: '', earn: {}, gift: false }, store.get('ms_wallet', {}) || {});
  if (!wallet.owned || !Array.isArray(wallet.owned.acc)) wallet.owned = { acc: [0], pet: [0] };
  wallet.c = clamp(wallet.c | 0, 0, A.ACC.length - 1); wallet.p = clamp(wallet.p | 0, 0, A.PET.length - 1);
  function saveWallet() { store.set('ms_wallet', wallet); }
  function rollDay() { if (wallet.day !== today()) { wallet.day = today(); wallet.earn = {}; saveWallet(); } }
  function renderCoins(bump) {
    $('coinCount').textContent = wallet.coins;
    ['shopCoins', 'gardenCoins', 'walletCoins'].forEach((id) => { const e = $(id); if (e) e.textContent = wallet.coins; });
    if (typeof renderDockSubs === 'function' && $('sub-shop')) $('sub-shop').textContent = '🪙 ' + wallet.coins;
    if (bump) { const c = $('coinBtn'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }
  function coinFly(n) {
    const r = $('coinBtn').getBoundingClientRect();
    const f = el('div', 'coin-fly', '+' + n);
    f.style.left = (r.left + r.width / 2 - 10) + 'px'; f.style.top = (r.bottom + 4) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }
  function earn(kind) {
    rollDay();
    const e = EARN[kind]; if (!e) return 0;
    const got = wallet.earn[kind] || 0;
    if (got >= e.max) return 0;
    const add = Math.min(e.each, e.max - got);
    wallet.earn[kind] = got + add; wallet.coins += add;
    saveWallet(); renderCoins(true); coinFly(add); Sound.coin();
    return add;
  }
  function spend(n) {
    if (wallet.coins < n) return false;
    wallet.coins -= n; saveWallet(); renderCoins(true);
    return true;
  }
  const look = () => Object.assign({}, profile || { a: 0, b: 0, s: 0, h: 0, hs: 0, o: 0, ot: 0 }, { c: wallet.c, p: wallet.p });

  /* ===================== 화면 크기 ===================== */
  let vw = 0, vh = 0, bandTop = 0, bandBot = 0, bandH = 1, lmScale = 1, cam = 0;
  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    const navH = ($('controls').offsetHeight || 90) + ($('interact').hidden ? 0 : 0);
    bandTop = Math.round(vh * 0.6);
    bandBot = vh - navH - 18;
    if (bandBot - bandTop < 90) bandTop = bandBot - 90;
    bandH = Math.max(60, bandBot - bandTop);
    lmScale = clamp(vh / 820, 0.62, 1.08);
  }

  /* ===================== 사람 ===================== */
  function makePerson(p, isMe) {
    const e = el('div', 'person' + (isMe ? ' me' : ''), '<div class="p-label"><span class="p-zone"></span><span class="p-name"></span></div><div class="flipper"></div>');
    setLook(e, p, isMe);
    return e;
  }
  function setLook(e, p, isMe) {
    e.querySelector('.flipper').innerHTML = A.person(p);
    e.querySelector('.p-name').textContent = (isMe ? '나 · ' : '') + nameOf(p);
  }
  function setZoneIcon(e, zid) { const z = zoneById(zid); e.querySelector('.p-zone').textContent = z ? z.icon : ''; }
  const yOf = (d) => bandTop + d * bandH;
  function placeAt(e, x, d, base, alt) {
    const s = (base || 1) * (0.78 + d * 0.4);
    e.style.transform = `translate3d(${x.toFixed(1)}px,${(yOf(d) - (alt || 0)).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    e.style.zIndex = String(20 + Math.round(d * 100) + (alt ? 120 : 0));
  }
  function showBubble(e, text, ms, cls) {
    let b = e.querySelector('.bubble');
    if (!b) { b = el('div', 'bubble'); e.appendChild(b); }
    b.className = 'bubble' + (cls ? ' ' + cls : '');
    b.textContent = text; b.hidden = false;
    clearTimeout(e._bt);
    e._bt = setTimeout(() => { b.hidden = true; }, ms || 3000);
  }
  function playHi5(e) { e.classList.remove('hi5'); void e.offsetWidth; e.classList.add('hi5'); setTimeout(() => e.classList.remove('hi5'), 950); }
  function clapAt(x, d) {
    const c = el('div', 'clap', '👏');
    c.style.left = x + 'px'; c.style.top = yOf(d) + 'px';
    $('people').appendChild(c);
    setTimeout(() => c.remove(), 1400);
  }

  /* ===================== 장면 만들기 ===================== */
  const worldEl = $('world'), peopleEl = $('people'), lmLayer = $('landmarks'), decorEl = $('decor'), starfieldEl = $('starfield');
  const lmEls = {};
  const decor = [];
  function buildScene() {
    worldEl.style.width = W + 'px';
    const tl = $('treeline');
    for (let i = 0; i < 78; i++) {
      const t = el('div', 'tree' + (Math.random() < 0.4 ? ' pine' : ''));
      t.style.left = Math.round(i * 82 + rand(-24, 24)) + 'px';
      t.style.bottom = (43 + rand(0, 3)).toFixed(1) + '%';
      t.style.transform = `scale(${rand(0.65, 1.35).toFixed(2)})`;
      tl.appendChild(t);
    }
    const cl = $('clouds');
    for (let i = 0; i < 5; i++) {
      const c = el('div', 'cloud'), w = rand(90, 220);
      c.style.width = w + 'px'; c.style.height = (w * 0.4) + 'px';
      c.style.top = rand(6, 28) + '%';
      c.style.animationDuration = rand(60, 120) + 's';
      c.style.animationDelay = (-rand(0, 80)) + 's';
      cl.appendChild(c);
    }
    const ns = $('nightStars');
    for (let i = 0; i < 70; i++) {
      const s = el('i');
      s.style.left = rand(0, 100) + '%'; s.style.top = rand(0, 100) + '%';
      s.style.animationDelay = (-rand(0, 3)) + 's';
      if (Math.random() < 0.2) { s.style.width = s.style.height = '3px'; }
      ns.appendChild(s);
    }
    const ff = $('fireflies');
    for (let i = 0; i < 18; i++) {
      const f = el('div', 'firefly');
      f.style.left = rand(0, 100) + '%'; f.style.top = rand(25, 75) + '%';
      f.style.setProperty('--dx', rand(-25, 25) + 'px'); f.style.setProperty('--dy', rand(-45, -15) + 'px');
      f.style.animationDuration = rand(3, 7) + 's, ' + rand(2, 4) + 's';
      f.style.animationDelay = (-rand(0, 4)) + 's';
      ff.appendChild(f);
    }
    const path = el('div', 'path'); decorEl.appendChild(path); decor.push({ el: path, kind: 'path' });
    const colors = ['#f5b3b8', '#fbe08a', '#c9b6ef', '#ffffff', '#f7c59f'];
    for (let i = 0; i < 120; i++) {
      const r = Math.random();
      let e;
      if (r < 0.35) e = el('div', 'tuft');
      else if (r < 0.8) { e = el('div', 'flower'); e.style.background = colors[randInt(colors.length)]; }
      else { e = el('div', 'sway', A.flower(randInt(6))); e.style.animationDelay = (-rand(0, 3)) + 's'; }
      decorEl.appendChild(e);
      decor.push({ el: e, x: rand(20, W - 20), d: rand(0, 1) });
    }
    // 크리스마스 꾸미기 — 트리·선물·눈사람
    const gcol = ['#d8453e', '#3f8a54', '#5e9bd6', '#f2a9c0', '#c98d5a'];
    const rcol = ['#ffd94e', '#fbf7f2', '#9ccf7c'];
    for (let i = 0; i < 11; i++) {
      const e = el('div', 'xtree', A.XTREE);
      decorEl.appendChild(e); decor.push({ el: e, x: rand(60, W - 60), d: rand(0.08, 0.85) });
    }
    for (let i = 0; i < 20; i++) {
      const e = el('div', 'xgift', A.GIFT);
      e.style.setProperty('--box', gcol[randInt(gcol.length)]); e.style.setProperty('--rib', rcol[randInt(rcol.length)]);
      decorEl.appendChild(e); decor.push({ el: e, x: rand(30, W - 30), d: rand(0, 1) });
    }
    for (let i = 0; i < 5; i++) {
      const e = el('div', 'xsnow', A.SNOWMAN);
      decorEl.appendChild(e); decor.push({ el: e, x: rand(100, W - 100), d: rand(0.1, 0.8) });
    }
    // 눈 내리기
    const snow = $('snow');
    for (let i = 0; i < 46; i++) {
      const f = el('div', 'flake', Math.random() < 0.5 ? '❄' : '•');
      f.style.left = rand(0, 100) + '%';
      f.style.fontSize = rand(8, 18).toFixed(0) + 'px';
      f.style.setProperty('--sdur', rand(7, 16).toFixed(1) + 's');
      f.style.setProperty('--sdrift', rand(-40, 40).toFixed(0) + 'px');
      f.style.animationDelay = (-rand(0, 16)).toFixed(1) + 's';
      f.style.opacity = rand(0.4, 0.95).toFixed(2);
      snow.appendChild(f);
    }
    ZONES.forEach((z) => {
      const art = A.LM[z.id];
      const e = el('div', 'landmark' + (z.big ? ' big' : ''));
      e.dataset.zone = z.id;
      e.innerHTML = `<svg viewBox="0 0 ${art.vb[0]} ${art.vb[1]}" aria-hidden="true">${art.svg}</svg>` +
        `<div class="lm-label">${z.icon} ${z.name}</div>` +
        `<button class="lm-prompt" type="button">${isTouch ? '눌러서 들어가기' : 'Enter 로 들어가기'}</button>`;
      e.querySelector('.lm-prompt').addEventListener('click', (ev) => { ev.stopPropagation(); enterZone(z.id); });
      lmLayer.appendChild(e);
      lmEls[z.id] = e;
    });
    // 아래 바로가기
    const track = $('dockTrack');
    ZONES.forEach((z) => {
      const b = el('button', 'dock-btn' + (z.big ? ' big' : ''));
      b.type = 'button'; b.dataset.go = z.id;
      b.innerHTML = `<span class="dock-ico" style="--tint:${z.tint}">${z.icon}</span><span class="dock-name">${z.short}</span><span class="dock-sub" id="sub-${z.id}"></span>` + (z.big ? '<span class="dock-flag">NEW</span>' : '');
      b.addEventListener('click', () => { b.blur(); goTo(z.id, true); });
      track.appendChild(b);
    });
  }
  function layout() {
    ZONES.forEach((z) => {
      const art = A.LM[z.id], e = lmEls[z.id];
      const w = art.w, h = w * art.vb[1] / art.vb[0];
      e.style.width = w + 'px';
      e.style.left = (z.x - w / 2) + 'px';
      e.style.top = (bandTop - h + 14) + 'px';
      e.style.transform = `scale(${lmScale.toFixed(3)})`;
    });
    decor.forEach((it) => {
      if (it.kind === 'path') { it.el.style.top = (bandTop + bandH * 0.42 - 14) + 'px'; it.el.style.zIndex = '1'; return; }
      it.el.style.left = it.x.toFixed(0) + 'px';
      it.el.style.top = yOf(it.d).toFixed(0) + 'px';
      it.el.style.zIndex = String(2 + Math.round(it.d * 9));
    });
    renderStarfield();
    renderGardenBed();
  }

  /* ===================== 숲지기 새싹 ===================== */
  const npc = { x: 470, d: 0.06, el: null, line: 0, k: 'npc' };
  const NPC_LINES = ['어서 와요. 천천히 둘러봐요 🌱', '가까이 와서 하이파이브 해요!', '마음 동전은 가게랑 꽃밭에서 써요.', '명언 계단 끝에는 무엇이 있을까요?', '마음이 무거우면 등불터에 내려놓고 가요.'];
  function spawnNpc() {
    const e = el('div', 'person npc', '<div class="p-label">🌱 숲지기 새싹</div>' + A.SPROUT);
    peopleEl.appendChild(e);
    npc.el = e;
  }
  function npcTalk() { showBubble(npc.el, NPC_LINES[npc.line++ % NPC_LINES.length], 3600); }

  /* ===================== 숲의 동물들 ===================== */
  const CRITTERS = [
    ['sheep', 3, 'walk', [14, 26], 1],
    ['rabbit', 4, 'hop', [45, 75], 1],
    ['deer', 2, 'walk', [18, 30], 1],
    ['squirrel', 2, 'hop', [55, 85], 1],
    ['bloom', 3, 'walk', [10, 18], 1],
    ['fairy', 3, 'fly', [26, 44], 1],
    ['butterfly', 6, 'fly', [30, 60], 1],
  ];
  const PETALS = ['#ffb3c7', '#ffd36e', '#c8b4f2', '#9fd3f5', '#ffc09a'];
  const WINGS = ['#ffc6e0', '#ffe08a', '#bfe3ff', '#d9c6ff', '#c9f0b8', '#ffd0a8'];
  const critters = [];
  function makeCritterEl(kind, cls) {
    const art = A.ANIMAL[kind];
    const e = el('div', 'critter ' + (cls || ''), `<div class="art">${art.svg}</div>`);
    e.style.width = art.w + 'px'; e.style.height = art.h + 'px';
    e.style.margin = `${-art.h}px 0 0 ${-art.w / 2}px`;
    e.style.transformOrigin = `${art.w / 2}px ${art.h}px`;
    return e;
  }
  function spawnCritters() {
    CRITTERS.forEach(([kind, n, mode, sp]) => {
      for (let i = 0; i < n; i++) {
        const e = makeCritterEl(kind, kind === 'fairy' ? 'fairy' : '');
        if (kind === 'bloom') e.style.setProperty('--petal', PETALS[randInt(PETALS.length)]);
        if (kind === 'butterfly') e.style.setProperty('--wing', WINGS[randInt(WINGS.length)]);
        peopleEl.appendChild(e);
        const c = { el: e, kind, mode, x: rand(500, W - 200), d: rand(0.05, 0.95), dir: Math.random() < 0.5 ? -1 : 1,
          speed: rand(sp[0], sp[1]), pause: rand(0, 3), alt: mode === 'fly' ? rand(kind === 'fairy' ? 90 : 30, kind === 'fairy' ? 170 : 110) : 0, ph: rand(0, 6), petAt: 0 };
        if (mode === 'fly') c.baseAlt = c.alt;
        e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); petCritter(c); });
        critters.push(c);
      }
    });
  }
  const CRITTER_LINES = { sheep: '음메~', rabbit: '깡총!', deer: '사뿐', squirrel: '도토리 좋아', bloom: '살랑살랑', fairy: '반짝반짝 ✨', butterfly: '팔랑' };
  function petCritter(c) {
    const h = el('div', 'heart-pop', '💗');
    h.style.left = c.x + 'px'; h.style.top = (yOf(c.d) - c.alt) + 'px'; h.style.zIndex = '400';
    peopleEl.appendChild(h); setTimeout(() => h.remove(), 1000);
    c.pause = 2.5;
    Sound.tok();
    const now = Date.now();
    if (now - c.petAt > 30000) { c.petAt = now; if (earn('pet')) toast(CRITTER_LINES[c.kind] + ' 동물 친구가 좋아해요'); }
  }
  function updateCritters(dt, t) {
    critters.forEach((c) => {
      const moving = c.pause <= 0;
      if (!moving) c.pause -= dt;
      else {
        c.x += c.dir * c.speed * dt;
        if (c.mode !== 'fly') c.d = clamp(c.d + Math.sin(t * 0.0007 + c.ph) * 0.02 * dt, 0, 1);
        if (c.x < 120) { c.x = 120; c.dir = 1; }
        if (c.x > W - 120) { c.x = W - 120; c.dir = -1; }
        if (Math.random() < 0.18 * dt) c.dir *= -1;
        if (c.mode !== 'fly' && Math.random() < (c.mode === 'hop' ? 0.5 : 0.15) * dt) c.pause = rand(1, c.mode === 'hop' ? 2.5 : 4.5);
      }
      if (c.mode === 'fly') c.alt = c.baseAlt + Math.sin(t * 0.0016 + c.ph) * 18;
      c.el.classList.toggle('flip', c.dir > 0);
      c.el.classList.toggle(c.mode, c.mode === 'fly' || moving);
      placeAt(c.el, c.x, c.d, 0.95, c.alt);
    });
  }

  /* ===================== 따라다니는 동물 친구 ===================== */
  function setPet(owner, p) {
    if (owner.pet && owner.pet.p === p) return;
    if (owner.pet) { owner.pet.el.remove(); owner.pet = null; }
    if (!p || !A.PET_ART[p]) return;
    const kind = A.PET_ART[p];
    const e = makeCritterEl(kind, 'pet');
    if (kind === 'butterfly') e.style.setProperty('--wing', '#ffd0a8');
    peopleEl.appendChild(e);
    owner.pet = { el: e, p, x: owner.x - 40, d: owner.d, fly: kind === 'butterfly', scale: A.PET_SCALE[p] || 0.6 };
  }
  function updatePet(owner, facing, dt, t) {
    const pt = owner.pet; if (!pt) return;
    const tx = owner.x - facing * 46, td = clamp(owner.d + 0.03, 0, 1);
    const dx = tx - pt.x;
    pt.x += dx * Math.min(1, dt * 4); pt.d += (td - pt.d) * Math.min(1, dt * 4);
    const moving = Math.abs(dx) > 3;
    pt.el.classList.toggle('flip', facing > 0);
    pt.el.classList.toggle(pt.fly ? 'fly' : 'hop', pt.fly || moving);
    placeAt(pt.el, pt.x, pt.d, pt.scale * 1.3, pt.fly ? 60 + Math.sin(t * 0.004) * 8 : 0);
  }

  /* ===================== 숲 소리 ===================== */
  const Sound = (function () {
    let ctx, master, sfx, ambG, on = false, windStarted = false, birdTimer = null, amb = null;
    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(ctx.destination);
      ambG = ctx.createGain(); ambG.gain.value = 0; ambG.connect(ctx.destination);
    }
    function noiseBuf(kind) {
      const size = 2 * ctx.sampleRate, buf = ctx.createBuffer(1, size, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w;
        else { d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3; }
      }
      return buf;
    }
    function loopSrc(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; }
    function startWind() {
      const src = loopSrc(noiseBuf('brown'));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
      const g = ctx.createGain(); g.gain.value = 0.07;
      src.connect(lp); lp.connect(g); g.connect(master); src.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    }
    function chirp() {
      if (!on) return;
      const t = ctx.currentTime, notes = 2 + randInt(3), base = rand(1700, 3000);
      let dest = master;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = rand(-0.8, 0.8); p.connect(master); dest = p; }
      for (let n = 0; n < notes; n++) {
        const st = t + n * 0.09, f = base * (1 + rand(-0.1, 0.2));
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f * 0.8, st); o.frequency.exponentialRampToValueAtTime(f * 1.25, st + 0.04); o.frequency.exponentialRampToValueAtTime(f * 0.9, st + 0.085);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(0.1, st + 0.012); g.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
        o.connect(g); g.connect(dest); o.start(st); o.stop(st + 0.1);
      }
      birdTimer = setTimeout(chirp, rand(2600, 9000));
    }
    function toggle() {
      ensure(); if (!ctx) return false;
      if (ctx.state === 'suspended') ctx.resume();
      on = !on;
      if (on) {
        if (!windStarted) { startWind(); windStarted = true; }
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.6);
        chirp();
      } else { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); clearTimeout(birdTimer); }
      return on;
    }
    function tone(freqs, gap, vol, len, type, force) {
      if ((!on && !force) || !ctx) return;
      const t = ctx.currentTime;
      freqs.forEach((f, i) => {
        const st = t + i * gap, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(vol, st + 0.015); g.gain.exponentialRampToValueAtTime(0.001, st + len);
        o.connect(g); g.connect(sfx); o.start(st); o.stop(st + len + 0.05);
      });
    }
    function clap() {
      if (!on || !ctx) return;
      const t = ctx.currentTime, src = ctx.createBufferSource();
      src.buffer = noiseBuf('white');
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      src.connect(bp); bp.connect(g); g.connect(sfx); src.start(t); src.stop(t + 0.2);
      tone([784, 1046.5], 0.08, 0.08, 0.4);
    }
    // 빗소리 정자: 소리 켜기와 상관없이 직접 고른 소리를 틀어요
    function ambient(kind) {
      ensure(); if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      stopAmbient(true);
      const nodes = [];
      const src = loopSrc(noiseBuf(kind === 'fire' ? 'brown' : 'white'));
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      if (kind === 'rain') { f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.4; g.gain.value = 0.16; }
      else if (kind === 'stream') {
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7; g.gain.value = 0.22;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35; const lg = ctx.createGain(); lg.gain.value = 300;
        lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo);
      } else { f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.5; }
      src.connect(f); f.connect(g); g.connect(ambG); src.start(); nodes.push(src);
      let timer = null;
      const tick = () => {
        const t = ctx.currentTime;
        if (kind === 'fire') {
          const c = ctx.createBufferSource(); c.buffer = noiseBuf('white');
          const cg = ctx.createGain(); cg.gain.setValueAtTime(rand(0.05, 0.18), t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
          c.connect(hp); hp.connect(cg); cg.connect(ambG); c.start(t); c.stop(t + 0.05);
          timer = setTimeout(tick, rand(60, 420));
        } else {
          const o = ctx.createOscillator(), og = ctx.createGain(), fr = rand(1200, 3200);
          o.frequency.setValueAtTime(fr, t); o.frequency.exponentialRampToValueAtTime(fr * 0.6, t + 0.08);
          og.gain.setValueAtTime(kind === 'rain' ? 0.03 : 0.02, t); og.gain.exponentialRampToValueAtTime(0.0005, t + 0.1);
          o.connect(og); og.connect(ambG); o.start(t); o.stop(t + 0.12);
          timer = setTimeout(tick, rand(kind === 'rain' ? 40 : 200, kind === 'rain' ? 260 : 900));
        }
      };
      tick();
      ambG.gain.cancelScheduledValues(ctx.currentTime);
      ambG.gain.setValueAtTime(0, ctx.currentTime);
      ambG.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.2);
      amb = { nodes, stop() { clearTimeout(timer); nodes.forEach((n) => { try { n.stop(); } catch (e) { /* */ } }); } };
    }
    function stopAmbient(now) {
      if (!amb || !ctx) return;
      const a = amb; amb = null;
      if (now) { a.stop(); return; }
      ambG.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => a.stop(), 900);
    }
    return {
      toggle, clap, ambient, stopAmbient,
      tok() { tone([430], 0, 0.2, 0.18); },
      step(i) { tone([392 + (i % 8) * 33], 0, 0.12, 0.16, 'triangle'); },
      coin() { tone([988, 1318.5], 0.07, 0.08, 0.3, 'triangle'); },
      chime(soft, force) { tone(soft ? [523.25, 659.25] : [523.25, 659.25, 783.99, 1046.5], 0.12, soft ? 0.07 : 0.11, 1.2, 'sine', force); },
    };
  })();

  /* ===================== 배경음악 (클래식·캐럴) ===================== */
  const Music = (function () {
    // 모두 저작권이 없는 옛 곡(캐럴·클래식)을 음 하나하나 소리로 만들어 들려줘요.
    const F = { 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, '-': 0 };
    const n = (name, d) => ({ f: F[name] || 0, d: d });
    const TRACKS = {
      jingle: { name: '징글벨', bpm: 132, bass: ['C3', 'G3'], mel: [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', .5], ['E4', 4], ['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', .5], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', .5], ['E4', .5], ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2]] },
      silent: { name: '고요한 밤', bpm: 96, bass: ['G3', 'C3'], mel: [['G4', 1.5], ['A4', .5], ['G4', 1], ['E4', 3], ['G4', 1.5], ['A4', .5], ['G4', 1], ['E4', 3], ['D5', 2], ['D5', 1], ['B4', 3], ['C5', 2], ['C5', 1], ['G4', 3]] },
      ode: { name: '환희의 송가', bpm: 120, bass: ['C3', 'G3'], mel: [['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1.5], ['D4', .5], ['D4', 2], ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1.5], ['C4', .5], ['C4', 2]] },
      canon: { name: '캐논(파헬벨)', bpm: 100, bass: ['D3', 'A3', 'B3', 'F3', 'G3', 'D3', 'G3', 'A3'], mel: [['F4', 2], ['E4', 2], ['D4', 2], ['C4', 2], ['B3', 2], ['A3', 2], ['B3', 2], ['C4', 2], ['D4', 2], ['C4', 2], ['B3', 2], ['A3', 2], ['G3', 2], ['F3', 2], ['G3', 2], ['E4', 2]] },
      gymnopedie: { name: '짐노페디(사티)', bpm: 76, bass: ['G3', 'D3', 'G3', 'D3'], mel: [['F5', 3], ['E5', 1], ['-', 2], ['D5', 2], ['A4', 2], ['B4', 2], ['-', 2], ['F5', 3], ['E5', 1], ['-', 2], ['D5', 2], ['A4', 2], ['B4', 4]] },
    };
    let ctx, master, on = '', timers = [], barTimer = null;
    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    }
    function pluck(freq, start, dur, vol, type) {
      if (!freq) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
      o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.05);
    }
    function playTrack(key) {
      const tr = TRACKS[key]; if (!tr) return;
      const beat = 60 / tr.bpm;
      let i = 0, bass = 0;
      const total = tr.mel.reduce((a, m) => a + m[1], 0);
      function bar() {
        const t0 = ctx.currentTime + 0.05;
        let t = t0;
        tr.mel.forEach((m) => { pluck(m[0] === '-' ? 0 : F[m[0]], t, m[1] * beat * 0.95, 0.12, 'triangle'); t += m[1] * beat; });
        // 낮은 베이스 반주
        let bt = t0, step = 2 * beat;
        for (let s = 0; s * step < total * beat; s++) { pluck(F[tr.bass[bass % tr.bass.length]] / 2 || 0, bt, step * 0.9, 0.06, 'sine'); bass++; bt += step; }
        barTimer = setTimeout(bar, total * beat * 1000 + 400);
      }
      bar();
    }
    function play(key) {
      if (key === on) return on;
      stop(true);
      if (!key || key === 'off') { on = ''; return ''; }
      ensure(); if (!ctx) return '';
      if (ctx.state === 'suspended') ctx.resume();
      on = key;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);
      playTrack(key);
      return on;
    }
    function stop(silent) {
      clearTimeout(barTimer); barTimer = null;
      timers.forEach(clearTimeout); timers = [];
      if (ctx && master && !silent) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      if (!silent) on = '';
    }
    return { play, stop, TRACKS, current: () => on };
  })();

  /* ===================== 서버 통신 ===================== */
  async function sheetFetch(options) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(cfg.APPS_SCRIPT_URL, Object.assign({ signal: ctrl.signal }, options));
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  function sheetPost(payload) {
    // text/plain 으로 보내면 브라우저의 사전요청 없이 Apps Script 로 전달됩니다.
    return sheetFetch({ method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  }

  /* ===================== 상태 ===================== */
  const state = { wishes: [], stars: { count: 0, recent: [] }, flowers: [], mood: [0, 0, 0, 0, 0, 0], links: [] };
  const seen = new Set();
  // 방금 내가 올렸는데 아직 서버 목록에 안 뜬 염원 (사라짐 방지)
  const myRecent = new Map();
  function rememberMine(w) { if (w && w.id) myRecent.set(w.id, { w: w, t: Date.now() }); }
  function mergeMyRecent() {
    const now = Date.now();
    myRecent.forEach((v, id) => {
      if (now - v.t > 90000) { myRecent.delete(id); return; }
      const rep = reported();
      if (rep[id]) { myRecent.delete(id); return; }
      // 이미 별이 됐거나 목록에 있으면 그대로, 없으면 다시 끼워 넣기
      if (state.stars.recent.some((s) => s.text === v.w.text)) { myRecent.delete(id); return; }
      if (!state.wishes.some((x) => x.id === id)) state.wishes.unshift(v.w);
    });
  }
  let visitsToday = 0, online = 1, presenceOk = false;
  const normKind = (k) => (k === KIND_LETGO ? KIND_LETGO : KIND_HOPE);
  function normWish(w) {
    if (typeof w === 'string') return { id: '', text: w, kind: KIND_HOPE, empathy: 0, at: 0 };
    return { id: String(w.id || ''), text: String(w.text || w.content || ''), kind: normKind(w.kind), empathy: Number(w.empathy) || 0, at: Number(w.at) || 0 };
  }
  const normFlower = (f) => ({ f: clamp(f.f | 0, 0, 5), x: clamp(+f.x || 0, 0, 100), y: clamp(+f.y || 0, 0, 100) });
  function normLink(l) {
    if (!l || !l.url) return null;
    return { id: String(l.id || ''), url: String(l.url), purpose: clamp(l.purpose | 0, 0, 3),
      level: Number.isInteger(l.level) && l.level >= 0 ? l.level : -1,
      subject: Number.isInteger(l.subject) && l.subject >= 0 ? l.subject : -1,
      topic: String(l.topic || ''), at: Number(l.at) || 0 };
  }
  function loadLocal() {
    let L = store.get('ms_local', null);
    if (!L) {
      const legacy = store.get('ms_wishes', []) || [];
      L = { wishes: legacy.map((w, i) => ({ id: 'L' + (w.at || Date.now()) + i, text: w.content, kind: KIND_HOPE, empathy: 0, at: w.at || Date.now() })).reverse(), stars: { count: 0, recent: [] } };
      store.set('ms_local', L);
    }
    state.wishes = (L.wishes || []).map(normWish);
    state.stars = L.stars || { count: 0, recent: [] };
    state.flowers = (L.flowers || []).map(normFlower);
    state.mood = L.mood && L.mood.day === today() ? L.mood.c : [0, 0, 0, 0, 0, 0];
    state.links = (L.links || []).map(normLink).filter(Boolean);
  }
  function saveLocal() {
    store.set('ms_local', { wishes: state.wishes.slice(0, 60), stars: state.stars, flowers: state.flowers.slice(-220), mood: { day: today(), c: state.mood }, links: state.links.slice(0, 60) });
  }
  const reported = () => store.get('ms_reported', {}) || {};
  async function refreshState(first) {
    if (!sheetMode) {
      loadLocal();
      if (first) state.wishes.slice(0, 6).reverse().forEach((w, i) => setTimeout(() => floatLantern(w.text, w.kind), 600 + i * 1300));
      afterState();
      return;
    }
    try {
      const d = await sheetFetch({ method: 'GET' });
      if (!d || !d.ok) throw new Error('bad response');
      const rep = reported();
      const ws = (d.wishes || []).map(normWish).filter((w) => w.text && !rep[w.id]);
      const fresh = first ? [] : ws.filter((w) => w.id && !seen.has(w.id));
      ws.forEach((w) => { if (w.id) seen.add(w.id); });
      state.wishes = ws;
      const st = d.stars || {};
      state.stars = { count: Number(st.count) || 0, recent: (st.recent || []).map((s) => ({ text: String(s.text || ''), kind: normKind(s.kind) })) };
      if (Array.isArray(d.flowers)) state.flowers = d.flowers.map(normFlower);
      if (Array.isArray(d.mood)) state.mood = d.mood.slice(0, 6).map((n) => Number(n) || 0);
      if (Array.isArray(d.links)) state.links = d.links.map(normLink).filter((x) => x && !rep[x.id]);
      visitsToday = Number(d.visitsToday) || visitsToday;
      mergeMyRecent();
      if (first) ws.slice(0, 8).reverse().forEach((w, i) => setTimeout(() => floatLantern(w.text, w.kind), 600 + i * 1300));
      else fresh.slice(0, 3).forEach((w, i) => setTimeout(() => floatLantern(w.text, w.kind), i * 900));
      afterState();
    } catch (e) {
      console.warn('[마음쉼터] 상태를 불러오지 못했어요', e);
      renderBadge();
    }
  }
  function afterState() {
    renderBadge(); renderStarfield(); renderGardenBed(); renderDockSubs(); renderSkyStars();
    if (!$('boardModal').hidden) renderBoard();
    if (!$('starsModal').hidden) renderStars();
    if (!$('gardenModal').hidden) renderGarden();
    if (!$('pondModal').hidden) renderMoodToday();
    if (!$('linksModal').hidden) renderLinks();
  }
  function renderBadge() {
    const parts = [];
    if (sheetMode && presenceOk) parts.push('지금 <b>' + Number(online) + '</b>명 함께');
    if (visitsToday) parts.push('오늘 ' + Number(visitsToday) + '명 다녀감');
    $('visitorBadge').innerHTML = parts.length ? parts.join(' · ') : '오늘도 숲이 열려 있어요';
  }
  function renderDockSubs() {
    const set = (id, t) => { const e = $('sub-' + id); if (e) e.textContent = t; };
    set('plaza', '안내'); set('shop', '🪙 ' + wallet.coins);
    set('links', state.links.length ? state.links.length + '개 링크' : '링크 나눔');
    set('tree', breaths + '번 숨'); set('spring', beadTotal + '알');
    set('lantern', state.wishes.length ? state.wishes.length + '개 마음' : '함께 보기');
    set('garden', state.flowers.length + '송이'); set('pond', moodPicked() !== null ? MOODS[moodPicked()].ico + ' 오늘' : '오늘 날씨');
    set('rain', '가만히 듣기'); set('stair', '최고 ' + (store.get('ms_stair_best', 0) || 0) + '칸'); set('hill', '별 ' + state.stars.count + '개');
  }
  function renderStarfield() {
    const hill = zoneById('hill');
    const n = Math.min(state.stars.count, 48);
    starfieldEl.textContent = '';
    const prand = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < n; i++) {
      const s = el('div', 'star-dot', '✦');
      s.style.left = (hill.x + (prand(i) * 2 - 1) * 170).toFixed(0) + 'px';
      s.style.top = (bandTop - (120 + prand(i + 99) * 180) * lmScale).toFixed(0) + 'px';
      s.style.fontSize = (15 + prand(i + 7) * 12).toFixed(0) + 'px';
      s.style.animationDelay = (-prand(i + 3) * 3).toFixed(2) + 's';
      starfieldEl.appendChild(s);
    }
  }
  // 별이 된 염원 — 하늘에 떠 있어요
  function renderSkyStars() {
    const layer = $('skyStars');
    if (!layer) return;
    const recent = state.stars.recent || [];
    const n = Math.min(Math.max(state.stars.count, recent.length), 40);
    const prand = (i) => { const x = Math.sin(i * 45.233 + 11.7) * 9731.1; return x - Math.floor(x); };
    layer.textContent = '';
    for (let i = 0; i < n; i++) {
      const wrap = el('div', 'sky-star');
      const big = prand(i + 5) < 0.3;
      wrap.innerHTML = '<span class="ss-mark">✦</span>';
      wrap.style.left = (3 + prand(i) * 94) + '%';
      wrap.style.top = (4 + prand(i + 50) * 34) + '%';
      wrap.style.setProperty('--tw', (2.4 + prand(i + 9) * 2.6).toFixed(2) + 's');
      wrap.style.animationDelay = (-prand(i + 3) * 6).toFixed(2) + 's';
      wrap.querySelector('.ss-mark').style.fontSize = (big ? 20 : 12) + 'px';
      const wish = recent[i];
      if (wish) {
        wrap.classList.add('named');
        const lbl = el('span', 'ss-text'); lbl.textContent = wish.text;
        wrap.appendChild(lbl);
        wrap.addEventListener('click', () => { toast('⭐ ' + wish.text, 3200); });
      }
      layer.appendChild(wrap);
    }
  }
  function renderGardenBed() {
    const bed = $('gardenBed'), g = zoneById('garden');
    bed.textContent = '';
    // 꽃밭이 넓어졌어요 — 최근 꽃을 넓은 땅에 흩뿌려요
    state.flowers.slice(-140).forEach((f, i) => {
      const e = el('div', 'gflower', A.flower(f.f));
      e.style.left = (g.x - 190 * lmScale + f.x / 100 * 380 * lmScale).toFixed(0) + 'px';
      e.style.top = (bandTop + 8 - (1 - f.y / 100) * 30 * lmScale).toFixed(0) + 'px';
      e.style.zIndex = String(3 + Math.round(f.y / 10));
      e.style.animationDelay = (-(i % 7) * 0.5) + 's, 0s';
      bed.appendChild(e);
    });
  }

  /* ===================== 산타 ===================== */
  let santaTimer = null;
  function flySanta() {
    const layer = $('santaLayer');
    if (!layer) return;
    const e = el('div', 'santa', A.SANTA);
    const dir = Math.random() < 0.5 ? 1 : -1;
    e.classList.add(dir > 0 ? 'to-right' : 'to-left');
    e.style.top = rand(6, 24) + '%';
    e.style.setProperty('--sdur', rand(12, 18).toFixed(1) + 's');
    layer.appendChild(e);
    e.addEventListener('animationend', () => e.remove());
    if (!document.hidden && Math.random() < 0.7) toast('🎅 산타가 숲 위를 지나가요!', 2600);
  }
  function startSanta() {
    const loop = () => { santaTimer = setTimeout(() => { if (!document.hidden) flySanta(); loop(); }, rand(35000, 70000)); };
    setTimeout(flySanta, 4000);
    loop();
  }

  /* ===================== 등불 · 반짝 · 알림 ===================== */
  function floatLantern(text, kind) {
    const layer = $('lanternLayer');
    if (layer.children.length >= (cfg.MAX_LANTERNS || 24)) layer.removeChild(layer.firstChild);
    const e = el('div', 'lantern' + (kind === KIND_LETGO ? ' letgo' : ''), '<div class="glow"></div><div class="text"></div>');
    e.style.left = rand(8, 88) + '%';
    e.style.setProperty('--dur', rand(22, 34) + 's');
    e.style.setProperty('--drift', rand(-30, 30) + 'px');
    e.querySelector('.text').textContent = text;
    layer.appendChild(e);
    e.addEventListener('animationend', (ev) => { if (ev.target === e) e.remove(); });
  }
  function sparkle() {
    for (let i = 0; i < 14; i++) {
      const s = el('div', 'spark');
      s.style.left = (vw / 2 + rand(-40, 40)) + 'px'; s.style.top = (vh * 0.55 + rand(-30, 30)) + 'px';
      s.style.setProperty('--sx', rand(-140, 140) + 'px'); s.style.setProperty('--sy', rand(-260, -120) + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1900);
    }
  }
  function toast(text, ms) {
    const t = $('toast');
    t.textContent = text; t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.hidden = true; }, ms || 3200);
  }

  /* ===================== 모달 ===================== */
  const MODALS = ['introModal', 'guideModal', 'breathModal', 'beadsModal', 'boardModal', 'wishModal', 'starsModal', 'shopModal', 'gardenModal', 'pondModal', 'rainModal', 'walletModal', 'bookModal', 'mapModal', 'linksModal', 'linkFormModal', 'musicModal'];
  const ZONE_OF_MODAL = { guideModal: 'plaza', breathModal: 'tree', beadsModal: 'spring', boardModal: 'lantern', starsModal: 'hill', shopModal: 'shop', gardenModal: 'garden', pondModal: 'pond', rainModal: 'rain', linksModal: 'links' };
  const modalOpen = () => MODALS.some((id) => !$(id).hidden) || !$('ritual').hidden || !$('loading').hidden || !$('stairGame').hidden;
  const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT'); };
  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) {
    if ($(id).hidden) return;
    if (id === 'introModal' && !profile) return;
    $(id).hidden = true;
    if (id === 'breathModal') stopBreath();
    if (id === 'mapModal') stopMapLive();
    if (id === 'rainModal') stopRain(false);
    if (ZONE_OF_MODAL[id] && !Object.keys(ZONE_OF_MODAL).some((m) => !$(m).hidden)) { me.zone = ''; setZoneIcon(me.el, ''); }
  }
  function closeTop() {
    if (!$('stairGame').hidden) { exitStair(); return; }
    for (let i = MODALS.length - 1; i >= 0; i--) { if (!$(MODALS[i]).hidden) { closeModal(MODALS[i]); return; } }
  }
  document.querySelectorAll('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => { if (e.target === bd) closeModal(bd.id); }));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModal(b.closest('.modal-backdrop').id)));

  /* ===================== 쉼터 들어가기 · 찾아가기 ===================== */
  let stroll = false, strollPause = 0, lastStrollZone = null;
  function setStroll(on) {
    if (stroll === on) return;
    stroll = on;
    $('strollBtn').classList.toggle('on', on);
    if (on) toast('발길 닿는 대로 쉼터를 둘러볼게요. 방향키나 화면을 누르면 멈춰요.');
    else { if (me.target && me.target.visit) me.target = null; strollPause = 0; }
  }
  function enterZone(id) {
    const z = zoneById(id); if (!z) return;
    setStroll(false);
    me.target = null;
    for (const k in keys) keys[k] = false;
    me.zone = id; setZoneIcon(me.el, id);
    if (Math.abs(z.x - me.x) > 4) me.facing = z.x > me.x ? 1 : -1;
    if (id === 'plaza') openModal('guideModal');
    else if (id === 'tree') { updateBreathUI(); openModal('breathModal'); startBreath(); }
    else if (id === 'spring') openModal('beadsModal');
    else if (id === 'lantern') { renderBoard(); openModal('boardModal'); refreshState(false); }
    else if (id === 'hill') { renderStars(); openModal('starsModal'); }
    else if (id === 'shop') openShop();
    else if (id === 'garden') { renderGarden(); openModal('gardenModal'); }
    else if (id === 'pond') openPond();
    else if (id === 'rain') openModal('rainModal');
    else if (id === 'stair') openStair();
    else if (id === 'links') openLinks();
  }
  function goTo(id, enter) {
    const z = zoneById(id); if (!z) return;
    setStroll(false);
    if (enter && Math.abs(me.x - z.x) < NEAR * 0.85) { enterZone(id); return; }
    const side = me.x < z.x ? -1 : 1;
    me.target = { x: clamp(z.x + side * 60, 40, W - 40), d: 0.3, zone: id, enter: !!enter, visit: false };
  }
  function arrive() {
    const t = me.target; me.target = null;
    if (!t) return;
    if (t.enter) enterZone(t.zone);
    else if (t.visit) {
      const z = zoneById(t.zone);
      strollPause = rand(4, 6.5);
      me.zone = z.id; setZoneIcon(me.el, z.id);
      showBubble(me.el, z.icon + ' ' + z.name + '에서 잠시 쉬어 가요', 3600);
    }
  }
  function strollTick(dt) {
    if (strollPause > 0) { strollPause -= dt; if (strollPause <= 0) { me.zone = ''; setZoneIcon(me.el, ''); } return; }
    const choices = ZONES.filter((z) => z.id !== lastStrollZone);
    const z = choices[randInt(choices.length)];
    lastStrollZone = z.id;
    me.target = { x: clamp(z.x + rand(-50, 50), 40, W - 40), d: rand(0.25, 0.75), zone: z.id, enter: false, visit: true };
  }

  /* ===================== 입력 ===================== */
  const keys = { l: false, r: false, u: false, d: false };
  const KEYMAP = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', a: 'l', d: 'r', w: 'u', s: 'd', A: 'l', D: 'r', W: 'u', S: 'd' };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeTop(); return; }
    if (!$('stairGame').hidden) { stairKey(e); return; }
    if (isTyping() || modalOpen()) return;
    const k = KEYMAP[e.key];
    if (k) { keys[k] = true; e.preventDefault(); setStroll(false); me.target = null; return; }
    if ((e.key === 'Enter' || e.key === ' ') && nearZone) {
      const a = document.activeElement;
      if (a && a.tagName === 'BUTTON') return;
      e.preventDefault(); enterZone(nearZone.id);
    }
  });
  document.addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  worldEl.addEventListener('pointerdown', (e) => {
    if (modalOpen()) return;
    if (e.target.closest('.lm-prompt')) return;
    if (e.target.closest('.npc')) { npcTalk(); return; }
    const lm = e.target.closest('.landmark');
    if (lm) { goTo(lm.dataset.zone, true); return; }
    if (e.clientY < bandTop - 70) return;
    setStroll(false);
    const wx = clamp(e.clientX + cam, 40, W - 40);
    const d = clamp((e.clientY - bandTop) / bandH, 0, 1);
    me.target = { x: wx, d, zone: null, enter: false, visit: false };
    const m = el('div', 'tapmark');
    m.style.left = wx + 'px'; m.style.top = yOf(d) + 'px'; m.style.zIndex = '15';
    decorEl.appendChild(m); setTimeout(() => m.remove(), 750);
  });
  $('strollBtn').addEventListener('click', (e) => { e.currentTarget.blur(); setStroll(!stroll); });
  $('mapBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openMap(); });
  $('profileBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openIntro(); });
  $('coinBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openWallet(); });
  $('soundBtn').addEventListener('click', (e) => {
    e.currentTarget.blur();
    const on = Sound.toggle();
    $('soundBtn').classList.toggle('on', on);
    $('soundIcon').textContent = on ? '🔊' : '🔈';
    $('soundBtn').title = on ? '숲 소리 끄기' : '숲 소리 켜기';
  });
  $('musicBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openMusic(); });
  $('enterBtn').addEventListener('click', (e) => { e.currentTarget.blur(); const z = e.currentTarget.dataset.zone; if (z) enterZone(z); });

  /* ===================== 숲의 시간 ===================== */
  const TIMES = [['t-morning', '🌅', '아침'], ['t-day', '☀️', '낮'], ['t-dusk', '🌇', '노을'], ['t-night', '🌙', '밤']];
  let timeIdx = -1, timeAuto = true;
  function autoTime() { const h = new Date().getHours(); return h >= 5 && h < 10 ? 0 : h < 17 ? 1 : h < 19 ? 2 : 3; }
  function applyTime(i) {
    timeIdx = i;
    TIMES.forEach((t) => document.body.classList.remove(t[0]));
    document.body.classList.add(TIMES[i][0]);
    $('timeBtn').textContent = TIMES[i][1];
    $('timeBtn').title = '숲의 시간: ' + TIMES[i][2];
  }
  $('timeBtn').addEventListener('click', (e) => {
    e.currentTarget.blur();
    timeAuto = false;
    applyTime((timeIdx + 1) % TIMES.length);
    toast('숲의 시간: ' + TIMES[timeIdx][2], 1600);
  });

  /* ===================== 매 프레임 ===================== */
  let nearZone = null, nearPerson = null, lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    updateMe(dt, now);
    updateOthers(dt, now);
    updateCritters(dt, now);
    updateCamera(dt);
    updateNear();
    requestAnimationFrame(frame);
  }
  function updateMe(dt, now) {
    let vx = 0, vd = 0;
    const blocked = modalOpen();
    const kx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), kd = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (!blocked && (kx || kd)) { vx = kx * SPEED; vd = kd * DSPEED; }
    else if (!blocked && me.target) {
      const dx = me.target.x - me.x, dpx = (me.target.d - me.d) * bandH, dist = Math.hypot(dx, dpx);
      if (dist <= Math.max(3, SPEED * dt)) { me.x = me.target.x; me.d = me.target.d; arrive(); }
      else { vx = dx / dist * SPEED; vd = (dpx / dist * SPEED) / bandH; }
    } else if (!blocked && stroll) strollTick(dt);
    me.x = clamp(me.x + vx * dt, 40, W - 40);
    me.d = clamp(me.d + vd * dt, 0, 1);
    if (Math.abs(vx) > 1) me.facing = vx > 0 ? 1 : -1;
    const moving = Math.abs(vx) > 1 || Math.abs(vd) > 0.002;
    me.el.classList.toggle('walking', moving);
    me.el.classList.toggle('left', me.facing < 0);
    placeAt(me.el, me.x, me.d);
    updatePet(me, me.facing, dt, now);
    if (npc.el) placeAt(npc.el, npc.x, npc.d, 0.95);
    if (me.e && Date.now() > me.emoUntil) { me.e = 0; me.hf = ''; }
  }
  function updateCamera(dt) {
    const target = clamp(me.x - vw / 2, 0, Math.max(0, W - vw));
    cam += (target - cam) * Math.min(1, dt * 5);
    worldEl.style.transform = `translate3d(${(-cam).toFixed(1)}px,0,0)`;
    $('hills').style.transform = `translate3d(${(-cam * 0.25).toFixed(1)}px,0,0)`;
    $('treeline').style.transform = `translate3d(${(-cam * 0.5).toFixed(1)}px,0,0)`;
  }
  function updateNear() {
    const open = modalOpen();
    const nz = open ? null : (ZONES.find((z) => Math.abs(me.x - z.x) < NEAR) || null);
    if (nz !== nearZone) {
      if (nearZone) lmEls[nearZone.id].classList.remove('near');
      if (nz) lmEls[nz.id].classList.add('near');
      nearZone = nz;
      document.querySelectorAll('.dock-btn').forEach((b) => {
        const here = !!nz && b.dataset.go === nz.id;
        b.classList.toggle('here', here);
        if (here && b.scrollIntoView) b.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
      });
      const eb = $('enterBtn');
      if (nz) { eb.innerHTML = `<span class="eb-ico">${nz.icon}</span>${nz.name} <b>들어가기</b>`; eb.dataset.zone = nz.id; }
    }
    // 가까운 사람(또는 숲지기)
    let best = null, bd = 1e9;
    if (!open) {
      const cand = [{ k: 'npc', x: npc.x, d: npc.d, name: '숲지기 새싹', el: npc.el }];
      for (const [k, o] of others) cand.push({ k, x: o.x, d: o.d, name: o.name, el: o.el });
      cand.forEach((c) => {
        const dx = Math.abs(c.x - me.x), dy = Math.abs(c.d - me.d) * bandH;
        const dist = Math.hypot(dx, dy * 1.4);
        if (dx < 120 && dy < 80 && dist < bd) { bd = dist; best = c; }
      });
    }
    const key = best ? best.k : null;
    if (key !== (nearPerson && nearPerson.k)) {
      if (nearPerson && nearPerson.el) nearPerson.el.classList.remove('near-me');
      nearPerson = best;
      if (best) { best.el.classList.add('near-me'); $('iaName').textContent = best.name + '님과'; }
      $('interact').hidden = !best;
    }
    // 들어가기 버튼: 쉼터 근처 + 모달 없음 + 인사 바가 안 떠 있을 때만 (버튼 겹침 방지)
    $('enterBtn').hidden = !(nearZone && !open && $('interact').hidden);
  }

  /* ===================== 인사 · 하이파이브 ===================== */
  const hfCool = {};
  function sendEmote(emo) {
    if (!nearPerson) return;
    const target = nearPerson;
    me.e = emo; me.ev = (me.ev + 1) % 99999; me.emoUntil = Date.now() + 7000;
    me.hf = emo === 5 && target.k !== 'npc' ? target.k : '';
    if (Math.abs(target.x - me.x) > 4) me.facing = target.x > me.x ? 1 : -1;
    showBubble(me.el, EMO[emo], 2200, 'emo');
    if (emo === 5) {
      playHi5(me.el); Sound.clap();
      const now = Date.now();
      if (target.k === 'npc') {
        playHi5(npc.el); clapAt((me.x + npc.x) / 2, (me.d + npc.d) / 2);
        setTimeout(() => showBubble(npc.el, '짝! 오늘도 반가워요 🌱', 2600), 300);
        if (!hfCool.npc || now - hfCool.npc > 60000) { hfCool.npc = now; earn('hf'); }
      } else {
        clapAt((me.x + target.x) / 2, (me.d + target.d) / 2);
        if (!hfCool[target.k] || now - hfCool[target.k] > 10000) { hfCool[target.k] = now; earn('hf'); }
        toast(target.name + '님에게 하이파이브를 보냈어요 🙌', 2200);
      }
    } else if (target.k === 'npc') {
      setTimeout(() => showBubble(npc.el, { 1: '안녕! 👋', 2: '고마워요 💚', 3: '웃으니 좋네요 😊', 4: '저도 고마워요 🙏' }[emo], 2400), 400);
    }
    document.querySelectorAll('.ia-btn').forEach((b) => { b.disabled = true; });
    setTimeout(() => document.querySelectorAll('.ia-btn').forEach((b) => { b.disabled = false; }), 1500);
    pushPresence();
  }
  document.querySelectorAll('.ia-btn').forEach((b) => b.addEventListener('click', () => { b.blur(); sendEmote(Number(b.dataset.emo)); }));

  /* ===================== 함께 접속한 사람 ===================== */
  const others = new Map();
  let myKey = '';
  function applyPresence(users) {
    const keep = new Set();
    users.forEach((u) => {
      if (!u || !u.k) return;
      const p = validProfile({ a: u.a | 0, b: u.b | 0, s: u.s | 0, h: u.h | 0, hs: u.hs | 0, o: u.o | 0, ot: u.ot | 0 });
      if (!p) return;
      p.c = clamp(u.c | 0, 0, A.ACC.length - 1);
      const pet = clamp(u.p | 0, 0, A.PET.length - 1);
      keep.add(u.k);
      let o = others.get(u.k);
      if (!o) {
        o = { el: makePerson(p, false), x: +u.x || 0, d: +u.y || 0, look: '', ev: u.ev, pet: null };
        peopleEl.appendChild(o.el);
        others.set(u.k, o);
      }
      const lk = [p.a, p.b, p.s, p.h, p.hs, p.o, p.ot, p.c].join(',');
      if (o.look && o.look !== lk) setLook(o.el, p, false);
      o.look = lk; o.name = nameOf(p);
      setPet(o, pet);
      o.tx = clamp(+u.x || 0, 0, W); o.td = clamp(+u.y || 0, 0, 1); o.f = u.f < 0 ? -1 : 1;
      if (o.z !== u.z) { o.z = u.z; setZoneIcon(o.el, u.z); }
      if (u.ev !== o.ev) {
        o.ev = u.ev;
        const emo = u.e | 0;
        if (emo > 0 && emo < EMO.length) {
          showBubble(o.el, EMO[emo], 2400, 'emo');
          if (emo === 5) {
            playHi5(o.el);
            if (u.hf && u.hf === myKey) {
              setTimeout(() => { playHi5(me.el); Sound.clap(); clapAt((me.x + o.x) / 2, (me.d + o.d) / 2); }, 250);
              toast(o.name + '님과 하이파이브! 🙌', 2600);
              const now = Date.now();
              if (!hfCool[u.k] || now - hfCool[u.k] > 10000) { hfCool[u.k] = now; earn('hf'); }
            }
          }
        }
      }
    });
    for (const [k, o] of others) {
      if (!keep.has(k)) {
        o.el.classList.add('leaving'); setTimeout(() => o.el.remove(), 600);
        if (o.pet) o.pet.el.remove();
        others.delete(k);
      }
    }
  }
  function updateOthers(dt, now) {
    for (const o of others.values()) {
      const dx = o.tx - o.x, dpx = (o.td - o.d) * bandH, dist = Math.hypot(dx, dpx), step = 260 * dt;
      if (dist > 700 || dist <= step) { o.x = o.tx; o.d = o.td; }
      else { o.x += dx / dist * step; o.d += (dpx / dist * step) / bandH; }
      const facing = Math.abs(dx) > 2 ? (dx < 0 ? -1 : 1) : o.f;
      o.el.classList.toggle('walking', dist > 2);
      o.el.classList.toggle('left', facing < 0);
      placeAt(o.el, o.x, o.d);
      updatePet(o, facing, dt, now);
    }
  }
  let presenceFails = 0, presenceBusy = false, presenceTimer = null;
  function presencePayload() {
    const L = look();
    return { type: 'presence', sessionId: sid, x: Math.round(me.x), y: Math.round(me.d * 100) / 100, z: me.zone || '', f: me.facing,
      a: L.a, b: L.b, s: L.s, h: L.h, hs: L.hs, o: L.o, ot: L.ot, c: L.c, p: L.p, e: me.e, hf: me.hf, ev: me.ev };
  }
  let pushAgain = false;
  async function presenceOnce() {
    if (presenceBusy) { pushAgain = true; return; }
    presenceBusy = true;
    try {
      const r = await sheetPost(presencePayload());
      if (r && r.ok && Array.isArray(r.users)) {
        presenceOk = true; presenceFails = 0;
        if (r.me) myKey = String(r.me);
        online = r.online || r.users.length + 1;
        applyPresence(r.users);
      } else presenceFails++;
    } catch (e) { presenceFails++; }
    presenceBusy = false;
    renderBadge();
    if (pushAgain) { pushAgain = false; await presenceOnce(); }
  }
  function scheduleNext() {
    clearTimeout(presenceTimer);
    let wait = 4500;
    if (presenceFails > 2) wait = 30000;
    else for (const o of others.values()) if (Math.abs(o.x - me.x) < 420) { wait = 2500; break; }
    presenceTimer = setTimeout(presenceLoop, wait);
  }
  async function presenceLoop() {
    if (!sheetMode) return;
    if (document.hidden || !profile) { clearTimeout(presenceTimer); presenceTimer = setTimeout(presenceLoop, 4000); return; }
    await presenceOnce();
    scheduleNext();
  }
  function pushPresence() { if (sheetMode && profile) presenceOnce().then(scheduleNext); }

  /* ===================== 숨 쉬는 나무 ===================== */
  let breaths = Number(store.get('ms_breaths', 0)) || 0, breathTimer = null, breathRun = 0;
  function updateBreathUI() { $('breathTotal').textContent = '함께 쉰 숨 ' + breaths + '번'; renderDockSubs(); }
  function startBreath() {
    stopBreath(); breathRun = 0;
    const c = $('breathCircle'), w = $('breathWord');
    const steps = [['들이쉬어요', 'in', 4000], ['잠시 멈추고', 'hold', 2000], ['천천히 내쉬어요', 'out', 6000]];
    let i = 0;
    c.style.transitionDuration = '0ms'; c.className = 'breath-circle'; w.textContent = '준비';
    const step = () => {
      const [txt, cls, ms] = steps[i];
      c.style.transitionDuration = ms + 'ms'; c.className = 'breath-circle ' + cls; w.textContent = txt;
      breathTimer = setTimeout(() => {
        i = (i + 1) % steps.length;
        if (i === 0) {
          breaths++; breathRun++; store.set('ms_breaths', breaths); updateBreathUI(); Sound.chime(true);
          if (breathRun % 3 === 0) earn('breath');
        }
        step();
      }, ms);
    };
    breathTimer = setTimeout(step, 700);
  }
  function stopBreath() { clearTimeout(breathTimer); breathTimer = null; }

  /* ===================== 마음 구슬 ===================== */
  let beadTotal = Number(store.get('ms_beads', 0)) || 0;
  (function beads() {
    const COUNT = 10, strand = $('beadStrand');
    let active = 0;
    const show = () => { $('beadTotal').textContent = '함께 넘긴 구슬 ' + beadTotal + '알'; };
    show();
    for (let i = 0; i < COUNT; i++) strand.appendChild(el('div', 'bead' + (i === 0 ? ' active' : '')));
    function roll() {
      const kids = strand.children;
      kids[active].classList.remove('active'); kids[active].classList.add('rolled');
      active = (active + 1) % COUNT;
      if (active === 0) { setTimeout(() => { for (const k of kids) k.classList.remove('rolled'); }, 320); earn('beads'); }
      kids[active].classList.add('active');
      beadTotal++; store.set('ms_beads', beadTotal); show(); renderDockSubs();
      $('beadHint').textContent = ['좋아요, 그대로 한 번 더', '숨을 길게 내쉬며', '천천히, 서두르지 않아도 돼요'][beadTotal % 3];
      Sound.tok();
    }
    $('beadStage').addEventListener('click', roll);
    $('beadStage').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roll(); } });
  })();

  /* ===================== 염원 등불터 ===================== */
  let boardTab = 'all';
  document.querySelectorAll('#boardModal .tab').forEach((t) => t.addEventListener('click', () => {
    boardTab = t.dataset.tab;
    document.querySelectorAll('#boardModal .tab').forEach((x) => x.classList.toggle('on', x === t));
    renderBoard();
    if (boardTab === 'mine') syncMine();
  }));
  const getMine = () => store.get('ms_mine', []) || [];
  const getLikes = () => store.get('ms_likes', {}) || {};
  function timeAgo(ms) {
    if (!ms) return '';
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return Math.floor(s / 86400) + '일 전';
  }
  const emptyEl = (html) => el('div', 'empty', html);
  function meter(n) {
    const m = el('span', 'meter');
    for (let i = 0; i < STAR_AT; i++) { const d = el('i'); if (i < n) d.className = 'on'; m.appendChild(d); }
    return m;
  }
  function wishCard(w, isMine) {
    const c = el('div', 'wcard' + (w.kind === KIND_LETGO ? ' letgo' : ''));
    const t = el('div', 'wtext'); t.textContent = (w.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + w.text;
    const meta = el('div', 'wmeta');
    const left = el('span');
    const ago = timeAgo(w.at);
    left.append((ago ? ago + ' · ' : '') + (w.kind === KIND_LETGO ? '토닥임 ' : '응원 ') + Math.min(w.empathy, STAR_AT) + '/' + STAR_AT);
    left.appendChild(meter(w.empathy));
    const btn = el('button', 'wbtn'); btn.type = 'button';
    const likes = getLikes();
    if (isMine) { btn.classList.add('self'); btn.textContent = '✨ 가벼워졌어요'; btn.addEventListener('click', () => resolveWish(w.id, btn)); }
    else if (!w.id || likes[w.id]) { btn.classList.add('done'); btn.disabled = true; btn.textContent = w.kind === KIND_LETGO ? '🤲 토닥였어요' : '🤍 응원했어요'; }
    else { btn.textContent = w.kind === KIND_LETGO ? '🤲 토닥토닥' : '🤍 응원해요'; btn.addEventListener('click', () => sendEmpathy(w)); }
    meta.append(left, btn);
    c.append(t, meta);
    if (!isMine && w.id && sheetMode) {
      const f = el('button', 'flag', '🚩'); f.type = 'button'; f.title = '불편한 글 알리기'; f.setAttribute('aria-label', '불편한 글 알리기');
      f.addEventListener('click', () => askReport(c, w));
      c.appendChild(f);
    }
    return c;
  }
  function askReport(card, w) {
    if (card.querySelector('.rep-ask')) return;
    const bar = el('div', 'wmeta rep-ask');
    bar.innerHTML = '<span>이 글이 마음을 불편하게 하나요?</span>';
    const yes = el('button', 'wbtn', '알리기'); yes.type = 'button';
    const no = el('button', 'wbtn done', '취소'); no.type = 'button'; no.disabled = false; no.style.cursor = 'pointer';
    const box = el('span'); box.style.display = 'flex'; box.style.gap = '6px'; box.append(no, yes);
    bar.appendChild(box); card.appendChild(bar);
    no.addEventListener('click', () => bar.remove());
    yes.addEventListener('click', () => sendReport(w));
  }
  async function sendReport(w) {
    const rep = reported(); rep[w.id] = Date.now(); store.set('ms_reported', rep);
    state.wishes = state.wishes.filter((x) => x.id !== w.id);
    renderBoard(); renderDockSubs();
    toast('알려 줘서 고마워요. 세 명이 알리면 그 글은 잠시 숨겨져요.', 3600);
    try { await sheetPost({ type: 'report', id: w.id, sessionId: sid }); } catch (e) { /* 다음에 */ }
  }
  function mineCard(m, live) {
    if (live) return wishCard(live, true);
    const c = el('div', 'wcard' + (m.kind === KIND_LETGO ? ' letgo' : ''));
    const t = el('div', 'wtext'); t.textContent = (m.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + m.text;
    const meta = el('div', 'wmeta');
    const st = el('span', 'wstatus');
    meta.appendChild(st);
    if (m.status === 'pending') st.textContent = '🕊️ 선생님이 살펴보고 있어요';
    else if (m.status === 'hidden') st.textContent = '🙈 잠시 숨겨졌어요 · 선생님이 살펴봐요';
    else if (m.status === 'star') st.textContent = '⭐ 별이 되었어요';
    else st.textContent = '🏮 떠 있어요';
    c.append(t, meta);
    return c;
  }
  function renderBoard() {
    const list = $('boardList');
    list.textContent = '';
    const mine = getMine();
    const mineIds = new Set(mine.map((m) => m.id).filter(Boolean));
    if (boardTab === 'all') {
      if (!state.wishes.length) list.appendChild(emptyEl('아직 떠 있는 등불이 없어요.<br>첫 마음을 올려 보세요.'));
      state.wishes.forEach((w) => list.appendChild(wishCard(w, !sheetMode || (w.id && mineIds.has(w.id)))));
      $('boardCount').textContent = state.wishes.length ? '떠 있는 마음 ' + state.wishes.length + '개' : '';
    } else {
      if (!mine.length) list.appendChild(emptyEl('아직 올린 마음이 없어요.<br>[＋ 마음 올리기]를 눌러 보세요.'));
      mine.forEach((m) => list.appendChild(mineCard(m, state.wishes.find((w) => w.id && w.id === m.id))));
      $('boardCount').textContent = mine.length ? '내가 올린 마음 ' + mine.length + '개' : '';
    }
  }
  async function syncMine() {
    if (!sheetMode) return;
    const mine = getMine(); const ids = mine.map((m) => m.id).filter(Boolean).slice(0, 40);
    if (!ids.length) return;
    try {
      const r = await sheetPost({ type: 'mine', sessionId: sid, ids });
      if (!r || !r.ok || !r.items) return;
      let gotStar = 0;
      mine.forEach((m) => {
        const it = r.items[m.id]; if (!it) return;
        if (it.s === 'star' && m.status !== 'star') gotStar++;
        m.status = it.s;
      });
      store.set('ms_mine', mine);
      for (let i = 0; i < gotStar; i++) earn('star');
      if (!$('boardModal').hidden) renderBoard();
    } catch (e) { /* 다음에 */ }
  }
  async function sendEmpathy(w) {
    const likes = getLikes();
    if (!w.id || likes[w.id]) return;
    likes[w.id] = Date.now();
    const keysL = Object.keys(likes);
    if (keysL.length > 400) keysL.sort((a, b) => likes[a] - likes[b]).slice(0, keysL.length - 400).forEach((k) => delete likes[k]);
    store.set('ms_likes', likes);
    w.empathy = (w.empathy || 0) + 1;
    Sound.tok();
    renderBoard();
    const undo = () => { const l = getLikes(); delete l[w.id]; store.set('ms_likes', l); w.empathy = Math.max(0, w.empathy - 1); renderBoard(); };
    if (!sheetMode) { earn('emp'); if (w.empathy >= STAR_AT) becomeStar(w, 'together'); else saveLocal(); return; }
    try {
      const r = await sheetPost({ type: 'empathy', id: w.id, sessionId: sid });
      if (r && r.ok) {
        earn('emp');
        w.empathy = Number(r.empathy) || w.empathy;
        if (r.released) becomeStar(w, 'together'); else renderBoard();
      } else if (!(r && r.already)) { undo(); toast((r && r.reason) || '잠시 뒤에 다시 눌러 주세요.'); }
    } catch (e) { undo(); toast('연결이 원활하지 않아요. 잠시 뒤에 다시 눌러 주세요.'); }
  }
  function becomeStar(w, how) {
    state.wishes = state.wishes.filter((x) => x !== w && !(w.id && x.id === w.id));
    state.stars.count++;
    state.stars.recent.unshift({ text: w.text, kind: w.kind });
    state.stars.recent = state.stars.recent.slice(0, 30);
    const mine = getMine(); const m = mine.find((x) => x.id && x.id === w.id);
    if (m && m.status !== 'star') { m.status = 'star'; store.set('ms_mine', mine); earn('star'); }
    if (!sheetMode) saveLocal();
    afterState(); renderBoard();
    Sound.chime(); sparkle();
    toast(how === 'self' ? '✨ 마음이 가벼워져 별이 되었어요. 별빛 언덕에서 빛날 거예요.' : '✨ 함께 보낸 마음 덕분에 이 염원이 별이 되었어요!', 4200);
  }
  async function resolveWish(id, btn) {
    if (btn) btn.disabled = true;
    const w = state.wishes.find((x) => x.id === id);
    if (!sheetMode) { if (w) becomeStar(w, 'self'); return; }
    try {
      const r = await sheetPost({ type: 'resolve', id, sessionId: sid });
      if (r && r.ok) {
        if (w) becomeStar(w, 'self');
        else { const mine = getMine(); const m = mine.find((x) => x.id === id); if (m) { m.status = 'star'; store.set('ms_mine', mine); } renderBoard(); }
      } else { if (btn) btn.disabled = false; toast((r && r.reason) || '잠시 뒤에 다시 눌러 주세요.'); }
    } catch (e) { if (btn) btn.disabled = false; toast('연결이 원활하지 않아요.'); }
  }

  /* ===================== 마음 올리기 ===================== */
  let wishKind = KIND_HOPE;
  const KIND_TEXT = {
    [KIND_HOPE]: { desc: '이루어지길 바라는 마음을 등불로 띄워요.', ph: '예) 오늘도 무사히 지나가기를', btn: '띄우기' },
    [KIND_LETGO]: { desc: '마음을 무겁게 하는 걱정을 나뭇잎에 실어 흘려보내요. 누구를 탓하는 말 대신 내 마음을 적어요.', ph: '예) 발표가 너무 떨려요', btn: '흘려보내기' },
  };
  function setKind(k) {
    wishKind = k;
    document.querySelectorAll('.pill').forEach((p) => { const on = p.dataset.kind === k; p.classList.toggle('on', on); p.setAttribute('aria-checked', on ? 'true' : 'false'); });
    $('kindDesc').textContent = KIND_TEXT[k].desc;
    $('wishInput').placeholder = KIND_TEXT[k].ph;
    $('wishSubmit').textContent = KIND_TEXT[k].btn;
  }
  document.querySelectorAll('.pill').forEach((p) => p.addEventListener('click', () => setKind(p.dataset.kind)));
  function openWrite(kind) {
    $('wishMsg').textContent = ''; $('wishMsg').className = 'modal-msg';
    $('wishInput').value = ''; $('charCount').textContent = '0 / 100';
    setKind(kind || KIND_HOPE);
    openModal('wishModal');
    setTimeout(() => $('wishInput').focus(), 60);
  }
  $('openWrite').addEventListener('click', () => openWrite());
  $('wishCancel').addEventListener('click', () => closeModal('wishModal'));
  $('wishInput').addEventListener('input', () => { $('charCount').textContent = $('wishInput').value.length + ' / 100'; });
  $('wishSubmit').addEventListener('click', submitWish);
  const showMsg = (t, k) => { $('wishMsg').textContent = t; $('wishMsg').className = 'modal-msg ' + (k || ''); };
  function cooldownLeft() {
    const last = Number(store.get('ms_last_wish', 0)) || 0;
    return Math.max(0, Math.ceil((cfg.WISH_COOLDOWN_SEC || 30) - (Date.now() - last) / 1000));
  }
  async function submitWish() {
    const text = $('wishInput').value.trim();
    const first = window.Filter ? window.Filter.check(text) : { ok: !!text, reason: '내용을 입력해 주세요.' };
    if (!first.ok) return showMsg(first.reason, 'err');
    const wait = cooldownLeft();
    if (wait > 0) return showMsg(wait + '초 뒤에 다시 올릴 수 있어요.', 'err');
    const kind = wishKind;
    $('wishSubmit').disabled = true; $('loading').hidden = false;
    try {
      let r;
      if (sheetMode) {
        try { r = await sheetPost({ type: 'wish', content: text, sessionId: sid, kind }); }
        catch (e) { r = { ok: false, reason: '연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.' }; }
      } else {
        await delay(600);
        const id = 'L' + Date.now();
        state.wishes.unshift({ id, text, kind, empathy: 0, at: Date.now() });
        saveLocal();
        r = { ok: true, id, kind };
      }
      if (!r || !r.ok) return showMsg((r && r.reason) || '조금 더 따뜻한 말로 적어 주세요.', 'err');
      store.set('ms_last_wish', Date.now());
      const mine = getMine();
      mine.unshift({ id: r.id || '', text, kind, at: Date.now(), status: r.pending ? 'pending' : 'public' });
      store.set('ms_mine', mine.slice(0, 50));
      if (sheetMode && !r.pending && r.id) { const nw = { id: r.id, text, kind, empathy: 0, at: Date.now() }; state.wishes.unshift(nw); seen.add(r.id); rememberMine(nw); }
      closeModal('wishModal');
      afterState(); renderBoard();
      earn('wish');
      if (kind === KIND_LETGO) runRitual(text, !!r.pending);
      else {
        if (!r.pending) floatLantern(text, kind);
        toast(r.pending ? '올렸어요. 선생님이 확인하면 등불이 켜져요.' : '🏮 등불이 숲 위로 떠올랐어요.');
      }
    } finally { $('loading').hidden = true; $('wishSubmit').disabled = false; }
  }
  function runRitual(text, pending) {
    const r = $('ritual'), leaf = $('ritualLeaf'), msg = $('ritualMsg');
    $('ritualText').textContent = text;
    leaf.classList.remove('go'); void leaf.offsetWidth;
    msg.classList.remove('show');
    msg.textContent = '적어서 내려놓은 마음은 이미 조금 가벼워졌어요. ' + (pending ? '선생님이 살펴본 뒤 친구들의 토닥임이 닿을 거예요.' : '이제 친구들이 토닥토닥 마음을 보내 줄 거예요.');
    r.hidden = false;
    const t1 = setTimeout(() => { leaf.classList.add('go'); Sound.chime(true); }, 1100);
    const t2 = setTimeout(() => msg.classList.add('show'), 2600);
    const t3 = setTimeout(close, 9000);
    function close() { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); r.hidden = true; r.onclick = null; }
    setTimeout(() => { r.onclick = close; }, 400);
  }

  /* ===================== 별빛 언덕 ===================== */
  function renderStars() {
    $('starsBig').textContent = state.stars.count;
    const list = $('starsList');
    list.textContent = '';
    if (!state.stars.recent.length) { list.appendChild(emptyEl('아직 별이 된 마음이 없어요.<br>공감을 보내면 첫 별이 뜰 거예요.')); return; }
    state.stars.recent.forEach((s) => { const c = el('div', 'scard'); c.textContent = s.text; list.appendChild(c); });
  }

  /* ===================== 숲속 가게 ===================== */
  let shopTab = 'acc';
  const SHOP_TALK = ['어서 와요! 마음 동전으로 꾸며 봐요.', '동전은 염원·공감·숨 고르기로 모을 수 있어요.', '동물 친구는 졸졸 따라다녀요.'];
  document.querySelectorAll('[data-shop]').forEach((t) => t.addEventListener('click', () => {
    shopTab = t.dataset.shop;
    document.querySelectorAll('[data-shop]').forEach((x) => x.classList.toggle('on', x === t));
    renderShop();
  }));
  function openShop() { $('shopTalk').textContent = SHOP_TALK[randInt(SHOP_TALK.length)]; renderShop(); openModal('shopModal'); }
  function petThumb(p) { const k = A.PET_ART[p]; return k ? `<div class="ani">${A.ANIMAL[k].svg}</div>` : ''; }
  function renderShop(previewOverride) {
    renderCoins();
    const L = Object.assign(look(), previewOverride || {});
    $('shopPreview').innerHTML = A.person(L) + (L.p ? `<div class="pv-pet">${A.ANIMAL[A.PET_ART[L.p]].svg}</div>` : '');
    const grid = $('shopGrid'); grid.textContent = '';
    const list = shopTab === 'acc' ? A.ACC : A.PET;
    const owned = wallet.owned[shopTab];
    const cur = shopTab === 'acc' ? wallet.c : wallet.p;
    list.forEach((it) => {
      if (it.id === 0) return;
      const has = owned.indexOf(it.id) >= 0, wearing = cur === it.id;
      const card = el('div', 'item' + (wearing ? ' on' : ''));
      const thumb = shopTab === 'acc' ? A.person(Object.assign(look(), { c: it.id })) : petThumb(it.id);
      card.innerHTML = `<div class="thumb">${thumb}</div><div class="iname">${it.name}</div>`;
      const b = el('button'); b.type = 'button';
      if (wearing) { b.textContent = '벗기'; }
      else if (has) { b.textContent = '착용'; b.className = 'wear'; }
      else { b.textContent = '🪙 ' + it.price; b.className = 'buy'; b.disabled = wallet.coins < it.price; }
      b.addEventListener('click', () => shopAction(it, has, wearing));
      card.appendChild(b);
      card.addEventListener('pointerenter', () => { if (!isTouch) $('shopPreview').innerHTML = A.person(Object.assign(look(), shopTab === 'acc' ? { c: it.id } : {})) + (shopTab === 'pet' ? `<div class="pv-pet">${A.ANIMAL[A.PET_ART[it.id]].svg}</div>` : (L.p ? `<div class="pv-pet">${A.ANIMAL[A.PET_ART[L.p]].svg}</div>` : '')); });
      card.addEventListener('pointerleave', () => { if (!isTouch) renderShopPreview(); });
      grid.appendChild(card);
    });
  }
  function renderShopPreview() { const L = look(); $('shopPreview').innerHTML = A.person(L) + (L.p ? `<div class="pv-pet">${A.ANIMAL[A.PET_ART[L.p]].svg}</div>` : ''); }
  function shopAction(it, has, wearing) {
    const key = shopTab === 'acc' ? 'c' : 'p';
    if (wearing) wallet[key] = 0;
    else if (has) wallet[key] = it.id;
    else {
      if (!spend(it.price)) { $('shopTalk').textContent = '동전이 조금 모자라요. 쉼터를 돌며 모아 와요!'; return; }
      wallet.owned[shopTab].push(it.id); wallet[key] = it.id;
      $('shopTalk').textContent = it.name + '! 정말 잘 어울려요.';
      Sound.chime(true); sparkle();
    }
    saveWallet();
    applyMyLook();
    renderShop();
    pushPresence();
  }
  function applyMyLook() {
    const L = look();
    setLook(me.el, L, true);
    setPet(me, L.p);
    renderMeChip();
    renderDockSubs();
  }
  function renderMeChip() { const L = look(); $('meFace').innerHTML = A.person(L); $('meName').textContent = profile ? nameOf(L) : '나'; }

  /* ===================== 함께 꽃밭 ===================== */
  let seedPick = 0;
  const FLOWER_COST = 3;
  (function buildSeeds() {
    const row = $('seedRow');
    A.FLOWERS.forEach((f, i) => {
      const b = el('button', 'seed' + (i === 0 ? ' on' : ''), A.flower(i) + f.name);
      b.type = 'button';
      b.addEventListener('click', () => { seedPick = i; row.querySelectorAll('.seed').forEach((x, j) => x.classList.toggle('on', j === i)); });
      row.appendChild(b);
    });
  })();
  const GARDEN_PAGE = 40; // 한 밭에 담기는 꽃 수 (차면 새 밭이 열려요)
  let gardenPage = 0;
  const gardenPages = () => Math.max(1, Math.ceil(state.flowers.length / GARDEN_PAGE));
  function renderGarden(keepPage) {
    renderCoins();
    if (!keepPage) gardenPage = gardenPages() - 1; // 기본은 지금 자라는 밭
    gardenPage = clamp(gardenPage, 0, gardenPages() - 1);
    const plot = $('gardenPlot'); plot.textContent = '';
    const start = gardenPage * GARDEN_PAGE;
    const page = state.flowers.slice(start, start + GARDEN_PAGE);
    page.forEach((f, i) => plot.appendChild(gardenFlower(f, i)));
    const full = page.length >= GARDEN_PAGE;
    if (!page.length) plot.appendChild(el('div', 'ghint', '아직 빈 꽃밭이에요. 첫 꽃을 심어 볼까요?'));
    else if (full && gardenPage === gardenPages() - 1) plot.appendChild(el('div', 'ghint full', '이 밭이 가득 찼어요! 한 송이 더 심으면 새 꽃밭이 열려요 🌱'));
    $('gardenCount').textContent = '함께 심은 꽃 ' + state.flowers.length + '송이';
    const multi = gardenPages() > 1;
    $('gardenPager').hidden = !multi;
    if (multi) {
      $('gardenPageLabel').textContent = (gardenPage + 1) + ' / ' + gardenPages() + '번 꽃밭';
      $('gardenPrev').disabled = gardenPage <= 0;
      $('gardenNext').disabled = gardenPage >= gardenPages() - 1;
    }
  }
  function gardenFlower(f, i) {
    const e = el('div', 'gflower', A.flower(f.f));
    e.style.left = (3 + f.x * 0.94) + '%'; e.style.top = (12 + f.y * 0.84) + '%';
    e.style.zIndex = String(f.y | 0);
    e.style.animationDelay = (-(i % 7) * 0.5) + 's, 0s';
    return e;
  }
  $('gardenPrev').addEventListener('click', () => { gardenPage--; renderGarden(true); });
  $('gardenNext').addEventListener('click', () => { gardenPage++; renderGarden(true); });
  $('gardenPlot').addEventListener('click', async (e) => {
    if (e.target.closest('.ghint')) return;
    const r = $('gardenPlot').getBoundingClientRect();
    const x = clamp(Math.round(((e.clientX - r.left) / r.width * 100 - 3) / 0.94), 0, 100);
    const y = clamp(Math.round(((e.clientY - r.top) / r.height * 100 - 12) / 0.84), 0, 100);
    if (!spend(FLOWER_COST)) { toast('꽃 한 송이에 🪙' + FLOWER_COST + '이 필요해요. 쉼터를 돌며 모아 와요.'); return; }
    const wasFull = state.flowers.length % GARDEN_PAGE === 0 && state.flowers.length > 0;
    const f = { f: seedPick, x, y };
    state.flowers.push(f);
    renderGarden(); renderGardenBed(); renderDockSubs(); Sound.chime(true);
    if (wasFull) toast('새 꽃밭이 열렸어요! 여기서 이어서 가꿔요 🌷', 3000);
    if (!sheetMode) { saveLocal(); return; }
    try {
      const res = await sheetPost({ type: 'flower', sessionId: sid, f: f.f, x, y });
      if (!res || !res.ok) throw new Error((res && res.reason) || '');
    } catch (err) {
      state.flowers = state.flowers.filter((x2) => x2 !== f);
      wallet.coins += FLOWER_COST; saveWallet(); renderCoins();
      renderGarden(); renderGardenBed();
      toast((err && err.message) || '꽃을 심지 못했어요. 동전은 돌려드렸어요.');
    }
  });

  /* ===================== 배경음악 고르기 ===================== */
  function openMusic() {
    const list = $('musicList'); list.textContent = '';
    const opts = [['off', '🔕', '끄기', '조용히'], ['forest', '🌲', '숲 소리', '새소리와 바람']];
    Object.keys(Music.TRACKS).forEach((k) => {
      const icons = { jingle: '🔔', silent: '🌙', ode: '🎼', canon: '🎻', gymnopedie: '🎹' };
      opts.push([k, icons[k] || '🎵', Music.TRACKS[k].name, k === 'jingle' || k === 'silent' ? '크리스마스 캐럴' : '클래식']);
    });
    const cur = musicChoice;
    opts.forEach(([key, ico, name, sub]) => {
      const b = el('button', 'music-opt' + (key === cur ? ' on' : ''),
        `<span class="mo-ico">${ico}</span><span class="mo-name">${name}</span><span class="mo-sub">${sub}</span>` + (key === cur ? '<span class="mo-play">▶ 재생 중</span>' : ''));
      b.type = 'button';
      b.addEventListener('click', () => chooseMusic(key));
      list.appendChild(b);
    });
    openModal('musicModal');
  }
  let musicChoice = store.get('ms_music', 'off') || 'off';
  function chooseMusic(key) {
    musicChoice = key; store.set('ms_music', key);
    if (key === 'forest') {
      Music.play('off');
      if (!soundOn()) toggleForest(true);
    } else {
      if (soundOn()) toggleForest(false);
      Music.play(key);
    }
    $('musicBtn').classList.toggle('on', key !== 'off');
    openMusic();
  }
  const soundOn = () => $('soundBtn').classList.contains('on');
  function toggleForest(want) {
    if (soundOn() === want) return;
    const on = Sound.toggle();
    $('soundBtn').classList.toggle('on', on);
    $('soundIcon').textContent = on ? '🔊' : '🔈';
  }

  /* ===================== 링크 나눔터 ===================== */
  let linkFilter = -1; // -1 전체, 0~3 목적
  let linkForm = { purpose: 0, level: 1, subject: 0 };
  function openLinks() { linkFilter = -1; renderLinks(); openModal('linksModal'); if (sheetMode) refreshState(false); }
  function purposeTag(l) {
    let t = PURPOSE_ICON[l.purpose] + ' ' + PURPOSES[l.purpose];
    if (l.purpose === 0 && l.level >= 0) t += ' · ' + LEVEL_NAME[l.level] + (l.subject >= 0 ? ' ' + SUBJECT_NAME[l.subject] : '');
    return t;
  }
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url.replace(/^https?:\/\//, '').split('/')[0]; } }
  function renderLinks() {
    const tabs = $('linkTabs'); tabs.textContent = '';
    [['전체', -1]].concat(PURPOSES.map((p, i) => [PURPOSE_ICON[i] + p, i])).forEach(([label, v]) => {
      const b = el('button', 'ltab' + (v === linkFilter ? ' on' : ''), label); b.type = 'button';
      b.addEventListener('click', () => { linkFilter = v; renderLinks(); });
      tabs.appendChild(b);
    });
    const list = $('linkList'); list.textContent = '';
    const items = state.links.filter((l) => linkFilter < 0 || l.purpose === linkFilter);
    if (!items.length) { list.appendChild(emptyEl('아직 나눈 링크가 없어요.<br>[＋ 링크 올리기]로 좋은 자료를 나눠 주세요.')); }
    const myLinks = store.get('ms_mylinks', []) || [];
    const repd = reported();
    items.forEach((l) => {
      const c = el('div', 'lcard p' + l.purpose);
      const head = el('div', 'lc-head');
      head.innerHTML = `<span class="lc-tag">${purposeTag(l)}</span>`;
      const topic = el('a', 'lc-topic'); topic.href = l.url; topic.target = '_blank'; topic.rel = 'noopener noreferrer';
      topic.textContent = l.topic || hostOf(l.url);
      const host = el('div', 'lc-host'); host.textContent = '🔗 ' + hostOf(l.url);
      const foot = el('div', 'lc-foot');
      const go = el('a', 'lc-go'); go.href = l.url; go.target = '_blank'; go.rel = 'noopener noreferrer'; go.textContent = '열어 보기 ↗';
      foot.appendChild(go);
      if (l.id && sheetMode && myLinks.indexOf(l.id) < 0 && !repd[l.id]) {
        const flag = el('button', 'lc-flag', '🚩'); flag.type = 'button'; flag.title = '부적절한 링크 알리기';
        flag.addEventListener('click', () => reportLink(l, c)); foot.appendChild(flag);
      }
      c.append(head, topic, host, foot);
      list.appendChild(c);
    });
    $('linksCount').textContent = state.links.length ? '함께 나눈 링크 ' + state.links.length + '개' : '';
  }
  async function reportLink(l, card) {
    const rep = reported(); rep[l.id] = Date.now(); store.set('ms_reported', rep);
    state.links = state.links.filter((x) => x.id !== l.id);
    renderLinks(); renderDockSubs();
    toast('알려 줘서 고마워요. 세 명이 알리면 그 링크는 가려져요.', 3200);
    try { await sheetPost({ type: 'linkreport', id: l.id, sessionId: sid }); } catch (e) { /* 다음에 */ }
  }
  function openLinkForm() {
    linkForm = { purpose: 0, level: 1, subject: 0 };
    $('linkUrl').value = ''; $('linkTopic').value = '';
    $('linkMsg').textContent = ''; $('linkMsg').className = 'modal-msg';
    renderLinkForm();
    openModal('linkFormModal');
  }
  function renderLinkForm() {
    const pr = $('linkPurpose'); pr.textContent = '';
    PURPOSES.forEach((p, i) => {
      const b = el('button', 'chip-opt' + (linkForm.purpose === i ? ' on' : ''), PURPOSE_ICON[i] + ' ' + p); b.type = 'button';
      b.addEventListener('click', () => { linkForm.purpose = i; renderLinkForm(); });
      pr.appendChild(b);
    });
    const show = linkForm.purpose === 0;
    $('linkClassRow').hidden = !show;
    if (show) {
      const lv = $('linkLevel'); lv.textContent = '';
      LEVEL_NAME.forEach((n, i) => {
        const b = el('button', 'chip-opt sm' + (linkForm.level === i ? ' on' : ''), n); b.type = 'button';
        b.addEventListener('click', () => { linkForm.level = i; renderLinkForm(); });
        lv.appendChild(b);
      });
      const sj = $('linkSubject'); sj.textContent = '';
      SUBJECT_NAME.forEach((n, i) => {
        const b = el('button', 'chip-opt sm' + (linkForm.subject === i ? ' on' : ''), n); b.type = 'button';
        b.addEventListener('click', () => { linkForm.subject = i; renderLinkForm(); });
        sj.appendChild(b);
      });
    }
  }
  async function submitLink() {
    const url = $('linkUrl').value.trim();
    const topic = $('linkTopic').value.trim();
    const setMsg = (t, k) => { $('linkMsg').textContent = t; $('linkMsg').className = 'modal-msg ' + (k || ''); };
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) return setMsg('http 로 시작하는 올바른 주소를 넣어 주세요.', 'err');
    if (!topic) return setMsg('어떤 링크인지 주제를 적어 주세요.', 'err');
    if (topic.length > 40) return setMsg('주제는 40자 이내로 적어 주세요.', 'err');
    const chk = window.Filter ? window.Filter.check(topic) : { ok: true };
    if (!chk.ok) return setMsg(/따뜻한/.test(chk.reason) ? '주제에 쓸 수 없는 말이 있어요.' : chk.reason, 'err');
    $('linkSubmit').disabled = true;
    const payload = { url, purpose: linkForm.purpose, topic, level: linkForm.level, subject: linkForm.subject };
    try {
      let r;
      if (sheetMode) {
        try { r = await sheetPost(Object.assign({ type: 'link', sessionId: sid }, payload)); }
        catch (e) { r = { ok: false, reason: '연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.' }; }
      } else {
        r = { ok: true, id: 'L' + Date.now() };
      }
      if (!r || !r.ok) return setMsg(r && r.reason || '올리지 못했어요.', 'err');
      const link = normLink({ id: r.id || ('L' + Date.now()), url, purpose: linkForm.purpose, topic,
        level: linkForm.purpose === 0 ? linkForm.level : -1, subject: linkForm.purpose === 0 ? linkForm.subject : -1, at: Date.now() });
      if (!r.pending) state.links.unshift(link);
      const mine = store.get('ms_mylinks', []) || []; mine.unshift(link.id); store.set('ms_mylinks', mine.slice(0, 50));
      if (!sheetMode) saveLocal();
      closeModal('linkFormModal');
      renderLinks(); renderDockSubs();
      earn('wish'); // 링크 나눔도 염원과 같은 동전 항목으로 북돋워요
      toast(r.pending ? '올렸어요. 선생님이 확인하면 보여요.' : '🎁 링크를 나눔터에 올렸어요. 고마워요!');
    } finally { $('linkSubmit').disabled = false; }
  }
  $('openLinkWrite').addEventListener('click', openLinkForm);
  $('linkCancel').addEventListener('click', () => closeModal('linkFormModal'));
  $('linkSubmit').addEventListener('click', submitLink);

  /* ===================== 마음 날씨 연못 ===================== */
  const MOODS = [
    { ico: '☀️', name: '맑음', msg: '햇살 같은 마음이네요. 그 기분을 친구에게 나눠 볼까요? 가까이 가서 하이파이브 한 번!', go: null },
    { ico: '⛅', name: '구름 조금', msg: '괜찮은데 조금 마음 쓰이는 일이 있나 봐요. 숨 쉬는 나무에서 숨을 세 번 골라 봐요.', go: ['tree', '숨 고르러 가기'] },
    { ico: '🌧️', name: '비', msg: '마음에 비가 오는 날도 있어요. 걱정을 나뭇잎에 실어 흘려보내 볼까요?', go: ['letgo', '걱정 흘려보내기'] },
    { ico: '⛈️', name: '천둥', msg: '많이 속상하거나 화가 난 것 같아요. 빗소리 정자에서 잠시 쉬어 가요. 마음이 계속 무거우면 믿을 수 있는 어른이나 선생님께 꼭 이야기해요.', go: ['rain', '빗소리 들으러 가기'] },
    { ico: '🌈', name: '무지개', msg: '힘든 일 뒤에 좋은 일이 왔나 봐요! 그 마음을 등불로 띄워 볼까요?', go: ['hope', '등불 띄우기'] },
    { ico: '🌫️', name: '안개', msg: '내 마음이 잘 안 보이는 날이에요. 구슬을 한 알씩 넘기며 천천히 살펴봐요.', go: ['spring', '구슬 넘기러 가기'] },
  ];
  const moodPicked = () => { const m = store.get('ms_mood', null); return m && m.day === today() ? m.m : null; };
  (function buildMoods() {
    const g = $('moodGrid');
    MOODS.forEach((m, i) => {
      const b = el('button', 'mood', `<span>${m.ico}</span><b>${m.name}</b>`);
      b.type = 'button';
      b.addEventListener('click', () => pickMood(i));
      g.appendChild(b);
    });
  })();
  function openPond() {
    const p = moodPicked();
    $('moodGrid').querySelectorAll('.mood').forEach((b, i) => b.classList.toggle('on', i === p));
    if (p !== null) showMoodAnswer(p); else $('moodAnswer').hidden = true;
    renderMoodToday();
    openModal('pondModal');
  }
  function showMoodAnswer(i) {
    const m = MOODS[i], box = $('moodAnswer');
    box.innerHTML = '';
    const p = el('p'); p.textContent = m.ico + ' ' + m.msg; box.appendChild(p);
    if (m.go) {
      const b = el('button', 'btn-primary go', m.go[1]); b.type = 'button';
      b.addEventListener('click', () => {
        closeModal('pondModal');
        const g = m.go[0];
        if (g === 'letgo' || g === 'hope') { renderBoard(); openModal('boardModal'); openWrite(g === 'letgo' ? KIND_LETGO : KIND_HOPE); }
        else goTo(g, true);
      });
      box.appendChild(b);
    }
    box.hidden = false;
  }
  async function pickMood(i) {
    const prev = moodPicked();
    $('moodGrid').querySelectorAll('.mood').forEach((b, j) => b.classList.toggle('on', j === i));
    showMoodAnswer(i);
    Sound.tok();
    if (prev !== null) return; // 집계는 하루 한 번만
    store.set('ms_mood', { day: today(), m: i });
    state.mood[i] = (state.mood[i] || 0) + 1;
    earn('mood'); renderMoodToday(); renderDockSubs();
    if (!sheetMode) { saveLocal(); return; }
    try { const r = await sheetPost({ type: 'mood', sessionId: sid, m: i }); if (r && r.ok && Array.isArray(r.mood)) { state.mood = r.mood; renderMoodToday(); } } catch (e) { /* */ }
  }
  function renderMoodToday() {
    const total = state.mood.reduce((a, b) => a + b, 0);
    const box = $('moodToday');
    if (!total) { box.textContent = '오늘 처음으로 마음 날씨를 남겨 볼까요?'; return; }
    box.innerHTML = '오늘 숲에 모인 마음 날씨 (' + total + '명)<br>' + MOODS.map((m, i) => `<span class="mt">${m.ico} ${state.mood[i] || 0}</span>`).join('');
  }

  /* ===================== 빗소리 정자 ===================== */
  let rainKind = 'rain', rainMin = 1, rainTimer = null, rainLeft = 0;
  document.querySelectorAll('#rainSound button').forEach((b) => b.addEventListener('click', () => {
    rainKind = b.dataset.s;
    document.querySelectorAll('#rainSound button').forEach((x) => x.classList.toggle('on', x === b));
    $('rainWindow').className = 'rain-window ' + (rainKind === 'rain' ? '' : rainKind);
    if (rainTimer) Sound.ambient(rainKind);
  }));
  document.querySelectorAll('#rainLen button').forEach((b) => b.addEventListener('click', () => {
    if (rainTimer) return;
    rainMin = Number(b.dataset.m);
    document.querySelectorAll('#rainLen button').forEach((x) => x.classList.toggle('on', x === b));
    $('rainTime').textContent = rainMin + ':00';
  }));
  const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  $('rainStart').addEventListener('click', () => {
    if (rainTimer) { stopRain(false); return; }
    rainLeft = rainMin * 60;
    $('rainTime').textContent = fmt(rainLeft);
    $('rainStart').textContent = '그만 쉬기';
    Sound.ambient(rainKind);
    rainTimer = setInterval(() => {
      rainLeft--;
      $('rainTime').textContent = fmt(Math.max(0, rainLeft));
      if (rainLeft <= 0) stopRain(true);
    }, 1000);
  });
  function stopRain(done) {
    if (!rainTimer) return;
    clearInterval(rainTimer); rainTimer = null;
    Sound.stopAmbient();
    $('rainStart').textContent = '쉬기 시작';
    $('rainTime').textContent = rainMin + ':00';
    if (done) { Sound.chime(true, true); earn('rain'); toast('잘 쉬었어요. 마음이 조금 촉촉해졌나요? ☔', 3600); }
  }

  /* ===================== 마음 동전 보기 ===================== */
  function openWallet() {
    rollDay(); renderCoins();
    const list = $('earnList'); list.textContent = '';
    Object.keys(EARN).forEach((k) => {
      const e = EARN[k], got = wallet.earn[k] || 0;
      const row = el('div', 'earn', `<span class="e-ico">${e.ico}</span><span class="e-name">${e.name}</span><span class="e-bar"><i style="width:${Math.round(got / e.max * 100)}%"></i></span><span class="e-val">${got}/${e.max}</span>`);
      list.appendChild(row);
    });
    openModal('walletModal');
  }

  /* ===================== 명언 계단 ===================== */
  const STEPS = 108, SDX = 50, SDY = 46;
  const sg = { dirs: [], cols: [], cur: 0, busy: false, miss: 0 };
  const quoteBook = () => store.get('ms_quotes', []) || [];
  function buildStairs() {
    sg.dirs = [0]; sg.cols = [0];
    for (let i = 1; i <= STEPS; i++) {
      const prev = sg.cols[i - 1];
      let d = Math.random() < (sg.dirs[i - 1] ? 0.62 : 0.5) ? (sg.dirs[i - 1] || 1) : -(sg.dirs[i - 1] || 1);
      if (Math.abs(prev + d) > 3) d = -d;
      sg.dirs.push(d); sg.cols.push(prev + d);
    }
    const box = $('sgSteps'); box.textContent = '';
    for (let i = 0; i <= STEPS; i++) {
      const s = el('div', 'sg-step' + (i % 10 === 0 && i > 0 ? ' ten' : '') + (i === STEPS ? ' goal' : ''));
      s.style.left = (sg.cols[i] * SDX) + 'px'; s.style.top = (-i * SDY) + 'px';
      if (i % 10 === 0 && i > 0) s.dataset.n = i === STEPS ? '108' : String(i);
      if (i === STEPS) s.dataset.n = '108';
      box.appendChild(s);
      if (i % 10 === 0 && i > 0) {
        [-1, 1].forEach((side) => {
          const l = el('div', 'sg-lantern');
          l.style.left = (sg.cols[i] * SDX + side * 62) + 'px'; l.style.top = (-i * SDY) + 'px';
          box.appendChild(l);
        });
      }
    }
    if (STEPS % 10) { const s = box.children[STEPS]; s.classList.add('ten'); }
    for (let i = 0; i < 16; i++) {
      const c = el('div', 'sg-cloud');
      c.style.width = rand(70, 160) + 'px'; c.style.left = (rand(-1, 1) * 420) + 'px'; c.style.top = (-rand(2, STEPS) * SDY) + 'px';
      box.insertBefore(c, box.firstChild);
    }
  }
  function stairSky(i) {
    const t = i / STEPS;
    const mix = (a, b, k) => a.map((v, j) => Math.round(v + (b[j] - v) * k));
    const P = [[[43, 59, 102], [106, 127, 168], [184, 198, 217]], [[247, 170, 160], [252, 206, 170], [255, 232, 200]], [[134, 196, 238], [190, 226, 247], [240, 248, 236]]];
    const seg = t < 0.5 ? 0 : 1, k = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const c = [0, 1, 2].map((j) => mix(P[seg][j], P[seg + 1][j], k));
    $('sgSky').style.background = `linear-gradient(180deg, rgb(${c[0]}) 0%, rgb(${c[1]}) 60%, rgb(${c[2]}) 100%)`;
    $('sgSky').style.setProperty('--stars', String(Math.max(0, 0.9 - t * 2)));
  }
  function stairCamera() {
    const i = sg.cur;
    const x = sg.cols[i] * SDX, y = -i * SDY;
    $('sgWorld').style.transform = `translate(${(vw / 2 - x).toFixed(0)}px, ${(vh * 0.64 - y).toFixed(0)}px)`;
    const meEl = $('sgMe');
    meEl.style.left = x + 'px'; meEl.style.top = (y + 4) + 'px';
    $('sgStep').textContent = i;
    $('sgBar').style.width = (i / STEPS * 100) + '%';
    const kids = $('sgSteps').querySelectorAll('.sg-step');
    kids.forEach((s, j) => s.classList.toggle('passed', j < i));
    stairSky(i);
  }
  function openStair() {
    buildStairs();
    sg.cur = 0; sg.busy = false; sg.miss = 0;
    $('sgMe').innerHTML = `<div class="flipper">${A.person(look())}</div>`;
    $('sgBookN').textContent = quoteBook().length;
    $('sgQuote').hidden = true; $('sgDone').hidden = true;
    $('sgTip').textContent = isTouch ? '다음 계단이 있는 쪽 버튼을 눌러요' : '← → 방향키로 다음 계단이 있는 쪽을 눌러요';
    $('stairGame').hidden = false;
    stairCamera();
  }
  function exitStair() {
    $('stairGame').hidden = true;
    me.zone = ''; setZoneIcon(me.el, '');
    renderDockSubs();
  }
  function climb(dir) {
    if (sg.busy || $('stairGame').hidden) return;
    const btn = dir < 0 ? $('sgLeft') : $('sgRight');
    btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 120);
    const meEl = $('sgMe');
    if (sg.cur >= STEPS) return;
    if (sg.dirs[sg.cur + 1] !== dir) {
      sg.miss++;
      meEl.classList.remove('slip'); void meEl.offsetWidth; meEl.classList.add('slip');
      $('sgTip').textContent = '앗, 반대쪽이에요. 천천히 다시!';
      return;
    }
    sg.cur++;
    meEl.querySelector('.flipper').style.transform = dir < 0 ? 'scaleX(-1)' : '';
    meEl.classList.remove('step'); void meEl.offsetWidth; meEl.classList.add('step');
    Sound.step(sg.cur);
    stairCamera();
    if (sg.cur > (store.get('ms_stair_best', 0) || 0)) store.set('ms_stair_best', sg.cur);
    if (sg.cur === STEPS) { setTimeout(stairDone, 350); return; }
    if (sg.cur % 10 === 0) { setTimeout(() => showQuote(sg.cur), 260); }
    else if (sg.cur % 10 === 7) $('sgTip').textContent = '조금만 더 가면 말 한마디가 기다려요';
    else if (sg.cur % 10 === 1) $('sgTip').textContent = '좋아요, 한 칸씩 천천히';
  }
  function pickQuote() {
    const got = new Set(quoteBook());
    const fresh = QUOTES.map((_, i) => i).filter((i) => !got.has(i));
    const pool = fresh.length ? fresh : QUOTES.map((_, i) => i);
    return pool[randInt(pool.length)];
  }
  function showQuote(n) {
    sg.busy = true;
    const qi = pickQuote(), q = QUOTES[qi] || ['한 걸음씩, 천천히.', '마음쉼터'];
    const book = quoteBook(); if (book.indexOf(qi) < 0) { book.push(qi); store.set('ms_quotes', book); }
    $('sgBookN').textContent = book.length;
    $('sgqStep').textContent = n + '번째 계단';
    $('sgqText').textContent = '“' + q[0] + '”';
    $('sgqBy').textContent = '— ' + q[1];
    $('sgQuote').hidden = false;
    Sound.chime(true);
    earn('stair');
    setTimeout(() => $('sgqNext').focus(), 50);
  }
  $('sgqNext').addEventListener('click', () => { $('sgQuote').hidden = true; sg.busy = false; $('sgTip').textContent = '다음 10칸도 천천히 올라가요'; });
  function stairDone() {
    sg.busy = true;
    const add = earn('stairDone');
    $('sgDoneCoin').textContent = add ? '🪙 +' + add + ' 완주 선물' : '오늘 완주 선물은 이미 받았어요';
    $('sgDone').hidden = false;
    Sound.chime(); sparkle();
  }
  $('sgAgain').addEventListener('click', openStair);
  $('sgHome').addEventListener('click', exitStair);
  $('sgExit').addEventListener('click', exitStair);
  $('sgLeft').addEventListener('pointerdown', (e) => { e.preventDefault(); climb(-1); });
  $('sgRight').addEventListener('pointerdown', (e) => { e.preventDefault(); climb(1); });
  $('sgBook').addEventListener('click', () => openBook());
  function stairKey(e) {
    if (e.repeat) return;
    if (!$('sgQuote').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('sgqNext').click(); return; }
    if (!$('bookModal').hidden) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); climb(-1); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); climb(1); }
  }
  function openBook() {
    const book = quoteBook(), list = $('bookList');
    list.textContent = '';
    $('bookDesc').textContent = '계단에서 모은 말 ' + book.length + ' / ' + QUOTES.length;
    if (!book.length) list.appendChild(emptyEl('아직 모은 말이 없어요.<br>10번째 계단마다 하나씩 만나요.'));
    book.slice().reverse().forEach((i) => {
      const q = QUOTES[i]; if (!q) return;
      const c = el('div', 'qcard'); const p = el('p'); p.textContent = q[0]; const s = el('small'); s.textContent = '— ' + q[1];
      c.append(p, s); list.appendChild(c);
    });
    $('bookModal').style.zIndex = '56';
    openModal('bookModal');
  }

  /* ===================== 숲 지도 ===================== */
  const MAP_PTS = { plaza: [50, 302], shop: [60, 240], links: [120, 198], tree: [104, 128], spring: [184, 100], lantern: [258, 120], garden: [300, 182], pond: [230, 244], rain: [330, 266], stair: [376, 182], hill: [404, 92] };
  function mapXY(x) {
    if (x <= ZONES[0].x) return MAP_PTS[ZONES[0].id];
    for (let i = 0; i < ZONES.length - 1; i++) {
      const a = ZONES[i], b = ZONES[i + 1];
      if (x <= b.x) { const t = (x - a.x) / (b.x - a.x), pa = MAP_PTS[a.id], pb = MAP_PTS[b.id]; return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]; }
    }
    return MAP_PTS[ZONES[ZONES.length - 1].id];
  }
  (function buildMap() {
    const pts = ZONES.map((z) => MAP_PTS[z.id].join(',')).join(' ');
    const prand = (i) => { const x = Math.sin(i * 91.3 + 7.1) * 10000; return x - Math.floor(x); };
    const nearPath = (x, y) => ZONES.slice(0, -1).some((z, i) => {
      const [ax, ay] = MAP_PTS[z.id], [bx, by] = MAP_PTS[ZONES[i + 1].id];
      const dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
      return Math.hypot(ax + dx * t - x, ay + dy * t - y) < 16;
    });
    let trees = '';
    for (let i = 0; i < 70; i++) {
      const x = 40 + prand(i) * 360, y = 50 + prand(i + 50) * 250;
      if (ZONES.some((z) => Math.hypot(MAP_PTS[z.id][0] - x, MAP_PTS[z.id][1] - y) < 34 || (Math.abs(MAP_PTS[z.id][0] - x) < 42 && y > MAP_PTS[z.id][1] && y - MAP_PTS[z.id][1] < 40))) continue;
      if (nearPath(x, y)) continue;
      trees += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})"><circle r="10" fill="#6ea05d"/><circle r="6.5" cy="-5" fill="#7cae69"/></g>`;
    }
    const spots = ZONES.map((z) => {
      const [x, y] = MAP_PTS[z.id];
      return `<g class="map-spot" data-zone="${z.id}" transform="translate(${x},${y})">
        <circle r="15" fill="#fffaf1" stroke="#e5b86a" stroke-width="2.5"/>
        <text y="5" text-anchor="middle" font-size="14">${z.icon}</text>
        <text class="spot-name" y="30" text-anchor="middle" font-size="10.5" fill="#4b4335">${z.short}</text></g>`;
    }).join('');
    $('mapFrame').innerHTML = `
      <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
        <rect width="440" height="340" fill="#bfe3cf"/>
        <path d="M30 60 Q20 150 40 260 Q60 330 180 326 Q330 330 400 268 Q430 170 408 84 Q370 22 220 22 Q80 18 30 60 Z" fill="#9ecb84"/>
        <path d="M58 86 Q48 170 68 250 Q100 304 200 302 Q320 304 372 250 Q398 166 380 98 Q344 50 220 48 Q100 46 58 86 Z" fill="#b2d79a"/>
        <polyline points="${pts}" fill="none" stroke="#eadbb2" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${pts}" fill="none" stroke="#d9c59a" stroke-width="2" stroke-dasharray="4 7" stroke-linecap="round"/>
        ${trees}${spots}<g id="mapPeople"></g>
      </svg>`;
    $('mapFrame').addEventListener('click', (e) => {
      const s = e.target.closest('.map-spot'); if (!s) return;
      closeModal('mapModal'); goTo(s.dataset.zone, true);
    });
  })();
  let mapTimer = null;
  function drawMapPeople() {
    const g = $('mapPeople'); if (!g) return;
    let s = '';
    for (const o of others.values()) { const [x, y] = mapXY(o.x); s += `<circle cx="${x.toFixed(1)}" cy="${(y + (o.d - 0.5) * 12).toFixed(1)}" r="5" fill="#6a8fd0" stroke="#fff" stroke-width="2"/>`; }
    const [mx, my] = mapXY(me.x);
    s += `<circle cx="${mx.toFixed(1)}" cy="${(my + (me.d - 0.5) * 12).toFixed(1)}" r="7.5" fill="#e8813a" stroke="#fff" stroke-width="2.5"/>`;
    g.innerHTML = s;
  }
  function openMap() { drawMapPeople(); openModal('mapModal'); clearInterval(mapTimer); mapTimer = setInterval(drawMapPeople, 500); }
  function stopMapLive() { clearInterval(mapTimer); mapTimer = null; }

  /* ===================== 내 모습 고르기 ===================== */
  let draft = null, lookTab = 's';
  document.querySelectorAll('#lookTabs .lt').forEach((b) => b.addEventListener('click', () => {
    lookTab = b.dataset.k;
    document.querySelectorAll('#lookTabs .lt').forEach((x) => x.classList.toggle('on', x === b));
    renderIntro();
  }));
  function openIntro() {
    draft = Object.assign({}, profile || randomProfile());
    renderIntro();
    $('introEnter').textContent = profile ? '이 모습으로 할게요' : '숲으로 들어가기';
    $('introModal').querySelector('.m-x').hidden = !profile;
    openModal('introModal');
  }
  function renderIntro() {
    const L = Object.assign({}, draft, { c: wallet.c });
    $('introPreview').innerHTML = A.person(L);
    $('introNick').textContent = nameOf(draft);
    const box = $('lookOpts'); box.textContent = '';
    const choose = (k, i) => { draft[k] = i; renderIntro(); };
    if (lookTab === 's' || lookTab === 'h' || lookTab === 'o') {
      const colors = lookTab === 's' ? A.SKIN : lookTab === 'h' ? A.HAIR : A.OUTFIT;
      colors.forEach((c, i) => {
        const b = el('button', 'swatch' + (draft[lookTab] === i ? ' on' : '')); b.type = 'button';
        b.style.background = c; b.setAttribute('aria-label', (i + 1) + '번 색');
        b.addEventListener('click', () => choose(lookTab, i));
        box.appendChild(b);
      });
    } else {
      const names = lookTab === 'hs' ? A.STYLE_NAMES : A.TYPE_NAMES;
      names.forEach((n, i) => {
        const b = el('button', 'opt-card' + (draft[lookTab] === i ? ' on' : '')); b.type = 'button';
        const p = Object.assign({}, draft, { [lookTab]: i, c: 0 });
        b.innerHTML = `<div class="opt-thumb"${lookTab === 'ot' ? ' style="display:flex;align-items:flex-end;justify-content:center"' : ''}>${A.person(p)}</div>${n}`;
        if (lookTab === 'ot') b.querySelector('svg').style.cssText = 'width:34px;height:46px';
        b.addEventListener('click', () => choose(lookTab, i));
        box.appendChild(b);
      });
    }
  }
  $('nickReroll').addEventListener('click', () => {
    const before = draft.a + ',' + draft.b;
    do { draft.a = randInt(ADJ.length); draft.b = randInt(NOUN.length); } while (draft.a + ',' + draft.b === before);
    renderIntro();
  });
  $('introEnter').addEventListener('click', () => {
    const firstTime = !profile;
    profile = validProfile(draft) || randomProfile();
    store.set('ms_profile', profile);
    applyMyLook();
    $('introModal').hidden = true;
    if (firstTime) welcome();
    pushPresence();
  });
  function welcome() {
    if (!wallet.gift) { wallet.gift = true; wallet.coins += 10; saveWallet(); renderCoins(true); coinFly(10); }
    toast((isTouch ? '가고 싶은 곳을 눌러 걸어요.' : '방향키로 걸어요.') + ' 첫 방문 선물로 마음 동전 🪙10을 드려요!', 5200);
    setTimeout(() => showBubble(me.el, '안녕! 천천히 둘러볼게요 🌿', 3200), 400);
  }

  /* ===================== 시작 ===================== */
  function start() {
    rollDay();
    document.body.classList.add('xmas');
    applyTime(autoTime());
    setInterval(() => { if (timeAuto) { const t = autoTime(); if (t !== timeIdx) applyTime(t); } }, 300000);
    measure();
    buildScene();
    spawnNpc();
    spawnCritters();
    me.el = makePerson(look(), true);
    peopleEl.appendChild(me.el);
    setPet(me, wallet.p);
    renderMeChip();
    renderCoins();
    layout();
    updateBreathUI();
    renderDockSubs();
    cam = clamp(me.x - vw / 2, 0, Math.max(0, W - vw));
    requestAnimationFrame(frame);
    startSanta();
    renderSkyStars();
    if (musicChoice && musicChoice !== 'off') { $('musicBtn').classList.add('on'); }
    window.addEventListener('resize', () => { measure(); layout(); if (!$('stairGame').hidden) stairCamera(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) for (const k in keys) keys[k] = false; });

    if (!profile) openIntro();
    else setTimeout(() => toast(isTouch ? '가고 싶은 곳을 눌러 걸어 보세요.' : '방향키로 걸어 보세요. 쉼터 앞에서 Enter!', 3800), 500);

    const todayKey = 'ms_visit_' + new Date().toISOString().slice(0, 10);
    if (sheetMode) {
      (async () => {
        try { if (!localStorage.getItem(todayKey)) { localStorage.setItem(todayKey, '1'); await sheetPost({ type: 'visit', sessionId: sid }); } } catch (e) { /* */ }
        refreshState(true);
      })();
      presenceLoop();
    } else {
      const n = (Number(store.get(todayKey, 0)) || 0) + 1;
      store.set(todayKey, n);
      visitsToday = n;
      refreshState(true);
    }
    setInterval(() => { if (!document.hidden) refreshState(false); }, 20000);

    // 시험용 창(개발자가 확인할 때만 사용)
    window.__ms = { me, others, state, wallet, critters, sg, goTo, enterZone, keys, earn, climb, sendEmote, applyTime, openLinks, openMusic, chooseMusic, flySanta, submitLink, linkForm, refreshState, renderBoard, get musicChoice() { return musicChoice; }, get cam() { return cam; }, get myKey() { return myKey; }, get nearPerson() { return nearPerson; } };
  }
  start();
})();
