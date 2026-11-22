/* ============================================================
 *  온라인 마음쉼터 — 메인 로직
 *  로컬 모드(기본)  : localStorage 저장 + 1차 필터만
 *  서버 모드(키 설정): Supabase 저장 + 서버 Gemini 2차 검열
 * ============================================================ */
(function () {
  const cfg = window.CONFIG;
  const serverMode = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  // ---- 세션 ID (익명, 신고·중복 식별용. 개인정보 아님) ----
  const sessionId =
    localStorage.getItem("ms_session") ||
    (() => {
      const id = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ms_session", id);
      return id;
    })();

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const character = $("character");
  const breatheBtn = $("breatheBtn");
  const breatheCount = $("breatheCount");
  const breathGuide = $("breathGuide");
  const wishBtn = $("wishBtn");
  const wishModal = $("wishModal");
  const wishInput = $("wishInput");
  const wishSubmit = $("wishSubmit");
  const wishCancel = $("wishCancel");
  const wishMsg = $("wishMsg");
  const charCount = $("charCount");
  const loading = $("loading");
  const lanternLayer = $("lanternLayer");
  const visitorBadge = $("visitorBadge");

  // ---- 배경 나무 흩뿌리기 ----
  (function plantTrees() {
    const trees = $("trees");
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = document.createElement("div");
      t.className = "tree";
      t.style.left = (6 + Math.random() * 88) + "%";
      t.style.bottom = (16 + Math.random() * 10) + "%";
      t.style.transform = `scale(${0.7 + Math.random() * 0.8})`;
      trees.appendChild(t);
    }
  })();

  /* ========== 1) 쉬어가기(숲호흡) ========== */
  let breaths = Number(localStorage.getItem("ms_breaths") || 0);
  breatheCount.textContent = breaths + "번째 숨";
  let breathing = false;

  breatheBtn.addEventListener("click", () => {
    if (breathing) return;
    breathing = true;
    character.classList.add("breathing");
    breathGuide.textContent = "들이쉬고… 잠시 멈추고… 천천히 내쉬어요";
    breaths += 1;
    breatheCount.textContent = breaths + "번째 숨";
    localStorage.setItem("ms_breaths", breaths);
    setTimeout(() => {
      character.classList.remove("breathing");
      breathing = false;
      breathGuide.textContent = "한결 가벼워졌나요? 언제든 다시 쉬어가요";
    }, 7000);
  });

  /* ========== 2) 염원 모달 ========== */
  wishBtn.addEventListener("click", () => openModal());
  wishCancel.addEventListener("click", () => closeModal());
  wishModal.addEventListener("click", (e) => { if (e.target === wishModal) closeModal(); });
  wishInput.addEventListener("input", () => {
    charCount.textContent = `${wishInput.value.length} / 100`;
  });

  function openModal() {
    wishMsg.textContent = ""; wishMsg.className = "modal-msg";
    wishInput.value = ""; charCount.textContent = "0 / 100";
    wishModal.hidden = false;
    setTimeout(() => wishInput.focus(), 50);
  }
  function closeModal() { wishModal.hidden = true; }

  // 도배 방지(클라이언트 쿨다운)
  function cooldownLeft() {
    const last = Number(localStorage.getItem("ms_last_wish") || 0);
    const passed = (Date.now() - last) / 1000;
    return Math.max(0, Math.ceil(cfg.WISH_COOLDOWN_SEC - passed));
  }

  wishSubmit.addEventListener("click", submitWish);

  async function submitWish() {
    const text = wishInput.value.trim();

    // 1차 필터 (즉시)
    const first = window.Filter.check(text);
    if (!first.ok) return showMsg(first.reason, "err");

    const wait = cooldownLeft();
    if (wait > 0) return showMsg(`${wait}초 뒤에 다시 올릴 수 있어요.`, "err");

    wishSubmit.disabled = true;
    loading.hidden = false; // "염원을 올리는 중…" 연출

    try {
      let result;
      if (serverMode) {
        result = await submitToServer(text); // 2차: 서버 Gemini 검열 + 저장
      } else {
        await delay(900); // 연출용 짧은 대기
        result = { ok: true };
        saveLocal(text);
      }

      if (result.ok) {
        localStorage.setItem("ms_last_wish", Date.now());
        floatLantern(text);
        closeModal();
      } else {
        showMsg(result.reason || "조금 더 따뜻한 말로 적어 주세요.", "err");
      }
    } catch (err) {
      console.error(err);
      showMsg("잠시 문제가 생겼어요. 다시 시도해 주세요.", "err");
    } finally {
      loading.hidden = true;
      wishSubmit.disabled = false;
    }
  }

  function showMsg(text, kind) {
    wishMsg.textContent = text;
    wishMsg.className = "modal-msg " + (kind || "");
  }

  /* ========== 3) 연등 띄우기 ========== */
  function floatLantern(text) {
    if (lanternLayer.children.length >= cfg.MAX_LANTERNS) {
      lanternLayer.removeChild(lanternLayer.firstChild);
    }
    const el = document.createElement("div");
    el.className = "lantern";
    el.style.left = (8 + Math.random() * 80) + "%";
    el.style.setProperty("--dur", (22 + Math.random() * 12) + "s");
    el.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
    el.innerHTML = `<div class="glow"></div><div class="text"></div>`;
    el.querySelector(".text").textContent = text;
    lanternLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  /* ========== 4) 로컬 모드 저장/불러오기 ========== */
  function saveLocal(text) {
    const list = JSON.parse(localStorage.getItem("ms_wishes") || "[]");
    list.push({ content: text, at: Date.now() });
    localStorage.setItem("ms_wishes", JSON.stringify(list.slice(-50)));
  }
  function loadLocalWishes() {
    const list = JSON.parse(localStorage.getItem("ms_wishes") || "[]");
    list.slice(-8).forEach((w, i) => setTimeout(() => floatLantern(w.content), i * 1400));
  }

  /* ========== 5) 서버 모드 (Supabase + Gemini) ========== */
  let supa = null;
  async function initServer() {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    supa = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  async function submitToServer(text) {
    // 서버리스 함수가 2차 검열(Gemini) 후 통과한 글만 저장합니다.
    const res = await fetch("/api/submit-wish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, sessionId }),
    });
    return res.json(); // { ok, reason? }
  }

  async function loadServerWishes() {
    const { data, error } = await supa
      .from("wishes")
      .select("content")
      .eq("status", "public")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) { console.error(error); return; }
    (data || []).reverse().forEach((w, i) =>
      setTimeout(() => floatLantern(w.content), i * 1300)
    );
  }

  /* ========== 6) 방문자 수 ========== */
  const todayKey = "ms_visit_" + new Date().toISOString().slice(0, 10);

  async function handleVisitor() {
    if (serverMode && supa) {
      // 하루에 이 브라우저당 한 번만 기록
      if (!localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, "1");
        await supa.from("visits").insert({ session_id: sessionId });
      }
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supa
        .from("visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);
      renderVisitor(count || 1);
    } else {
      let n = Number(localStorage.getItem(todayKey) || 0) + 1;
      localStorage.setItem(todayKey, n);
      renderVisitor(n);
    }
  }
  function renderVisitor(n) {
    visitorBadge.textContent = `오늘 ${n.toLocaleString("ko-KR")}명이 다녀갔어요`;
  }

  /* ========== 시작 ========== */
  (async function start() {
    if (serverMode) {
      try {
        await initServer();
        await loadServerWishes();
      } catch (e) {
        console.error("서버 모드 초기화 실패 → 로컬 모드로 전환", e);
        loadLocalWishes();
      }
    } else {
      loadLocalWishes();
    }
    handleVisitor();
  })();

  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
})();
