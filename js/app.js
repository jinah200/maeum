/* ============================================================
 *  온라인 마음쉼터 — v4 메인 로직
 *  로컬 / 서버(Supabase) / 시트(Apps Script) 모드 자동 분기
 *  + 양 거닐기 · 숲 지도 · 마음 구슬 · 숲 소리
 * ============================================================ */
(function () {
  const cfg = window.CONFIG;
  const sheetMode = !!cfg.APPS_SCRIPT_URL;
  const serverMode = !sheetMode && !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const $ = (id) => document.getElementById(id);

  const sessionId =
    localStorage.getItem("ms_session") ||
    (() => { const id = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ms_session", id); return id; })();

  const todayKey = "ms_visit_" + new Date().toISOString().slice(0, 10);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ===================== 배경 꾸미기 ===================== */
  (function decorate() {
    // 나무
    const tl = $("treeline");
    for (let i = 0; i < 9; i++) {
      const t = document.createElement("div");
      t.className = "tree";
      t.style.left = (4 + Math.random() * 90) + "%";
      t.style.transform = `scale(${0.6 + Math.random() * 0.7})`;
      tl.appendChild(t);
    }
    // 구름
    const cl = $("clouds");
    for (let i = 0; i < 4; i++) {
      const c = document.createElement("div");
      c.className = "cloud";
      const w = 90 + Math.random() * 120;
      c.style.width = w + "px"; c.style.height = (w * 0.4) + "px";
      c.style.top = (6 + Math.random() * 26) + "%";
      c.style.animationDuration = (60 + Math.random() * 50) + "s";
      c.style.animationDelay = (-Math.random() * 60) + "s";
      cl.appendChild(c);
    }
    // 반딧불
    const ff = $("fireflies");
    for (let i = 0; i < 14; i++) {
      const f = document.createElement("div");
      f.className = "firefly";
      f.style.left = (Math.random() * 100) + "%";
      f.style.top = (30 + Math.random() * 55) + "%";
      f.style.setProperty("--dx", (Math.random() * 50 - 25) + "px");
      f.style.setProperty("--dy", (-15 - Math.random() * 30) + "px");
      f.style.animationDuration = (3 + Math.random() * 4) + "s, " + (2 + Math.random() * 2) + "s";
      f.style.animationDelay = (-Math.random() * 4) + "s";
      ff.appendChild(f);
    }
  })();

  /* ===================== 양 거닐기 ===================== */
  const SHEEP_SVG = `
  <svg viewBox="0 0 100 80" width="100%" aria-hidden="true">
    <ellipse cx="50" cy="73" rx="26" ry="5" fill="rgba(80,110,80,.18)"/>
    <path d="M24 34 q-10 -4 -6 4 q-8 2 -2 8 q-2 8 7 6" fill="#8a6b52"/>
    <g fill="#fff" stroke="#efe6d6" stroke-width="1">
      <circle cx="34" cy="40" r="11"/><circle cx="46" cy="33" r="13"/>
      <circle cx="61" cy="34" r="13"/><circle cx="72" cy="42" r="11"/>
      <circle cx="40" cy="50" r="12"/><circle cx="55" cy="52" r="13"/><circle cx="68" cy="50" r="11"/>
    </g>
    <rect x="36" y="60" width="4.5" height="12" rx="2" fill="#7c614a"/>
    <rect x="62" y="60" width="4.5" height="12" rx="2" fill="#7c614a"/>
    <ellipse cx="26" cy="44" rx="12" ry="11" fill="#fdf7ec"/>
    <path d="M18 38 q-9 -3 -7 6 q0 7 8 4" fill="none" stroke="#c89b6a" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="18" cy="52" rx="4" ry="2.6" fill="#f3b6a1"/>
    <circle cx="23" cy="43" r="2.3" fill="#4b4335"/><circle cx="31" cy="43" r="2.3" fill="#4b4335"/>
    <circle cx="23.7" cy="42.2" r=".7" fill="#fff"/><circle cx="31.7" cy="42.2" r=".7" fill="#fff"/>
    <ellipse cx="27" cy="48" rx="3" ry="2" fill="#f3c4b0"/>
    <path d="M25 50 q2 2 4 0" fill="none" stroke="#4b4335" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;

  const sheep = [];
  (function spawnSheep() {
    const meadow = $("meadow");
    const n = 2;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "sheep";
      el.innerHTML = `<div class="bob">${SHEEP_SVG}</div>`;
      el.style.width = (58 + Math.random() * 26) + "px";
      el.style.bottom = (6 + Math.random() * 15) + "%";
      const s = { el, x: 15 + Math.random() * 70, dir: Math.random() < 0.5 ? -1 : 1,
        speed: 0.6 + Math.random() * 0.5, graze: 0 };
      el.style.left = s.x + "%";
      el.classList.toggle("flip", s.dir < 0);
      meadow.appendChild(el);
      sheep.push(s);
    }
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(60, now - last); last = now;
      sheep.forEach((s) => {
        if (s.graze > 0) { s.graze -= dt; s.el.classList.add("graze"); return; }
        s.el.classList.remove("graze");
        s.x += s.dir * s.speed * (dt / 1000) * 3;
        if (s.x < 6) { s.x = 6; s.dir = 1; }
        if (s.x > 92) { s.x = 92; s.dir = -1; }
        if (Math.random() < 0.003) s.dir *= -1;
        if (Math.random() < 0.0016) s.graze = 1600 + Math.random() * 2600;
        s.el.classList.toggle("flip", s.dir < 0);
        s.el.style.left = s.x + "%";
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ===================== 숲 소리 (Web Audio) ===================== */
  const Sound = (function () {
    let ctx, master, sfx, on = false, windStarted = false, birdTimer = null;
    function ensure() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(ctx.destination);
    }
    function startWind() {
      const size = 2 * ctx.sampleRate;
      const buf = ctx.createBuffer(1, size, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < size; i++) { const w = Math.random() * 2 - 1; d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480;
      const g = ctx.createGain(); g.gain.value = 0.07;
      src.connect(lp); lp.connect(g); g.connect(master); src.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    }
    function chirp() {
      if (!on) return;
      const t = ctx.currentTime, notes = 2 + Math.floor(Math.random() * 3);
      const base = 1700 + Math.random() * 1300;
      let dest = master;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; p.connect(master); dest = p; }
      for (let n = 0; n < notes; n++) {
        const st = t + n * 0.09, f = base * (1 + (Math.random() * 0.3 - 0.1));
        const o = ctx.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(f * 0.8, st);
        o.frequency.exponentialRampToValueAtTime(f * 1.25, st + 0.04);
        o.frequency.exponentialRampToValueAtTime(f * 0.9, st + 0.085);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.1, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
        o.connect(g); g.connect(dest); o.start(st); o.stop(st + 0.1);
      }
      birdTimer = setTimeout(chirp, 2600 + Math.random() * 6500);
    }
    function toggle() {
      ensure();
      if (ctx.state === "suspended") ctx.resume();
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
    function tok() {
      ensure();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(430, t); o.frequency.exponentialRampToValueAtTime(230, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.2);
    }
    return { toggle, tok };
  })();

  $("soundBtn").addEventListener("click", () => {
    const on = Sound.toggle();
    $("soundBtn").classList.toggle("on", on);
    $("soundIcon").textContent = on ? "🔊" : "🔈";
    $("soundBtn").title = on ? "소리 끄기" : "소리 켜기";
  });

  /* ===================== 쉬어가기(숲호흡) ===================== */
  let breaths = Number(localStorage.getItem("ms_breaths") || 0);
  $("breatheCount").textContent = breaths + "번째 숨";
  let breathing = false;
  $("breatheBtn").addEventListener("click", () => {
    if (breathing) return;
    breathing = true;
    $("character").classList.add("breathing");
    $("breathGuide").textContent = "들이쉬고… 잠시 멈추고… 천천히 내쉬어요";
    breaths++; $("breatheCount").textContent = breaths + "번째 숨";
    localStorage.setItem("ms_breaths", breaths);
    setTimeout(() => {
      $("character").classList.remove("breathing"); breathing = false;
      $("breathGuide").textContent = "한결 가벼워졌나요? 언제든 다시 쉬어가요";
    }, 7000);
  });

  /* ===================== 마음 구슬 ===================== */
  (function beads() {
    const COUNT = 10;
    const strand = $("beadStrand");
    let active = 0;
    let total = Number(localStorage.getItem("ms_beads") || 0);
    $("beadsCount").textContent = total + "알";
    $("beadTotal").textContent = "함께 넘긴 구슬 " + total + "알";
    for (let i = 0; i < COUNT; i++) {
      const b = document.createElement("div");
      b.className = "bead" + (i === 0 ? " active" : "");
      strand.appendChild(b);
    }
    function roll() {
      const kids = strand.children;
      kids[active].classList.remove("active");
      kids[active].classList.add("rolled");
      active = (active + 1) % COUNT;
      if (active === 0) { // 한 바퀴 — 모두 비우고 다시
        setTimeout(() => { for (const k of kids) k.classList.remove("rolled"); }, 320);
      }
      kids[active].classList.add("active");
      total++; localStorage.setItem("ms_beads", total);
      $("beadsCount").textContent = total + "알";
      $("beadTotal").textContent = "함께 넘긴 구슬 " + total + "알";
      $("beadHint").textContent = ["좋아요, 그대로 한 번 더", "숨을 길게 내쉬며", "천천히, 서두르지 않아도 돼요"][total % 3];
      Sound.tok();
    }
    const stage = $("beadStage");
    stage.addEventListener("click", roll);
    stage.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); roll(); } });
    $("beadsBtn").addEventListener("click", () => openModal($("beadsModal")));
    $("beadsClose").addEventListener("click", () => closeModal($("beadsModal")));
  })();

  /* ===================== 숲 지도 ===================== */
  (function map() {
    const spots = [
      { x: 220, y: 185, ic: "📍", t: "쉼터 광장", big: true },
      { x: 120, y: 120, ic: "🌳", t: "숨 쉬는 나무" },
      { x: 320, y: 125, ic: "🫧", t: "마음 구슬 샘" },
      { x: 300, y: 250, ic: "🏮", t: "염원 등불터" },
      { x: 120, y: 255, ic: "🚪", t: "숲 입구" },
    ];
    const trees = [];
    for (let i = 0; i < 26; i++) trees.push([40 + Math.random() * 360, 60 + Math.random() * 230]);
    const treeSvg = trees.map(([x, y]) =>
      `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})"><circle r="11" fill="#6ea05d"/><circle r="7" cy="-6" fill="#7cae69"/></g>`).join("");
    const spotSvg = spots.map((s) => `
      <g transform="translate(${s.x},${s.y})">
        <circle r="${s.big ? 15 : 12}" fill="#fffaf1" stroke="#e5b86a" stroke-width="${s.big ? 3 : 2}"/>
        <text y="4.5" text-anchor="middle" font-size="${s.big ? 15 : 12}">${s.ic}</text>
        <text y="${s.big ? 30 : 26}" text-anchor="middle" class="map-spot-label">${s.t}</text>
      </g>`).join("");
    $("mapFrame").innerHTML = `
    <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
      <rect width="440" height="340" fill="#bfe3cf"/>
      <path d="M40 60 Q30 150 50 250 Q70 320 180 318 Q320 322 390 260 Q418 170 398 90 Q360 30 220 28 Q90 24 40 60 Z" fill="#9ecb84"/>
      <path d="M70 90 Q60 170 80 240 Q110 295 200 292 Q310 294 360 240 Q384 165 366 100 Q330 58 220 56 Q110 54 70 90 Z" fill="#b2d79a"/>
      <path d="M120 255 Q190 210 220 185 Q255 150 320 125" fill="none" stroke="#e7d9b2" stroke-width="12" stroke-linecap="round" opacity=".85"/>
      <path d="M220 185 Q270 215 300 250" fill="none" stroke="#e7d9b2" stroke-width="11" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="300" cy="250" rx="30" ry="20" fill="#bfe6f0" stroke="#a7d3de" stroke-width="3"/>
      ${treeSvg}
      ${spotSvg}
    </svg>`;
    $("mapBtn").addEventListener("click", () => openModal($("mapModal")));
    $("mapClose").addEventListener("click", () => closeModal($("mapModal")));
  })();

  /* ===================== 모달 공통 ===================== */
  function openModal(el) { el.hidden = false; }
  function closeModal(el) { el.hidden = true; }
  document.querySelectorAll(".modal-backdrop").forEach((bd) => {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.hidden = true; });
  });

  /* ===================== 염원 ===================== */
  const wishModal = $("wishModal"), wishInput = $("wishInput");
  $("wishBtn").addEventListener("click", () => {
    $("wishMsg").textContent = ""; $("wishMsg").className = "modal-msg";
    wishInput.value = ""; $("charCount").textContent = "0 / 100";
    openModal(wishModal); setTimeout(() => wishInput.focus(), 50);
  });
  $("wishCancel").addEventListener("click", () => closeModal(wishModal));
  wishInput.addEventListener("input", () => { $("charCount").textContent = wishInput.value.length + " / 100"; });
  $("wishSubmit").addEventListener("click", submitWish);

  function cooldownLeft() {
    const last = Number(localStorage.getItem("ms_last_wish") || 0);
    return Math.max(0, Math.ceil(cfg.WISH_COOLDOWN_SEC - (Date.now() - last) / 1000));
  }
  function showMsg(t, k) { $("wishMsg").textContent = t; $("wishMsg").className = "modal-msg " + (k || ""); }

  async function submitWish() {
    const text = wishInput.value.trim();
    const first = window.Filter.check(text);
    if (!first.ok) return showMsg(first.reason, "err");
    const wait = cooldownLeft();
    if (wait > 0) return showMsg(wait + "초 뒤에 다시 올릴 수 있어요.", "err");

    $("wishSubmit").disabled = true; $("loading").hidden = false;
    try {
      let result;
      if (sheetMode) result = await submitToSheet(text);
      else if (serverMode) result = await submitToServer(text);
      else { await delay(900); result = { ok: true }; saveLocal(text); }

      if (result.ok && !result.pending) {
        localStorage.setItem("ms_last_wish", Date.now());
        floatLantern(text); closeModal(wishModal);
      } else if (result.pending) {
        localStorage.setItem("ms_last_wish", Date.now());
        showMsg(result.reason || "올렸어요. 선생님 확인 후 등불이 켜질 거예요.", "ok");
        setTimeout(() => closeModal(wishModal), 2200);
      } else showMsg(result.reason || "조금 더 따뜻한 말로 적어 주세요.", "err");
    } catch (e) {
      console.error(e); showMsg("잠시 문제가 생겼어요. 다시 시도해 주세요.", "err");
    } finally { $("loading").hidden = true; $("wishSubmit").disabled = false; }
  }

  function floatLantern(text) {
    const layer = $("lanternLayer");
    if (layer.children.length >= cfg.MAX_LANTERNS) layer.removeChild(layer.firstChild);
    const el = document.createElement("div");
    el.className = "lantern";
    el.style.left = (8 + Math.random() * 80) + "%";
    el.style.setProperty("--dur", (22 + Math.random() * 12) + "s");
    el.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
    el.innerHTML = `<div class="glow"></div><div class="text"></div>`;
    el.querySelector(".text").textContent = text;
    layer.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  /* ===================== 저장소 ===================== */
  function saveLocal(text) {
    const list = JSON.parse(localStorage.getItem("ms_wishes") || "[]");
    list.push({ content: text, at: Date.now() });
    localStorage.setItem("ms_wishes", JSON.stringify(list.slice(-50)));
  }
  function loadLocalWishes() {
    JSON.parse(localStorage.getItem("ms_wishes") || "[]").slice(-8)
      .forEach((w, i) => setTimeout(() => floatLantern(w.content), i * 1400));
  }

  // --- 시트 모드 (Apps Script) ---
  async function sheetFetch(options) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(cfg.APPS_SCRIPT_URL, Object.assign({ signal: ctrl.signal }, options));
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  function sheetPost(payload) {
    return sheetFetch({ method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
  }
  async function submitToSheet(text) {
    try { return await sheetPost({ type: "wish", content: text, sessionId }); }
    catch (e) { console.error("[마음쉼터] 염원 전송 실패:", e); return { ok: false, reason: "연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요." }; }
  }
  async function startSheet() {
    try {
      if (!localStorage.getItem(todayKey)) { localStorage.setItem(todayKey, "1"); await sheetPost({ type: "visit", sessionId }); }
      const data = await sheetFetch({ method: "GET" });
      (data.wishes || []).forEach((t, i) => setTimeout(() => floatLantern(t), i * 1300));
      renderVisitor(data.visitsToday || 1);
    } catch (e) {
      console.error("[마음쉼터] 시트 연결 실패 → 로컬 보기로 전환", e);
      loadLocalWishes(); $("visitorBadge").textContent = "오늘도 숲이 열려 있어요";
    }
  }

  // --- 서버 모드 (Supabase) ---
  let supa = null;
  async function initServer() {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supa = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  async function submitToServer(text) {
    const res = await fetch("/api/submit-wish", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, sessionId }) });
    return res.json();
  }
  async function loadServerWishes() {
    const { data } = await supa.from("wishes").select("content").eq("status", "public")
      .order("created_at", { ascending: false }).limit(10);
    (data || []).reverse().forEach((w, i) => setTimeout(() => floatLantern(w.content), i * 1300));
  }
  async function serverVisitor() {
    if (!localStorage.getItem(todayKey)) { localStorage.setItem(todayKey, "1"); await supa.from("visits").insert({ session_id: sessionId }); }
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supa.from("visits").select("*", { count: "exact", head: true }).gte("created_at", today);
    renderVisitor(count || 1);
  }

  function renderVisitor(n) { $("visitorBadge").textContent = "오늘 " + Number(n).toLocaleString("ko-KR") + "명이 다녀갔어요"; }

  /* ===================== 시작 ===================== */
  (async function start() {
    if (sheetMode) { document.querySelector(".admin-link").hidden = true; await startSheet(); return; }
    if (serverMode) {
      try { await initServer(); await loadServerWishes(); await serverVisitor(); }
      catch (e) { console.error(e); loadLocalWishes(); renderVisitor(localStorage.getItem(todayKey) ? 1 : 1); }
      return;
    }
    loadLocalWishes();
    let n = Number(localStorage.getItem(todayKey) || 0) + 1; localStorage.setItem(todayKey, n); renderVisitor(n);
  })();
})();
