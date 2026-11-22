/* ============================================================
 *  온라인 마음쉼터 — v5
 *  옆으로 긴 숲길 · 사람 캐릭터 · 방향키/탭 이동 · 쉼터 자동 찾아가기
 *  함께 보는 염원 · 공감 · 별이 되는 장치 · 함께 접속한 사람
 *  서버: Google Apps Script(시트 모드) / 없으면 로컬 모드(혼자 보기)
 * ============================================================ */
(function () {
  'use strict';

  /* ===================== 기본 도구 ===================== */
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

  /* ===================== 상수 ===================== */
  const W = 2600;            // 숲길 전체 길이(px)
  const SPEED = 230;         // 걷는 속도(px/초)
  const DSPEED = 0.8;        // 앞뒤로 움직이는 속도(깊이/초)
  const NEAR = 110;          // 쉼터 앞이라고 보는 거리
  const STAR_AT = 5;         // 공감 몇 개면 별이 되는지(서버와 같게)
  const KIND_HOPE = '바람', KIND_LETGO = '내려놓기';

  // 별명은 이 목록의 '번호'로만 주고받습니다(자유 입력 없음 → 욕설 차단)
  const ADJ = ['느린', '따뜻한', '조용한', '포근한', '맑은', '다정한', '싱그러운', '잔잔한',
    '반짝이는', '수줍은', '너그러운', '차분한', '말랑한', '산뜻한', '고요한', '부드러운'];
  const NOUN = ['걸음', '바람', '새벽', '구름', '오솔길', '햇살', '이슬', '나뭇잎',
    '달빛', '시냇물', '솔방울', '민들레', '별빛', '도토리', '꽃잎', '숲길'];
  const HAIR = ['#4b3a2f', '#2f2a28', '#8a5a3b', '#c08a52', '#6b4a8a', '#a3483a'];
  const OUTFIT = ['#8fb4d9', '#f2a7a0', '#a9cf98', '#f3d08a', '#c3a6e0', '#f0b97a'];

  const ZONES = [
    { id: 'plaza', x: 300, name: '쉼터 광장', icon: '🪧' },
    { id: 'tree', x: 800, name: '숨 쉬는 나무', icon: '🌳' },
    { id: 'spring', x: 1300, name: '마음 구슬 샘', icon: '🫧' },
    { id: 'lantern', x: 1800, name: '염원 등불터', icon: '🏮' },
    { id: 'hill', x: 2300, name: '별빛 언덕', icon: '⭐' },
  ];
  const zoneById = (id) => ZONES.find((z) => z.id === id);

  /* ===================== 나 ===================== */
  let sid = null;
  try { sid = localStorage.getItem('ms_session'); } catch (e) { /* */ }
  if (!sid) {
    sid = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem('ms_session', sid); } catch (e) { /* */ }
  }
  const randomProfile = () => ({ a: randInt(ADJ.length), b: randInt(NOUN.length), h: randInt(HAIR.length), o: randInt(OUTFIT.length) });
  const nameOf = (p) => ADJ[p.a] + ' ' + NOUN[p.b];
  function validProfile(p) {
    if (!p) return null;
    const ok = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
    return ok(p.a, ADJ.length) && ok(p.b, NOUN.length) && ok(p.h, HAIR.length) && ok(p.o, OUTFIT.length) ? p : null;
  }
  let profile = validProfile(store.get('ms_profile', null));
  const me = { x: 380, d: 0.55, facing: 1, target: null, zone: '', el: null };

  /* ===================== 화면 크기 ===================== */
  let vw = 0, vh = 0, bandTop = 0, bandBot = 0, bandH = 1, lmScale = 1, cam = 0;
  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    const navH = $('controls').offsetHeight || 80;
    bandTop = Math.round(vh * 0.6);
    bandBot = vh - navH - 14;
    if (bandBot - bandTop < 90) bandTop = bandBot - 90;
    bandH = Math.max(60, bandBot - bandTop);
    lmScale = clamp(vh / 820, 0.66, 1.1);
  }

  /* ===================== 사람 그리기 ===================== */
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round((n >> 16) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function personSVG(h, o) {
    const hair = HAIR[h] || HAIR[0], shirt = OUTFIT[o] || OUTFIT[0], back = shade(shirt, 0.86);
    return `<svg viewBox="0 0 60 100" class="psvg" aria-hidden="true">
      <ellipse class="p-shadow" cx="30" cy="96" rx="15" ry="3.5"/>
      <g class="body-g">
        <g class="leg leg-b"><rect x="31" y="66" width="7" height="24" rx="3.5" fill="#56606e"/><ellipse cx="35.5" cy="90" rx="5.5" ry="3.2" fill="#4a4237"/></g>
        <g class="arm arm-b"><rect x="38" y="47" width="6.5" height="20" rx="3.2" fill="${back}"/><circle cx="41.3" cy="68" r="3.3" fill="#f6cfb4"/></g>
        <rect x="17" y="44" width="26" height="27" rx="10" fill="${shirt}"/>
        <rect x="17" y="62" width="26" height="6" fill="${back}" opacity=".35"/>
        <g class="leg leg-f"><rect x="22" y="66" width="7" height="24" rx="3.5" fill="#66717f"/><ellipse cx="26.5" cy="90" rx="5.5" ry="3.2" fill="#4a4237"/></g>
        <g class="arm arm-f"><rect x="15.5" y="47" width="6.5" height="20" rx="3.2" fill="${shirt}"/><circle cx="18.8" cy="68" r="3.3" fill="#ffd9bf"/></g>
        <circle cx="30" cy="27" r="17" fill="#ffe2cc"/>
        <path d="M13 28 Q11 8 30 8 Q49 8 47 28 Q45 18 37 16 Q31 21 21 19 Q16 22 13 28 Z" fill="${hair}"/>
        <path d="M44 22 Q49 30 45 38" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="26" cy="29" r="2.3" fill="#3d342b"/><circle cx="37.5" cy="29" r="2.3" fill="#3d342b"/>
        <circle cx="26.7" cy="28.2" r=".8" fill="#fff"/><circle cx="38.2" cy="28.2" r=".8" fill="#fff"/>
        <circle cx="22" cy="34" r="2.6" fill="#f6a99a" opacity=".55"/><circle cx="41" cy="34" r="2.6" fill="#f6a99a" opacity=".55"/>
        <path d="M29.5 35 Q32 37.5 34.5 35" fill="none" stroke="#3d342b" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    </svg>`;
  }
  function makePerson(p, isMe) {
    const el = document.createElement('div');
    el.className = 'person' + (isMe ? ' me' : '');
    el.innerHTML = '<div class="p-label"><span class="p-zone"></span><span class="p-name"></span></div><div class="flipper"></div>';
    setLook(el, p, isMe);
    return el;
  }
  function setLook(el, p, isMe) {
    el.querySelector('.flipper').innerHTML = personSVG(p.h, p.o);
    el.querySelector('.p-name').textContent = (isMe ? '나 · ' : '') + nameOf(p);
  }
  function setZoneIcon(el, zid) {
    const z = zoneById(zid);
    el.querySelector('.p-zone').textContent = z ? z.icon : '';
  }
  function placeAt(el, x, d, base) {
    const y = bandTop + d * bandH;
    const s = (base || 1) * (0.82 + d * 0.42);
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    el.style.zIndex = String(20 + Math.round(d * 100));
  }
  function showBubble(el, text, ms) {
    let b = el.querySelector('.bubble');
    if (!b) { b = document.createElement('div'); b.className = 'bubble'; el.appendChild(b); }
    b.textContent = text; b.hidden = false;
    clearTimeout(el._bt);
    el._bt = setTimeout(() => { b.hidden = true; }, ms || 3000);
  }

  /* ===================== 쉼터 그림 ===================== */
  const LM_ART = {
    plaza: { w: 150, vb: [150, 150], svg: `
      <ellipse cx="75" cy="144" rx="58" ry="6" fill="rgba(70,90,60,.18)"/>
      <rect x="70" y="40" width="10" height="104" rx="3" fill="#a07850"/>
      <rect x="20" y="36" width="110" height="36" rx="9" fill="#cfa16d" stroke="#a07850" stroke-width="3"/>
      <text x="75" y="60" text-anchor="middle" font-size="16" font-weight="800" fill="#5a3f28">마음쉼터</text>
      <rect x="34" y="80" width="82" height="22" rx="6" fill="#dcb789" stroke="#a07850" stroke-width="2"/>
      <text x="75" y="95" text-anchor="middle" font-size="10" fill="#5a3f28">천천히 쉬어 가요</text>
      <g><circle cx="42" cy="136" r="5" fill="#f5b3b8"/><circle cx="52" cy="139" r="4" fill="#fbe08a"/><circle cx="102" cy="137" r="5" fill="#c9b6ef"/><circle cx="112" cy="140" r="4" fill="#f5b3b8"/></g>` },
    tree: { w: 240, vb: [240, 260], svg: `
      <ellipse cx="120" cy="252" rx="92" ry="9" fill="rgba(70,90,60,.2)"/>
      <path d="M106 252 Q112 192 102 150 L138 150 Q128 192 136 252 Z" fill="#8a6447"/>
      <path d="M116 178 Q96 162 80 142" stroke="#8a6447" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g fill="#6e9f5c"><circle cx="120" cy="88" r="62"/><circle cx="68" cy="116" r="44"/><circle cx="174" cy="112" r="46"/></g>
      <g fill="#86b872"><circle cx="104" cy="70" r="34"/><circle cx="152" cy="92" r="28"/><circle cx="78" cy="104" r="22"/></g>
      <g fill="#a6cf8e" opacity=".75"><circle cx="95" cy="58" r="14"/><circle cx="144" cy="78" r="10"/></g>
      <line x1="80" y1="142" x2="80" y2="205" stroke="#c8a77e" stroke-width="2"/>
      <line x1="104" y1="132" x2="104" y2="205" stroke="#c8a77e" stroke-width="2"/>
      <rect x="74" y="203" width="36" height="7" rx="3" fill="#b3875d"/>` },
    spring: { w: 210, vb: [210, 140], svg: `
      <ellipse cx="105" cy="130" rx="92" ry="9" fill="rgba(70,90,60,.18)"/>
      <path d="M22 96 Q14 70 26 58" stroke="#6f9a58" stroke-width="3" fill="none"/><ellipse cx="26" cy="56" rx="3.5" ry="9" fill="#8b6a4a"/>
      <path d="M188 96 Q198 72 184 60" stroke="#6f9a58" stroke-width="3" fill="none"/><ellipse cx="184" cy="58" rx="3.5" ry="9" fill="#8b6a4a"/>
      <ellipse cx="105" cy="104" rx="86" ry="28" fill="#b9b2a4"/>
      <ellipse cx="105" cy="98" rx="73" ry="22" fill="#9fd3e0"/>
      <ellipse cx="92" cy="92" rx="32" ry="7" fill="#d4eef4" opacity=".85"/>
      <g fill="#a39b8d"><ellipse cx="34" cy="104" rx="10" ry="6"/><ellipse cx="62" cy="122" rx="11" ry="6"/><ellipse cx="105" cy="128" rx="12" ry="6"/><ellipse cx="150" cy="122" rx="11" ry="6"/><ellipse cx="177" cy="104" rx="10" ry="6"/></g>
      <g fill="#ffffff" opacity=".85"><circle class="bub" cx="88" cy="96" r="3"/><circle class="bub" cx="112" cy="100" r="2.5" style="animation-delay:1.2s"/><circle class="bub" cx="126" cy="94" r="2" style="animation-delay:2.1s"/></g>` },
    lantern: { w: 230, vb: [230, 214], svg: `
      <ellipse cx="115" cy="206" rx="98" ry="8" fill="rgba(70,90,60,.2)"/>
      <rect x="28" y="184" width="174" height="16" rx="4" fill="#c7a77d"/>
      <rect x="42" y="74" width="10" height="112" fill="#9a6e4a"/><rect x="178" y="74" width="10" height="112" fill="#9a6e4a"/>
      <path d="M8 80 Q115 22 222 80 L202 88 Q115 46 28 88 Z" fill="#7a5a44"/>
      <path d="M28 88 Q115 46 202 88 L198 97 Q115 58 32 97 Z" fill="#8f6a50"/>
      <rect x="40" y="96" width="150" height="7" fill="#9a6e4a"/>
      <rect x="93" y="134" width="44" height="46" rx="4" fill="#dcbd8f" stroke="#9a6e4a" stroke-width="2"/>
      <g><rect x="99" y="141" width="12" height="10" fill="#fff4d6"/><rect x="116" y="140" width="14" height="11" fill="#e7f2dc"/><rect x="100" y="157" width="13" height="11" fill="#e7f2dc"/><rect x="117" y="156" width="12" height="12" fill="#fff4d6"/></g>
      <g stroke="#7a5a44" stroke-width="1.5"><line x1="70" y1="103" x2="70" y2="114"/><line x1="115" y1="103" x2="115" y2="112"/><line x1="160" y1="103" x2="160" y2="114"/></g>
      <g class="lglow"><ellipse cx="70" cy="126" rx="11" ry="13" fill="#ffcf86"/><ellipse cx="115" cy="124" rx="11" ry="13" fill="#ffd99a"/><ellipse cx="160" cy="126" rx="11" ry="13" fill="#ffcf86"/></g>
      <g fill="#fff3d0" opacity=".7"><ellipse cx="67" cy="122" rx="3.5" ry="5"/><ellipse cx="112" cy="120" rx="3.5" ry="5"/><ellipse cx="157" cy="122" rx="3.5" ry="5"/></g>` },
    hill: { w: 270, vb: [270, 150], svg: `
      <path d="M0 150 Q135 34 270 150 Z" fill="#7fae74"/>
      <path d="M36 150 Q135 66 234 150 Z" fill="#94c088"/>
      <rect x="104" y="80" width="56" height="8" rx="3" fill="#a9825d"/>
      <rect x="110" y="88" width="5" height="16" fill="#8f6a4a"/><rect x="149" y="88" width="5" height="16" fill="#8f6a4a"/>
      <g stroke="#6d5a7e" stroke-width="5" stroke-linecap="round"><line x1="186" y1="98" x2="210" y2="70"/></g>
      <g stroke="#8f6a4a" stroke-width="2.5"><line x1="196" y1="88" x2="190" y2="112"/><line x1="196" y1="88" x2="204" y2="112"/></g>
      <g fill="#fff4c2"><circle cx="70" cy="128" r="2"/><circle cx="210" cy="132" r="2"/></g>` },
  };

  /* ===================== 장면 만들기 ===================== */
  const worldEl = $('world'), peopleEl = $('people'), lmLayer = $('landmarks'), decorEl = $('decor'), starfieldEl = $('starfield');
  const lmEls = {};
  const decor = [];

  function buildScene() {
    worldEl.style.width = W + 'px';
    // 먼 나무
    const tl = $('treeline');
    for (let i = 0; i < 46; i++) {
      const t = document.createElement('div');
      t.className = 'tree';
      t.style.left = Math.round(i * 82 + rand(-20, 20)) + 'px';
      t.style.bottom = (43 + rand(0, 3)).toFixed(1) + '%';
      t.style.transform = `scale(${rand(0.6, 1.25).toFixed(2)})`;
      tl.appendChild(t);
    }
    // 구름
    const cl = $('clouds');
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('div'); c.className = 'cloud';
      const w = rand(90, 210);
      c.style.width = w + 'px'; c.style.height = (w * 0.4) + 'px';
      c.style.top = rand(6, 28) + '%';
      c.style.animationDuration = rand(60, 110) + 's';
      c.style.animationDelay = (-rand(0, 60)) + 's';
      cl.appendChild(c);
    }
    // 반딧불
    const ff = $('fireflies');
    for (let i = 0; i < 14; i++) {
      const f = document.createElement('div'); f.className = 'firefly';
      f.style.left = rand(0, 100) + '%'; f.style.top = rand(25, 75) + '%';
      f.style.setProperty('--dx', rand(-25, 25) + 'px'); f.style.setProperty('--dy', rand(-45, -15) + 'px');
      f.style.animationDuration = rand(3, 7) + 's, ' + rand(2, 4) + 's';
      f.style.animationDelay = (-rand(0, 4)) + 's';
      ff.appendChild(f);
    }
    // 숲길 바닥 장식
    const path = document.createElement('div'); path.className = 'path'; decorEl.appendChild(path);
    decor.push({ el: path, kind: 'path' });
    const flowerColors = ['#f5b3b8', '#fbe08a', '#c9b6ef', '#ffffff', '#f7c59f'];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      const isTuft = Math.random() < 0.45;
      el.className = isTuft ? 'tuft' : 'flower';
      if (!isTuft) el.style.background = flowerColors[randInt(flowerColors.length)];
      decorEl.appendChild(el);
      decor.push({ el, x: rand(20, W - 20), d: rand(0, 1) });
    }
    // 쉼터
    ZONES.forEach((z) => {
      const art = LM_ART[z.id];
      const el = document.createElement('div');
      el.className = 'landmark'; el.dataset.zone = z.id;
      el.innerHTML = `<svg viewBox="0 0 ${art.vb[0]} ${art.vb[1]}" aria-hidden="true">${art.svg}</svg>` +
        `<div class="lm-label">${z.icon} ${z.name}</div>` +
        `<button class="lm-prompt" type="button">${isTouch ? '눌러서 들어가기' : 'Enter 로 들어가기'}</button>`;
      el.querySelector('.lm-prompt').addEventListener('click', (e) => { e.stopPropagation(); enterZone(z.id); });
      lmLayer.appendChild(el);
      lmEls[z.id] = el;
    });
  }

  function layout() {
    ZONES.forEach((z) => {
      const art = LM_ART[z.id], el = lmEls[z.id];
      const w = art.w, h = w * art.vb[1] / art.vb[0];
      el.style.width = w + 'px';
      el.style.left = (z.x - w / 2) + 'px';
      el.style.top = (bandTop - h + 14) + 'px';
      el.style.transform = `scale(${lmScale.toFixed(3)})`;
    });
    decor.forEach((it) => {
      if (it.kind === 'path') { it.el.style.top = (bandTop + bandH * 0.42 - 13) + 'px'; it.el.style.zIndex = '1'; return; }
      it.el.style.left = it.x.toFixed(0) + 'px';
      it.el.style.top = (bandTop + it.d * bandH).toFixed(0) + 'px';
      it.el.style.zIndex = String(2 + Math.round(it.d * 9));
    });
    renderStarfield();
  }

  /* ===================== 숲지기 새싹 · 양 ===================== */
  const SPROUT_SVG = `<svg viewBox="0 0 120 150" width="56" height="70" aria-hidden="true" style="display:block;margin:30px auto 0">
    <ellipse cx="60" cy="140" rx="30" ry="6" fill="rgba(80,110,80,.2)"/>
    <ellipse cx="60" cy="96" rx="36" ry="38" fill="#d6ead0"/><ellipse cx="50" cy="84" rx="14" ry="10" fill="#e6f1e1" opacity=".7"/>
    <circle cx="41" cy="100" r="6" fill="#f7b9a2" opacity=".7"/><circle cx="79" cy="100" r="6" fill="#f7b9a2" opacity=".7"/>
    <circle cx="49" cy="90" r="4.6" fill="#4b4335"/><circle cx="71" cy="90" r="4.6" fill="#4b4335"/>
    <path d="M54 105 Q60 110 66 105" fill="none" stroke="#4b4335" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M60 59 L60 38" stroke="#8aa06a" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 42 Q76 33 75 49 Q64 53 60 42 Z" fill="#8fb46e"/><path d="M60 48 Q44 39 45 55 Q56 59 60 48 Z" fill="#8fb46e"/></svg>`;
  const npc = { x: 430, d: 0.06, el: null, line: 0 };
  const NPC_LINES = ['어서 와요. 천천히 둘러봐요 🌱', '숨 쉬는 나무 아래에서 숨을 골라 봐요.', '마음이 무거우면 등불터에 내려놓고 가요.', '별빛 언덕엔 가벼워진 마음들이 모여 있어요.'];
  function spawnNpc() {
    const el = document.createElement('div');
    el.className = 'person npc';
    el.innerHTML = '<div class="p-label">🌱 숲지기 새싹</div>' + SPROUT_SVG;
    peopleEl.appendChild(el);
    npc.el = el;
  }
  function npcTalk() { showBubble(npc.el, NPC_LINES[npc.line++ % NPC_LINES.length], 3600); }

  const SHEEP_SVG = `<svg viewBox="0 0 100 80" width="100%" aria-hidden="true" style="display:block">
    <ellipse cx="50" cy="73" rx="26" ry="5" fill="rgba(80,110,80,.18)"/>
    <path d="M24 34 q-10 -4 -6 4 q-8 2 -2 8 q-2 8 7 6" fill="#8a6b52"/>
    <g fill="#fff" stroke="#efe6d6" stroke-width="1"><circle cx="34" cy="40" r="11"/><circle cx="46" cy="33" r="13"/><circle cx="61" cy="34" r="13"/><circle cx="72" cy="42" r="11"/><circle cx="40" cy="50" r="12"/><circle cx="55" cy="52" r="13"/><circle cx="68" cy="50" r="11"/></g>
    <rect x="36" y="60" width="4.5" height="12" rx="2" fill="#7c614a"/><rect x="62" y="60" width="4.5" height="12" rx="2" fill="#7c614a"/>
    <ellipse cx="26" cy="44" rx="12" ry="11" fill="#fdf7ec"/>
    <path d="M18 38 q-9 -3 -7 6 q0 7 8 4" fill="none" stroke="#c89b6a" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="23" cy="43" r="2.3" fill="#4b4335"/><circle cx="31" cy="43" r="2.3" fill="#4b4335"/>
    <ellipse cx="27" cy="48" rx="3" ry="2" fill="#f3c4b0"/>
    <path d="M25 50 q2 2 4 0" fill="none" stroke="#4b4335" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const sheep = [];
  function spawnSheep() {
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'sheep';
      el.innerHTML = `<div class="bob">${SHEEP_SVG}</div>`;
      peopleEl.appendChild(el);
      sheep.push({ el, x: rand(520, 2150), d: rand(0.1, 0.9), dir: Math.random() < 0.5 ? -1 : 1, speed: rand(16, 30), graze: 0 });
    }
  }
  function updateSheep(dt) {
    sheep.forEach((s) => {
      if (s.graze > 0) { s.graze -= dt; s.el.classList.add('graze'); }
      else {
        s.el.classList.remove('graze');
        s.x += s.dir * s.speed * dt;
        if (s.x < 480) { s.x = 480; s.dir = 1; }
        if (s.x > 2180) { s.x = 2180; s.dir = -1; }
        if (Math.random() < 0.25 * dt) s.dir *= -1;
        if (Math.random() < 0.15 * dt) s.graze = rand(1.6, 4);
      }
      s.el.classList.toggle('flip', s.dir < 0);
      placeAt(s.el, s.x, s.d, 0.92);
    });
  }

  /* ===================== 숲 소리 ===================== */
  const Sound = (function () {
    let ctx, master, sfx, on = false, windStarted = false, birdTimer = null;
    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(ctx.destination);
    }
    function startWind() {
      const size = 2 * ctx.sampleRate, buf = ctx.createBuffer(1, size, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) { const w = Math.random() * 2 - 1; d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
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
        o.frequency.setValueAtTime(f * 0.8, st);
        o.frequency.exponentialRampToValueAtTime(f * 1.25, st + 0.04);
        o.frequency.exponentialRampToValueAtTime(f * 0.9, st + 0.085);
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
      } else {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        clearTimeout(birdTimer);
      }
      return on;
    }
    function tone(freqs, gap, vol, len) {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      freqs.forEach((f, i) => {
        const st = t + i * gap, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(vol, st + 0.015); g.gain.exponentialRampToValueAtTime(0.001, st + len);
        o.connect(g); g.connect(sfx); o.start(st); o.stop(st + len + 0.05);
      });
    }
    return {
      toggle,
      tok() { tone([430], 0, 0.2, 0.18); },
      chime(soft) { tone(soft ? [523.25, 659.25] : [523.25, 659.25, 783.99, 1046.5], 0.12, soft ? 0.07 : 0.11, 1.2); },
    };
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

  /* ===================== 상태(염원·별) ===================== */
  const state = { wishes: [], stars: { count: 0, recent: [] } };
  const seen = new Set();
  let visitsToday = 0, online = 1, presenceOk = false;
  const normKind = (k) => (k === KIND_LETGO ? KIND_LETGO : KIND_HOPE);
  function normWish(w) {
    if (typeof w === 'string') return { id: '', text: w, kind: KIND_HOPE, empathy: 0, at: 0 };
    return { id: String(w.id || ''), text: String(w.text || w.content || ''), kind: normKind(w.kind), empathy: Number(w.empathy) || 0, at: Number(w.at) || 0 };
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
  }
  function saveLocal() { store.set('ms_local', { wishes: state.wishes.slice(0, 60), stars: state.stars }); }

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
      const ws = (d.wishes || []).map(normWish).filter((w) => w.text);
      const fresh = first ? [] : ws.filter((w) => w.id && !seen.has(w.id));
      ws.forEach((w) => { if (w.id) seen.add(w.id); });
      state.wishes = ws;
      const st = d.stars || {};
      state.stars = { count: Number(st.count) || 0, recent: (st.recent || []).map((s) => ({ text: String(s.text || ''), kind: normKind(s.kind) })) };
      visitsToday = Number(d.visitsToday) || visitsToday;
      if (first) ws.slice(0, 8).reverse().forEach((w, i) => setTimeout(() => floatLantern(w.text, w.kind), 600 + i * 1300));
      else fresh.slice(0, 3).forEach((w, i) => setTimeout(() => floatLantern(w.text, w.kind), i * 900));
      afterState();
    } catch (e) {
      console.warn('[마음쉼터] 상태를 불러오지 못했어요', e);
      renderBadge();
    }
  }
  function afterState() {
    renderBadge();
    renderStarfield();
    $('starCount').textContent = '별 ' + state.stars.count + '개';
    $('wishCount').textContent = state.wishes.length ? state.wishes.length + '개의 마음' : '함께 보기';
    if (!$('boardModal').hidden) renderBoard();
    if (!$('starsModal').hidden) renderStars();
  }
  function renderBadge() {
    const parts = [];
    if (sheetMode && presenceOk) parts.push('지금 <b>' + Number(online) + '</b>명 함께');
    if (visitsToday) parts.push('오늘 ' + Number(visitsToday) + '명 다녀감');
    $('visitorBadge').innerHTML = parts.length ? parts.join(' · ') : '오늘도 숲이 열려 있어요';
  }

  function renderStarfield() {
    const hill = zoneById('hill');
    const n = Math.min(state.stars.count, 48);
    starfieldEl.textContent = '';
    const prand = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'star-dot'; s.textContent = '✦';
      s.style.left = (hill.x + (prand(i) * 2 - 1) * 175).toFixed(0) + 'px';
      s.style.top = (bandTop - (120 + prand(i + 99) * 180) * lmScale).toFixed(0) + 'px';
      s.style.fontSize = (15 + prand(i + 7) * 12).toFixed(0) + 'px';
      s.style.animationDelay = (-prand(i + 3) * 3).toFixed(2) + 's';
      starfieldEl.appendChild(s);
    }
  }

  /* ===================== 등불 ===================== */
  function floatLantern(text, kind) {
    const layer = $('lanternLayer');
    if (layer.children.length >= (cfg.MAX_LANTERNS || 24)) layer.removeChild(layer.firstChild);
    const el = document.createElement('div');
    el.className = 'lantern' + (kind === KIND_LETGO ? ' letgo' : '');
    el.style.left = rand(8, 88) + '%';
    el.style.setProperty('--dur', rand(22, 34) + 's');
    el.style.setProperty('--drift', rand(-30, 30) + 'px');
    el.innerHTML = '<div class="glow"></div><div class="text"></div>';
    el.querySelector('.text').textContent = text;
    layer.appendChild(el);
    el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
  }
  function sparkle() {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.style.left = (vw / 2 + rand(-40, 40)) + 'px';
      s.style.top = (vh * 0.55 + rand(-30, 30)) + 'px';
      s.style.setProperty('--sx', rand(-140, 140) + 'px');
      s.style.setProperty('--sy', rand(-260, -120) + 'px');
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
  const MODALS = ['introModal', 'guideModal', 'breathModal', 'beadsModal', 'boardModal', 'wishModal', 'starsModal', 'mapModal'];
  const ZONE_OF_MODAL = { guideModal: 'plaza', breathModal: 'tree', beadsModal: 'spring', boardModal: 'lantern', starsModal: 'hill' };
  const modalOpen = () => MODALS.some((id) => !$(id).hidden) || !$('ritual').hidden || !$('loading').hidden;
  const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT'); };
  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) {
    if ($(id).hidden) return;
    $(id).hidden = true;
    if (id === 'breathModal') stopBreath();
    if (id === 'mapModal') stopMapLive();
    if (ZONE_OF_MODAL[id] && !Object.keys(ZONE_OF_MODAL).some((m) => !$(m).hidden)) { me.zone = ''; setZoneIcon(me.el, ''); }
  }
  function closeTop() {
    for (let i = MODALS.length - 1; i >= 0; i--) {
      const id = MODALS[i];
      if (!$(id).hidden) { if (id === 'introModal' && !profile) return; closeModal(id); return; }
    }
  }
  document.querySelectorAll('.modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target !== bd) return;
      if (bd.id === 'introModal' && !profile) return;
      closeModal(bd.id);
    });
  });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModal(b.closest('.modal-backdrop').id)));

  /* ===================== 쉼터 들어가기 · 찾아가기 ===================== */
  let stroll = false, strollPause = 0, lastStrollZone = null;
  function setStroll(on) {
    if (stroll === on) return;
    stroll = on;
    $('strollBtn').classList.toggle('on', on);
    if (on) { toast('발길 닿는 대로 쉼터를 둘러볼게요. 방향키나 화면을 누르면 멈춰요.'); }
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
  }
  function goTo(id, enter) {
    const z = zoneById(id); if (!z) return;
    setStroll(false);
    if (enter && Math.abs(me.x - z.x) < NEAR * 0.85) { enterZone(id); return; }
    const side = me.x < z.x ? -1 : 1;
    me.target = { x: clamp(z.x + side * 55, 40, W - 40), d: 0.3, zone: id, enter: !!enter, visit: false };
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
    if (strollPause > 0) {
      strollPause -= dt;
      if (strollPause <= 0) { me.zone = ''; setZoneIcon(me.el, ''); }
      return;
    }
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
    if (isTyping() || modalOpen()) return;
    const k = KEYMAP[e.key];
    if (k) { keys[k] = true; e.preventDefault(); setStroll(false); me.target = null; return; }
    if ((e.key === 'Enter' || e.key === ' ') && nearZone) {
      const a = document.activeElement;
      if (a && a.tagName === 'BUTTON') return; // 버튼에 초점이 있으면 버튼 동작에 맡김
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
    tapMark(wx, d);
  });
  function tapMark(x, d) {
    const m = document.createElement('div');
    m.className = 'tapmark';
    m.style.left = x + 'px'; m.style.top = (bandTop + d * bandH) + 'px'; m.style.zIndex = '15';
    decorEl.appendChild(m);
    setTimeout(() => m.remove(), 750);
  }

  document.querySelectorAll('.controls [data-go]').forEach((b) => b.addEventListener('click', () => { b.blur(); goTo(b.dataset.go, true); }));
  $('strollBtn').addEventListener('click', (e) => { e.currentTarget.blur(); setStroll(!stroll); });
  $('mapBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openMap(); });
  $('profileBtn').addEventListener('click', (e) => { e.currentTarget.blur(); openIntro(); });
  $('soundBtn').addEventListener('click', (e) => {
    e.currentTarget.blur();
    const on = Sound.toggle();
    $('soundBtn').classList.toggle('on', on);
    $('soundIcon').textContent = on ? '🔊' : '🔈';
    $('soundBtn').title = on ? '소리 끄기' : '소리 켜기';
  });

  /* ===================== 매 프레임 ===================== */
  let nearZone = null, lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    updateMe(dt);
    updateOthers(dt);
    updateSheep(dt);
    updateCamera(dt);
    updateNear();
    requestAnimationFrame(frame);
  }
  function updateMe(dt) {
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
    if (npc.el) placeAt(npc.el, npc.x, npc.d, 0.95);
  }
  function updateCamera(dt) {
    const target = clamp(me.x - vw / 2, 0, Math.max(0, W - vw));
    cam += (target - cam) * Math.min(1, dt * 5);
    worldEl.style.transform = `translate3d(${(-cam).toFixed(1)}px,0,0)`;
    $('hills').style.transform = `translate3d(${(-cam * 0.25).toFixed(1)}px,0,0)`;
    $('treeline').style.transform = `translate3d(${(-cam * 0.5).toFixed(1)}px,0,0)`;
  }
  function updateNear() {
    const nz = modalOpen() ? null : (ZONES.find((z) => Math.abs(me.x - z.x) < NEAR) || null);
    if (nz === nearZone) return;
    if (nearZone) lmEls[nearZone.id].classList.remove('near');
    if (nz) lmEls[nz.id].classList.add('near');
    nearZone = nz;
    document.querySelectorAll('.controls [data-go]').forEach((b) => b.classList.toggle('here', !!nz && b.dataset.go === nz.id));
  }

  /* ===================== 함께 접속한 사람 ===================== */
  const others = new Map();
  function applyPresence(users) {
    const keep = new Set();
    users.forEach((u) => {
      if (!u || !u.k) return;
      const p = { a: u.a | 0, b: u.b | 0, h: u.h | 0, o: u.o | 0 };
      if (!validProfile(p)) return;
      keep.add(u.k);
      let o = others.get(u.k);
      if (!o) {
        o = { el: makePerson(p, false), x: +u.x || 0, d: +u.y || 0, look: '' };
        peopleEl.appendChild(o.el);
        others.set(u.k, o);
      }
      const look = [p.a, p.b, p.h, p.o].join(',');
      if (o.look && o.look !== look) setLook(o.el, p, false);
      o.look = look;
      o.tx = clamp(+u.x || 0, 0, W); o.td = clamp(+u.y || 0, 0, 1); o.f = u.f < 0 ? -1 : 1;
      if (o.z !== u.z) { o.z = u.z; setZoneIcon(o.el, u.z); }
    });
    for (const [k, o] of others) {
      if (!keep.has(k)) { o.el.classList.add('leaving'); setTimeout(() => o.el.remove(), 600); others.delete(k); }
    }
  }
  function updateOthers(dt) {
    for (const o of others.values()) {
      const dx = o.tx - o.x, dpx = (o.td - o.d) * bandH, dist = Math.hypot(dx, dpx), step = 260 * dt;
      if (dist > 700 || dist <= step) { o.x = o.tx; o.d = o.td; }
      else { o.x += dx / dist * step; o.d += (dpx / dist * step) / bandH; }
      const moving = dist > 2;
      o.el.classList.toggle('walking', moving);
      o.el.classList.toggle('left', (Math.abs(dx) > 2 ? (dx < 0) : o.f < 0));
      placeAt(o.el, o.x, o.d);
    }
  }
  let presenceFails = 0;
  async function presenceLoop() {
    if (!sheetMode) return;
    if (document.hidden || !profile) { setTimeout(presenceLoop, 4000); return; }
    try {
      const r = await sheetPost({
        type: 'presence', sessionId: sid,
        x: Math.round(me.x), y: Math.round(me.d * 100) / 100, z: me.zone || '', f: me.facing,
        h: profile.h, o: profile.o, a: profile.a, b: profile.b,
      });
      if (r && r.ok && Array.isArray(r.users)) {
        presenceOk = true; presenceFails = 0;
        online = r.online || r.users.length + 1;
        applyPresence(r.users);
      } else presenceFails++;
    } catch (e) { presenceFails++; }
    renderBadge();
    setTimeout(presenceLoop, presenceFails > 2 ? 30000 : 4500);
  }

  /* ===================== 숨 쉬는 나무 ===================== */
  let breaths = Number(store.get('ms_breaths', 0)) || 0, breathTimer = null;
  function updateBreathUI() {
    $('breatheCount').textContent = breaths + '번째 숨';
    $('breathTotal').textContent = '함께 쉰 숨 ' + breaths + '번';
  }
  function startBreath() {
    stopBreath();
    const c = $('breathCircle'), w = $('breathWord');
    const steps = [['들이쉬어요', 'in', 4000], ['잠시 멈추고', 'hold', 2000], ['천천히 내쉬어요', 'out', 6000]];
    let i = 0;
    c.style.transitionDuration = '0ms'; c.className = 'breath-circle'; w.textContent = '준비';
    const step = () => {
      const [txt, cls, ms] = steps[i];
      c.style.transitionDuration = ms + 'ms'; c.className = 'breath-circle ' + cls; w.textContent = txt;
      breathTimer = setTimeout(() => {
        i = (i + 1) % steps.length;
        if (i === 0) { breaths++; store.set('ms_breaths', breaths); updateBreathUI(); Sound.chime(true); }
        step();
      }, ms);
    };
    breathTimer = setTimeout(step, 700);
  }
  function stopBreath() { clearTimeout(breathTimer); breathTimer = null; }

  /* ===================== 마음 구슬 ===================== */
  (function beads() {
    const COUNT = 10, strand = $('beadStrand');
    let active = 0, total = Number(store.get('ms_beads', 0)) || 0;
    const show = () => { $('beadsCount').textContent = total + '알'; $('beadTotal').textContent = '함께 넘긴 구슬 ' + total + '알'; };
    show();
    for (let i = 0; i < COUNT; i++) { const b = document.createElement('div'); b.className = 'bead' + (i === 0 ? ' active' : ''); strand.appendChild(b); }
    function roll() {
      const kids = strand.children;
      kids[active].classList.remove('active'); kids[active].classList.add('rolled');
      active = (active + 1) % COUNT;
      if (active === 0) setTimeout(() => { for (const k of kids) k.classList.remove('rolled'); }, 320);
      kids[active].classList.add('active');
      total++; store.set('ms_beads', total); show();
      $('beadHint').textContent = ['좋아요, 그대로 한 번 더', '숨을 길게 내쉬며', '천천히, 서두르지 않아도 돼요'][total % 3];
      Sound.tok();
    }
    $('beadStage').addEventListener('click', roll);
    $('beadStage').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roll(); } });
  })();

  /* ===================== 염원 등불터 (함께 보기 · 공감) ===================== */
  let boardTab = 'all';
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    boardTab = t.dataset.tab;
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === t));
    renderBoard();
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
  function emptyEl(html) { const e = document.createElement('div'); e.className = 'empty'; e.innerHTML = html; return e; }
  function meter(n) {
    const m = document.createElement('span'); m.className = 'meter';
    for (let i = 0; i < STAR_AT; i++) { const d = document.createElement('i'); if (i < n) d.className = 'on'; m.appendChild(d); }
    return m;
  }
  function wishCard(w, isMine) {
    const c = document.createElement('div');
    c.className = 'wcard' + (w.kind === KIND_LETGO ? ' letgo' : '');
    const t = document.createElement('div'); t.className = 'wtext';
    t.textContent = (w.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + w.text;
    const meta = document.createElement('div'); meta.className = 'wmeta';
    const left = document.createElement('span');
    const ago = timeAgo(w.at);
    left.append((ago ? ago + ' · ' : '') + (w.kind === KIND_LETGO ? '토닥임 ' : '응원 ') + Math.min(w.empathy, STAR_AT) + '/' + STAR_AT);
    left.appendChild(meter(w.empathy));
    const btn = document.createElement('button'); btn.className = 'wbtn'; btn.type = 'button';
    const likes = getLikes();
    if (isMine) {
      btn.classList.add('self'); btn.textContent = '✨ 가벼워졌어요';
      btn.addEventListener('click', () => resolveWish(w.id, btn));
    } else if (!w.id) {
      btn.classList.add('done'); btn.disabled = true; btn.textContent = w.kind === KIND_LETGO ? '🤲 토닥토닥' : '🤍 응원해요';
    } else if (likes[w.id]) {
      btn.classList.add('done'); btn.disabled = true; btn.textContent = w.kind === KIND_LETGO ? '🤲 토닥였어요' : '🤍 응원했어요';
    } else {
      btn.textContent = w.kind === KIND_LETGO ? '🤲 토닥토닥' : '🤍 응원해요';
      btn.addEventListener('click', () => sendEmpathy(w));
    }
    meta.append(left, btn);
    c.append(t, meta);
    return c;
  }
  function mineCard(m, live) {
    if (live) return wishCard(live, true);
    const c = document.createElement('div');
    c.className = 'wcard' + (m.kind === KIND_LETGO ? ' letgo' : '');
    const t = document.createElement('div'); t.className = 'wtext';
    t.textContent = (m.kind === KIND_LETGO ? '🍂 ' : '🏮 ') + m.text;
    const meta = document.createElement('div'); meta.className = 'wmeta';
    const st = document.createElement('span'); st.className = 'wstatus';
    meta.appendChild(st);
    if (m.status === 'pending') {
      st.textContent = '🕊️ 선생님이 살펴보고 있어요';
      if (m.id) {
        const b = document.createElement('button'); b.className = 'wbtn self'; b.type = 'button'; b.textContent = '✨ 가벼워졌어요';
        b.addEventListener('click', () => resolveWish(m.id, b));
        meta.appendChild(b);
      }
    } else st.textContent = '⭐ 별이 되었어요';
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
      if (!mine.length) list.appendChild(emptyEl('아직 올린 마음이 없어요.<br>위의 [마음 올리기]를 눌러 보세요.'));
      mine.forEach((m) => list.appendChild(mineCard(m, state.wishes.find((w) => w.id && w.id === m.id))));
      $('boardCount').textContent = mine.length ? '내가 올린 마음 ' + mine.length + '개' : '';
    }
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
    if (!sheetMode) { if (w.empathy >= STAR_AT) becomeStar(w, 'together'); else saveLocal(); return; }
    try {
      const r = await sheetPost({ type: 'empathy', id: w.id, sessionId: sid });
      if (r && r.ok) {
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
    if (m) { m.status = 'star'; store.set('ms_mine', mine); }
    if (!sheetMode) saveLocal();
    afterState(); renderBoard();
    Sound.chime(); sparkle();
    toast(how === 'self' ? '✨ 마음이 가벼워져 별이 되었어요. 별빛 언덕에서 빛날 거예요.' : '✨ 함께 보낸 마음 덕분에 이 염원이 별이 되었어요!', 4200);
  }
  async function resolveWish(id, btn) {
    if (btn) btn.disabled = true;
    const w = state.wishes.find((x) => x.id === id);
    const mine = getMine(); const m = mine.find((x) => x.id === id);
    if (!sheetMode) { if (w) becomeStar(w, 'self'); return; }
    try {
      const r = await sheetPost({ type: 'resolve', id, sessionId: sid });
      if (r && r.ok) {
        if (w) becomeStar(w, 'self');
        else { if (m) { m.status = 'star'; store.set('ms_mine', mine); } renderBoard(); Sound.chime(); toast('✨ 마음을 내려놓았어요. 선생님이 확인하면 별빛 언덕에서 빛날 거예요.', 4200); }
      } else { if (btn) btn.disabled = false; toast((r && r.reason) || '잠시 뒤에 다시 눌러 주세요.'); }
    } catch (e) { if (btn) btn.disabled = false; toast('연결이 원활하지 않아요.'); }
  }

  /* ===================== 마음 올리기 ===================== */
  let wishKind = KIND_HOPE;
  const KIND_TEXT = {
    [KIND_HOPE]: { desc: '이루어지길 바라는 마음을 등불로 띄워요. 따뜻한 말만 담아 주세요.', ph: '예) 오늘도 무사히 지나가기를', btn: '띄우기' },
    [KIND_LETGO]: { desc: '마음을 무겁게 하는 걱정을 나뭇잎에 실어 흘려보내요. 누군가를 탓하는 말 대신 내 마음을 적어 주세요.', ph: '예) 발표가 너무 떨려요', btn: '흘려보내기' },
  };
  function setKind(k) {
    wishKind = k;
    document.querySelectorAll('.pill').forEach((p) => { const on = p.dataset.kind === k; p.classList.toggle('on', on); p.setAttribute('aria-checked', on ? 'true' : 'false'); });
    $('kindDesc').textContent = KIND_TEXT[k].desc;
    $('wishInput').placeholder = KIND_TEXT[k].ph;
    $('wishSubmit').textContent = KIND_TEXT[k].btn;
  }
  document.querySelectorAll('.pill').forEach((p) => p.addEventListener('click', () => setKind(p.dataset.kind)));
  $('openWrite').addEventListener('click', () => {
    $('wishMsg').textContent = ''; $('wishMsg').className = 'modal-msg';
    $('wishInput').value = ''; $('charCount').textContent = '0 / 100';
    setKind(KIND_HOPE);
    openModal('wishModal');
    setTimeout(() => $('wishInput').focus(), 60);
  });
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
        await delay(700);
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
      if (sheetMode && !r.pending && r.id) { state.wishes.unshift({ id: r.id, text, kind, empathy: 0, at: Date.now() }); seen.add(r.id); }
      closeModal('wishModal');
      afterState(); renderBoard();
      if (kind === KIND_LETGO) runRitual(text, !!r.pending);
      else {
        if (!r.pending) floatLantern(text, kind);
        toast(r.pending ? '올렸어요. 선생님이 확인하면 등불이 켜져요.' : '🏮 등불이 숲 위로 떠올랐어요.');
      }
    } finally { $('loading').hidden = true; $('wishSubmit').disabled = false; }
  }

  /* ===================== 흘려보내기 의식 ===================== */
  function runRitual(text, pending) {
    const r = $('ritual'), leaf = $('ritualLeaf'), msg = $('ritualMsg');
    $('ritualText').textContent = text;
    leaf.classList.remove('go'); void leaf.offsetWidth;
    msg.classList.remove('show');
    msg.textContent = '적어서 내려놓은 마음은 이미 조금 가벼워졌어요. ' +
      (pending ? '선생님이 살펴본 뒤, 다른 친구들의 토닥임이 닿을 거예요.' : '이제 다른 친구들이 토닥토닥 마음을 보내 줄 거예요.');
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
    state.stars.recent.forEach((s) => {
      const c = document.createElement('div'); c.className = 'scard';
      c.textContent = s.text;
      list.appendChild(c);
    });
  }

  /* ===================== 숲 지도 ===================== */
  const MAP_PTS = { plaza: [92, 252], tree: [150, 140], spring: [236, 196], lantern: [322, 118], hill: [368, 244] };
  function mapXY(x) {
    if (x <= ZONES[0].x) return MAP_PTS[ZONES[0].id];
    for (let i = 0; i < ZONES.length - 1; i++) {
      const a = ZONES[i], b = ZONES[i + 1];
      if (x <= b.x) {
        const t = (x - a.x) / (b.x - a.x), pa = MAP_PTS[a.id], pb = MAP_PTS[b.id];
        return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t];
      }
    }
    return MAP_PTS[ZONES[ZONES.length - 1].id];
  }
  (function buildMap() {
    const pts = ZONES.map((z) => MAP_PTS[z.id].join(',')).join(' ');
    const prand = (i) => { const x = Math.sin(i * 91.3 + 7.1) * 10000; return x - Math.floor(x); };
    const nearPath = (x, y) => ZONES.slice(0, -1).some((z, i) => {
      const [ax, ay] = MAP_PTS[z.id], [bx, by] = MAP_PTS[ZONES[i + 1].id];
      const dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
      return Math.hypot(ax + dx * t - x, ay + dy * t - y) < 18;
    });
    let trees = '';
    for (let i = 0; i < 48; i++) {
      const x = 50 + prand(i) * 340, y = 60 + prand(i + 50) * 230;
      if (ZONES.some((z) => Math.hypot(MAP_PTS[z.id][0] - x, MAP_PTS[z.id][1] - y) < 40 || (Math.abs(MAP_PTS[z.id][0] - x) < 44 && y > MAP_PTS[z.id][1] && y - MAP_PTS[z.id][1] < 46))) continue;
      if (nearPath(x, y)) continue;
      trees += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})"><circle r="11" fill="#6ea05d"/><circle r="7" cy="-6" fill="#7cae69"/></g>`;
    }
    const spots = ZONES.map((z) => {
      const [x, y] = MAP_PTS[z.id];
      return `<g class="map-spot" data-zone="${z.id}" transform="translate(${x},${y})">
        <circle r="15" fill="#fffaf1" stroke="#e5b86a" stroke-width="2.5"/>
        <text y="5" text-anchor="middle" font-size="14">${z.icon}</text>
        <text class="spot-name" y="31" text-anchor="middle" font-size="10" font-weight="800" fill="#4b4335">${z.name}</text></g>`;
    }).join('');
    $('mapFrame').innerHTML = `
      <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
        <rect width="440" height="340" fill="#bfe3cf"/>
        <path d="M40 60 Q30 150 50 250 Q70 320 180 318 Q320 322 390 260 Q418 170 398 90 Q360 30 220 28 Q90 24 40 60 Z" fill="#9ecb84"/>
        <path d="M70 90 Q60 170 80 240 Q110 295 200 292 Q310 294 360 240 Q384 165 366 100 Q330 58 220 56 Q110 54 70 90 Z" fill="#b2d79a"/>
        <polyline points="${pts}" fill="none" stroke="#eadbb2" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${pts}" fill="none" stroke="#d9c59a" stroke-width="2" stroke-dasharray="4 7" stroke-linecap="round"/>
        ${trees}${spots}<g id="mapPeople"></g>
      </svg>`;
    $('mapFrame').addEventListener('click', (e) => {
      const s = e.target.closest('.map-spot');
      if (!s) return;
      closeModal('mapModal');
      goTo(s.dataset.zone, true);
    });
  })();
  let mapTimer = null;
  function drawMapPeople() {
    const g = $('mapPeople'); if (!g) return;
    let s = '';
    for (const o of others.values()) {
      const [x, y] = mapXY(o.x);
      s += `<circle cx="${x.toFixed(1)}" cy="${(y + (o.d - 0.5) * 12).toFixed(1)}" r="5" fill="#6a8fd0" stroke="#fff" stroke-width="2"/>`;
    }
    const [mx, my] = mapXY(me.x);
    s += `<circle cx="${mx.toFixed(1)}" cy="${(my + (me.d - 0.5) * 12).toFixed(1)}" r="7.5" fill="#e8813a" stroke="#fff" stroke-width="2.5"/>`;
    g.innerHTML = s;
  }
  function openMap() { drawMapPeople(); openModal('mapModal'); clearInterval(mapTimer); mapTimer = setInterval(drawMapPeople, 500); }
  function stopMapLive() { clearInterval(mapTimer); mapTimer = null; }

  /* ===================== 내 모습 고르기 ===================== */
  let draft = null;
  function openIntro() {
    draft = Object.assign({}, profile || randomProfile());
    renderIntro();
    $('introEnter').textContent = profile ? '이 모습으로 할게요' : '숲으로 들어가기';
    openModal('introModal');
  }
  function renderIntro() {
    $('introPreview').innerHTML = personSVG(draft.h, draft.o);
    $('introNick').textContent = nameOf(draft);
    const sw = (elId, colors, key) => {
      const box = $(elId); box.textContent = '';
      colors.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'swatch' + (draft[key] === i ? ' on' : '');
        b.style.background = c; b.setAttribute('aria-label', (key === 'h' ? '머리 색 ' : '옷 색 ') + (i + 1));
        b.addEventListener('click', () => { draft[key] = i; renderIntro(); });
        box.appendChild(b);
      });
    };
    sw('hairSwatches', HAIR, 'h');
    sw('outfitSwatches', OUTFIT, 'o');
  }
  $('nickReroll').addEventListener('click', () => {
    const before = draft.a + ',' + draft.b;
    do { draft.a = randInt(ADJ.length); draft.b = randInt(NOUN.length); } while (draft.a + ',' + draft.b === before);
    renderIntro();
  });
  $('introEnter').addEventListener('click', () => {
    const firstTime = !profile;
    profile = Object.assign({}, draft);
    store.set('ms_profile', profile);
    setLook(me.el, profile, true);
    closeModal('introModal');
    if (firstTime) welcome();
  });
  function welcome() {
    toast(isTouch ? '가고 싶은 곳을 눌러 걸어 보세요. 아래 버튼을 누르면 쉼터까지 스스로 걸어가요.' : '방향키로 걸어 보세요. 아래 버튼을 누르면 쉼터까지 스스로 걸어가요.', 5200);
    setTimeout(() => showBubble(me.el, '안녕! 천천히 둘러볼게요 🌿', 3200), 400);
  }

  /* ===================== 시작 ===================== */
  function start() {
    measure();
    buildScene();
    spawnNpc();
    spawnSheep();
    me.el = makePerson(profile || randomProfile(), true);
    peopleEl.appendChild(me.el);
    layout();
    updateBreathUI();
    cam = clamp(me.x - vw / 2, 0, Math.max(0, W - vw));
    requestAnimationFrame(frame);
    window.addEventListener('resize', () => { measure(); layout(); });
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
    window.__ms = { me, others, state, goTo, enterZone, keys, get cam() { return cam; } };
  }
  start();
})();
