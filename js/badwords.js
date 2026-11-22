/* ============================================================
 *  1차 필터 — 클라이언트 금칙어 사전 (즉시 차단)
 *  브라우저에서 바로 거르는 1차 방어선입니다.
 *  완벽하지 않으므로(우회 가능) 서버 Gemini 검열(2차)과 함께 씁니다.
 *  단어는 아래 BAD_WORDS / BAD_CHOSUNG 배열에 자유롭게 추가하세요.
 * ============================================================ */
(function () {
  // 받침 없이 흔히 쓰이는 비속어 어근. 필요에 맞게 늘리세요.
  const BAD_WORDS = [
    "시발", "씨발", "씨빨", "시팔", "씨팔", "ㅅㅂ", "개새끼", "새끼", "개색",
    "병신", "ㅂㅅ", "지랄", "ㅈㄹ", "좆", "존나", "ㅈㄴ", "닥쳐", "꺼져",
    "엿먹", "미친놈", "미친년", "등신", "애미", "애비", "창녀", "걸레",
    "강간", "자살해", "죽어버려", "꺼지라", "싸가지", "쓰레기같",
    "fuck", "shit", "bitch", "asshole",
  ];

  // 초성만으로 쓰는 욕설(ㅅㅂ 등)을 잡기 위한 초성 패턴
  const BAD_CHOSUNG = ["ㅅㅂ", "ㅄ", "ㅂㅅ", "ㅆㅂ", "ㅈㄹ", "ㄷㅊ", "ㄱㅅㄲ"];

  // 전화번호/연락처 패턴 (개인정보 차단)
  const PHONE_RE = /(01[016789])[-\s.]?\d{3,4}[-\s.]?\d{4}/;
  const DIGIT_RUN_RE = /\d{8,}/; // 숫자 8자리 이상 연속(계좌·주민번호 등 의심)

  // 문자열 정규화: 공백/특수문자 제거, 반복문자 축약, 흔한 숫자 치환
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^0-9a-z가-힣ㄱ-ㅎ]/g, "") // 특수문자 제거(우회 방지)
      .replace(/(.)\1{2,}/g, "$1$1")       // ㅋㅋㅋㅋ → ㅋㅋ
      .replace(/[1!|]/g, "ㅣ")             // 시1발 류 완화
      .replace(/0/g, "ㅇ");
  }

  // 한글 → 초성 추출
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  function toChosung(text) {
    let out = "";
    for (const ch of text) {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code >= 0 && code <= 11171) out += CHO[Math.floor(code / 588)];
      else if (/[ㄱ-ㅎ]/.test(ch)) out += ch;
    }
    return out;
  }

  /**
   * 텍스트 검사 → { ok, reason }
   * ok=false 이면 reason 에 차단 사유가 담깁니다.
   */
  function check(text) {
    const raw = (text || "").trim();
    if (!raw) return { ok: false, reason: "내용을 입력해 주세요." };
    if (raw.length > 100) return { ok: false, reason: "100자 이내로 써 주세요." };

    if (PHONE_RE.test(raw) || DIGIT_RUN_RE.test(raw)) {
      return { ok: false, reason: "전화번호나 개인정보는 담을 수 없어요." };
    }

    const norm = normalize(raw);
    for (const w of BAD_WORDS) {
      if (norm.includes(normalize(w))) {
        return { ok: false, reason: "따뜻한 말로 다시 적어 주세요." };
      }
    }

    const cho = toChosung(raw);
    for (const c of BAD_CHOSUNG) {
      if (cho.includes(c)) {
        return { ok: false, reason: "따뜻한 말로 다시 적어 주세요." };
      }
    }

    return { ok: true, reason: "" };
  }

  window.Filter = { check, normalize };
})();
