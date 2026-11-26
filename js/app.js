/* ============================================================
 *  온라인 마음쉼터 — v6
 *  숲길 · 쉼터 10곳 · 예쁜 아바타 · 동물 친구들 · 하이파이브
 *  마음 동전 · 숲속 가게 · 마음 꽃밭 · 마음 날씨 · 빗소리 · 명언 계단
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
  const ymd = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ===================== 상수 ===================== */
  const W = 6380, SPEED = 250, DSPEED = 0.85, NEAR = 130, STAR_AT = 5;
  const KIND_HOPE = '바람', KIND_LETGO = '내려놓기';
  const ADJ = ['느린', '따뜻한', '조용한', '포근한', '맑은', '다정한', '싱그러운', '잔잔한', '반짝이는', '수줍은', '너그러운', '차분한', '말랑한', '산뜻한', '고요한', '부드러운'];
  const NOUN = ['걸음', '바람', '새벽', '구름', '오솔길', '햇살', '이슬', '나뭇잎', '달빛', '시냇물', '솔방울', '민들레', '별빛', '도토리', '꽃잎', '숲길'];
  const EMO = ['', '👋', '💚', '😊', '🙏', '🙌'];
  const ZONES = [
    { id: 'plaza', x: 340, name: '쉼터 광장', short: '광장', icon: '🪧', tint: '#f4e7cf' },
    { id: 'reading', x: 800, name: '마음 글밭', short: '글밭', icon: '📖', tint: '#eaf3da', big: true },
    { id: 'shop', x: 1280, name: '숲속 가게', short: '가게', icon: '🏪', tint: '#d6efe4' },
    { id: 'links', x: 1780, name: '링크 나눔터', short: '링크', icon: '🎁', tint: '#fbdcd9' },
    { id: 'tree', x: 2280, name: '숨 쉬는 나무', short: '숨 고르기', icon: '🌳', tint: '#ddeed0' },
    { id: 'spring', x: 2740, name: '마음 구슬 샘', short: '마음 구슬', icon: '🫧', tint: '#dbecf5' },
    { id: 'lantern', x: 3220, name: '염원 등불터', short: '염원', icon: '🏮', tint: '#fbe6c4', big: true },
    { id: 'garden', x: 3720, name: '마음 꽃밭', short: '꽃밭', icon: '🌷', tint: '#fadde4', big: true },
    { id: 'pond', x: 4200, name: '마음 날씨 연못', short: '마음 날씨', icon: '🪷', tint: '#d6edf2' },
    { id: 'rain', x: 4680, name: '빗소리 정자', short: '빗소리', icon: '☔', tint: '#dfe7ec' },
    { id: 'stair', x: 5160, name: '명언 계단', short: '명언 계단', icon: '🪜', tint: '#f1e4cc' },
    { id: 'temple', x: 5620, name: '고요한 산사', short: '산사', icon: '🏔️', tint: '#e8e2d4', big: true },
    { id: 'hill', x: 6080, name: '별빛 언덕', short: '별빛 언덕', icon: '⭐', tint: '#e6def5' },
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
    bell: { name: '소원 종 울리기', ico: '🔔', each: 1, max: 3 },
    present: { name: '숲 선물 열기', ico: '🎁', each: 1, max: 3 },
    ground: { name: '지금 여기 그라운딩', ico: '🖐️', each: 1, max: 2 },
    tap: { name: '탑돌이 한 바퀴', ico: '🗼', each: 1, max: 3 },
    gong: { name: '범종 소리 끝까지 듣기', ico: '🔔', each: 1, max: 3 },
    thanks: { name: '좋은 일 씨앗 심기', ico: '🌰', each: 2, max: 6 },
    water: { name: '마음 정원 물 주기', ico: '💧', each: 2, max: 2 },
  };
  // 염원 분류 (서버 N.CAT 과 같은 순서·개수)
  const WISH_CATS = [
    { ico: '🌱', name: '건강' }, { ico: '👨‍👩‍👧', name: '가족' }, { ico: '🤝', name: '친구' }, { ico: '📚', name: '공부' },
    { ico: '⭐', name: '꿈' }, { ico: '🙏', name: '감사' }, { ico: '🌙', name: '마음' }, { ico: '🍀', name: '그 밖에' },
  ];
  const catOf = (i) => WISH_CATS[clamp(i | 0, 0, WISH_CATS.length - 1)];
  const wallet = Object.assign({ coins: 0, owned: { acc: [0], pet: [0] }, c: 0, p: 0, wornSlots: null, day: '', earn: {}, gift: false }, store.get('ms_wallet', {}) || {});
  if (!wallet.owned || !Array.isArray(wallet.owned.acc)) wallet.owned = { acc: [0], pet: [0] };
  wallet.p = clamp(wallet.p | 0, 0, A.PET.length - 1);
  // 장식을 슬롯별로 여러 개 착용 (예전 단일 장식 wallet.c 은 자동으로 옮겨요)
  if (!wallet.wornSlots || typeof wallet.wornSlots !== 'object') {
    wallet.wornSlots = {};
    const old = clamp(wallet.c | 0, 0, A.ACC.length - 1);
    if (old) wallet.wornSlots[A.ACC_SLOT[old]] = old;
  }
  function wornArr() { return Object.keys(wallet.wornSlots).map((k) => wallet.wornSlots[k] | 0).filter((x) => x >= 1 && x <= 13); }
  function isWorn(id) { return wallet.wornSlots[A.ACC_SLOT[id]] === id; }
  function saveWallet() { store.set('ms_wallet', wallet); }
  // 나의 마음 정원 (이 기기에만 저장 — 서버로 보내지 않아요)
  const mg = Object.assign({ plants: [], lastWater: '', streak: 0 }, store.get('ms_garden', {}) || {});
  if (!Array.isArray(mg.plants)) mg.plants = [];
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
  const look = () => Object.assign({}, profile || { a: 0, b: 0, s: 0, h: 0, hs: 0, o: 0, ot: 0 }, { worn: wornArr(), p: wallet.p });

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
  const gifts = [];
  const GIFT_SPOTS = [570, 1530, 2510, 3470, 4440, 5390, 5880];
  function startShooting() {
    const host = $('shooting');
    const fire = () => {
      if (document.hidden || !document.body.classList.contains('t-night')) return;
      const sh = el('div', 'shoot');
      sh.style.left = rand(40, 90) + '%'; sh.style.top = rand(4, 34) + '%';
      host.appendChild(sh); void sh.offsetWidth; sh.classList.add('go');
      setTimeout(() => sh.remove(), 1300);
    };
    const tick = () => { setTimeout(() => { fire(); tick(); }, rand(9000, 22000)); };
    tick();
  }
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
      const rr = Math.random();
      if (rr < 0.14) s.className = 'gold'; else if (rr < 0.4) s.className = 'big';
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
    // 빛 입자(bokeh)
    const mo = $('motes');
    for (let i = 0; i < 10; i++) {
      const m = el('div', 'mote');
      const sz = rand(3, 9);
      m.style.width = m.style.height = sz.toFixed(1) + 'px';
      m.style.left = rand(0, 100) + '%'; m.style.top = rand(20, 92) + '%';
      m.style.setProperty('--mx', rand(-40, 40).toFixed(0) + 'px');
      m.style.setProperty('--my', rand(-110, -50).toFixed(0) + 'px');
      m.style.animationDuration = rand(13, 26).toFixed(1) + 's, ' + rand(3, 6).toFixed(1) + 's';
      m.style.animationDelay = (-rand(0, 20)).toFixed(1) + 's, ' + (-rand(0, 4)).toFixed(1) + 's';
      mo.appendChild(m);
    }
    // 땅 반짝임(눈·이슬)
    const gl = el('div', 'ground-glints'); $('scene').insertBefore(gl, $('world'));
    for (let i = 0; i < 14; i++) {
      const g = el('div', 'glint');
      g.style.left = rand(1, 99) + '%'; g.style.bottom = rand(2, 38) + '%';
      g.style.animationDelay = (-rand(0, 3.2)).toFixed(2) + 's';
      gl.appendChild(g);
    }
    const path = el('div', 'path'); decorEl.appendChild(path); decor.push({ el: path, kind: 'path' });
    startShooting();
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
    // 숲 선물 상자 — 주우면 좋은 말이 나와요 (날마다 새로 놓여요)
    const gd0 = giftDay();
    GIFT_SPOTS.forEach((gx, i) => {
      const e = el('div', 'giftbox', A.GIFT + '<span class="gb-spark">✨</span>');
      e.style.setProperty('--box', '#f2a9c0'); e.style.setProperty('--rib', '#ffd94e');
      decorEl.appendChild(e);
      const item = { el: e, x: gx, d: 0.22 + (i % 3) * 0.13, kind: 'gift', id: i, got: gd0.got.indexOf(i) >= 0 };
      decor.push(item); gifts.push(item);
    });
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
      b.addEventListener('click', () => { b.blur(); warpTo(z.id); });
      track.appendChild(b);
    });
  }
  // 빠른 이동 — 걷지 않고 바로 그곳으로 가서 입장해요 (부드러운 전환)
  let warpBusy = false;
  function warpTo(id) {
    const z = zoneById(id); if (!z || warpBusy) return;
    setStroll(false); me.target = null; for (const k in keys) keys[k] = false;
    if (Math.abs(me.x - z.x) < NEAR * 0.9) { enterZone(id); return; } // 이미 가까우면 바로
    warpBusy = true;
    let fade = $('warpFade');
    if (!fade) { fade = el('div', 'warp-fade'); fade.id = 'warpFade'; document.body.appendChild(fade); }
    fade.classList.remove('show'); void fade.offsetWidth; fade.classList.add('show');
    setTimeout(() => {
      me.facing = z.x > me.x ? 1 : -1;
      me.x = clamp(z.x - me.facing * 56, 40, W - 40); me.d = 0.5;
      cam = clamp(me.x - vw / 2, 0, Math.max(0, W - vw));
      worldEl.style.transform = `translate3d(${(-cam).toFixed(1)}px,0,0)`;
      placeAt(me.el, me.x, me.d);
      enterZone(id);
      setTimeout(() => { fade.classList.remove('show'); warpBusy = false; }, 120);
    }, 230);
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
      if (it.kind === 'gift') { it.el.style.display = it.got ? 'none' : ''; if (it.got) return; }
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
    // 전자음 없이, 부드럽게 걸러낸 '소음'으로 빗소리·시냇물·모닥불을 만들어요.
    function noiseBurst(dest, t, dur, vol, type, freq, q) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf('white');
      const bp = ctx.createBiquadFilter(); bp.type = type; bp.frequency.value = freq; if (q) bp.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(bp); bp.connect(g); g.connect(dest); src.start(t); src.stop(t + dur + 0.05);
    }
    function ambient(kind) {
      ensure(); if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      stopAmbient(true);
      const nodes = [];
      // 바탕 소리
      const src = loopSrc(noiseBuf('brown'));
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      if (kind === 'rain') {
        // 부드러운 빗줄기: 낮게 걸러낸 쉬——
        f.type = 'lowpass'; f.frequency.value = 1500; f.Q.value = 0.3; g.gain.value = 0.3;
      } else if (kind === 'stream') {
        // 졸졸 흐르는 시냇물: 중간 대역이 천천히 흔들려요
        f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.6; g.gain.value = 0.34;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.18; const lg = ctx.createGain(); lg.gain.value = 180;
        lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo);
      } else {
        // 모닥불: 낮고 따뜻한 울림
        f.type = 'lowpass'; f.frequency.value = 360; g.gain.value = 0.5;
      }
      src.connect(f); f.connect(g); g.connect(ambG); src.start(); nodes.push(src);
      let timer = null;
      const tick = () => {
        const t = ctx.currentTime;
        if (kind === 'fire') {
          // 탁탁 — 걸러낸 소음 짧은 터짐
          noiseBurst(ambG, t, rand(0.015, 0.05), rand(0.06, 0.2), 'highpass', rand(1400, 3200), 0.5);
          if (Math.random() < 0.25) noiseBurst(ambG, t + 0.02, 0.02, 0.12, 'bandpass', rand(600, 1200), 1);
          timer = setTimeout(tick, rand(80, 500));
        } else if (kind === 'rain') {
          // 톡 — 부드러운 물방울
          noiseBurst(ambG, t, rand(0.04, 0.09), rand(0.015, 0.05), 'bandpass', rand(900, 2000), 1.2);
          timer = setTimeout(tick, rand(90, 320));
        } else {
          // 또르르 — 물 구르는 소리
          noiseBurst(ambG, t, rand(0.05, 0.12), rand(0.02, 0.05), 'bandpass', rand(1400, 2800), 2);
          timer = setTimeout(tick, rand(180, 600));
        }
      };
      tick();
      ambG.gain.cancelScheduledValues(ctx.currentTime);
      ambG.gain.setValueAtTime(0, ctx.currentTime);
      ambG.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.4);
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
      // 싱잉볼 같은 맑고 긴 종소리 (소리 꺼져 있어도 이 순간엔 들려줘요)
      bell() {
        ensure(); if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime, base = 330, partials = [1, 2.0, 2.76, 3.98];
        partials.forEach((m, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = base * m * (1 + (i ? 0.004 : 0));
          const vol = 0.14 / (i + 1);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0008, t + 4.2 - i * 0.5);
          o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 4.4);
        });
        // 은은한 맥놀이
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = base * 1.004;
        g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(0.05, t + 0.03); g2.gain.exponentialRampToValueAtTime(0.0008, t + 3.6);
        o2.connect(g2); g2.connect(sfx); o2.start(t); o2.stop(t + 3.8);
      },
      // 범종 — 낮게 웅 울리며 맥놀이(소리가 커졌다 작아졌다)가 길게 이어져요
      gong() {
        ensure(); if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime, base = 128, len = 9.5;
        // 당목이 종에 닿는 둔탁한 소리
        const th = ctx.createBufferSource(); th.buffer = noiseBuf('brown');
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
        const tg = ctx.createGain(); tg.gain.setValueAtTime(0.0001, t); tg.gain.linearRampToValueAtTime(0.5, t + 0.01); tg.gain.exponentialRampToValueAtTime(0.0005, t + 0.35);
        th.connect(lp); lp.connect(tg); tg.connect(sfx); th.start(t); th.stop(t + 0.4);
        // [배수, 세기, 지속]
        [[0.5, 0.20, len], [0.506, 0.16, len], [1, 0.16, len * 0.8], [1.19, 0.07, len * 0.55], [1.5, 0.05, len * 0.5],
          [2, 0.06, len * 0.45], [2.63, 0.035, len * 0.3], [3.31, 0.02, len * 0.22]].forEach(([m, v, d]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = base * m;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(v, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0006, t + d);
          o.connect(g); g.connect(sfx); o.start(t); o.stop(t + d + 0.1);
        });
      },
    };
  })();

  /* ===================== 배경음악 (클래식·캐럴) ===================== */
  const Music = (function () {
    // 전자음 대신 '부드러운 종·오르골 + 잔잔한 울림(리버브)'로 숲에 어울리게 들려줘요.
    const F = { 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'G2': 98.00, 'D2': 73.42, 'C2': 65.41, '-': 0 };
    const CAROLS = {
      jingle: { name: '징글벨', bpm: 128, mel: [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', .5], ['E4', 4], ['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', .5], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', .5], ['E4', .5], ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2]] },
      silent: { name: '고요한 밤', bpm: 92, mel: [['G4', 1.5], ['A4', .5], ['G4', 1], ['E4', 3], ['G4', 1.5], ['A4', .5], ['G4', 1], ['E4', 3], ['D5', 2], ['D5', 1], ['B4', 3], ['C5', 2], ['C5', 1], ['G4', 3]] },
      joy: { name: '기쁘다 구주 오셨네', bpm: 112, mel: [['C5', 1.5], ['B4', .5], ['A4', 1], ['G4', 1.5], ['F4', .5], ['E4', 2], ['E4', 1], ['E4', 1], ['F4', 1], ['F4', 1], ['G4', 2], ['G4', .75], ['F4', .25], ['E4', 1], ['E4', .75], ['D4', .25], ['C4', 2]] },
      wish: { name: '우리 모두 메리 크리스마스', bpm: 124, mel: [['G4', 1], ['C5', 1], ['C5', .5], ['D5', .5], ['C5', .5], ['B4', .5], ['A4', 1], ['A4', 1], ['D5', 1], ['D5', .5], ['E5', .5], ['D5', .5], ['C5', .5], ['B4', 1], ['G4', 1], ['E5', 1], ['E5', .5], ['F5', .5], ['E5', .5], ['D5', .5], ['C5', 1], ['A4', 1], ['G4', .5], ['G4', .5], ['A4', 1], ['D5', 1], ['B4', 1], ['C5', 2]] },
      deck: { name: '데크 더 홀', bpm: 118, mel: [['G5', 1], ['F5', .5], ['E5', .5], ['D5', 1], ['C5', 1], ['D5', .5], ['E5', .5], ['F5', .5], ['D5', .5], ['E5', .5], ['D5', .5], ['C5', .5], ['B4', .5], ['C5', 2], ['D5', 1], ['E5', .5], ['F5', .5], ['E5', .5], ['D5', .5], ['C5', 1], ['B4', 1], ['C5', 2]] },
    };
    // 잔잔한 숲 분위기 음악(멜로디 없이 패드 화음 + 가끔 맑은 종)
    const SCAPES = {
      bowl: { name: '숲속 명상', chord: ['G2', 'D3', 'G3', 'B3'], bells: ['G4', 'B4', 'D5', 'G5'], every: [5, 9], wave: 'sine' },
      sunlight: { name: '따뜻한 햇살', chord: ['C3', 'G3', 'C4', 'E4'], bells: ['G4', 'C5', 'E5', 'G5'], every: [4, 7], wave: 'triangle' },
      chime: { name: '바람 풍경 소리', chord: ['D3', 'A3', 'D4'], bells: ['A4', 'D5', 'E5', 'G5', 'A5'], every: [2.5, 5], wave: 'sine' },
    };
    const TRACKS = {};
    Object.keys(CAROLS).forEach((k) => { TRACKS[k] = Object.assign({ kind: 'carol' }, CAROLS[k]); });
    Object.keys(SCAPES).forEach((k) => { TRACKS[k] = Object.assign({ kind: 'scape' }, SCAPES[k]); });

    let ctx, master, wet, verb, on = '', timer = null, nodes = [];
    function makeVerb() {
      // 간단한 임펄스 리버브로 전자음 느낌을 덜어 줘요
      const len = Math.floor(2.6 * ctx.sampleRate), buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      const c = ctx.createConvolver(); c.buffer = buf; return c;
    }
    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
      verb = makeVerb(); wet = ctx.createGain(); wet.gain.value = 0.9; verb.connect(wet); wet.connect(master);
    }
    function dest() { return { dry: master, send: verb }; }
    // 오르골/종 같은 음색: 기음 + 옥타브(여린) 사인, 부드러운 감쇠, 울림 추가
    function bellNote(freq, start, dur, vol, wave) {
      if (!freq) return;
      [[1, vol, wave || 'sine'], [2, vol * 0.3, 'sine']].forEach(([m, v, w]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = w; o.frequency.value = freq * m;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(v, start + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0007, start + dur);
        o.connect(g); g.connect(master); g.connect(verb);
        o.start(start); o.stop(start + dur + 0.05);
      });
    }
    function pad(freqs, gain) {
      // 숨 쉬듯 천천히 커졌다 작아지는 화음
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * (1 + (i % 2 ? 0.003 : -0.002));
        g.gain.value = gain / freqs.length;
        lfo.type = 'sine'; lfo.frequency.value = 0.05 + i * 0.012; lg.gain.value = g.gain.value * 0.6;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master); g.connect(verb);
        o.start(); lfo.start(); nodes.push(o, lfo);
      });
    }
    function playCarol(tr) {
      const beat = 60 / tr.bpm, total = tr.mel.reduce((a, m) => a + m[1], 0);
      function bar() {
        let t = ctx.currentTime + 0.1;
        tr.mel.forEach((m) => { bellNote(m[0] === '-' ? 0 : F[m[0]], t, Math.min(m[1] * beat * 1.4, 2.4), 0.13, 'triangle'); t += m[1] * beat; });
        timer = setTimeout(bar, total * beat * 1000 + 900);
      }
      bar();
    }
    function playScape(tr) {
      pad(tr.chord.map((n) => F[n]), 0.12);
      function ring() {
        const n = tr.bells[Math.floor(Math.random() * tr.bells.length)];
        bellNote(F[n], ctx.currentTime + 0.05, 2.6, 0.08, tr.wave);
        if (Math.random() < 0.3) bellNote(F[tr.bells[Math.floor(Math.random() * tr.bells.length)]], ctx.currentTime + 0.3, 2.2, 0.05, tr.wave);
        const gap = tr.every[0] + Math.random() * (tr.every[1] - tr.every[0]);
        timer = setTimeout(ring, gap * 1000);
      }
      timer = setTimeout(ring, 600);
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
      master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.4);
      const tr = TRACKS[key];
      if (tr.kind === 'scape') playScape(tr); else playCarol(tr);
      return on;
    }
    function stop(silent) {
      clearTimeout(timer); timer = null;
      nodes.forEach((n) => { try { n.stop(); } catch (e) { /* */ } }); nodes = [];
      if (ctx && master && !silent) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
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
  const state = { wishes: [], stars: { count: 0, recent: [] }, flowers: [], mood: [0, 0, 0, 0, 0, 0], links: [], thoughts: [], thanks: [] };
  const seen = new Set();
  // 방금 내가 올렸는데 아직 서버 목록에 안 뜬 염원 (사라짐 방지)
  const myRecent = new Map();
  const seenByServer = new Set(); // 서버가 한 번이라도 돌려준 염원 id
  // 링크·생각도 올린 직후 사라지지 않도록 잠깐 붙잡아 둬요
  const recentPost = { links: new Map(), thoughts: new Map(), thanks: new Map() };
  const seenPost = { links: new Set(), thoughts: new Set(), thanks: new Set() };
  function rememberPost(kind, item) { if (item && item.id) recentPost[kind].set(item.id, { it: item, t: Date.now() }); }
  function mergeRecentPost(kind) {
    const now = Date.now(), rep = reported(), arr = state[kind], seen2 = seenPost[kind];
    arr.forEach((x) => { if (x.id) seen2.add(x.id); });
    recentPost[kind].forEach((v, id) => {
      if (seen2.has(id) || rep[id] || now - v.t > 90000) { recentPost[kind].delete(id); return; }
      if (!arr.some((x) => x.id === id)) arr.unshift(v.it);
    });
  }
  function rememberMine(w) { if (w && w.id) myRecent.set(w.id, { w: w, t: Date.now() }); }
  function mergeMyRecent() {
    const now = Date.now();
    const rep = reported();
    myRecent.forEach((v, id) => {
      // 서버가 이미 아는 글이면(목록에 있었든, 숨김/별이 됐든) 서버 말을 따름
      if (seenByServer.has(id) || rep[id] || now - v.t > 90000) { myRecent.delete(id); return; }
      // 아직 서버 목록에 안 나타난 '막 올린' 글만 잠깐 끼워 넣어요
      if (!state.wishes.some((x) => x.id === id)) state.wishes.unshift(v.w);
    });
  }
  let visitsToday = 0, online = 1, presenceOk = false;
  const normKind = (k) => (k === KIND_LETGO ? KIND_LETGO : KIND_HOPE);
  function normWish(w) {
    if (typeof w === 'string') return { id: '', text: w, kind: KIND_HOPE, empathy: 0, cat: 0, at: 0 };
    return { id: String(w.id || ''), text: String(w.text || w.content || ''), kind: normKind(w.kind), empathy: Number(w.empathy) || 0, cat: clamp(w.cat | 0, 0, 7), at: Number(w.at) || 0 };
  }
  const normFlower = (f) => ({ f: clamp(f.f | 0, 0, 5), x: clamp(+f.x || 0, 0, 100), y: clamp(+f.y || 0, 0, 100) });
  function normLink(l) {
    if (!l || !l.url) return null;
    return { id: String(l.id || ''), url: String(l.url), purpose: clamp(l.purpose | 0, 0, 3),
      level: Number.isInteger(l.level) && l.level >= 0 ? l.level : -1,
      subject: Number.isInteger(l.subject) && l.subject >= 0 ? l.subject : -1,
      topic: String(l.topic || ''), nick: String(l.nick || ''), at: Number(l.at) || 0 };
  }
  function normThought(tt) {
    if (!tt || !tt.text) return null;
    return { id: String(tt.id || ''), text: String(tt.text), url: String(tt.url || ''), nick: String(tt.nick || ''), at: Number(tt.at) || 0 };
  }
  function normThanks(x) {
    if (!x || !x.text) return null;
    return { id: String(x.id || ''), text: String(x.text), nick: String(x.nick || ''), k: clamp(x.k | 0, 0, 2), f: clamp(x.f | 0, 0, 7), emp: Number(x.emp) || 0, at: Number(x.at) || 0 };
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
    state.thoughts = (L.thoughts || []).map(normThought).filter(Boolean);
    state.thanks = (L.thanks || []).map(normThanks).filter(Boolean);
  }
  function saveLocal() {
    store.set('ms_local', { wishes: state.wishes.slice(0, 60), stars: state.stars, flowers: state.flowers.slice(-220), mood: { day: today(), c: state.mood }, links: state.links.slice(0, 60), thoughts: state.thoughts.slice(0, 60), thanks: state.thanks.slice(0, 80) });
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
      ws.forEach((w) => { if (w.id) { seen.add(w.id); seenByServer.add(w.id); } });
      state.wishes = ws;
      const st = d.stars || {};
      state.stars = { count: Number(st.count) || 0, recent: (st.recent || []).map((s) => ({ text: String(s.text || ''), kind: normKind(s.kind) })) };
      if (Array.isArray(d.flowers)) state.flowers = d.flowers.map(normFlower);
      if (Array.isArray(d.mood)) state.mood = d.mood.slice(0, 6).map((n) => Number(n) || 0);
      if (Array.isArray(d.links)) state.links = d.links.map(normLink).filter((x) => x && !rep[x.id]);
      if (Array.isArray(d.thoughts)) state.thoughts = d.thoughts.map(normThought).filter((x) => x && !rep[x.id]);
      if (Array.isArray(d.thanks)) state.thanks = d.thanks.map(normThanks).filter((x) => x && !rep[x.id]);
      visitsToday = Number(d.visitsToday) || visitsToday;
      mergeMyRecent();
      mergeRecentPost('links'); mergeRecentPost('thoughts'); mergeRecentPost('thanks');
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
    if (!$('gardenModal').hidden) { renderGarden(); if (gardenTab === 'all') renderAll(); }
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
    set('garden', mgBloomed() ? '🌸 ' + mgBloomed() + '송이' : mg.plants.length ? '🌱 자라는 중' : '좋은 일 심기'); set('pond', moodPicked() !== null ? MOODS[moodPicked()].ico + ' 오늘' : '오늘 날씨');
    set('rain', '가만히 듣기'); set('stair', '최고 ' + (store.get('ms_stair_best', 0) || 0) + '칸'); set('hill', '별 ' + state.stars.count + '개');
    set('temple', tapToday() ? '탑돌이 ' + tapToday() + '바퀴' : '고요히 쉬기');
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
    if (!layer || season !== 'winter') return;
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
  const MODALS = ['introModal', 'guideModal', 'breathModal', 'beadsModal', 'boardModal', 'wishModal', 'starsModal', 'shopModal', 'gardenModal', 'pondModal', 'rainModal', 'walletModal', 'bookModal', 'mapModal', 'linksModal', 'linkFormModal', 'musicModal', 'seasonModal', 'readingModal', 'templeModal'];
  const ZONE_OF_MODAL = { guideModal: 'plaza', breathModal: 'tree', beadsModal: 'spring', boardModal: 'lantern', starsModal: 'hill', shopModal: 'shop', gardenModal: 'garden', pondModal: 'pond', rainModal: 'rain', linksModal: 'links', readingModal: 'reading', templeModal: 'temple' };
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
    if (id === 'templeModal') stopTemple();
    if (id === 'gardenModal') stopSavor();
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
    else if (id === 'tree') { updateBreathUI(); openModal('breathModal'); setBreathMode('breath'); }
    else if (id === 'spring') openModal('beadsModal');
    else if (id === 'lantern') { renderBoard(); openModal('boardModal'); refreshState(false); }
    else if (id === 'hill') { renderStars(); openModal('starsModal'); }
    else if (id === 'shop') openShop();
    else if (id === 'garden') openGarden();
    else if (id === 'pond') openPond();
    else if (id === 'rain') openModal('rainModal');
    else if (id === 'stair') openStair();
    else if (id === 'links') openLinks();
    else if (id === 'reading') openReading();
    else if (id === 'temple') openTemple();
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
  }

  /* ===================== 매 프레임 ===================== */
  let nearZone = null, nearPerson = null, nearGift = null, lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.08, (now - lastT) / 1000); lastT = now;
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
    $('farMtn').style.transform = `translate3d(${(-cam * 0.12).toFixed(1)}px,0,0)`;
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
    // 가까운 선물 상자
    let ng = null;
    if (!open && !nz) { let gb = 1e9; gifts.forEach((g) => { if (g.got) return; const dx = Math.abs(g.x - me.x); if (dx < NEAR * 0.75 && dx < gb) { gb = dx; ng = g; } }); }
    nearGift = ng;
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
    $('giftBtn').hidden = !(nearGift && !nearZone && !open && $('interact').hidden);
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
      p.worn = (Array.isArray(u.w) ? u.w : (u.c ? [u.c] : [])).map((x) => clamp(x | 0, 0, A.ACC.length - 1)).filter((x) => x >= 1);
      const pet = clamp(u.p | 0, 0, A.PET.length - 1);
      keep.add(u.k);
      let o = others.get(u.k);
      if (!o) {
        o = { el: makePerson(p, false), x: +u.x || 0, d: +u.y || 0, look: '', ev: u.ev, pet: null };
        peopleEl.appendChild(o.el);
        others.set(u.k, o);
      }
      const lk = [p.a, p.b, p.s, p.h, p.hs, p.o, p.ot, p.worn.join('-')].join(',');
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
      a: L.a, b: L.b, s: L.s, h: L.h, hs: L.hs, o: L.o, ot: L.ot, w: L.worn || [], p: L.p, e: me.e, hf: me.hf, ev: me.ev };
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
  // 느린 날숨은 몸의 긴장을 낮춰요. 세 가지 호흡법 중에서 골라요.
  const BREATH_PATS = {
    calm: { desc: '원이 커질 때 들이쉬고, 작아질 때 천천히 내쉬어요.',
      steps: [['들이쉬어요', 'in', 4], ['잠시 멈춰요', 'hold', 2], ['천천히 내쉬어요', 'out', 6]] },
    box: { desc: '네모를 그리듯 넷을 세며 들이쉬고, 멈추고, 내쉬고, 멈춰요.',
      steps: [['들이쉬어요', 'in', 4], ['멈춰요', 'hold', 4], ['내쉬어요', 'out', 4], ['멈춰요', 'rest', 4]] },
    sleep: { desc: '넷 동안 들이쉬고, 일곱 동안 멈추고, 여덟 동안 후— 길게 내쉬어요.',
      steps: [['들이쉬어요', 'in', 4], ['멈춰요', 'hold', 7], ['후— 길게 내쉬어요', 'out', 8]] },
  };
  const BREATH_REPLY = [
    '좋아요. 그 편안함을 기억해 두었다가, 필요할 때 또 와서 숨을 골라요.',
    '괜찮아요. 숨 고르기는 할수록 쉬워져요. 한 번 더 해도 좋고, 빗소리를 들으러 가도 좋아요.',
    '마음이 무거운 날도 있어요. 한 번 더 천천히 쉬어 보고, 그래도 무거우면 믿을 수 있는 어른이나 선생님께 꼭 이야기해요.',
  ];
  let breaths = Number(store.get('ms_breaths', 0)) || 0, breathTimer = null, tickTimer = null, breathRun = 0;
  let breathPat = 'calm', breathGoal = 3;
  function updateBreathUI() { $('breathTotal').textContent = '함께 쉰 숨 ' + breaths + '번'; renderDockSubs(); }
  function renderBreathDots() {
    const box = $('breathDots'); box.textContent = '';
    if (!breathGoal) { box.textContent = breathRun ? breathRun + '번 쉬었어요' : ''; return; }
    for (let i = 0; i < breathGoal; i++) box.appendChild(el('span', 'bdot' + (i < breathRun ? ' on' : '')));
  }
  function startBreath() {
    stopBreath(); breathRun = 0;
    const pat = BREATH_PATS[breathPat];
    $('breathDesc').textContent = pat.desc;
    $('breathDone').hidden = true; $('breathAnswer').hidden = true;
    $('breathDone').querySelectorAll('.bd-pick button').forEach((x) => x.classList.remove('on'));
    const c = $('breathCircle'), w = $('breathWord'), cnt = $('breathCount'), prog = $('breathProg');
    const L = 2 * Math.PI * 92;
    prog.style.strokeDasharray = L.toFixed(1);
    const setProg = (frac, ms) => { prog.style.transition = ms ? `stroke-dashoffset ${ms}ms linear` : 'none'; prog.style.strokeDashoffset = (L * (1 - frac)).toFixed(1); };
    c.style.transitionDuration = '0ms'; c.className = 'breath-circle'; w.textContent = '준비'; cnt.textContent = ''; setProg(0, 0);
    renderBreathDots();
    let i = 0;
    const step = () => {
      const [txt, cls, sec] = pat.steps[i], ms = sec * 1000;
      c.style.transitionDuration = (cls === 'hold' || cls === 'rest' ? 300 : ms) + 'ms';
      c.className = 'breath-circle ' + cls; w.textContent = txt;
      setProg(0, 0); void prog.getBoundingClientRect(); setProg(1, ms);
      let left = sec; cnt.textContent = left;
      clearInterval(tickTimer);
      tickTimer = setInterval(() => { left--; cnt.textContent = left > 0 ? left : ''; }, 1000);
      breathTimer = setTimeout(() => {
        clearInterval(tickTimer);
        i = (i + 1) % pat.steps.length;
        if (i === 0) {
          breaths++; breathRun++; store.set('ms_breaths', breaths); updateBreathUI(); Sound.chime(true);
          if (breathRun % 3 === 0) earn('breath');
          renderBreathDots();
          if (breathGoal && breathRun >= breathGoal) { finishBreath(); return; }
        }
        step();
      }, ms);
    };
    breathTimer = setTimeout(step, 900);
  }
  function finishBreath() {
    stopBreath();
    const c = $('breathCircle');
    c.style.transitionDuration = '1200ms'; c.className = 'breath-circle';
    $('breathWord').textContent = '다 쉬었어요'; $('breathCount').textContent = '';
    $('breathDone').hidden = false;
  }
  function stopBreath() { clearTimeout(breathTimer); clearInterval(tickTimer); breathTimer = null; tickTimer = null; }
  document.querySelectorAll('#breathPat button').forEach((b) => b.addEventListener('click', () => {
    breathPat = b.dataset.p;
    document.querySelectorAll('#breathPat button').forEach((x) => x.classList.toggle('on', x === b));
    startBreath();
  }));
  document.querySelectorAll('#breathLen button').forEach((b) => b.addEventListener('click', () => {
    breathGoal = Number(b.dataset.n) || 0;
    document.querySelectorAll('#breathLen button').forEach((x) => x.classList.toggle('on', x === b));
    startBreath();
  }));
  $('breathDone').querySelectorAll('.bd-pick button').forEach((b) => b.addEventListener('click', () => {
    $('breathDone').querySelectorAll('.bd-pick button').forEach((x) => x.classList.toggle('on', x === b));
    const a = $('breathAnswer'); a.textContent = BREATH_REPLY[Number(b.dataset.f)]; a.hidden = false;
  }));
  $('breathAgain').addEventListener('click', startBreath);

  /* ----- 지금 여기: 5·4·3·2·1 감각 그라운딩 ----- */
  // 감각에 하나씩 주의를 옮기면 불안·긴장이 가라앉아요(그라운딩).
  const GROUND = [
    { ico: '👀', n: 5, p: '지금 <b>보이는 것 5가지</b>를 천천히 둘러보며 찾아봐요.' },
    { ico: '✋', n: 4, p: '몸에 <b>닿는 느낌 4가지</b>를 느껴봐요. (의자, 바닥, 옷, 바람…)' },
    { ico: '👂', n: 3, p: '들리는 <b>소리 3가지</b>에 가만히 귀 기울여요.' },
    { ico: '👃', n: 2, p: '맡을 수 있는 <b>냄새 2가지</b>를 떠올려 봐요.' },
    { ico: '👅', n: 1, p: '입안의 맛, 또는 좋아하는 <b>맛 1가지</b>를 떠올려요.' },
  ];
  let grStep = 0, grLeft = 0;
  function renderGroundSteps() {
    const box = $('grSteps'); box.textContent = '';
    GROUND.forEach((g, i) => {
      const d = el('span', 'gr-step' + (i < grStep ? ' done' : i === grStep ? ' now' : ''), g.ico);
      box.appendChild(d);
    });
  }
  function showGroundStep() {
    const g = GROUND[grStep]; grLeft = g.n;
    $('grIco').textContent = g.ico;
    $('grPrompt').innerHTML = g.p;
    $('grDone').hidden = true; $('grFound').hidden = false; $('grPrompt').hidden = false; $('grIco').hidden = false; $('grDots').hidden = false;
    renderGroundDots(); renderGroundSteps();
    $('grFound').textContent = '하나 찾았어요  (남은 ' + grLeft + '개)';
  }
  function renderGroundDots() {
    const box = $('grDots'); box.textContent = '';
    const g = GROUND[grStep];
    for (let i = 0; i < g.n; i++) box.appendChild(el('span', 'gr-dot' + (i < g.n - grLeft ? ' on' : '')));
  }
  function startGround() { grStep = 0; showGroundStep(); }
  $('grFound').addEventListener('click', () => {
    if (grLeft > 0) grLeft--;
    renderGroundDots();
    Sound.tok();
    if (grLeft <= 0) {
      $('grFound').textContent = '좋아요 🌿';
      setTimeout(() => {
        grStep++;
        if (grStep >= GROUND.length) finishGround();
        else showGroundStep();
      }, 650);
    } else {
      $('grFound').textContent = '하나 찾았어요  (남은 ' + grLeft + '개)';
    }
  });
  function finishGround() {
    $('grIco').hidden = true; $('grPrompt').hidden = true; $('grDots').hidden = true; $('grFound').hidden = true;
    renderGroundSteps();
    $('grDone').hidden = false;
    Sound.bell(); earn('ground');
  }
  $('grAgain').addEventListener('click', startGround);
  function setBreathMode(m) {
    document.querySelectorAll('#breathMode button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    $('breathMain').hidden = m !== 'breath';
    $('groundMain').hidden = m !== 'ground';
    if (m === 'breath') startBreath(); else { stopBreath(); startGround(); }
  }
  document.querySelectorAll('#breathMode button').forEach((b) => b.addEventListener('click', () => setBreathMode(b.dataset.m)));


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
  const ALTAR_WORDS = ['마음을 담아 천천히 한 줄을 적어요.', '종을 울리고 잠시 눈을 감아 보세요.', '내가 보낸 다정함은 나에게 돌아와요.', '오늘 하루도 애썼어요. 깊게 숨을 쉬어요.', '작은 바람도 소중한 마음이에요.'];
  let bellBusy = false;
  function ringBell() {
    if (bellBusy) return; bellBusy = true;
    Sound.bell();
    const altar = document.querySelector('.altar');
    if (altar) {
      for (let i = 0; i < 3; i++) { const r = el('span', 'bell-ripple'); r.style.animationDelay = (i * 0.25) + 's'; altar.appendChild(r); setTimeout(() => r.remove(), 2200); }
    }
    $('altarWord').textContent = ['댕——', '마음이 한결 맑아졌어요.', '좋아요. 천천히 숨을 쉬어요.'][randInt(3)];
    const got = earn('bell');
    setTimeout(() => { $('altarWord').textContent = ALTAR_WORDS[randInt(ALTAR_WORDS.length)]; }, 2600);
    setTimeout(() => { bellBusy = false; }, 1400);
  }
  if ($('bellBtn')) $('bellBtn').addEventListener('click', (e) => { e.currentTarget.blur(); ringBell(); });
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
    const ct = catOf(w.cat);
    const t = el('div', 'wtext'); t.innerHTML = `<span class="wcat">${ct.ico} ${ct.name}</span>`;
    t.append((w.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + w.text);
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
    const ct = catOf(m.cat || 0);
    const t = el('div', 'wtext'); t.innerHTML = `<span class="wcat">${ct.ico} ${ct.name}</span>`;
    t.append((m.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + m.text);
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
  let catFilter = -1;
  function renderCatFilter() {
    const bar = $('catFilter');
    bar.hidden = boardTab !== 'all';
    if (boardTab !== 'all') return;
    bar.textContent = '';
    const mk = (label, v) => {
      const b = el('button', 'cat-chip' + (v === catFilter ? ' on' : ''), label); b.type = 'button';
      b.addEventListener('click', () => { catFilter = v; renderBoard(); });
      bar.appendChild(b);
    };
    mk('전체', -1);
    WISH_CATS.forEach((c, i) => { if (state.wishes.some((w) => w.cat === i)) mk(c.ico + c.name, i); });
  }
  function renderBoard() {
    renderCatFilter();
    const list = $('boardList');
    list.textContent = '';
    const mine = getMine();
    const mineIds = new Set(mine.map((m) => m.id).filter(Boolean));
    if (boardTab === 'all') {
      const shown = state.wishes.filter((w) => catFilter < 0 || w.cat === catFilter);
      if (!shown.length) list.appendChild(emptyEl(state.wishes.length ? '이 분류의 마음은 아직 없어요.' : '아직 떠 있는 등불이 없어요.<br>첫 마음을 올려 보세요.'));
      shown.forEach((w) => list.appendChild(wishCard(w, !sheetMode || (w.id && mineIds.has(w.id)))));
      $('boardCount').textContent = state.wishes.length ? '떠 있는 마음 ' + state.wishes.length + '개' : '';
    } else {
      if (!mine.length) list.appendChild(emptyEl('아직 올린 마음이 없어요.<br>[＋ 마음 올리기]를 눌러 보세요.'));
      // 숨김·검토중·별은 상태 카드로 (아직 새로고침 전이라 목록에 남아 있어도 상태를 먼저 따름)
      mine.forEach((m) => list.appendChild(mineCard(m, (!m.status || m.status === 'public') ? state.wishes.find((w) => w.id && w.id === m.id) : null)));
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
  let wishCat = 0;
  function renderCatPick() {
    const box = $('catPick'); box.textContent = '';
    WISH_CATS.forEach((c, i) => {
      const b = el('button', 'cat-opt' + (i === wishCat ? ' on' : ''), `<span>${c.ico}</span>${c.name}`); b.type = 'button';
      b.addEventListener('click', () => { wishCat = i; renderCatPick(); });
      box.appendChild(b);
    });
  }
  function openWrite(kind) {
    $('wishMsg').textContent = ''; $('wishMsg').className = 'modal-msg';
    $('wishInput').value = ''; $('charCount').textContent = '0 / 100';
    wishCat = 0; renderCatPick();
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
    const kind = wishKind, cat = wishCat;
    $('wishSubmit').disabled = true; $('loading').hidden = false;
    try {
      let r;
      if (sheetMode) {
        try { r = await sheetPost({ type: 'wish', content: text, sessionId: sid, kind, cat }); }
        catch (e) { r = { ok: false, reason: '연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.' }; }
      } else {
        await delay(600);
        const id = 'L' + Date.now();
        state.wishes.unshift({ id, text, kind, empathy: 0, cat, at: Date.now() });
        saveLocal();
        r = { ok: true, id, kind };
      }
      if (!r || !r.ok) return showMsg((r && r.reason) || '조금 더 따뜻한 말로 적어 주세요.', 'err');
      store.set('ms_last_wish', Date.now());
      const mine = getMine();
      mine.unshift({ id: r.id || '', text, kind, cat, at: Date.now(), status: r.pending ? 'pending' : 'public' });
      store.set('ms_mine', mine.slice(0, 50));
      if (sheetMode && !r.pending && r.id) { const nw = { id: r.id, text, kind, empathy: 0, cat, at: Date.now() }; state.wishes.unshift(nw); seen.add(r.id); rememberMine(nw); }
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
  function previewWith(accId) {
    // 미리보기: 이 장식을 함께 착용했을 때의 모습
    const slots = Object.assign({}, wallet.wornSlots);
    if (accId) slots[A.ACC_SLOT[accId]] = accId;
    return Object.assign(look(), { worn: Object.keys(slots).map((k) => slots[k] | 0).filter((x) => x >= 1) });
  }
  function renderShop() {
    renderCoins();
    renderShopPreview();
    const grid = $('shopGrid'); grid.textContent = '';
    const list = shopTab === 'acc' ? A.ACC : A.PET;
    const owned = wallet.owned[shopTab];
    list.forEach((it) => {
      if (it.id === 0) return;
      const has = owned.indexOf(it.id) >= 0;
      const wearing = shopTab === 'acc' ? isWorn(it.id) : wallet.p === it.id;
      const card = el('div', 'item' + (wearing ? ' on' : ''));
      const thumb = shopTab === 'acc'
        ? A.person(Object.assign(look(), { worn: [it.id] }))
        : petThumb(it.id);
      card.innerHTML = `<div class="thumb">${thumb}</div><div class="iname">${it.name}</div>`;
      const b = el('button'); b.type = 'button';
      if (wearing) { b.textContent = '벗기'; b.className = 'wear'; }
      else if (has) { b.textContent = '착용'; b.className = 'wear'; }
      else { b.textContent = '🪙 ' + it.price; b.className = 'buy'; b.disabled = wallet.coins < it.price; }
      b.addEventListener('click', () => shopAction(it, has, wearing));
      card.appendChild(b);
      card.addEventListener('pointerenter', () => { if (!isTouch) $('shopPreview').innerHTML = previewHTML(shopTab === 'acc' ? previewWith(it.id) : Object.assign(look(), { p: it.id })); });
      card.addEventListener('pointerleave', () => { if (!isTouch) renderShopPreview(); });
      grid.appendChild(card);
    });
  }
  function previewHTML(L) { return A.person(L) + (L.p ? `<div class="pv-pet">${A.ANIMAL[A.PET_ART[L.p]].svg}</div>` : ''); }
  function renderShopPreview() { $('shopPreview').innerHTML = previewHTML(look()); }
  function shopAction(it, has, wearing) {
    if (shopTab === 'pet') {
      if (wearing) wallet.p = 0;
      else if (has) wallet.p = it.id;
      else { if (!spend(it.price)) { $('shopTalk').textContent = '동전이 조금 모자라요. 쉼터를 돌며 모아 와요!'; return; } wallet.owned.pet.push(it.id); wallet.p = it.id; $('shopTalk').textContent = it.name + ' 친구가 생겼어요!'; Sound.chime(true); sparkle(); }
    } else {
      const slot = A.ACC_SLOT[it.id];
      if (wearing) { delete wallet.wornSlots[slot]; }
      else if (has) { wallet.wornSlots[slot] = it.id; }
      else {
        if (!spend(it.price)) { $('shopTalk').textContent = '동전이 조금 모자라요. 쉼터를 돌며 모아 와요!'; return; }
        wallet.owned.acc.push(it.id); wallet.wornSlots[slot] = it.id;
        $('shopTalk').textContent = it.name + '! 여러 개를 함께 꾸밀 수 있어요.';
        Sound.chime(true); sparkle();
      }
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
    A.FLOWERS.slice(0, 6).forEach((f, i) => {
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
    if (gardenTab === 'shared') $('gardenCount').textContent = '함께 심은 꽃 ' + state.flowers.length + '송이';
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

  /* ===================== 나의 마음 정원 ===================== */
  // 세 가지 좋은 일(감사·음미·스스로 칭찬)을 씨앗으로 심고, 날마다 물을 주며 키워요.
  const MG_KINDS = [
    { ico: '🙏', name: '고마운 일', ph: '예) 친구가 지우개를 빌려줘서 고마웠어요.' },
    { ico: '✨', name: '좋았던 순간', ph: '예) 점심시간에 하늘이 정말 파랬어요.' },
    { ico: '💪', name: '내가 잘한 일', ph: '예) 어려운 문제를 포기하지 않고 끝까지 풀었어요.' },
  ];
  const MG_DAILY = 3, MG_PAGE = 12, MG_MAX = 240;
  const STAGE_NAME = ['🌰 씨앗', '🌱 새싹', '🌷 꽃봉오리', '🌸 활짝 핀 꽃'];
  const STAGE_NEXT = ['싹이 터요', '꽃봉오리가 맺혀요', '꽃이 피어요'];
  let gardenTab = 'mine', mgPage = 0, mgKind = 0, mgSeed = 0, mgSel = null, savorTimer = null, mgDiaryKind = -1;
  function saveMg() { store.set('ms_garden', mg); }
  const mgYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
  function mgTodayCount() { return mg.plants.filter((p) => p.day === today()).length; }
  function mgBloomed() { return mg.plants.filter((p) => p.g >= 3).length; }
  function mgStreak() { return mg.lastWater === today() || mg.lastWater === mgYesterday() ? mg.streak | 0 : 0; }
  function mgPages() { return Math.max(1, Math.ceil((mg.plants.length + 1) / MG_PAGE)); }
  function fmtDay(d) { const [, m, dd] = String(d).split('-'); const t = new Date(+String(d).split('-')[0], m - 1, +dd); return m + '월 ' + dd + '일 (' + DAY_NAMES[t.getDay()] + ')'; }
  function stageLine(p) {
    if (p.g >= 3) return STAGE_NAME[3] + ' — 좋은 기억이 꽃이 되었어요.';
    return STAGE_NAME[p.g] + ' — ' + (mg.lastWater === today() ? '내일' : '오늘') + ' 물을 주면 ' + STAGE_NEXT[p.g] + '.';
  }

  function renderMine(fresh) {
    fresh = fresh || [];
    mgPage = clamp(mgPage, 0, mgPages() - 1);
    const grid = $('mgGrid'); grid.textContent = '';
    const start = mgPage * MG_PAGE, page = mg.plants.slice(start, start + MG_PAGE);
    const isLast = mgPage === mgPages() - 1;
    for (let i = 0; i < MG_PAGE; i++) {
      const p = page[i];
      if (p) {
        const b = el('button', 'gpatch st' + p.g + (fresh.includes(p.id) ? ' fresh' : ''), A.plant(p.f, p.g) + (p.g >= 3 ? '<span class="gp-glow"></span>' : ''));
        b.type = 'button'; b.style.setProperty('--d', (-(i % 5) * 0.7) + 's');
        b.setAttribute('aria-label', STAGE_NAME[p.g] + ': ' + p.note);
        b.addEventListener('click', () => openView(p.id));
        grid.appendChild(b);
      } else if (isLast) {
        const left = MG_DAILY - mgTodayCount(), k = i - page.length; // k: 빈 칸 순서
        let b;
        if (left <= 0 && k === 0) b = el('button', 'gpatch empty rest', '<span class="gp-lbl">내일<br>또 심어요</span>');
        else if (k < left) { b = el('button', 'gpatch empty', '<span class="gp-plus">＋</span><span class="gp-lbl">심기</span>'); b.addEventListener('click', () => openForm()); }
        else { b = el('div', 'gpatch blank'); b.setAttribute('aria-hidden', 'true'); }
        if (b.tagName === 'BUTTON') b.type = 'button';
        grid.appendChild(b);
      }
    }
    // 핀 꽃이 있으면 나비가 놀러 와요
    const blooms = page.filter((p) => p.g >= 3).length, flies = $('mgFlies');
    flies.textContent = '';
    for (let i = 0; i < Math.min(3, Math.ceil(blooms / 3)); i++) {
      const f = el('div', 'mg-fly', A.BUTTERFLY); f.style.animationDelay = (-i * 3.3) + 's'; f.style.top = (12 + i * 26) + '%'; flies.appendChild(f);
    }
    $('mgBox').dataset.season = season;
    const watered = mg.lastWater === today();
    const w = $('mgWater'); w.disabled = watered; w.textContent = watered ? '💧 오늘 물을 줬어요' : '💧 오늘 물 주기';
    $('mgToday').textContent = '오늘 심은 좋은 일 ' + mgTodayCount() + '/' + MG_DAILY;
    const st = mgStreak(); $('mgStreak').textContent = st >= 2 ? '🌿 ' + st + '일째 돌보는 중' : '';
    const multi = mgPages() > 1;
    $('mgPager').hidden = !multi;
    if (multi) { $('mgPageLabel').textContent = (mgPage + 1) + ' / ' + mgPages() + ' 정원'; $('mgPrev').disabled = mgPage <= 0; $('mgNext').disabled = isLast; }
    if (gardenTab === 'mine') $('gardenCount').textContent = '피운 꽃 ' + mgBloomed() + '송이 · 자라는 중 ' + (mg.plants.length - mgBloomed());
  }
  $('mgPrev').addEventListener('click', () => { mgPage--; renderMine(); });
  $('mgNext').addEventListener('click', () => { mgPage++; renderMine(); });

  function waterGarden() {
    if (mg.lastWater === today()) { toast('오늘은 이미 물을 줬어요. 내일 또 와요 💧'); return; }
    if (!mg.plants.some((p) => p.g < 3)) { toast('물을 줄 씨앗이 없어요. 먼저 좋은 일을 한 줄 심어 봐요 🌰'); openForm(); return; }
    mg.streak = mg.lastWater === mgYesterday() ? (mg.streak | 0) + 1 : 1;
    mg.lastWater = today();
    const grew = [];
    let bloomed = 0;
    mg.plants.forEach((p) => { if (p.g < 3 && p.lg !== today()) { p.g++; p.lg = today(); grew.push(p.id); if (p.g === 3) bloomed++; } });
    saveMg(); earn('water');
    const rain = $('mgRain'); rain.textContent = '';
    for (let i = 0; i < 26; i++) { const d = el('span', 'mg-drop'); d.style.left = rand(2, 98) + '%'; d.style.animationDelay = rand(0, 0.7).toFixed(2) + 's'; rain.appendChild(d); }
    Sound.chime(true);
    setTimeout(() => {
      rain.textContent = '';
      renderMine(grew); renderDockSubs();
      toast(bloomed ? '🌸 ' + bloomed + '송이가 활짝 피었어요! 눌러서 그때를 떠올려 봐요.' : '💧 모두 한 뼘씩 자랐어요. 내일 또 만나요.', 3200);
      if (bloomed) Sound.bell();
    }, 1100);
  }
  $('mgWater').addEventListener('click', waterGarden);

  function renderMgKinds() {
    const box = $('mgKinds'); box.textContent = '';
    MG_KINDS.forEach((k, i) => {
      const b = el('button', 'mf-chip' + (i === mgKind ? ' on' : ''), k.ico + ' ' + k.name); b.type = 'button';
      b.addEventListener('click', () => { mgKind = i; renderMgKinds(); });
      box.appendChild(b);
    });
    $('mgNote').placeholder = MG_KINDS[mgKind].ph;
  }
  (function buildMgSeeds() {
    const row = $('mgSeeds');
    A.FLOWERS.forEach((f, i) => {
      const b = el('button', 'seed' + (i === 0 ? ' on' : ''), A.flower(i) + f.name); b.type = 'button';
      b.addEventListener('click', () => { mgSeed = i; row.querySelectorAll('.seed').forEach((x, j) => x.classList.toggle('on', j === i)); });
      row.appendChild(b);
    });
  })();
  function openForm(kind) {
    if (mgTodayCount() >= MG_DAILY) { toast('오늘은 좋은 일 세 가지를 모두 심었어요. 내일 또 심어요 🌱'); return; }
    if (gardenTab !== 'mine') setGardenTab('mine');
    if (Number.isInteger(kind)) mgKind = kind;
    $('mgView').hidden = true; stopSavor();
    renderMgKinds();
    $('mgNote').value = ''; $('mgHint').textContent = '';
    $('mgPublic').checked = store.get('ms_mgpublic', true) !== false; renderPrivNote();
    $('mgForm').hidden = false;
    $('mgForm').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (!isTouch) setTimeout(() => $('mgNote').focus(), 50);
  }
  $('mgCancel').addEventListener('click', () => { $('mgForm').hidden = true; });
  function renderPrivNote() {
    const pub = $('mgPublic').checked;
    $('mgPrivNote').innerHTML = pub
      ? '🌼 <b>' + esc(nameOf(profile || { a: 0, b: 0 })) + '</b>(이)라는 별명으로 모두에게 보여요. 고운 말로 적어요.'
      : '🔒 나만 볼 수 있어요. 이 기기에만 저장돼요.';
  }
  $('mgPublic').addEventListener('change', () => { store.set('ms_mgpublic', $('mgPublic').checked); renderPrivNote(); });
  const myThanks = () => store.get('ms_mythanks', []) || [];
  function rememberMyThanks(id) { const m = myThanks(); m.unshift(id); store.set('ms_mythanks', m.slice(0, 200)); }
  // 좋은 일을 모두의 정원(시트)에 올려요. 성공하면 { ok, id }, 실패하면 { ok:false, reason, net }
  async function publishThanks(p) {
    const chk = window.Filter ? window.Filter.check(p.note) : { ok: true };
    if (!chk.ok) return { ok: false, reason: chk.reason };
    const pf = profile || { a: 0, b: 0 };
    let r;
    if (sheetMode) {
      try { r = await sheetPost({ type: 'thanks', sessionId: sid, content: p.note, k: p.k, f: p.f, na: pf.a, nb: pf.b }); }
      catch (e) { return { ok: false, net: true, reason: '연결이 원활하지 않아요.' }; }
      if (!r || !r.ok) return { ok: false, reason: (r && r.reason) || '나누지 못했어요.' };
    } else r = { ok: true, id: 'T' + Date.now().toString(36) };
    p.sid = r.id; p.pend = !!r.pending;
    rememberMyThanks(r.id);
    if (!r.pending) {
      const item = normThanks({ id: r.id, text: p.note, nick: nameOf(pf), k: p.k, f: p.f, emp: 0, at: Date.now() });
      state.thanks.unshift(item); rememberPost('thanks', item);
      if (!sheetMode) saveLocal();
    }
    return r;
  }
  $('mgPlant').addEventListener('click', async () => {
    const note = $('mgNote').value.replace(/\s+/g, ' ').trim();
    if (note.length < 2) { $('mgHint').textContent = '좋았던 일을 짧게 한 줄만 적어 주세요.'; return; }
    if (mgTodayCount() >= MG_DAILY) { $('mgForm').hidden = true; renderMine(); return; }
    const pub = $('mgPublic').checked;
    const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), f: mgSeed, k: mgKind, note: note.slice(0, 60), day: today(), at: Date.now(), g: 0, lg: '', sh: false };
    let shareMsg = '';
    if (pub) {
      const btn = $('mgPlant'); btn.disabled = true;
      let r;
      try { r = await publishThanks(p); } finally { btn.disabled = false; }
      if (!r.ok && !r.net) { $('mgHint').textContent = r.reason; return; } // 말을 고쳐서 다시
      shareMsg = r.ok ? (r.pending ? ' 선생님이 확인하면 모두의 정원에 보여요.' : ' 모두의 정원에도 피었어요 🌼') : ' (연결이 원활하지 않아 나만 보기로 심었어요)';
    }
    mg.plants.push(p);
    while (mg.plants.length > MG_MAX) mg.plants.shift();
    saveMg(); earn('thanks');
    $('mgForm').hidden = true;
    mgPage = mgPages() - 1;
    renderMine([p.id]); renderDockSubs(); Sound.chime(true);
    toast('🌰 씨앗을 심었어요.' + shareMsg, 3200);
  });

  function openView(id) {
    const p = mg.plants.find((x) => x.id === id); if (!p) return;
    mgSel = id; stopSavor();
    $('mgForm').hidden = true;
    $('mvArt').innerHTML = A.plant(p.f, p.g);
    const k = MG_KINDS[clamp(p.k | 0, 0, 2)];
    $('mvKind').textContent = k.ico + ' ' + k.name; $('mvDate').textContent = fmtDay(p.day);
    $('mvNote').textContent = p.note;
    $('mvStage').textContent = stageLine(p);
    $('mvSavorBtn').hidden = p.g < 3;
    $('mvShare').hidden = p.g < 3 || p.sh;
    $('mvPublish').hidden = !!p.sid; $('mvUnpublish').hidden = !p.sid;
    $('mvStage').textContent = stageLine(p) + (p.sid ? (p.pend ? ' · 🌼 선생님 확인 중' : ' · 🌼 모두의 정원에 나눴어요') : '');
    const rm = $('mvRemove'); rm.textContent = '뽑기'; rm.classList.remove('sure');
    $('mgView').hidden = false;
    $('mgView').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function stopSavor() { clearTimeout(savorTimer); savorTimer = null; const s = $('mvSavor'); if (s) s.hidden = true; }
  $('mvSavorBtn').addEventListener('click', () => {
    stopSavor();
    const box = $('mvSavor'), bar = $('mvSavorBar'), txt = $('mvSavorText');
    txt.textContent = '그 순간을 10초만 다시 떠올려 봐요. 어디였는지, 누가 있었는지, 어떤 기분이었는지…';
    box.hidden = false;
    bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
    bar.style.transition = 'width 10s linear'; bar.style.width = '0%';
    savorTimer = setTimeout(() => { txt.textContent = '좋은 기억이 마음에 한 번 더 피었어요 🌸'; Sound.chime(true); }, 10000);
  });
  $('mvShare').addEventListener('click', async () => {
    const p = mg.plants.find((x) => x.id === mgSel); if (!p || p.sh) return;
    const f = p.f < 6 ? p.f : (p.f === 6 ? 4 : 0);
    const x = randInt(101), y = randInt(101);
    p.sh = true; saveMg(); $('mvShare').hidden = true;
    const fl = { f, x, y };
    state.flowers.push(fl); renderGardenBed();
    if (!sheetMode) { saveLocal(); toast('함께 꽃밭에 한 송이를 나눴어요. 누군가에게 작은 힘이 될 거예요 🌷', 3000); return; }
    try {
      const r = await sheetPost({ type: 'flower', sessionId: sid, f, x, y });
      if (!r || !r.ok) throw new Error((r && r.reason) || '');
      toast('함께 꽃밭에 한 송이를 나눴어요. 누군가에게 작은 힘이 될 거예요 🌷', 3000);
    } catch (e) {
      state.flowers = state.flowers.filter((z) => z !== fl); renderGardenBed();
      p.sh = false; saveMg(); $('mvShare').hidden = false;
      toast((e && e.message) || '지금은 나누지 못했어요. 잠시 뒤에 다시 해 봐요.');
    }
  });
  async function unpublish(p) {
    const id = p.sid; if (!id) return true;
    if (sheetMode) {
      try { const r = await sheetPost({ type: 'thanksdel', id, sessionId: sid }); if (!r || !r.ok) { toast((r && r.reason) || '지금은 내리지 못했어요.'); return false; } }
      catch (e) { toast('연결이 원활하지 않아요. 잠시 뒤에 다시 해 봐요.'); return false; }
    }
    state.thanks = state.thanks.filter((x) => x.id !== id); recentPost.thanks.delete(id);
    if (!sheetMode) saveLocal();
    p.sid = ''; p.pend = false; saveMg();
    return true;
  }
  $('mvPublish').addEventListener('click', async () => {
    const p = mg.plants.find((x) => x.id === mgSel); if (!p || p.sid) return;
    const b = $('mvPublish'); b.disabled = true;
    let r; try { r = await publishThanks(p); } finally { b.disabled = false; }
    if (!r.ok) { toast(r.reason); return; }
    saveMg(); openView(p.id);
    toast(r.pending ? '나눴어요. 선생님이 확인하면 모두의 정원에 보여요.' : '🌼 모두의 정원에 나눴어요.');
  });
  $('mvUnpublish').addEventListener('click', async () => {
    const p = mg.plants.find((x) => x.id === mgSel); if (!p) return;
    if (await unpublish(p)) { openView(p.id); toast('모두의 정원에서 내렸어요. 내 정원에는 그대로 있어요.'); }
  });
  $('mvRemove').addEventListener('click', async () => {
    const b = $('mvRemove');
    if (!b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = '정말 뽑을까요?'; return; }
    const p = mg.plants.find((x) => x.id === mgSel);
    if (p && p.sid && !(await unpublish(p))) return;
    mg.plants = mg.plants.filter((x) => x.id !== mgSel); saveMg();
    $('mgView').hidden = true; mgSel = null;
    renderMine(); renderDockSubs();
  });
  $('mvClose').addEventListener('click', () => { $('mgView').hidden = true; stopSavor(); });

  function renderDiary() {
    const all = mg.plants.slice().sort((a, b) => (b.at || 0) - (a.at || 0));
    const weekAgo = Date.now() - 7 * 864e5;
    const stats = [['심은 좋은 일', all.length], ['피운 꽃', mgBloomed()], ['이번 주', all.filter((p) => (p.at || 0) >= weekAgo).length], ['돌본 날', mgStreak() ? mgStreak() + '일째' : '-']];
    $('gdStats').innerHTML = stats.map(([k, v]) => `<div class="gd-stat"><b>${v}</b><span>${k}</span></div>`).join('');
    const list = $('gdList'); list.textContent = '';
    const filt = el('div', 'mf-chips gd-filter');
    [[-1, '전체']].concat(MG_KINDS.map((k, i) => [i, k.ico + ' ' + k.name])).forEach(([i, name]) => {
      const b = el('button', 'mf-chip' + (i === mgDiaryKind ? ' on' : ''), name); b.type = 'button';
      b.addEventListener('click', () => { mgDiaryKind = i; renderDiary(); });
      filt.appendChild(b);
    });
    list.appendChild(filt);
    const shown = all.filter((p) => mgDiaryKind < 0 || (p.k | 0) === mgDiaryKind);
    if (!shown.length) { list.appendChild(el('p', 'read-empty', all.length ? '이 갈래에는 아직 심은 일이 없어요.' : '아직 심은 좋은 일이 없어요.<br>나의 정원에서 오늘 좋았던 일 한 줄을 심어 볼까요?')); return; }
    let lastDay = '';
    shown.forEach((p) => {
      if (p.day !== lastDay) { lastDay = p.day; list.appendChild(el('p', 'gd-day', fmtDay(p.day))); }
      const k = MG_KINDS[clamp(p.k | 0, 0, 2)];
      const it = el('button', 'gd-item');
      it.type = 'button';
      it.innerHTML = `<span class="gd-art">${A.plant(p.f, p.g)}</span><span class="gd-txt"><small>${k.ico} ${k.name} · ${STAGE_NAME[p.g]}${p.sid ? ' · 🌼 나눔' : ''}</small></span>`;
      const t = el('span', 'gd-note'); t.textContent = p.note; it.querySelector('.gd-txt').appendChild(t);
      it.addEventListener('click', () => { setGardenTab('mine'); const idx = mg.plants.indexOf(p); mgPage = Math.floor(idx / MG_PAGE); renderMine(); openView(p.id); });
      list.appendChild(it);
    });
  }

  /* ----- 모두의 정원 ----- */
  let gaKind = -1;
  const thxHearted = () => store.get('ms_thx_heart', {}) || {};
  function thanksCard(x) {
    const mine = myThanks().includes(x.id);
    const k = MG_KINDS[x.k] || MG_KINDS[0];
    const c = el('div', 'ga-card' + (mine ? ' mine' : ''));
    c.innerHTML = `<div class="ga-art">${A.flower(x.f)}</div><div class="ga-body"><p class="ga-kind">${k.ico} ${k.name}</p><p class="ga-text"></p><p class="ga-meta"></p></div>`;
    c.querySelector('.ga-text').textContent = x.text;
    c.querySelector('.ga-meta').textContent = (mine ? '🌱 내가 심은 글 · ' : '') + (x.nick || '숲 친구') + ' · ' + timeAgo(x.at);
    const act = el('div', 'ga-act');
    const hearted = !!thxHearted()[x.id];
    const h = el('button', 'ga-heart' + (hearted ? ' on' : '') + (mine ? ' self' : ''), (hearted ? '💗' : '🤍') + ' <b>' + x.emp + '</b>');
    h.type = 'button'; h.setAttribute('aria-label', '마음 보내기');
    if (mine || hearted) h.disabled = true;
    h.addEventListener('click', () => heartThanks(x, h));
    act.appendChild(h);
    if (!mine) {
      const f = el('button', 'flag', '🚩'); f.type = 'button'; f.title = '불편한 글 알리기';
      f.addEventListener('click', () => askThanksReport(c, x));
      act.appendChild(f);
    }
    c.appendChild(act);
    return c;
  }
  function renderAll() {
    const filt = $('gaFilter'); filt.textContent = '';
    [[-1, '전체']].concat(MG_KINDS.map((k, i) => [i, k.ico + ' ' + k.name])).forEach(([i, name]) => {
      const b = el('button', 'mf-chip' + (i === gaKind ? ' on' : ''), name); b.type = 'button';
      b.addEventListener('click', () => { gaKind = i; renderAll(); });
      filt.appendChild(b);
    });
    const list = $('gaList'); list.textContent = '';
    const rep = reported();
    const shown = state.thanks.filter((x) => !rep[x.id] && (gaKind < 0 || x.k === gaKind));
    if (!shown.length) {
      list.appendChild(el('p', 'read-empty', state.thanks.length ? '이 갈래에는 아직 글이 없어요.' : '아직 모두의 정원이 비어 있어요.<br>나의 정원에서 좋은 일을 심고 함께 나눠 볼까요?'));
      return;
    }
    shown.forEach((x) => list.appendChild(thanksCard(x)));
    if (gardenTab === 'all') $('gardenCount').textContent = '모두가 심은 좋은 일 ' + state.thanks.length + '개';
  }
  async function heartThanks(x, btn) {
    const hs = thxHearted(); if (hs[x.id]) return;
    hs[x.id] = Date.now(); store.set('ms_thx_heart', hs);
    x.emp++; btn.classList.add('on', 'pop'); btn.disabled = true; btn.innerHTML = '💗 <b>' + x.emp + '</b>';
    earn('emp'); Sound.tok();
    if (!sheetMode) { saveLocal(); return; }
    try {
      const r = await sheetPost({ type: 'thanksemp', id: x.id, sessionId: sid });
      if (r && r.ok) { x.emp = r.emp; btn.querySelector('b').textContent = x.emp; }
      else if (!(r && r.already)) { toast((r && r.reason) || '마음을 보내지 못했어요.'); }
    } catch (e) { /* 다음에 */ }
  }
  function askThanksReport(card, x) {
    if (card.querySelector('.rep-ask')) return;
    const bar = el('div', 'ga-rep rep-ask');
    bar.innerHTML = '<span>이 글이 마음을 불편하게 하나요?</span>';
    const no = el('button', 'chip-btn', '취소'); no.type = 'button';
    const yes = el('button', 'chip-btn danger sure', '알리기'); yes.type = 'button';
    const box = el('span', 'ga-rep-btns'); box.append(no, yes); bar.appendChild(box); card.appendChild(bar);
    no.addEventListener('click', () => bar.remove());
    yes.addEventListener('click', async () => {
      const rep = reported(); rep[x.id] = Date.now(); store.set('ms_reported', rep);
      state.thanks = state.thanks.filter((y) => y.id !== x.id);
      renderAll();
      toast('알려 줘서 고마워요. 세 명이 알리면 그 글은 잠시 숨겨져요.', 3600);
      if (sheetMode) { try { await sheetPost({ type: 'thanksreport', id: x.id, sessionId: sid }); } catch (e) { /* 다음에 */ } }
    });
  }

  function setGardenTab(t) {
    gardenTab = t;
    document.querySelectorAll('#gardenTabs button').forEach((b) => b.classList.toggle('on', b.dataset.g === t));
    $('gpMine').hidden = t !== 'mine'; $('gpAll').hidden = t !== 'all'; $('gpShared').hidden = t !== 'shared'; $('gpDiary').hidden = t !== 'diary';
    if (t !== 'mine') stopSavor();
    if (t === 'mine') renderMine();
    if (t === 'shared') renderGarden();
    if (t === 'all') { renderAll(); $('gardenCount').textContent = '모두가 심은 좋은 일 ' + state.thanks.length + '개'; if (sheetMode) refreshState(false); }
    if (t === 'diary') { renderDiary(); $('gardenCount').textContent = '좋은 일 ' + mg.plants.length + '개를 모았어요'; }
  }
  document.querySelectorAll('#gardenTabs button').forEach((b) => b.addEventListener('click', () => setGardenTab(b.dataset.g)));
  function openGarden(tab, opts) {
    renderCoins();
    $('mgForm').hidden = true; $('mgView').hidden = true;
    mgPage = mgPages() - 1;
    openModal('gardenModal');
    setGardenTab(tab || gardenTab || 'mine');
    if (opts && opts.plant) openForm(opts.kind);
  }

  /* ===================== 숲 선물 (좋은 말) ===================== */
  function giftDay() {
    const g = store.get('ms_gifts', null);
    if (g && g.day === today() && Array.isArray(g.got)) return g;
    const n = { day: today(), got: [] }; store.set('ms_gifts', n); return n;
  }
  let giftQueue = [], giftPick = 0;
  function nextGood() {
    const words = (window.CALM && CALM.GOODWORDS) || [['오늘도 참 잘했어요.', '']];
    if (!giftQueue.length) {
      giftQueue = words.map((_, i) => i);
      for (let i = giftQueue.length - 1; i > 0; i--) { const j = randInt(i + 1); const t = giftQueue[i]; giftQueue[i] = giftQueue[j]; giftQueue[j] = t; }
    }
    return giftQueue.pop();
  }
  function openGift(g) {
    if (!g || g.got) return;
    const words = (window.CALM && CALM.GOODWORDS) || [['오늘도 참 잘했어요.', '']];
    giftPick = nextGood();
    const w = words[giftPick] || words[0];
    $('giftWord').innerHTML = '“' + esc(w[0]) + '”' + (w[1] ? '<cite>— ' + esc(w[1]) + '</cite>' : '');
    const add = earn('present');
    $('giftReward').textContent = add ? '🪙 마음 동전 +' + add : '';
    $('giftSave').textContent = '🔖 마음 글밭에 담기'; $('giftSave').disabled = false;
    const op = $('giftOpen'); op.classList.remove('pop'); void op.offsetWidth; op.classList.add('pop');
    openModal('giftModal'); Sound.chime(true);
    // 선물 수거 (오늘은 이 자리 선물 끝, 내일 또 놓여요)
    g.got = true; g.el.style.display = 'none';
    const gd = giftDay(); if (gd.got.indexOf(g.id) < 0) { gd.got.push(g.id); store.set('ms_gifts', gd); }
    nearGift = null; $('giftBtn').hidden = true;
  }
  $('giftBtn').addEventListener('click', () => openGift(nearGift));
  $('giftSave').addEventListener('click', () => {
    let favs = store.get('ms_readfav', []) || []; const key = 'good:' + giftPick;
    if (favs.indexOf(key) < 0) favs.push(key);
    store.set('ms_readfav', favs.slice(-60));
    $('giftSave').textContent = '✓ 담았어요'; $('giftSave').disabled = true;
    toast('마음 글밭 ‘담은 글’에 담았어요 🔖');
  });
  $('giftClose').addEventListener('click', () => closeModal('giftModal'));

  /* ===================== 배경음악 고르기 ===================== */
  function openMusic() {
    const list = $('musicList'); list.textContent = '';
    const opts = [['off', '🔕', '끄기', '조용히'], ['forest', '🌲', '숲 소리', '새소리와 바람']];
    const icons = { bowl: '🧘', sunlight: '🌼', chime: '🎐', jingle: '🔔', silent: '🌙', joy: '🎄', wish: '⛄', deck: '🎁' };
    // 숲 분위기 음악 먼저, 그다음 크리스마스 캐럴
    const order = ['bowl', 'sunlight', 'chime', 'jingle', 'silent', 'joy', 'wish', 'deck'];
    const carolSet = { jingle: 1, silent: 1, joy: 1, wish: 1, deck: 1 };
    order.forEach((k) => {
      if (!Music.TRACKS[k]) return;
      opts.push([k, icons[k] || '🎵', Music.TRACKS[k].name, carolSet[k] ? '크리스마스 캐럴' : '잔잔한 숲 음악']);
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
      const host = el('div', 'lc-host'); host.textContent = '🔗 ' + hostOf(l.url) + (l.nick ? '  ·  🙂 ' + l.nick : '');
      const foot = el('div', 'lc-foot');
      const go = el('a', 'lc-go'); go.href = l.url; go.target = '_blank'; go.rel = 'noopener noreferrer'; go.textContent = '열어 보기 ↗';
      foot.appendChild(go);
      const mineThis = l.id && myLinks.indexOf(l.id) >= 0;
      const tools = el('div', 'lc-tools');
      if (mineThis) {
        const edit = el('button', 'lc-edit', '✏️ 수정'); edit.type = 'button';
        edit.addEventListener('click', () => openLinkForm(l)); tools.appendChild(edit);
      } else if (l.id && sheetMode && !repd[l.id]) {
        const flag = el('button', 'lc-flag', '🚩'); flag.type = 'button'; flag.title = '부적절한 링크 알리기';
        flag.addEventListener('click', () => reportLink(l, c)); tools.appendChild(flag);
      }
      foot.appendChild(tools);
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
  let linkEditId = null;
  function openLinkForm(l) {
    linkEditId = l && l.id ? l.id : null;
    linkForm = l ? { purpose: l.purpose, level: l.level >= 0 ? l.level : 1, subject: l.subject >= 0 ? l.subject : 0 } : { purpose: 0, level: 1, subject: 0 };
    $('linkUrl').value = l ? l.url : '';
    $('linkTopic').value = l ? l.topic : '';
    $('linkNick').value = l ? (l.nick || '') : (profile ? nameOf(profile) : '');
    $('linkMsg').textContent = ''; $('linkMsg').className = 'modal-msg';
    $('linkFormModal').querySelector('h2').textContent = linkEditId ? '링크 수정' : '링크 올리기';
    $('linkSubmit').textContent = linkEditId ? '수정하기' : '나누기';
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
    const nick = $('linkNick').value.trim();
    const setMsg = (t, k) => { $('linkMsg').textContent = t; $('linkMsg').className = 'modal-msg ' + (k || ''); };
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) return setMsg('http 로 시작하는 올바른 주소를 넣어 주세요.', 'err');
    if (!topic) return setMsg('어떤 링크인지 주제를 적어 주세요.', 'err');
    if (topic.length > 40) return setMsg('주제는 40자 이내로 적어 주세요.', 'err');
    const chk = window.Filter ? window.Filter.check(topic) : { ok: true };
    if (!chk.ok) return setMsg(/따뜻한/.test(chk.reason) ? '주제에 쓸 수 없는 말이 있어요.' : chk.reason, 'err');
    if (nick.length > 12) return setMsg('이름은 12자 이내로 적어 주세요.', 'err');
    if (nick) { const nc = window.Filter ? window.Filter.check(nick) : { ok: true }; if (!nc.ok) return setMsg('이름에 쓸 수 없는 말이 있어요.', 'err'); }
    $('linkSubmit').disabled = true;
    const pf = profile || { a: 0, b: 0 };
    const editing = linkEditId;
    const payload = { url, purpose: linkForm.purpose, topic, level: linkForm.level, subject: linkForm.subject, na: pf.a, nb: pf.b, nick };
    try {
      let r;
      if (sheetMode) {
        try { r = await sheetPost(Object.assign({ type: editing ? 'linkedit' : 'link', sessionId: sid, id: editing || undefined }, payload)); }
        catch (e) { r = { ok: false, reason: '연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.' }; }
      } else {
        r = { ok: true, id: editing || ('L' + Date.now()) };
      }
      if (!r || !r.ok) return setMsg(r && r.reason || '올리지 못했어요.', 'err');
      const link = normLink({ id: r.id || editing || ('L' + Date.now()), url, purpose: linkForm.purpose, topic, nick: nick || nameOf(pf),
        level: linkForm.purpose === 0 ? linkForm.level : -1, subject: linkForm.purpose === 0 ? linkForm.subject : -1, at: Date.now() });
      if (editing) {
        state.links = state.links.map((x) => (x.id === editing ? Object.assign(link, { at: x.at }) : x));
        rememberPost('links', link);
      } else if (!r.pending) {
        state.links.unshift(link); rememberPost('links', link);
        const mine = store.get('ms_mylinks', []) || []; mine.unshift(link.id); store.set('ms_mylinks', mine.slice(0, 50));
      }
      if (!sheetMode) saveLocal();
      closeModal('linkFormModal');
      renderLinks(); renderDockSubs();
      if (!editing) earn('wish');
      toast(editing ? '✏️ 링크를 고쳤어요.' : (r.pending ? '올렸어요. 선생님이 확인하면 보여요.' : '🎁 링크를 나눔터에 올렸어요. 고마워요!'));
    } finally { $('linkSubmit').disabled = false; }
  }
  $('openLinkWrite').addEventListener('click', () => openLinkForm());
  $('linkCancel').addEventListener('click', () => closeModal('linkFormModal'));
  $('linkSubmit').addEventListener('click', submitLink);

  /* ===================== 생각 나눔터 ===================== */
  function openThoughts() { renderThoughts(); openModal('thoughtsModal'); if (sheetMode) refreshState(false); }
  function renderThoughts() {
    const list = $('thoughtList'); list.textContent = '';
    const myT = store.get('ms_mythoughts', []) || [];
    const repd = reported();
    if (!state.thoughts.length) list.appendChild(emptyEl('아직 나눈 생각이 없어요.<br>[＋ 생각 올리기]로 마음속 생각을 나눠 주세요.'));
    state.thoughts.forEach((tt) => {
      const c = el('div', 'tcard');
      const txt = el('div', 'tc-text'); txt.textContent = tt.text;
      c.appendChild(txt);
      if (tt.url) {
        const go = el('a', 'tc-link'); go.href = tt.url; go.target = '_blank'; go.rel = 'noopener noreferrer';
        go.textContent = '🔗 ' + hostOf(tt.url) + ' 열기 ↗';
        c.appendChild(go);
      }
      const foot = el('div', 'tc-foot');
      const who = el('span', 'tc-who'); who.textContent = '🙂 ' + (tt.nick || '숲 친구');
      foot.appendChild(who);
      const tools = el('div', 'lc-tools');
      if (tt.id && myT.indexOf(tt.id) >= 0) {
        const edit = el('button', 'lc-edit', '✏️ 수정'); edit.type = 'button';
        edit.addEventListener('click', () => openThoughtForm(tt)); tools.appendChild(edit);
      } else if (tt.id && sheetMode && !repd[tt.id]) {
        const flag = el('button', 'lc-flag', '🚩'); flag.type = 'button'; flag.title = '부적절한 글 알리기';
        flag.addEventListener('click', () => reportThought(tt, c)); tools.appendChild(flag);
      }
      foot.appendChild(tools);
      c.appendChild(foot);
      list.appendChild(c);
    });
    $('thoughtsCount').textContent = state.thoughts.length ? '함께 나눈 생각 ' + state.thoughts.length + '개' : '';
  }
  async function reportThought(tt) {
    const rep = reported(); rep[tt.id] = Date.now(); store.set('ms_reported', rep);
    state.thoughts = state.thoughts.filter((x) => x.id !== tt.id);
    renderThoughts(); renderDockSubs();
    toast('알려 줘서 고마워요. 세 명이 알리면 그 글은 가려져요.', 3200);
    try { await sheetPost({ type: 'thoughtreport', id: tt.id, sessionId: sid }); } catch (e) { /* */ }
  }
  let thoughtEditId = null;
  function openThoughtForm(tt) {
    thoughtEditId = tt && tt.id ? tt.id : null;
    $('thoughtInput').value = tt ? tt.text : '';
    $('thoughtUrl').value = tt ? (tt.url || '') : '';
    $('thoughtNick').value = tt ? (tt.nick || '') : (profile ? nameOf(profile) : '');
    $('thoughtCharCount').textContent = ($('thoughtInput').value.length) + ' / 160';
    $('thoughtMsg').textContent = ''; $('thoughtMsg').className = 'modal-msg';
    $('thoughtFormModal').querySelector('h2').textContent = thoughtEditId ? '생각 수정' : '생각 올리기';
    $('thoughtSubmit').textContent = thoughtEditId ? '수정하기' : '나누기';
    openModal('thoughtFormModal');
    setTimeout(() => $('thoughtInput').focus(), 60);
  }
  async function submitThought() {
    const text = $('thoughtInput').value.trim();
    const url = $('thoughtUrl').value.trim();
    const nick = $('thoughtNick').value.trim();
    const setMsg = (t, k) => { $('thoughtMsg').textContent = t; $('thoughtMsg').className = 'modal-msg ' + (k || ''); };
    if (!text) return setMsg('나누고 싶은 생각을 적어 주세요.', 'err');
    if (text.length > 160) return setMsg('160자 이내로 적어 주세요.', 'err');
    const chk = window.Filter ? window.Filter.check(text.slice(0, 100)) : { ok: true };
    if (!chk.ok && /따뜻한/.test(chk.reason)) return setMsg('고운 말로 다시 적어 주세요. 내 말은 나에게 돌아와요.', 'err');
    if (url && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) return setMsg('링크는 http로 시작하는 올바른 주소만 넣어 주세요.', 'err');
    if (nick.length > 12) return setMsg('이름은 12자 이내로 적어 주세요.', 'err');
    if (nick) { const nc = window.Filter ? window.Filter.check(nick) : { ok: true }; if (!nc.ok) return setMsg('이름에 쓸 수 없는 말이 있어요.', 'err'); }
    const pf = profile || { a: 0, b: 0 };
    const editing = thoughtEditId;
    $('thoughtSubmit').disabled = true;
    try {
      let r;
      if (sheetMode) {
        try { r = await sheetPost({ type: editing ? 'thoughtedit' : 'thought', sessionId: sid, id: editing || undefined, content: text, url, na: pf.a, nb: pf.b, nick }); }
        catch (e) { r = { ok: false, reason: '연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.' }; }
      } else r = { ok: true, id: editing || ('T' + Date.now()) };
      if (!r || !r.ok) return setMsg(r && r.reason || '올리지 못했어요.', 'err');
      const th = normThought({ id: r.id || editing || ('T' + Date.now()), text, url, nick: nick || nameOf(pf), at: Date.now() });
      if (editing) {
        state.thoughts = state.thoughts.map((x) => (x.id === editing ? Object.assign(th, { at: x.at }) : x));
        rememberPost('thoughts', th);
      } else if (!r.pending) {
        state.thoughts.unshift(th); rememberPost('thoughts', th);
        const mine = store.get('ms_mythoughts', []) || []; mine.unshift(th.id); store.set('ms_mythoughts', mine.slice(0, 50));
      }
      if (!sheetMode) saveLocal();
      closeModal('thoughtFormModal');
      renderThoughts(); renderDockSubs();
      if (!editing) earn('wish');
      toast(editing ? '✏️ 생각을 고쳤어요.' : (r.pending ? '올렸어요. 선생님이 확인하면 보여요.' : '💬 생각을 나눔터에 올렸어요. 고마워요!'));
    } finally { $('thoughtSubmit').disabled = false; }
  }

  /* ===================== 마음 글밭 ===================== */
  const CALM = window.CALM || { POEMS: [], COMFORTS: [], GOODWORDS: [] };
  let readTab = 'poem', readIdx = 0;
  const readFavs = () => store.get('ms_readfav', []) || []; // ['poem:3', ...]
  function readItems(tab) {
    if (tab === 'poem') return CALM.POEMS.map((p, i) => ({ key: 'poem:' + i, title: p.t, body: p.b, by: '마음쉼터 동시' }));
    if (tab === 'comfort') return CALM.COMFORTS.map((t, i) => ({ key: 'comfort:' + i, title: '', body: t, by: '다독이는 말' }));
    if (tab === 'good') return CALM.GOODWORDS.map((g, i) => ({ key: 'good:' + i, title: '', body: g[0], by: g[1] }));
    // 담은 글
    const favs = readFavs(), out = [];
    favs.forEach((k) => {
      const [t, i] = k.split(':'); const n = +i;
      if (t === 'poem' && CALM.POEMS[n]) out.push({ key: k, title: CALM.POEMS[n].t, body: CALM.POEMS[n].b, by: '마음쉼터 동시' });
      else if (t === 'comfort' && CALM.COMFORTS[n]) out.push({ key: k, title: '', body: CALM.COMFORTS[n], by: '다독이는 말' });
      else if (t === 'good' && CALM.GOODWORDS[n]) out.push({ key: k, title: '', body: CALM.GOODWORDS[n][0], by: CALM.GOODWORDS[n][1] });
    });
    return out;
  }
  function openReading() {
    readTab = 'poem'; readIdx = randInt(Math.max(1, CALM.POEMS.length));
    document.querySelectorAll('.rtab').forEach((b) => b.classList.toggle('on', b.dataset.read === 'poem'));
    renderReading();
    openModal('readingModal');
  }
  function renderReading() {
    const items = readItems(readTab);
    const card = $('readCard');
    if (!items.length) {
      card.innerHTML = '<p class="read-empty">아직 담은 글이 없어요.<br>마음에 드는 글에서 🔖 를 눌러 담아 보세요.</p>';
      $('readFoot').textContent = ''; $('readFav').style.visibility = 'hidden';
      $('readPrev').disabled = $('readNext').disabled = true; $('readShuffle').style.visibility = 'hidden';
      return;
    }
    $('readFav').style.visibility = ''; $('readShuffle').style.visibility = '';
    readIdx = ((readIdx % items.length) + items.length) % items.length;
    const it = items[readIdx];
    const favd = readFavs().indexOf(it.key) >= 0;
    card.className = 'read-card ' + readTab;
    card.innerHTML = (it.title ? `<div class="read-title">${it.title}</div>` : '') +
      `<div class="read-body">${it.body.replace(/\n/g, '<br>')}</div>` +
      (it.by ? `<div class="read-by">— ${it.by}</div>` : '');
    $('readFoot').textContent = (readIdx + 1) + ' / ' + items.length;
    $('readFav').textContent = favd ? '🔖 담았어요' : '🔖 마음에 담기';
    $('readFav').classList.toggle('on', favd);
    $('readShuffle').style.visibility = items.length > 1 ? '' : 'hidden';
    $('readPrev').disabled = $('readNext').disabled = items.length <= 1;
  }
  document.querySelectorAll('.rtab').forEach((b) => b.addEventListener('click', () => {
    readTab = b.dataset.read; readIdx = 0;
    document.querySelectorAll('.rtab').forEach((x) => x.classList.toggle('on', x === b));
    renderReading();
  }));
  $('readPrev').addEventListener('click', () => { readIdx--; renderReading(); });
  $('readNext').addEventListener('click', () => { readIdx++; renderReading(); });
  $('readShuffle').addEventListener('click', () => { const n = readItems(readTab).length; if (n > 1) { let r; do { r = randInt(n); } while (r === readIdx); readIdx = r; } renderReading(); Sound.tok(); });
  $('readFav').addEventListener('click', () => {
    const items = readItems(readTab); if (!items.length) return;
    const key = items[readIdx].key; let favs = readFavs();
    if (favs.indexOf(key) >= 0) favs = favs.filter((k) => k !== key);
    else { favs.push(key); Sound.chime(true); }
    store.set('ms_readfav', favs.slice(-60));
    renderReading();
  });

  /* ===================== 계절 ===================== */
  const SEASONS = [
    { id: 'winter', name: '겨울', ico: '❄️', flake: ['❄', '❅', '•'] },
    { id: 'spring', name: '봄', ico: '🌸', flake: ['🌸', '❀', '·'] },
    { id: 'summer', name: '여름', ico: '🌿', flake: ['✦', '·'] },
    { id: 'autumn', name: '가을', ico: '🍂', flake: ['🍂', '🍁', '·'] },
  ];
  let season = store.get('ms_season', 'winter') || 'winter';
  function buildWeather() {
    const snow = $('snow'); snow.textContent = '';
    const s = SEASONS.find((x) => x.id === season) || SEASONS[0];
    if (season === 'summer') return; // 여름은 깨끗한 하늘
    const n = season === 'winter' ? 46 : 30;
    for (let i = 0; i < n; i++) {
      const g = s.flake[randInt(s.flake.length)];
      const f = el('div', 'flake' + (g.length > 1 ? ' big-glyph' : ''), g);
      f.style.left = rand(0, 100) + '%';
      f.style.fontSize = (g.length > 1 ? rand(11, 20) : rand(8, 16)).toFixed(0) + 'px';
      f.style.setProperty('--sdur', rand(season === 'winter' ? 7 : 9, season === 'winter' ? 16 : 20).toFixed(1) + 's');
      f.style.setProperty('--sdrift', rand(-40, 40).toFixed(0) + 'px');
      f.style.animationDelay = (-rand(0, 18)).toFixed(1) + 's';
      f.style.opacity = rand(0.45, 0.95).toFixed(2);
      snow.appendChild(f);
    }
  }
  function applySeason(id) {
    const wasWinter = season === 'winter';
    season = id; store.set('ms_season', id);
    SEASONS.forEach((s) => document.body.classList.remove('se-' + s.id));
    document.body.classList.add('se-' + id);
    document.body.classList.toggle('xmas', id === 'winter');
    buildWeather();
    $('seasonBtn').textContent = (SEASONS.find((s) => s.id === id) || SEASONS[0]).ico;
    if (id === 'winter') { timeAuto = false; applyTime(3); } // 겨울은 언제나 밤
    else if (wasWinter) { timeAuto = true; applyTime(autoTime()); }
  }
  function openSeason() {
    const grid = $('seasonGrid'); grid.textContent = '';
    SEASONS.forEach((s) => {
      const b = el('button', 'season-opt' + (s.id === season ? ' on' : ''), `<span class="so-ico">${s.ico}</span><span class="so-name">${s.name}</span>`);
      b.type = 'button';
      b.addEventListener('click', () => { applySeason(s.id); openSeason(); });
      grid.appendChild(b);
    });
    const winter = season === 'winter';
    $('timeSection').style.display = winter ? 'none' : '';
    $('winterNote').hidden = !winter;
    if (!winter) {
      const tg = $('timeGrid'); tg.textContent = '';
      TIMES.forEach((t, i) => {
        const b = el('button', 'season-opt' + (i === timeIdx && !timeAuto ? ' on' : ''), `<span class="so-ico">${t[1]}</span><span class="so-name">${t[2]}</span>`);
        b.type = 'button';
        b.addEventListener('click', () => { timeAuto = false; applyTime(i); openSeason(); });
        tg.appendChild(b);
      });
      $('timeAutoBtn').classList.toggle('on', timeAuto);
    }
    openModal('seasonModal');
  }
  $('seasonBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openSeason(); });
  $('timeAutoBtn').addEventListener('click', () => { timeAuto = true; applyTime(autoTime()); openSeason(); });

  /* ===================== 마음 날씨 연못 ===================== */
  const MOODS = [
    { ico: '☀️', name: '맑음', msg: '햇살 같은 마음이네요. 무엇 덕분인지 꽃밭에 씨앗으로 심어 두면, 나중에 다시 꺼내 볼 수 있어요.', go: ['plant', '좋은 순간 꽃으로 심기'] },
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
  // 마음에 이름을 붙이면(정서 명명) 마음이 조금 가라앉아요. 고른 낱말은 이 기기에만 남아요.
  const FEELS = [
    ['기뻐요', '신나요', '뿌듯해요', '고마워요', '편안해요'],
    ['신경 쓰여요', '조금 걱정돼요', '긴장돼요', '심심해요', '피곤해요'],
    ['슬퍼요', '서운해요', '외로워요', '실망했어요', '그리워요'],
    ['화나요', '억울해요', '짜증나요', '답답해요', '무서워요'],
    ['안심돼요', '다행이에요', '용기 나요', '희망차요', '설레요'],
    ['헷갈려요', '멍해요', '지쳤어요', '걱정돼요', '잘 모르겠어요'],
  ];
  const FEEL_REPLY = [
    '그 마음을 오래 간직해 봐요. 무엇 덕분인지 떠올려 보면 기쁨이 더 커져요.',
    '그럴 수 있어요. 작은 걱정도 이름을 붙이면 조금 가벼워져요.',
    '그렇게 느끼는 건 자연스러운 일이에요. 지금 마음 그대로 괜찮아요.',
    '그렇게 느낄 만한 일이 있었나 봐요. 마음이 큰 소리를 낼 때는 먼저 숨을 천천히 골라요.',
    '힘든 시간을 잘 지나왔네요. 그 마음을 스스로에게 칭찬해 줘요.',
    '마음이 잘 안 보이는 날도 있어요. 이름을 붙이려고 한 것만으로도 잘했어요.',
  ];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  function moodLog() { const l = store.get('ms_moodlog', {}); return l && typeof l === 'object' ? l : {}; }
  function saveMoodLog(patch) {
    const l = moodLog(), d = today();
    l[d] = Object.assign({}, l[d] || {}, patch);
    const keys = Object.keys(l).sort();
    while (keys.length > 30) delete l[keys.shift()];
    store.set('ms_moodlog', l);
  }
  function dayKey(offset) { const t = new Date(); t.setDate(t.getDate() - offset); return { key: ymd(t), dow: t.getDay() }; }
  function renderMoodWeek() {
    const box = $('moodWeek'), l = moodLog(); box.textContent = '';
    for (let i = 6; i >= 0; i--) {
      const { key, dow } = dayKey(i), e = l[key];
      const cell = el('div', 'mw-day' + (i === 0 ? ' today' : ''));
      const m = e && Number.isInteger(e.m) ? MOODS[clamp(e.m, 0, MOODS.length - 1)] : null;
      cell.innerHTML = `<span class="mw-ico">${m ? m.ico : '·'}</span><span class="mw-dow">${i === 0 ? '오늘' : DAY_NAMES[dow]}</span>`;
      if (m) cell.title = m.name + (e.f && e.f.length ? ' — ' + e.f.join(', ') : '');
      box.appendChild(cell);
    }
  }
  function renderFeelChips(i) {
    const box = $('moodChips'); box.textContent = '';
    const picked = (moodLog()[today()] || {}).f || [];
    FEELS[i].forEach((f) => {
      const b = el('button', 'mf-chip' + (picked.includes(f) ? ' on' : ''), f); b.type = 'button';
      b.addEventListener('click', () => pickFeel(f));
      box.appendChild(b);
    });
    $('moodFeel').hidden = false;
  }
  function pickFeel(f) {
    const e = moodLog()[today()] || {};
    if (!Number.isInteger(e.m)) return;
    let picked = Array.isArray(e.f) ? e.f.slice() : [];
    if (picked.includes(f)) picked = picked.filter((x) => x !== f);
    else { picked.push(f); if (picked.length > 3) picked.shift(); }
    saveMoodLog({ f: picked });
    Sound.tok();
    renderFeelChips(e.m); showMoodAnswer(e.m); renderMoodWeek();
  }
  function openPond() {
    const p = moodPicked();
    $('moodGrid').querySelectorAll('.mood').forEach((b, i) => b.classList.toggle('on', i === p));
    if (p !== null) { renderFeelChips(p); showMoodAnswer(p); } else { $('moodAnswer').hidden = true; $('moodFeel').hidden = true; }
    renderMoodWeek(); renderMoodToday();
    openModal('pondModal');
  }
  function showMoodAnswer(i) {
    const m = MOODS[i], box = $('moodAnswer');
    const feels = ((moodLog()[today()] || {}).f || []);
    box.innerHTML = '';
    if (feels.length) {
      const v = el('p', 'mood-valid');
      v.textContent = '‘' + feels.join('’, ‘') + '’ — 그런 마음이 드는구나. ' + FEEL_REPLY[i];
      box.appendChild(v);
    }
    const p = el('p'); p.textContent = m.ico + ' ' + m.msg; box.appendChild(p);
    if (m.go) {
      const b = el('button', 'btn-primary go', m.go[1]); b.type = 'button';
      b.addEventListener('click', () => {
        closeModal('pondModal');
        const g = m.go[0];
        if (g === 'plant') { openGarden('mine', { plant: true, kind: 1 }); return; }
        if (g === 'letgo' || g === 'hope') { renderBoard(); openModal('boardModal'); openWrite(g === 'letgo' ? KIND_LETGO : KIND_HOPE); }
        else warpTo(g);
      });
      box.appendChild(b);
    }
    box.hidden = false;
  }
  async function pickMood(i) {
    const prev = moodPicked();
    $('moodGrid').querySelectorAll('.mood').forEach((b, j) => b.classList.toggle('on', j === i));
    const old = moodLog()[today()] || {};
    saveMoodLog({ m: i, f: old.m === i ? (old.f || []) : [] });
    renderFeelChips(i); showMoodAnswer(i); renderMoodWeek();
    Sound.tok();
    if (prev !== null) { store.set('ms_mood', { day: today(), m: i }); renderDockSubs(); return; } // 집계는 하루 한 번만
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

  /* ===================== 고요한 산사 ===================== */
  const tp = { tab: 'tap', ang: Math.PI / 2, roundStart: Math.PI / 2, holding: false, raf: 0, last: 0, held: 0, lastStep: 0,
    gongBusy: false, gongTimers: [], idx: -1 };
  const TAP_ROUND_MS = 15000;
  function tapToday() { const t = store.get('ms_tap', null); return t && t.day === today() ? t.n | 0 : 0; }
  function gongToday() { const t = store.get('ms_gong', null); return t && t.day === today() ? t.n | 0 : 0; }
  function renderTapCount() { $('tapCount').textContent = '오늘 ' + tapToday() + '바퀴 · 한 바퀴마다 🪙1'; }
  function renderGongCount() { const n = gongToday(); $('gongCount').textContent = (n ? '오늘 ' + n + '번 들었어요 · ' : '') + '끝까지 들으면 🪙1'; }
  function placeWalker() {
    const st = $('tapStage'), w = $('tapWalker');
    const W2 = st.clientWidth, H2 = st.clientHeight;
    const s = Math.sin(tp.ang), c = Math.cos(tp.ang);
    const x = W2 / 2 + W2 * 0.36 * c, y = H2 * 0.80 + H2 * 0.09 * s;
    const sc = 0.82 + 0.22 * (s + 1) / 2;
    const dir = -Math.sin(tp.ang) < 0 ? -1 : 1; // 움직이는 쪽을 바라봐요
    w.style.left = x.toFixed(1) + 'px'; w.style.top = y.toFixed(1) + 'px';
    w.style.zIndex = s > 0 ? '4' : '1';
    w.style.transform = `translate(-50%,-100%) scale(${(sc * dir).toFixed(3)},${sc.toFixed(3)})`;
    return { x, y };
  }
  function dropStep(x, y) {
    const f = el('span', 'tap-step'); f.style.left = x.toFixed(0) + 'px'; f.style.top = y.toFixed(0) + 'px';
    $('tapTrail').appendChild(f); setTimeout(() => f.remove(), 3200);
  }
  function tapLoop(now) {
    tp.raf = 0;
    if ($('templeModal').hidden || tp.tab !== 'tap') return;
    const dt = Math.min(120, now - (tp.last || now)); tp.last = now;
    if (tp.holding) {
      tp.held += dt;
      tp.ang += dt / TAP_ROUND_MS * Math.PI * 2;
      const done = (tp.ang - tp.roundStart) / (Math.PI * 2);
      $('tapFill').style.width = (Math.min(1, done) * 100).toFixed(1) + '%';
      const phase = Math.floor(tp.held / 3500) % 2;
      $('tapBreath').textContent = phase ? '내쉬며… 한 걸음' : '들이쉬며… 한 걸음';
      const pos = placeWalker();
      if (tp.ang - tp.lastStep > 0.32) { tp.lastStep = tp.ang; dropStep(pos.x, pos.y); }
      $('tapWalker').classList.add('walking');
      if (done >= 1) finishRound();
    } else {
      $('tapWalker').classList.remove('walking');
      placeWalker();
    }
    tp.raf = requestAnimationFrame(tapLoop);
  }
  function finishRound() {
    tp.roundStart = tp.ang; $('tapFill').style.width = '0%';
    const n = tapToday() + 1; store.set('ms_tap', { day: today(), n });
    const words = (window.CALM && CALM.TAP_WORDS) || ['한 걸음, 한 숨.'];
    const w = $('tapWord'); w.classList.remove('show'); void w.offsetWidth;
    w.textContent = '🗼 ' + n + '바퀴 — ' + words[(n - 1) % words.length]; w.classList.add('show');
    Sound.chime(true); earn('tap'); renderTapCount(); renderDockSubs();
  }
  function setHold(on) {
    if (tp.holding === on) return;
    tp.holding = on;
    $('tapHold').classList.toggle('on', on);
    if (!on) $('tapBreath').textContent = '잠시 멈췄어요. 다시 꾹 누르면 이어서 걸어요';
    else { tp.last = performance.now(); if (!tp.raf) tp.raf = requestAnimationFrame(tapLoop); }
  }
  (function bindTap() {
    const b = $('tapHold');
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { /* */ } setHold(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, () => setHold(false)));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setHold(true); } });
    b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') setHold(false); });
  })();

  function gongReset() {
    tp.gongTimers.forEach(clearTimeout); tp.gongTimers = []; tp.gongBusy = false;
    $('gongBtn').disabled = false; $('gongArt').classList.remove('strike');
    const bar = $('gongBar'); bar.style.transition = 'none'; bar.style.width = '0%';
    $('gongRipples').textContent = '';
  }
  function strikeGong() {
    if (tp.gongBusy) return;
    gongReset(); tp.gongBusy = true; $('gongBtn').disabled = true;
    Sound.gong();
    const art = $('gongArt'); void art.offsetWidth; art.classList.add('strike');
    const rp = $('gongRipples');
    for (let i = 0; i < 4; i++) { const r = el('span', 'g-ring'); r.style.animationDelay = (i * 1.4) + 's'; rp.appendChild(r); }
    const bar = $('gongBar'); bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
    bar.style.transition = 'width 9.4s linear'; bar.style.width = '0%';
    const w = $('gongWord');
    const seq = [[0, '데에엥—'], [1800, '소리가 숲 너머로 퍼져 나가요…'], [4600, '점점 작아져요. 끝까지 귀 기울여 봐요.'], [7600, '아주 작은 소리까지…']];
    seq.forEach(([ms, txt]) => tp.gongTimers.push(setTimeout(() => { w.textContent = txt; }, ms)));
    tp.gongTimers.push(setTimeout(() => {
      w.textContent = '소리가 다 사라졌어요. 마음도 조금 고요해졌나요?';
      store.set('ms_gong', { day: today(), n: gongToday() + 1 });
      earn('gong'); renderGongCount();
      tp.gongBusy = false; $('gongBtn').disabled = false; art.classList.remove('strike'); rp.textContent = '';
    }, 9600));
  }
  $('gongBtn').addEventListener('click', strikeGong);

  function templeList() { return (window.CALM && CALM.TEMPLES) || []; }
  function renderTempleCard() {
    const list = templeList(); if (!list.length) return;
    if (tp.idx < 0) { const d = new Date(), start = new Date(d.getFullYear(), 0, 0); tp.idx = Math.floor((d - start) / 864e5) % list.length; }
    const t = list[(tp.idx % list.length + list.length) % list.length];
    $('tcScene').innerHTML = A.templeScene(t.scene);
    $('tcName').textContent = t.name; $('tcRegion').textContent = t.region;
    const tag = $('tcTag'); tag.textContent = t.tag; tag.hidden = !t.tag;
    $('tcText').textContent = t.text; $('tcBreath').textContent = '🍃 ' + t.breath;
    $('tcMap').href = 'https://map.naver.com/p/search/' + encodeURIComponent(t.region.split(' ')[0] + ' ' + t.name);
    $('tcCount').textContent = ((tp.idx % list.length + list.length) % list.length + 1) + ' / ' + list.length + ' · 날마다 다른 산사가 찾아와요';
  }
  $('tcPrev').addEventListener('click', () => { tp.idx--; renderTempleCard(); Sound.tok(); });
  $('tcNext').addEventListener('click', () => { tp.idx++; renderTempleCard(); Sound.tok(); });

  function setTempleTab(t) {
    tp.tab = t;
    document.querySelectorAll('#templeTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    $('tpTap').hidden = t !== 'tap'; $('tpGong').hidden = t !== 'gong'; $('tpToday').hidden = t !== 'today';
    if (t !== 'tap') setHold(false);
    if (t === 'tap') { tp.last = 0; if (!tp.raf) tp.raf = requestAnimationFrame(tapLoop); }
    if (t === 'today') renderTempleCard();
    if (t === 'gong') renderGongCount();
  }
  document.querySelectorAll('#templeTabs button').forEach((b) => b.addEventListener('click', () => setTempleTab(b.dataset.t)));
  function openTemple() {
    if (!$('tapPagoda').innerHTML) $('tapPagoda').innerHTML = A.PAGODA;
    if (!$('gongArt').innerHTML) $('gongArt').innerHTML = A.GONG;
    $('tapWalker').innerHTML = A.person(look());
    renderTapCount(); renderGongCount();
    openModal('templeModal');
    setTempleTab(tp.tab);
  }
  function stopTemple() {
    setHold(false);
    if (tp.raf) cancelAnimationFrame(tp.raf); tp.raf = 0;
    gongReset();
    $('gongWord').textContent = '종을 한 번 울리고, 소리가 다 사라질 때까지 귀 기울여 보세요.';
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
    if (sg.dirs[sg.cur + 1] !== dir) { fallStair(); return; }
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
  // 발을 헛디디면 아래 쉼 지점(10칸 단위)까지 미끄러져 떨어져요
  function fallStair() {
    if (sg.busy) return;
    sg.busy = true; sg.miss++;
    const meEl = $('sgMe');
    const checkpoint = Math.floor((sg.cur - 1) / 10) * 10; // 방금 밟은 칸 아래 쉼터
    const target = Math.max(0, checkpoint);
    const dropped = sg.cur - target;
    meEl.classList.add('falling');
    Sound.tok();
    $('sgTip').textContent = dropped > 1 ? '앗, 미끄러졌어요. 괜찮아요, 다시 천천히 올라가요' : '앗, 반대쪽이에요. 괜찮아요, 천천히 다시!';
    setTimeout(() => {
      meEl.classList.remove('falling');
      sg.cur = target;
      stairCamera();
      setTimeout(() => { sg.busy = false; }, 150);
    }, dropped > 1 ? 650 : 280);
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
  const MAP_PTS = { plaza: [46, 306], reading: [92, 250], shop: [56, 196], links: [128, 210], tree: [104, 120], spring: [182, 96], lantern: [256, 116], garden: [300, 176], pond: [232, 240], rain: [332, 262], stair: [370, 186], temple: [414, 132], hill: [372, 62] };
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
      closeModal('mapModal'); warpTo(s.dataset.zone);
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
    const L = Object.assign({}, draft, { worn: wornArr() });
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
    applyTime(autoTime());
    applySeason(season);
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
    window.__ms = { me, others, state, wallet, critters, sg, goTo, warpTo, enterZone, openReading, openTemple, openGarden, mg, waterGarden, renderAll, openGift, gifts: () => gifts, nearGift: () => nearGift, setBreathMode, temple: () => tp, startBreath, pickMood, pickFeel, moodLog: () => moodLog(), tapToday, keys, earn, climb, sendEmote, applyTime, applySeason, openLinks, openMusic, openSeason, chooseMusic, flySanta, submitLink, linkForm, refreshState, renderBoard, get season() { return season; }, get musicChoice() { return musicChoice; }, get cam() { return cam; }, get myKey() { return myKey; }, get nearPerson() { return nearPerson; } };
  }
  start();
})();
