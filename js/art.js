/* ============================================================
 *  온라인 마음쉼터 — 그림 모음 (사람 · 동물 · 쉼터 · 꽃 · 장식)
 *  모든 그림은 SVG 글자로 만들어서 따로 그림 파일이 필요 없어요.
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 고를 수 있는 모습 ---------- */
  const SKIN = ['#ffe6d3', '#f9d3b6', '#efbf98', '#d59d70', '#ab754d'];
  const HAIR = ['#3a2b24', '#6e4733', '#a5683f', '#dba660', '#f1d78f', '#7b5ca8', '#dd7484', '#5d8fc6'];
  const OUTFIT = ['#8fb8e3', '#f5a7a4', '#a7d79a', '#f7d585', '#c7aeea', '#f6b67f', '#9adbd3', '#f4f0e8'];
  const STYLE_NAMES = ['짧은 머리', '단발', '긴 머리', '양갈래', '포니테일', '뽀글 머리'];
  const TYPE_NAMES = ['티셔츠', '후드티', '원피스', '멜빵바지'];

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  const pick = (arr, i) => arr[i] || arr[0];

  /* ---------- 머리 모양 ---------- */
  function hairBack(st, hc) {
    const d = shade(hc, 0.85);
    switch (st) {
      case 1: return `<path d="M15 36 Q13 60 23 62 L57 62 Q67 60 65 36 Z" fill="${d}"/>`;
      case 2: return `<path d="M15 34 Q10 80 25 82 Q40 85 55 82 Q70 80 65 34 Z" fill="${d}"/>`;
      case 3: return `<g fill="${d}"><path d="M17 40 Q2 46 6 66 Q9 76 16 72 Q12 60 20 50 Z"/><path d="M63 40 Q78 46 74 66 Q71 76 64 72 Q68 60 60 50 Z"/></g>
        <g fill="#ff9fb0"><circle cx="16" cy="42" r="3.2"/><circle cx="64" cy="42" r="3.2"/></g>`;
      case 4: return `<path d="M58 24 Q76 22 74 44 Q73 62 66 70 Q70 52 62 40 Z" fill="${d}"/><circle cx="62" cy="27" r="3.4" fill="#ffcf6e"/>`;
      default: return '';
    }
  }
  function hairFront(st, hc) {
    const hl = shade(hc, 1.18);
    if (st === 5) {
      let s = '';
      const pts = [[18, 34], [20, 24], [27, 17], [36, 13], [45, 13], [54, 17], [60, 24], [62, 34], [31, 21], [41, 18], [50, 21]];
      pts.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="7.5"/>`; });
      return `<g fill="${hc}">${s}</g><g fill="${hl}" opacity=".5"><circle cx="34" cy="16" r="3"/><circle cx="48" cy="17" r="2.4"/></g>`;
    }
    let bang = 'M17 40 Q14 13 40 12 Q66 13 63 40 Q60 27 51 25 Q44 31 30 28 Q22 31 17 40 Z';
    if (st === 0) bang = 'M17 38 Q15 12 40 11 Q65 12 63 38 Q61 26 54 23 Q50 29 41 26 Q33 31 25 26 Q20 30 17 38 Z';
    if (st === 2 || st === 1) bang = 'M16 42 Q13 12 40 11 Q67 12 64 42 Q62 28 56 24 Q46 30 34 27 Q26 26 22 30 Q18 34 16 42 Z';
    return `<path d="${bang}" fill="${hc}"/><path d="M27 17 Q36 12 46 14" stroke="${hl}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>`;
  }

  /* ---------- 옷 ---------- */
  function body(t, oc, sk) {
    const dk = shade(oc, 0.84), pants = '#6f7a99', shoe = '#7a5a43';
    const legs = (col) => `
      <g class="leg leg-b"><rect x="43" y="80" width="7.5" height="20" rx="3.6" fill="${col}"/><ellipse cx="47.5" cy="101" rx="5.6" ry="3.2" fill="${shoe}"/></g>
      <g class="leg leg-f"><rect x="30" y="80" width="7.5" height="20" rx="3.6" fill="${col}"/><ellipse cx="33" cy="101" rx="5.6" ry="3.2" fill="${shoe}"/></g>`;
    const armB = (col) => `<g class="arm arm-b"><rect x="51" y="60" width="7" height="18" rx="3.5" fill="${shade(col, 0.88)}"/><circle cx="54.5" cy="79" r="3.6" fill="${shade(sk, 0.95)}"/></g>`;
    const armF = (col) => `<g class="arm arm-f"><rect x="22" y="60" width="7" height="18" rx="3.5" fill="${col}"/><circle cx="25.5" cy="79" r="3.6" fill="${sk}"/></g>`;
    if (t === 1) { // 후드티
      return { back: armB(oc) + legs(pants), front: `
        <ellipse cx="40" cy="60" rx="14" ry="6" fill="${dk}"/>
        <rect x="26" y="58" width="28" height="26" rx="11" fill="${oc}"/>
        <path d="M32 74 H48 V80 Q40 82 32 80 Z" fill="${dk}" opacity=".55"/>
        <path d="M36 60 L35 69 M44 60 L45 69" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>` + armF(oc) };
    }
    if (t === 2) { // 원피스
      return { back: armB(oc) + legs(sk), front: `
        <path d="M30 58 H50 L58 88 Q40 93 22 88 Z" fill="${oc}"/>
        <path d="M23 86 Q40 91 57 86 L58 88 Q40 93 22 88 Z" fill="${dk}"/>
        <path d="M33 58 Q40 64 47 58" fill="#fff" opacity=".85"/>
        <circle cx="40" cy="68" r="1.4" fill="#fff"/><circle cx="40" cy="74" r="1.4" fill="#fff"/>` + armF(oc) };
    }
    if (t === 3) { // 멜빵바지
      const sh = '#fbf6ee';
      return { back: armB(sh) + legs(dk), front: `
        <rect x="27" y="58" width="26" height="22" rx="10" fill="${sh}"/>
        <path d="M29 68 H51 V84 Q40 87 29 84 Z" fill="${oc}"/>
        <rect x="33" y="66" width="14" height="9" rx="2" fill="${oc}"/>
        <path d="M31 60 L34 68 M49 60 L46 68" stroke="${oc}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="34.5" cy="68" r="1.5" fill="#fff"/><circle cx="45.5" cy="68" r="1.5" fill="#fff"/>` + armF(sh) };
    }
    // 티셔츠 + 반바지
    return { back: armB(oc) + legs(sk), front: `
      <rect x="31" y="77" width="18" height="8" rx="3" fill="${pants}"/>
      <rect x="27" y="58" width="26" height="22" rx="10" fill="${oc}"/>
      <path d="M35 59 Q40 63 45 59" fill="none" stroke="${dk}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="40" cy="70" r="3.2" fill="#fff" opacity=".55"/>` + armF(oc) };
  }

  /* ---------- 장식(가게 물건) ---------- */
  const ACC = [
    { id: 0, name: '없음', price: 0 },
    { id: 1, name: '분홍 리본', price: 8 },
    { id: 2, name: '꽃 머리핀', price: 8 },
    { id: 3, name: '새싹 머리띠', price: 10 },
    { id: 4, name: '동그란 안경', price: 12 },
    { id: 5, name: '포근한 목도리', price: 12 },
    { id: 6, name: '고양이 귀', price: 15 },
    { id: 7, name: '토끼 귀', price: 15 },
    { id: 8, name: '밀짚모자', price: 20 },
    { id: 9, name: '헤드폰', price: 25 },
    { id: 10, name: '별 왕관', price: 40 },
    { id: 11, name: '요정 날개', price: 50 },
    { id: 12, name: '산타 모자', price: 20 },
    { id: 13, name: '루돌프 뿔', price: 22 },
  ];
  function accBack(c) {
    if (c === 11) return `<g class="wings" opacity=".85"><path d="M30 64 Q6 40 8 66 Q10 84 30 72 Z" fill="#dff3ff" stroke="#b8def5"/><path d="M50 64 Q74 40 72 66 Q70 84 50 72 Z" fill="#dff3ff" stroke="#b8def5"/>
      <path d="M30 70 Q14 78 16 88 Q24 90 32 76 Z" fill="#f2e3ff"/><path d="M50 70 Q66 78 64 88 Q56 90 48 76 Z" fill="#f2e3ff"/></g>`;
    if (c === 6) return `<g fill="#3d3330"><path d="M20 22 L18 4 L33 15 Z"/><path d="M60 22 L62 4 L47 15 Z"/></g><g fill="#f7b3bf"><path d="M22 18 L21 9 L29 15 Z"/><path d="M58 18 L59 9 L51 15 Z"/></g>`;
    if (c === 7) return `<g fill="#fff" stroke="#eadfd6" stroke-width="1.2"><ellipse cx="30" cy="0" rx="5.5" ry="15" transform="rotate(-10 30 12)"/><ellipse cx="50" cy="0" rx="5.5" ry="15" transform="rotate(10 50 12)"/></g>
      <g fill="#f9c3cc"><ellipse cx="30" cy="1" rx="2.6" ry="10" transform="rotate(-10 30 12)"/><ellipse cx="50" cy="1" rx="2.6" ry="10" transform="rotate(10 50 12)"/></g>`;
    if (c === 13) return `<g fill="none" stroke="#9a6e4a" stroke-width="3.2" stroke-linecap="round">
      <path d="M28 12 Q22 2 24 -7"/><path d="M26 3 Q19 1 15 -3"/><path d="M25 -2 Q20 -6 21 -11"/>
      <path d="M52 12 Q58 2 56 -7"/><path d="M54 3 Q61 1 65 -3"/><path d="M55 -2 Q60 -6 59 -11"/></g>`;
    return '';
  }
  function accFront(c) {
    switch (c) {
      case 1: return `<g transform="translate(55 19)"><path d="M0 0 L-9 -6 L-9 6 Z M0 0 L9 -6 L9 6 Z" fill="#ff8fa8"/><circle r="3" fill="#ff6f8f"/></g>`;
      case 2: return `<g transform="translate(57 25)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="3.2" ry="5" transform="rotate(${a}) translate(0 -4)" fill="#ffd3e0"/>`).join('')}<circle r="2.6" fill="#ffd25e"/></g>`;
      case 3: return `<path d="M22 16 Q40 6 58 16" stroke="#9ccf7c" stroke-width="3" fill="none"/><path d="M40 10 L40 1" stroke="#7fb062" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M40 3 Q50 -4 50 7 Q43 9 40 3 Z" fill="#8fd16e"/><path d="M40 5 Q30 -2 30 9 Q37 11 40 5 Z" fill="#a8dd88"/>`;
      case 4: return `<g fill="rgba(255,255,255,.25)" stroke="#5b4a3c" stroke-width="1.8"><circle cx="31" cy="41" r="6.5"/><circle cx="49" cy="41" r="6.5"/></g><path d="M37.5 41 H42.5" stroke="#5b4a3c" stroke-width="1.8"/>`;
      case 5: return `<path d="M25 59 Q40 66 55 59 L55 64 Q40 71 25 64 Z" fill="#e66f6f"/><path d="M47 63 L50 78 L56 76 L52 62 Z" fill="#d95f5f"/>
        <path d="M27 61 L53 61" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>`;
      case 8: return `<ellipse cx="40" cy="19" rx="31" ry="7" fill="#e9c878"/><path d="M24 18 Q24 4 40 4 Q56 4 56 18 Z" fill="#f2d78f"/>
        <path d="M24 16 Q40 20 56 16 L56 19 Q40 23 24 19 Z" fill="#ef8f8f"/><path d="M14 20 Q40 25 66 20" stroke="#d6b05f" stroke-width="1" fill="none"/>`;
      case 9: return `<path d="M16 38 Q16 10 40 10 Q64 10 64 38" stroke="#6f7fa8" stroke-width="4" fill="none"/><rect x="11" y="33" width="9" height="14" rx="4" fill="#8fa0cc"/><rect x="60" y="33" width="9" height="14" rx="4" fill="#8fa0cc"/>`;
      case 10: return `<path d="M27 16 L29 4 L35 11 L40 2 L45 11 L51 4 L53 16 Z" fill="#ffd45e" stroke="#e6a92f" stroke-width="1.3" stroke-linejoin="round"/><circle cx="40" cy="11" r="1.8" fill="#ff8fa8"/>`;
      case 12: return `<path d="M18 21 Q20 1 44 5 Q62 8 66 20 Z" fill="#d8453e"/><path d="M34 7 Q50 6 61 16" stroke="#e8706a" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>
        <path d="M16 19 Q40 27 68 19 L68 26 Q40 34 16 26 Z" fill="#fbf7f2"/><circle cx="66" cy="8" r="6" fill="#fbf7f2"/>`;
      case 13: return `<circle cx="40" cy="48" r="4.2" fill="#e23b35"/><circle cx="40" cy="48" r="4.2" fill="#ff6a63" opacity=".5"/><circle cx="38.5" cy="46.5" r="1.3" fill="#fff" opacity=".85"/>`;
      default: return '';
    }
  }

  /** 사람 그리기 — p: {s 피부, h 머리색, hs 머리모양, o 옷색, ot 옷종류, c 장식} */
  // 장식 슬롯 — 슬롯마다 하나씩, 여러 슬롯은 함께 착용돼요
  const ACC_SLOT = { 1: 'hair', 2: 'hair', 3: 'hair', 4: 'face', 5: 'neck', 6: 'ears', 7: 'ears', 8: 'hat', 9: 'ears', 10: 'hat', 11: 'back', 12: 'hat', 13: 'ears' };
  const FRONT_Z = [5, 4, 1, 2, 3, 9, 8, 10, 12, 13]; // 뒤→앞 그리는 순서
  function wornList(p) {
    let list = Array.isArray(p.worn) ? p.worn : (p.c ? [p.c] : []);
    list = list.map((x) => x | 0).filter((x) => x >= 1 && x <= 13);
    return list.filter((v, i) => list.indexOf(v) === i);
  }
  function person(p) {
    const sk = pick(SKIN, p.s), hc = pick(HAIR, p.h), oc = pick(OUTFIT, p.o);
    const st = p.hs | 0;
    const worn = wornList(p);
    const backHead = worn.filter((id) => id === 6 || id === 7 || id === 13);
    const fronts = FRONT_Z.filter((id) => worn.indexOf(id) >= 0);
    const b = body(p.ot | 0, oc, sk);
    return `<svg viewBox="0 0 80 110" class="psvg" aria-hidden="true">
      <ellipse class="p-shadow" cx="40" cy="104" rx="18" ry="4"/>
      <g class="body-g">
        ${worn.indexOf(11) >= 0 ? accBack(11) : ''}
        ${hairBack(st, hc)}
        ${b.back}
        ${b.front}
        <rect x="36" y="54" width="8" height="7" rx="3" fill="${shade(sk, 0.93)}"/>
        <g class="head-g">
          ${backHead.map((id) => accBack(id)).join('')}
          <ellipse cx="16.8" cy="41" rx="3.4" ry="4.4" fill="${sk}" stroke="${shade(sk, 0.84)}" stroke-width=".7"/><ellipse cx="63.2" cy="41" rx="3.4" ry="4.4" fill="${sk}" stroke="${shade(sk, 0.84)}" stroke-width=".7"/>
          <circle cx="40" cy="37" r="23.5" fill="${sk}" stroke="${shade(sk, 0.82)}" stroke-width=".9"/>
          <ellipse cx="31" cy="27" rx="13" ry="8.5" fill="#fff" opacity=".16"/>
          <path d="M18 44 Q40 60 62 44 Q58 55 40 56.5 Q22 55 18 44 Z" fill="${shade(sk, 0.95)}" opacity=".45"/>
          <ellipse cx="31" cy="42.5" rx="4" ry="5.2" fill="#4a3730"/><ellipse cx="49" cy="42.5" rx="4" ry="5.2" fill="#4a3730"/>
          <path d="M26.6 39 Q31 36.2 35.4 39" fill="none" stroke="#2f241e" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M44.6 39 Q49 36.2 53.4 39" fill="none" stroke="#2f241e" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="32.3" cy="40.6" r="1.7" fill="#fff"/><circle cx="50.3" cy="40.6" r="1.7" fill="#fff"/>
          <circle cx="29.8" cy="44.4" r=".8" fill="#fff" opacity=".85"/><circle cx="47.8" cy="44.4" r=".8" fill="#fff" opacity=".85"/>
          <path d="M38.8 46.4 Q40 48.2 41.2 46.4" fill="none" stroke="${shade(sk, 0.78)}" stroke-width="1.1" stroke-linecap="round"/>
          <ellipse cx="25" cy="49.5" rx="4.2" ry="2.7" fill="#ff9aa6" opacity=".5"/><ellipse cx="55" cy="49.5" rx="4.2" ry="2.7" fill="#ff9aa6" opacity=".5"/>
          <path class="mouth" d="M36.5 50.2 Q40 53.8 43.5 50.2" fill="none" stroke="#c76b62" stroke-width="1.7" stroke-linecap="round"/>
          ${hairFront(st, hc)}
          ${fronts.map((id) => accFront(id)).join('')}
        </g>
      </g>
    </svg>`;
  }

  /* ---------- 동물 친구(따라다니는) ---------- */
  const PET = [
    { id: 0, name: '없음', price: 0 },
    { id: 1, name: '병아리', price: 30 },
    { id: 2, name: '아기 토끼', price: 35 },
    { id: 3, name: '아기 양', price: 35 },
    { id: 4, name: '다람쥐', price: 40 },
    { id: 5, name: '나비', price: 30 },
    { id: 6, name: '아기 사슴', price: 60 },
  ];

  /* ---------- 숲의 동물들 (모두 왼쪽을 보고 그림) ---------- */
  const ANIMAL = {
    sheep: { w: 70, h: 56, svg: `<svg viewBox="0 0 100 80" aria-hidden="true">
      <ellipse cx="52" cy="74" rx="28" ry="5" fill="rgba(70,100,70,.18)"/>
      <rect class="lg1" x="38" y="58" width="5" height="15" rx="2.5" fill="#7c614a"/><rect class="lg2" x="64" y="58" width="5" height="15" rx="2.5" fill="#7c614a"/>
      <g fill="#fff" stroke="#efe6d6" stroke-width="1"><circle cx="36" cy="40" r="11"/><circle cx="48" cy="32" r="13"/><circle cx="63" cy="33" r="13"/><circle cx="75" cy="42" r="11"/><circle cx="42" cy="51" r="12"/><circle cx="58" cy="53" r="13"/><circle cx="71" cy="51" r="11"/></g>
      <g fill="#fbf6ee"><circle cx="50" cy="38" r="6"/><circle cx="64" cy="40" r="5"/></g>
      <ellipse cx="25" cy="44" rx="12.5" ry="11.5" fill="#fdf7ec"/>
      <path d="M17 36 q-9 -3 -7 6 q0 7 8 4" fill="none" stroke="#c89b6a" stroke-width="3.4" stroke-linecap="round"/>
      <g fill="#fff"><circle cx="20" cy="34" r="5"/><circle cx="28" cy="32" r="5.5"/><circle cx="33" cy="37" r="4.5"/></g>
      <circle cx="21" cy="44" r="2.4" fill="#3d332a"/><circle cx="29.5" cy="44" r="2.4" fill="#3d332a"/><circle cx="21.7" cy="43.2" r=".8" fill="#fff"/><circle cx="30.2" cy="43.2" r=".8" fill="#fff"/>
      <ellipse cx="16" cy="49" rx="3" ry="1.8" fill="#ffb3a6" opacity=".7"/><ellipse cx="33" cy="49" rx="3" ry="1.8" fill="#ffb3a6" opacity=".7"/>
      <path d="M23.5 50 q2 2 4 0" fill="none" stroke="#4b4335" stroke-width="1.4" stroke-linecap="round"/></svg>` },
    rabbit: { w: 48, h: 48, svg: `<svg viewBox="0 0 70 70" aria-hidden="true">
      <ellipse cx="38" cy="65" rx="20" ry="4" fill="rgba(70,100,70,.18)"/>
      <g class="ears"><ellipse cx="20" cy="15" rx="5" ry="15" transform="rotate(-14 20 28)" fill="#fffdf8" stroke="#efe5da"/><ellipse cx="29" cy="14" rx="5" ry="15" transform="rotate(8 29 28)" fill="#fffdf8" stroke="#efe5da"/>
        <ellipse cx="20" cy="16" rx="2.3" ry="10" transform="rotate(-14 20 28)" fill="#ffc4cf"/><ellipse cx="29" cy="15" rx="2.3" ry="10" transform="rotate(8 29 28)" fill="#ffc4cf"/></g>
      <ellipse cx="42" cy="48" rx="19" ry="15" fill="#fffdf8" stroke="#efe5da"/>
      <circle cx="60" cy="46" r="6" fill="#fff"/>
      <ellipse cx="34" cy="61" rx="7" ry="3.4" fill="#f6eee4"/><ellipse cx="52" cy="61" rx="7" ry="3.4" fill="#f6eee4"/>
      <circle cx="25" cy="38" r="13" fill="#fffdf8" stroke="#efe5da"/>
      <circle cx="20" cy="37" r="2.4" fill="#3d332a"/><circle cx="20.8" cy="36.2" r=".8" fill="#fff"/>
      <ellipse cx="13.5" cy="41" rx="2" ry="1.5" fill="#ff9fb0"/><ellipse cx="22" cy="44" rx="3.2" ry="2" fill="#ffc4cf" opacity=".8"/></svg>` },
    deer: { w: 78, h: 78, svg: `<svg viewBox="0 0 90 90" aria-hidden="true">
      <ellipse cx="50" cy="86" rx="26" ry="4" fill="rgba(70,100,70,.18)"/>
      <g fill="#a86f43"><rect class="lg1" x="34" y="56" width="5" height="28" rx="2.5"/><rect class="lg2" x="42" y="56" width="5" height="27" rx="2.5"/><rect class="lg1" x="60" y="56" width="5" height="28" rx="2.5"/><rect class="lg2" x="68" y="55" width="5" height="27" rx="2.5"/></g>
      <g fill="#5b4031"><rect x="34" y="81" width="5" height="4" rx="1.5"/><rect x="42" y="80" width="5" height="4" rx="1.5"/><rect x="60" y="81" width="5" height="4" rx="1.5"/><rect x="68" y="80" width="5" height="4" rx="1.5"/></g>
      <ellipse cx="54" cy="50" rx="24" ry="13" fill="#c98d5a"/>
      <ellipse cx="54" cy="56" rx="18" ry="6" fill="#ecd2b2" opacity=".75"/>
      <g fill="#fff4e3" opacity=".9"><circle cx="48" cy="44" r="2"/><circle cx="57" cy="42" r="1.8"/><circle cx="64" cy="46" r="2"/><circle cx="52" cy="49" r="1.6"/><circle cx="70" cy="50" r="1.6"/></g>
      <path d="M77 44 q6 -4 5 3" fill="#fff4e3"/>
      <path d="M38 48 Q30 36 27 26 L37 22 Q40 34 46 42 Z" fill="#c98d5a"/>
      <ellipse cx="26" cy="22" rx="11" ry="9" fill="#c98d5a"/>
      <ellipse cx="17" cy="25" rx="5.5" ry="4.5" fill="#e3bf98"/><circle cx="13.5" cy="24" r="1.8" fill="#3d2f27"/>
      <ellipse cx="30" cy="12" rx="4" ry="8" transform="rotate(30 30 12)" fill="#b77e4e"/><ellipse cx="30" cy="12" rx="1.8" ry="5" transform="rotate(30 30 12)" fill="#f3c9b0"/>
      <circle cx="23" cy="19" r="2.4" fill="#3d2f27"/><circle cx="23.8" cy="18.2" r=".8" fill="#fff"/>
      <path d="M26 9 l-2 -6 M26 9 l4 -5" stroke="#8a5d3c" stroke-width="1.8" stroke-linecap="round"/></svg>` },
    squirrel: { w: 44, h: 44, svg: `<svg viewBox="0 0 60 60" aria-hidden="true">
      <ellipse cx="30" cy="56" rx="16" ry="3" fill="rgba(70,100,70,.18)"/>
      <path d="M40 50 Q60 48 56 26 Q53 8 40 12 Q50 18 46 30 Q42 40 34 44 Z" fill="#d48a4c"/>
      <path d="M44 20 Q50 24 48 32" stroke="#f2c08c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="30" cy="42" rx="11" ry="12" fill="#c97a3f"/><ellipse cx="27" cy="45" rx="6" ry="8" fill="#f6dcbc"/>
      <circle cx="22" cy="28" r="10" fill="#c97a3f"/><path d="M22 19 L25 10 L29 20 Z" fill="#c97a3f"/>
      <ellipse cx="16" cy="31" rx="4" ry="3" fill="#f6dcbc"/><circle cx="19" cy="26" r="2.1" fill="#3a2b22"/><circle cx="19.7" cy="25.3" r=".7" fill="#fff"/>
      <circle cx="12.6" cy="30" r="1.4" fill="#5b3a2a"/>
      <g><ellipse cx="22" cy="40" rx="4" ry="4.5" fill="#a5683a"/><path d="M19 37 Q22 34 25 37" fill="#7a4b2a"/></g>
      <ellipse cx="24" cy="54" rx="5" ry="2.5" fill="#b56d36"/><ellipse cx="34" cy="54" rx="5" ry="2.5" fill="#b56d36"/></svg>` },
    bloom: { w: 40, h: 52, svg: `<svg viewBox="0 0 50 64" aria-hidden="true">
      <ellipse cx="25" cy="61" rx="12" ry="2.6" fill="rgba(70,100,70,.18)"/>
      <path d="M25 34 L25 54" stroke="#6fae5a" stroke-width="4" stroke-linecap="round"/>
      <path class="leafL" d="M24 44 Q12 38 9 46 Q16 51 24 46 Z" fill="#8ccf6f"/><path class="leafR" d="M26 42 Q38 36 41 44 Q34 49 26 44 Z" fill="#8ccf6f"/>
      <ellipse class="lg1" cx="20" cy="57" rx="4.5" ry="2.6" fill="#5f9a4c"/><ellipse class="lg2" cx="30" cy="57" rx="4.5" ry="2.6" fill="#5f9a4c"/>
      <g style="fill:var(--petal,#ffb3c7)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="7" ry="9" transform="translate(25 22) rotate(${a}) translate(0 -11)"/>`).join('')}</g>
      <circle cx="25" cy="22" r="10.5" fill="#fff3b0"/>
      <circle cx="21.5" cy="21" r="1.7" fill="#4b3a2a"/><circle cx="28.5" cy="21" r="1.7" fill="#4b3a2a"/>
      <ellipse cx="19" cy="25" rx="2.2" ry="1.4" fill="#ff9f9f" opacity=".6"/><ellipse cx="31" cy="25" rx="2.2" ry="1.4" fill="#ff9f9f" opacity=".6"/>
      <path d="M23 25 Q25 27 27 25" fill="none" stroke="#4b3a2a" stroke-width="1.2" stroke-linecap="round"/></svg>` },
    fairy: { w: 34, h: 34, svg: `<svg viewBox="0 0 50 50" aria-hidden="true">
      <circle cx="25" cy="26" r="22" fill="url(#fairyGlow)"/>
      <defs><radialGradient id="fairyGlow"><stop offset="0" stop-color="#fffbe0" stop-opacity=".95"/><stop offset=".45" stop-color="#ffe9a8" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>
      <g class="fwing"><ellipse cx="15" cy="22" rx="9" ry="6" fill="#e2f6ff" opacity=".85" transform="rotate(-25 15 22)"/><ellipse cx="35" cy="22" rx="9" ry="6" fill="#e2f6ff" opacity=".85" transform="rotate(25 35 22)"/></g>
      <path d="M21 28 L29 28 L32 38 L18 38 Z" fill="#b9e6a6"/>
      <circle cx="25" cy="22" r="6.5" fill="#ffe7d6"/><path d="M18.5 21 Q19 14 25 14 Q31 14 31.5 21 Q28 17 25 18 Q22 17 18.5 21 Z" fill="#f1c76a"/>
      <circle cx="23" cy="22.5" r="1" fill="#3d332a"/><circle cx="27" cy="22.5" r="1" fill="#3d332a"/></svg>` },
    butterfly: { w: 26, h: 22, svg: `<svg viewBox="0 0 30 24" aria-hidden="true">
      <g class="bwing" style="fill:var(--wing,#ffc6e0)"><path d="M15 12 Q4 0 2 8 Q1 14 15 13 Z"/><path d="M15 12 Q7 22 4 18 Q3 14 15 13 Z" opacity=".8"/></g>
      <g class="bwing r" style="fill:var(--wing,#ffc6e0)"><path d="M15 12 Q26 0 28 8 Q29 14 15 13 Z"/><path d="M15 12 Q23 22 26 18 Q27 14 15 13 Z" opacity=".8"/></g>
      <rect x="14" y="7" width="2" height="11" rx="1" fill="#5b4a3c"/></svg>` },
    chick: { w: 30, h: 30, svg: `<svg viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="37" rx="11" ry="2.4" fill="rgba(70,100,70,.18)"/>
      <ellipse cx="21" cy="25" rx="13" ry="11" fill="#ffe17a"/><circle cx="15" cy="16" r="9" fill="#ffe892"/>
      <path d="M8 16 L3 18 L8 20 Z" fill="#ff9e43"/><circle cx="13" cy="14" r="1.8" fill="#3d332a"/>
      <path d="M22 22 Q30 20 31 27 Q26 28 22 25 Z" fill="#ffd25e"/>
      <path d="M17 35 v3 M23 35 v3" stroke="#ff9e43" stroke-width="1.8" stroke-linecap="round"/></svg>` },
  };
  ANIMAL.fawn = ANIMAL.deer;
  ANIMAL.lamb = ANIMAL.sheep;
  const PET_ART = { 1: 'chick', 2: 'rabbit', 3: 'lamb', 4: 'squirrel', 5: 'butterfly', 6: 'fawn' };
  const PET_SCALE = { 1: 0.8, 2: 0.62, 3: 0.48, 4: 0.7, 5: 0.9, 6: 0.45 };

  /* ---------- 꽃 (꽃밭에 심는 꽃) ---------- */
  const FLOWERS = [
    { name: '튤립', color: '#f57f95' },
    { name: '데이지', color: '#ffffff' },
    { name: '해바라기', color: '#ffc93c' },
    { name: '수국', color: '#9fb3f2' },
    { name: '코스모스', color: '#f7a8d8' },
    { name: '민들레', color: '#ffe066' },
  ];
  function flower(f) {
    const stem = '<path d="M12 32 Q11 24 12 16" stroke="#62a54f" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M12 26 Q5 22 4 27 Q8 30 12 27 Z" fill="#7cc062"/>';
    let head = '';
    if (f === 0) head = '<path d="M6 10 Q6 2 9 4 L12 7 L15 4 Q18 2 18 10 Q18 17 12 17 Q6 17 6 10 Z" fill="#f57f95"/><path d="M12 7 L12 16" stroke="#e5627b" stroke-width="1"/>';
    else if (f === 1) head = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse rx="2.3" ry="5" transform="translate(12 11) rotate(${a}) translate(0 -4.5)" fill="#fff" stroke="#eee6da" stroke-width=".5"/>`).join('') + '<circle cx="12" cy="11" r="3" fill="#ffd34e"/>';
    else if (f === 2) head = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<ellipse rx="2.2" ry="5" transform="translate(12 10) rotate(${a}) translate(0 -6)" fill="#ffc93c"/>`).join('') + '<circle cx="12" cy="10" r="4.6" fill="#8a5a2b"/>';
    else if (f === 3) head = [[8, 9], [12, 6], [16, 9], [10, 13], [14, 13], [12, 10]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${i % 2 ? '#9fb3f2' : '#c3a6ee'}"/>`).join('');
    else if (f === 4) head = [0, 72, 144, 216, 288].map((a) => `<ellipse rx="3.3" ry="5.4" transform="translate(12 10) rotate(${a}) translate(0 -5)" fill="#f7a8d8"/>`).join('') + '<circle cx="12" cy="10" r="2.4" fill="#ffd34e"/>';
    else head = '<circle cx="12" cy="10" r="6.5" fill="#ffe066"/><circle cx="12" cy="10" r="4" fill="#ffd23f"/>';
    return `<svg viewBox="0 0 24 34" aria-hidden="true">${stem}${head}</svg>`;
  }

  /* ---------- 쉼터 그림 ---------- */
  const LM = {
    plaza: { w: 160, vb: [160, 160], svg: `
      <ellipse cx="80" cy="152" rx="62" ry="7" fill="rgba(60,90,60,.16)"/>
      <rect x="74" y="44" width="12" height="108" rx="4" fill="#a37a52"/>
      <path d="M18 30 H142 Q150 30 150 38 V68 Q150 76 142 76 H18 Q10 76 10 68 V38 Q10 30 18 30 Z" fill="#e7bd86" stroke="#a37a52" stroke-width="3"/>
      <text x="80" y="60" text-anchor="middle" font-size="19" font-family="Jua, sans-serif" fill="#6b4a2c">마음쉼터</text>
      <path d="M30 86 H130 Q136 86 136 92 V104 Q136 110 130 110 H30 Q24 110 24 104 V92 Q24 86 30 86 Z" fill="#f0d3a6" stroke="#a37a52" stroke-width="2"/>
      <text x="80" y="102" text-anchor="middle" font-size="11" font-family="Gowun Dodum, sans-serif" fill="#6b4a2c">천천히 쉬어 가요</text>
      <path d="M40 30 Q48 18 60 26" stroke="#7fb062" stroke-width="3" fill="none"/><circle cx="60" cy="24" r="5" fill="#ffb3c7"/><circle cx="44" cy="22" r="4" fill="#ffe17a"/>
      <g><circle cx="40" cy="142" r="6" fill="#ffb3c7"/><circle cx="52" cy="146" r="5" fill="#ffe17a"/><circle cx="108" cy="143" r="6" fill="#c9b6ef"/><circle cx="120" cy="147" r="5" fill="#ffb3c7"/></g>` },
    shop: { w: 210, vb: [210, 190], svg: `
      <ellipse cx="105" cy="182" rx="92" ry="8" fill="rgba(60,90,60,.18)"/>
      <rect x="22" y="72" width="166" height="104" rx="8" fill="#d9a873"/>
      <rect x="22" y="72" width="166" height="104" rx="8" fill="none" stroke="#a87548" stroke-width="3"/>
      <rect x="36" y="88" width="138" height="44" rx="6" fill="#fff5e4"/>
      <g><circle cx="56" cy="110" r="8" fill="#ff8fa8"/><path d="M48 110 L64 110 M56 102 L56 118" stroke="#fff" stroke-width="2" opacity=".6"/>
        <path d="M78 116 Q86 96 94 116 Z" fill="#f2d78f"/><ellipse cx="86" cy="116" rx="12" ry="3" fill="#e9c878"/>
        <path d="M110 104 L113 96 L117 102 L121 94 L125 102 L129 96 L132 104 Z" fill="#ffd45e"/>
        <circle cx="152" cy="110" r="9" fill="#ffe17a"/><circle cx="148" cy="107" r="1.5" fill="#3d332a"/><path d="M141 109 L137 111 L141 113 Z" fill="#ff9e43"/></g>
      <rect x="36" y="140" width="138" height="12" rx="4" fill="#b98654"/>
      <path d="M12 74 L32 32 H178 L198 74 Z" fill="#fff"/>
      <g fill="#7cc4a8">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${32 + i * 21.4 * 1.0} 32 L${12 + i * 26.6} 74 H${12 + i * 26.6 + 13.3} L${32 + i * 21.4 + 10.7} 32 Z"/>`).join('')}</g>
      <path d="M12 74 Q25.3 86 38.6 74 Q52 86 65.2 74 Q78.5 86 91.8 74 Q105 86 118.4 74 Q131.7 86 145 74 Q158.3 86 171.6 74 Q185 86 198 74 Z" fill="#7cc4a8"/>
      <rect x="70" y="12" width="70" height="24" rx="8" fill="#fff5e4" stroke="#a87548" stroke-width="2"/>
      <text x="105" y="29" text-anchor="middle" font-size="13" font-family="Jua, sans-serif" fill="#7a5230">숲속 가게</text>
      <g transform="translate(150 132)">
        <ellipse cx="0" cy="40" rx="15" ry="4" fill="rgba(60,90,60,.15)"/>
        <ellipse cx="-6" cy="-12" rx="4" ry="12" fill="#fff" stroke="#eadfd6"/><ellipse cx="6" cy="-12" rx="4" ry="12" fill="#fff" stroke="#eadfd6"/>
        <ellipse cx="-6" cy="-11" rx="1.8" ry="8" fill="#ffc4cf"/><ellipse cx="6" cy="-11" rx="1.8" ry="8" fill="#ffc4cf"/>
        <ellipse cx="0" cy="24" rx="14" ry="14" fill="#fff" stroke="#eadfd6"/><path d="M-10 18 H10 V34 Q0 38 -10 34 Z" fill="#7cc4a8"/>
        <circle cx="0" cy="6" r="12" fill="#fff" stroke="#eadfd6"/>
        <circle cx="-4.5" cy="5" r="1.8" fill="#3d332a"/><circle cx="4.5" cy="5" r="1.8" fill="#3d332a"/>
        <ellipse cx="0" cy="9" rx="1.6" ry="1.2" fill="#ff9fb0"/><ellipse cx="-8" cy="10" rx="2.4" ry="1.5" fill="#ffc4cf" opacity=".8"/><ellipse cx="8" cy="10" rx="2.4" ry="1.5" fill="#ffc4cf" opacity=".8"/>
      </g>` },
    links: { w: 220, vb: [220, 200], svg: `
      <ellipse cx="110" cy="192" rx="94" ry="8" fill="rgba(60,90,60,.18)"/>
      <rect x="40" y="96" width="12" height="96" rx="4" fill="#9a6e4a"/><rect x="168" y="96" width="12" height="96" rx="4" fill="#9a6e4a"/>
      <g class="lglow"><ellipse cx="110" cy="40" rx="96" ry="30" fill="#ffe9a8" opacity=".5"/></g>
      <rect x="24" y="52" width="172" height="104" rx="16" fill="#fff6e9" stroke="#e0a85a" stroke-width="4"/>
      <rect x="24" y="52" width="172" height="104" rx="16" fill="none" stroke="#f6d59a" stroke-width="1.5" stroke-dasharray="2 7"/>
      <rect x="34" y="64" width="152" height="40" rx="8" fill="#eaf4ec"/>
      <g><rect x="44" y="72" width="36" height="9" rx="2" fill="#7cc4a8"/><rect x="44" y="86" width="52" height="7" rx="2" fill="#bfe0d2"/>
        <rect x="104" y="72" width="34" height="9" rx="2" fill="#f2a9c0"/><rect x="104" y="86" width="44" height="7" rx="2" fill="#f7cdda"/>
        <rect x="150" y="72" width="26" height="9" rx="2" fill="#f2c97e"/></g>
      <g><circle cx="70" cy="122" r="7" fill="#7fb4d9"/><path d="M63 122 H77 M70 115 V129" stroke="#fff" stroke-width="2"/>
        <circle cx="110" cy="122" r="7" fill="#f2a9c0"/><path d="M103 122 H117 M110 115 V129" stroke="#fff" stroke-width="2"/>
        <circle cx="150" cy="122" r="7" fill="#9ccf7c"/><path d="M143 122 H157 M150 115 V129" stroke="#fff" stroke-width="2"/></g>
      <path d="M12 44 Q22 24 40 36 Q30 18 50 18 Q44 6 64 14 L64 30 Q40 46 24 56 Z" fill="#cf3c3c"/>
      <path d="M110 52 L110 20" stroke="#cf3c3c" stroke-width="6"/>
      <path d="M110 22 Q92 10 94 28 Q104 34 110 22 Z" fill="#e14a46"/><path d="M110 22 Q128 10 126 28 Q116 34 110 22 Z" fill="#e14a46"/>
      <circle cx="110" cy="26" r="4.5" fill="#ffd45e"/>
      <g fill="#fff6e9"><circle cx="24" cy="52" r="5"/><circle cx="196" cy="52" r="5"/></g>
      <rect x="66" y="156" width="88" height="22" rx="8" fill="#cf3c3c"/>
      <text x="110" y="172" text-anchor="middle" font-size="14" font-family="Jua, sans-serif" fill="#fff">나눔터</text>` },
    thoughts: { w: 210, vb: [210, 196], svg: `
      <ellipse cx="105" cy="188" rx="90" ry="8" fill="rgba(60,90,60,.18)"/>
      <rect x="40" y="92" width="11" height="96" rx="4" fill="#9a6e4a"/><rect x="159" y="92" width="11" height="96" rx="4" fill="#9a6e4a"/>
      <g class="lglow"><ellipse cx="105" cy="46" rx="92" ry="28" fill="#dff1e6" opacity=".5"/></g>
      <rect x="26" y="54" width="158" height="96" rx="16" fill="#f3fbf5" stroke="#6fb59a" stroke-width="4"/>
      <path d="M58 150 L74 150 L62 170 Z" fill="#f3fbf5" stroke="#6fb59a" stroke-width="4"/>
      <g><rect x="42" y="72" width="80" height="10" rx="5" fill="#bfe3d4"/><rect x="42" y="90" width="126" height="9" rx="4" fill="#d5ecE2"/><rect x="42" y="106" width="104" height="9" rx="4" fill="#d5ece2"/><rect x="42" y="122" width="70" height="9" rx="4" fill="#bfe3d4"/></g>
      <g transform="translate(150 70)"><path d="M0 0 Q22 0 22 15 Q22 30 10 30 L8 38 L2 30 Q0 28 0 22 Z" fill="#7cc4a8"/><circle cx="7" cy="15" r="2" fill="#fff"/><circle cx="14" cy="15" r="2" fill="#fff"/></g>
      <rect x="66" y="40" width="78" height="22" rx="8" fill="#5aa585"/>
      <text x="105" y="56" text-anchor="middle" font-size="13" font-family="Jua, sans-serif" fill="#fff">생각 나눔터</text>
      <g fill="#f3fbf5"><circle cx="26" cy="54" r="5"/><circle cx="184" cy="54" r="5"/></g>` },
    reading: { w: 220, vb: [220, 200], svg: `
      <ellipse cx="110" cy="190" rx="96" ry="8" fill="rgba(60,90,60,.18)"/>
      <g fill="#6aa35a"><circle cx="60" cy="60" r="40"/><circle cx="150" cy="54" r="44"/><circle cx="110" cy="40" r="40"/></g>
      <g fill="#82bb6d"><circle cx="78" cy="44" r="24"/><circle cx="140" cy="40" r="22"/></g>
      <g fill="#a7d68d" opacity=".7"><circle cx="70" cy="34" r="11"/><circle cx="136" cy="30" r="9"/></g>
      <g fill="#ffd3e0"><circle cx="48" cy="66" r="3.5"/><circle cx="168" cy="60" r="3.5"/><circle cx="120" cy="22" r="3"/></g>
      <rect x="150" y="96" width="9" height="80" rx="3" fill="#9a6e4a"/>
      <g class="lglow"><ellipse cx="154" cy="104" rx="10" ry="12" fill="#ffd99a"/></g>
      <ellipse cx="154" cy="104" rx="4" ry="6" fill="#fff3d0"/>
      <path d="M44 150 L96 150 L110 176 L58 176 Z" fill="#c69b6a"/>
      <rect x="40" y="144" width="60" height="9" rx="3" fill="#b3875d"/>
      <rect x="44" y="176" width="7" height="14" fill="#9a6e4a"/><rect x="92" y="176" width="7" height="14" fill="#9a6e4a"/>
      <g transform="translate(110 120)">
        <path d="M-42 20 Q-40 6 -2 10 L-2 44 Q-40 40 -42 50 Z" fill="#fff7ea" stroke="#d9b98a" stroke-width="2"/>
        <path d="M42 20 Q40 6 2 10 L2 44 Q40 40 42 50 Z" fill="#fff7ea" stroke="#d9b98a" stroke-width="2"/>
        <path d="M-2 10 L2 10 L2 44 L-2 44 Z" fill="#c69b6a"/>
        <g stroke="#cdbfa6" stroke-width="1.6"><line x1="-34" y1="20" x2="-8" y2="22"/><line x1="-34" y1="27" x2="-8" y2="29"/><line x1="-34" y1="34" x2="-8" y2="36"/>
          <line x1="8" y1="22" x2="34" y2="20"/><line x1="8" y1="29" x2="34" y2="27"/><line x1="8" y1="36" x2="34" y2="34"/></g>
        <path d="M-2 8 Q0 2 2 8" fill="none" stroke="#e0a85a" stroke-width="2"/>
      </g>
      <rect x="66" y="34" width="88" height="22" rx="8" fill="#fff6e9" stroke="#8fae6a" stroke-width="2" opacity=".96"/>
      <text x="110" y="50" text-anchor="middle" font-size="13" font-family="Jua, sans-serif" fill="#5a7a3c">마음 글밭</text>` },
    tree: { w: 250, vb: [240, 260], svg: `
      <ellipse cx="120" cy="252" rx="96" ry="9" fill="rgba(60,90,60,.2)"/>
      <path d="M104 252 Q112 192 100 148 L140 148 Q128 192 138 252 Z" fill="#8c6548"/>
      <path d="M112 252 Q118 200 112 160" stroke="#a7805f" stroke-width="4" fill="none" opacity=".6"/>
      <path d="M116 178 Q96 162 80 142" stroke="#8c6548" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g fill="#6aa35a"><circle cx="120" cy="88" r="64"/><circle cx="66" cy="118" r="45"/><circle cx="176" cy="114" r="47"/></g>
      <g fill="#82bb6d"><circle cx="104" cy="70" r="36"/><circle cx="154" cy="92" r="30"/><circle cx="78" cy="104" r="24"/></g>
      <g fill="#a7d68d" opacity=".75"><circle cx="94" cy="56" r="15"/><circle cx="146" cy="78" r="11"/><circle cx="64" cy="98" r="8"/></g>
      <g fill="#ffd3e0"><circle cx="70" cy="80" r="4"/><circle cx="150" cy="60" r="3.5"/><circle cx="180" cy="110" r="4"/><circle cx="120" cy="40" r="3.5"/><circle cx="96" cy="130" r="3.5"/></g>
      <line x1="80" y1="142" x2="80" y2="205" stroke="#cfae84" stroke-width="2"/><line x1="104" y1="132" x2="104" y2="205" stroke="#cfae84" stroke-width="2"/>
      <rect x="72" y="203" width="40" height="8" rx="3" fill="#b3875d"/>` },
    spring: { w: 220, vb: [210, 140], svg: `
      <ellipse cx="105" cy="130" rx="94" ry="9" fill="rgba(60,90,60,.18)"/>
      <path d="M22 96 Q14 70 26 58" stroke="#6f9a58" stroke-width="3" fill="none"/><ellipse cx="26" cy="56" rx="3.5" ry="9" fill="#8b6a4a"/>
      <path d="M188 96 Q198 72 184 60" stroke="#6f9a58" stroke-width="3" fill="none"/><ellipse cx="184" cy="58" rx="3.5" ry="9" fill="#8b6a4a"/>
      <ellipse cx="105" cy="104" rx="88" ry="29" fill="#c4bcad"/>
      <ellipse cx="105" cy="98" rx="74" ry="22" fill="#8fd0e2"/>
      <ellipse cx="92" cy="92" rx="34" ry="7" fill="#d9f2f8" opacity=".85"/>
      <g fill="#aaa294"><ellipse cx="34" cy="104" rx="10" ry="6"/><ellipse cx="62" cy="122" rx="11" ry="6"/><ellipse cx="105" cy="128" rx="12" ry="6"/><ellipse cx="150" cy="122" rx="11" ry="6"/><ellipse cx="177" cy="104" rx="10" ry="6"/></g>
      <g fill="#ffffff" opacity=".9"><circle class="bub" cx="88" cy="96" r="3"/><circle class="bub" cx="112" cy="100" r="2.5" style="animation-delay:1.2s"/><circle class="bub" cx="126" cy="94" r="2" style="animation-delay:2.1s"/></g>` },
    lantern: { w: 236, vb: [230, 214], svg: `
      <ellipse cx="115" cy="206" rx="100" ry="8" fill="rgba(60,90,60,.2)"/>
      <rect x="28" y="184" width="174" height="16" rx="4" fill="#c9a97f"/>
      <rect x="42" y="74" width="10" height="112" fill="#9a6e4a"/><rect x="178" y="74" width="10" height="112" fill="#9a6e4a"/>
      <path d="M8 80 Q115 22 222 80 L202 88 Q115 46 28 88 Z" fill="#7a5a44"/>
      <path d="M28 88 Q115 46 202 88 L198 97 Q115 58 32 97 Z" fill="#94704f"/>
      <rect x="40" y="96" width="150" height="7" fill="#9a6e4a"/>
      <rect x="90" y="132" width="50" height="48" rx="5" fill="#e3c597" stroke="#9a6e4a" stroke-width="2"/>
      <g><rect x="96" y="139" width="14" height="11" rx="1.5" fill="#fff4d6"/><rect x="114" y="138" width="16" height="12" rx="1.5" fill="#e7f2dc"/><rect x="97" y="155" width="15" height="12" rx="1.5" fill="#e7f2dc"/><rect x="116" y="154" width="14" height="13" rx="1.5" fill="#fff4d6"/></g>
      <g stroke="#7a5a44" stroke-width="1.5"><line x1="70" y1="103" x2="70" y2="114"/><line x1="115" y1="103" x2="115" y2="112"/><line x1="160" y1="103" x2="160" y2="114"/></g>
      <g class="lglow"><ellipse cx="70" cy="126" rx="11" ry="13" fill="#ffcf86"/><ellipse cx="115" cy="124" rx="11" ry="13" fill="#ffd99a"/><ellipse cx="160" cy="126" rx="11" ry="13" fill="#ffcf86"/></g>
      <g fill="#fff3d0" opacity=".7"><ellipse cx="67" cy="122" rx="3.5" ry="5"/><ellipse cx="112" cy="120" rx="3.5" ry="5"/><ellipse cx="157" cy="122" rx="3.5" ry="5"/></g>` },
    garden: { w: 240, vb: [240, 150], svg: `
      <ellipse cx="120" cy="142" rx="108" ry="8" fill="rgba(60,90,60,.16)"/>
      <ellipse cx="120" cy="118" rx="104" ry="24" fill="#8c6a4c"/>
      <ellipse cx="120" cy="114" rx="98" ry="20" fill="#a37d59"/>
      <g stroke="#c9a77c" stroke-width="5" stroke-linecap="round">${[22, 46, 70, 94, 118, 142, 166, 190, 214].map((x) => `<line x1="${x}" y1="${118 + Math.abs(x - 118) * 0.1}" x2="${x}" y2="${96 + Math.abs(x - 118) * 0.1}"/>`).join('')}</g>
      <path d="M18 102 Q120 92 222 102" stroke="#d8b78a" stroke-width="4" fill="none"/>
      <rect x="92" y="40" width="56" height="26" rx="7" fill="#fff5e4" stroke="#a37a52" stroke-width="2"/>
      <rect x="117" y="66" width="6" height="30" fill="#a37a52"/>
      <text x="120" y="58" text-anchor="middle" font-size="12" font-family="Jua, sans-serif" fill="#6b4a2c">함께 꽃밭</text>
      <g transform="translate(196 74)"><path d="M0 14 H18 L15 30 H3 Z" fill="#7fb4d9"/><path d="M18 18 L30 10" stroke="#7fb4d9" stroke-width="3" stroke-linecap="round"/><path d="M2 14 Q9 2 16 14" stroke="#5e95bf" stroke-width="2" fill="none"/></g>` },
    pond: { w: 240, vb: [240, 130], svg: `
      <ellipse cx="120" cy="120" rx="110" ry="9" fill="rgba(60,90,60,.16)"/>
      <ellipse cx="120" cy="92" rx="106" ry="30" fill="#9fc6a4"/>
      <ellipse cx="120" cy="90" rx="94" ry="24" fill="#8cc9dc"/>
      <ellipse cx="104" cy="84" rx="40" ry="7" fill="#d8f1f7" opacity=".8"/>
      <g class="ripple" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"><ellipse cx="150" cy="96" rx="10" ry="3"/><ellipse cx="80" cy="98" rx="8" ry="2.4" style="animation-delay:1.4s"/></g>
      <g fill="#7cbf6a"><path d="M52 88 a12 5 0 1 0 1 0 Z"/><ellipse cx="60" cy="94" rx="12" ry="5"/><ellipse cx="176" cy="88" rx="11" ry="4.5"/></g>
      <circle cx="64" cy="91" r="3" fill="#ffc0d8"/><circle cx="178" cy="85" r="3" fill="#ffe17a"/>
      <g fill="#bdb6a8"><ellipse cx="22" cy="96" rx="9" ry="5"/><ellipse cx="218" cy="96" rx="9" ry="5"/><ellipse cx="200" cy="112" rx="8" ry="4.5"/></g>
      <g stroke="#6f9a58" stroke-width="2.5" fill="none"><path d="M206 92 Q204 70 210 58"/><path d="M212 94 Q214 74 220 66"/></g>
      <ellipse cx="210" cy="56" rx="3" ry="8" fill="#8b6a4a"/><ellipse cx="220" cy="64" rx="3" ry="7" fill="#8b6a4a"/>` },
    rain: { w: 220, vb: [220, 210], svg: `
      <ellipse cx="110" cy="202" rx="96" ry="8" fill="rgba(60,90,60,.18)"/>
      <rect x="30" y="178" width="160" height="18" rx="4" fill="#c4b49a"/>
      <rect x="44" y="96" width="9" height="84" fill="#8f6a4c"/><rect x="167" y="96" width="9" height="84" fill="#8f6a4c"/>
      <rect x="62" y="150" width="96" height="8" rx="3" fill="#b28a62"/><rect x="66" y="158" width="6" height="20" fill="#8f6a4c"/><rect x="148" y="158" width="6" height="20" fill="#8f6a4c"/>
      <path d="M110 28 L206 92 Q196 98 186 94 L110 52 L34 94 Q24 98 14 92 Z" fill="#6f8f7c"/>
      <path d="M110 52 L186 94 L180 102 L110 64 L40 102 L34 94 Z" fill="#83a691"/>
      <path d="M104 28 Q110 16 116 28" fill="#6f8f7c"/>
      <g class="raindrops" stroke="#9ccbe6" stroke-width="2" stroke-linecap="round">${[24, 52, 84, 120, 150, 182, 206].map((x, i) => `<line x1="${x}" y1="${110 + (i % 3) * 14}" x2="${x - 3}" y2="${122 + (i % 3) * 14}" style="animation-delay:${(i * 0.23).toFixed(2)}s"/>`).join('')}</g>` },
    stair: { w: 250, vb: [250, 240], svg: `
      <ellipse cx="125" cy="232" rx="110" ry="8" fill="rgba(60,90,60,.18)"/>
      <path d="M20 232 Q60 120 125 60 Q190 120 230 232 Z" fill="#8dbb7d"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const y = 218 - i * 20, w = 88 - i * 7; return `<rect x="${125 - w / 2 + (i % 2 ? 8 : -8)}" y="${y}" width="${w}" height="12" rx="3" fill="#cfc4b2"/><rect x="${125 - w / 2 + (i % 2 ? 8 : -8)}" y="${y + 10}" width="${w}" height="4" rx="2" fill="#a89c88"/>`; }).join('')}
      <rect x="72" y="36" width="8" height="70" fill="#9a6e4a"/><rect x="170" y="36" width="8" height="70" fill="#9a6e4a"/>
      <path d="M60 36 Q125 22 190 36 L186 44 Q125 32 64 44 Z" fill="#a8744a"/>
      <rect x="96" y="44" width="58" height="20" rx="6" fill="#fff5e4" stroke="#9a6e4a" stroke-width="2"/>
      <text x="125" y="58" text-anchor="middle" font-size="12" font-family="Jua, sans-serif" fill="#6b4a2c">명언 계단</text>
      <g class="lglow"><ellipse cx="66" cy="120" rx="7" ry="9" fill="#ffd99a"/><ellipse cx="184" cy="120" rx="7" ry="9" fill="#ffd99a"/></g>
      <g stroke="#7a5a44" stroke-width="2"><line x1="66" y1="129" x2="66" y2="160"/><line x1="184" y1="129" x2="184" y2="160"/></g>` },
    hill: { w: 280, vb: [270, 150], svg: `
      <path d="M0 150 Q135 34 270 150 Z" fill="#7cae72"/>
      <path d="M36 150 Q135 66 234 150 Z" fill="#94c387"/>
      <rect x="104" y="80" width="56" height="8" rx="3" fill="#a9825d"/>
      <rect x="110" y="88" width="5" height="16" fill="#8f6a4a"/><rect x="149" y="88" width="5" height="16" fill="#8f6a4a"/>
      <g stroke="#6d5a7e" stroke-width="5" stroke-linecap="round"><line x1="186" y1="98" x2="210" y2="70"/></g>
      <circle cx="212" cy="67" r="5" fill="#8a76a3"/>
      <g stroke="#8f6a4a" stroke-width="2.5"><line x1="196" y1="88" x2="190" y2="112"/><line x1="196" y1="88" x2="204" y2="112"/></g>
      <g fill="#fff4c2"><circle cx="70" cy="128" r="2"/><circle cx="210" cy="132" r="2"/></g>` },
  };

  /* ---------- 숲지기 새싹이 ---------- */
  /* ---------- 크리스마스 ---------- */
  const SANTA = `<svg viewBox="0 0 280 110" aria-hidden="true">
    <g stroke="#7a5436" stroke-width="2" fill="none" opacity=".5"><path d="M196 56 Q150 50 96 60"/><path d="M196 62 Q150 60 96 70"/></g>
    <g transform="translate(40 44)">
      <ellipse cx="18" cy="52" rx="20" ry="4" fill="rgba(40,60,70,.2)"/>
      <path d="M-14 36 Q-20 50 -4 50 L44 50 Q52 50 48 40 L44 18 Q42 12 34 12 L4 12 Q-8 12 -10 24 Z" fill="#c43b3b"/>
      <path d="M-14 50 Q-18 60 -8 60 M44 50 Q48 60 38 60" stroke="#8a2f2f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="-16" cy="30" r="5" fill="#f6d9c0"/>
      <rect x="2" y="4" width="34" height="18" rx="8" fill="#d8453e"/>
      <circle cx="18" cy="0" r="12" fill="#f6d9c0"/>
      <path d="M6 -4 Q18 -16 30 -4 Q30 2 26 0 Q18 -6 10 0 Q6 2 6 -4 Z" fill="#d8453e"/>
      <circle cx="30" cy="-10" r="4" fill="#fff"/>
      <path d="M6 2 Q18 16 30 2 Q26 10 18 11 Q10 10 6 2 Z" fill="#fbf7f2"/>
      <circle cx="14" cy="2" r="1.6" fill="#2b2b2b"/><circle cx="22" cy="2" r="1.6" fill="#2b2b2b"/>
      <circle cx="18" cy="6" r="2.4" fill="#e78b7b"/>
    </g>
    <g transform="translate(176 40)">
      <g stroke="#9a6e4a" stroke-width="3" stroke-linecap="round"><path d="M44 2 Q40 -8 46 -14"/><path d="M50 2 Q54 -8 48 -14"/></g>
      <ellipse cx="18" cy="54" rx="20" ry="4" fill="rgba(40,60,70,.2)"/>
      <path d="M2 18 Q-2 46 8 48 L10 30 Z" fill="#b07a4c"/>
      <ellipse cx="30" cy="30" rx="26" ry="15" fill="#c98d5a"/>
      <rect class="lg1" x="14" y="40" width="5" height="16" rx="2" fill="#a06a40"/><rect class="lg2" x="40" y="40" width="5" height="16" rx="2" fill="#a06a40"/>
      <circle cx="50" cy="16" r="12" fill="#c98d5a"/>
      <ellipse cx="60" cy="18" rx="5" ry="4" fill="#e3bf98"/><circle cx="60" cy="18" r="4.4" fill="#e23b35"/>
      <circle cx="54" cy="12" r="2" fill="#2b2b2b"/>
      <path d="M48 6 Q50 0 53 5" stroke="#9a6e4a" stroke-width="2" fill="none"/>
    </g></svg>`;

  const XTREE = `<svg viewBox="0 0 90 130" aria-hidden="true">
    <ellipse cx="45" cy="124" rx="34" ry="6" fill="rgba(40,60,40,.2)"/>
    <rect x="39" y="104" width="12" height="20" fill="#8a5a36"/>
    <path d="M45 6 L72 46 L56 46 L80 82 L60 82 L86 116 L4 116 L30 82 L10 82 L34 46 L18 46 Z" fill="#3f8a54"/>
    <path d="M45 6 L72 46 L56 46 L80 82 L60 82 L86 116 L45 116 Z" fill="#368049"/>
    <g><circle cx="45" cy="34" r="4" fill="#e23b35"/><circle cx="34" cy="64" r="4" fill="#ffd45e"/><circle cx="58" cy="66" r="4" fill="#5e9bd6"/>
      <circle cx="26" cy="98" r="4" fill="#e23b35"/><circle cx="48" cy="96" r="4" fill="#ffd45e"/><circle cx="66" cy="100" r="4" fill="#f2a9c0"/>
      <circle cx="45" cy="80" r="4" fill="#e23b35"/></g>
    <g stroke="#ffe9a8" stroke-width="2" opacity=".8" fill="none"><path d="M30 50 Q45 58 60 50"/><path d="M20 86 Q45 96 70 86"/></g>
    <path class="xstar" d="M45 -2 L49 9 L61 9 L51 16 L55 28 L45 20 L35 28 L39 16 L29 9 L41 9 Z" fill="#ffd94e" stroke="#eab62f" stroke-width="1"/></svg>`;

  const GIFT = `<svg viewBox="0 0 40 42" aria-hidden="true">
    <ellipse cx="20" cy="39" rx="16" ry="3" fill="rgba(40,60,40,.18)"/>
    <rect x="5" y="16" width="30" height="22" rx="3" fill="var(--box,#d8453e)"/>
    <rect x="5" y="16" width="30" height="7" rx="2" fill="rgba(0,0,0,.08)"/>
    <rect x="16" y="16" width="8" height="22" fill="var(--rib,#ffd94e)"/>
    <rect x="3" y="12" width="34" height="8" rx="3" fill="var(--box,#d8453e)"/>
    <rect x="16" y="12" width="8" height="8" fill="var(--rib,#ffd94e)"/>
    <path d="M20 12 Q12 2 10 8 Q10 13 20 12 Q28 2 30 8 Q30 13 20 12 Z" fill="var(--rib,#ffd94e)"/></svg>`;

  const SNOWMAN = `<svg viewBox="0 0 60 80" aria-hidden="true">
    <ellipse cx="30" cy="76" rx="20" ry="4" fill="rgba(40,60,70,.18)"/>
    <circle cx="30" cy="54" r="20" fill="#fbfdff"/><circle cx="30" cy="54" r="20" fill="none" stroke="#dce7ef" stroke-width="1"/>
    <circle cx="30" cy="26" r="14" fill="#fbfdff" stroke="#dce7ef" stroke-width="1"/>
    <path d="M18 14 Q30 6 42 14 L40 6 L20 6 Z" fill="#c43b3b"/><rect x="18" y="12" width="24" height="4" fill="#8a2f2f"/>
    <circle cx="26" cy="24" r="1.8" fill="#333"/><circle cx="34" cy="24" r="1.8" fill="#333"/>
    <path d="M30 27 L40 29 L30 31 Z" fill="#f08a3a"/>
    <g fill="#333"><circle cx="24" cy="30" r="1"/><circle cx="30" cy="32" r="1"/><circle cx="36" cy="30" r="1"/></g>
    <g fill="#c43b3b"><circle cx="30" cy="46" r="2"/><circle cx="30" cy="54" r="2"/><circle cx="30" cy="62" r="2"/></g>
    <g stroke="#9a6e4a" stroke-width="2" stroke-linecap="round"><path d="M12 50 L2 44 M12 50 L4 52"/><path d="M48 50 L58 44 M48 50 L56 52"/></g></svg>`;

  const SPROUT = `<svg viewBox="0 0 120 150" width="58" height="72" aria-hidden="true" style="display:block;margin:28px auto 0">
    <ellipse cx="60" cy="140" rx="30" ry="6" fill="rgba(80,110,80,.2)"/>
    <ellipse cx="60" cy="96" rx="37" ry="39" fill="#d9eed2"/><ellipse cx="48" cy="82" rx="15" ry="10" fill="#eef7ea" opacity=".8"/>
    <circle cx="40" cy="102" r="6.5" fill="#f7b9a2" opacity=".65"/><circle cx="80" cy="102" r="6.5" fill="#f7b9a2" opacity=".65"/>
    <ellipse cx="48" cy="92" rx="4.8" ry="5.6" fill="#3e3529"/><ellipse cx="72" cy="92" rx="4.8" ry="5.6" fill="#3e3529"/>
    <circle cx="49.5" cy="90" r="1.7" fill="#fff"/><circle cx="73.5" cy="90" r="1.7" fill="#fff"/>
    <path d="M54 106 Q60 112 66 106" fill="none" stroke="#3e3529" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M60 58 L60 36" stroke="#8aa06a" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M60 40 Q78 30 77 48 Q65 53 60 40 Z" fill="#8fc46e"/><path d="M60 46 Q42 36 43 54 Q55 59 60 46 Z" fill="#a5d585"/></svg>`;

  window.ART = { SKIN, HAIR, OUTFIT, STYLE_NAMES, TYPE_NAMES, ACC, ACC_SLOT, PET, PET_ART, PET_SCALE, ANIMAL, FLOWERS, LM, SPROUT, SANTA, XTREE, GIFT, SNOWMAN, person, flower, shade };
})();
