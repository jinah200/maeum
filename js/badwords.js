/* ============================================================
 *  1차 필터 — 브라우저 금칙어 검사 (즉시 차단)
 *  서버(Code.gs)도 같은 방식으로 한 번 더 검사합니다.
 *  단어를 늘릴 때는 아래 BAD_WORDS 와 Code.gs 의 BAD_WORDS 를 함께 바꾸세요.
 * ============================================================ */
(function () {
  const BAD_WORDS = [
    '시발', '씨발', '씨빨', '시팔', '씨팔', '개새끼', '새끼', '개색', '병신', '지랄', '좆', '존나',
    '닥쳐', '꺼져', '엿먹', '미친놈', '미친년', '등신', '애미', '애비', '창녀', '걸레', '강간',
    '자살해', '죽어버려', '꺼지라', '싸가지', '쓰레기같', '찐따', '장애인같', '느금',
    'fuck', 'shit', 'bitch', 'asshole',
  ];
  // 자음만 이어 쓴 욕설 (ㅅㅂ 등) — 자음만 쓴 부분에서만 찾아서 '수박'·'자랑' 같은 낱말은 막지 않아요
  const BAD_CHO = ['ㅅㅂ', 'ㅄ', 'ㅂㅅ', 'ㅆㅂ', 'ㅈㄹ', 'ㄷㅊ', 'ㄱㅅㄲ', 'ㅈㄴ', 'ㅁㅊ'];

  const PHONE_RE = /(01[016789])[-\s.]?\d{3,4}[-\s.]?\d{4}/;
  const DIGIT_RUN_RE = /\d{8,}/;
  const LINK_RE = /(https?:\/\/|www\.|\.com\b|\.co\.kr|\.kr\/|\.net\b|\.io\b)/i;
  const MAIL_RE = /[a-z0-9._-]+@[a-z0-9.-]+/i;

  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  function normalize(text) {
    return String(text).toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^0-9a-z가-힣ㄱ-ㅎ]/g, '')
      .replace(/(.)\1{2,}/g, '$1$1')
      .replace(/[1!|]/g, 'ㅣ')
      .replace(/0/g, 'ㅇ');
  }
  // 'ㅂㅏㄹ' → '발'
  function compose(t) {
    return String(t).replace(/([ㄱ-ㅎ])([ㅏ-ㅣ])([ㄱ-ㅎ](?![ㅏ-ㅣ]))?/g, (all, c, v, f) => {
      const ci = CHO.indexOf(c), vi = JUNG.indexOf(v), fi = f ? JONG.indexOf(f) : 0;
      if (ci < 0 || vi < 0 || fi < 0) return all;
      return String.fromCharCode(0xac00 + (ci * 21 + vi) * 28 + fi);
    });
  }
  function variants(text) {
    const raw = String(text).replace(/\s+/g, '');
    const joined = compose(raw.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g, ''));
    return [normalize(text), normalize(joined), joined.toLowerCase().replace(/[^가-힣a-z]/g, '')];
  }

  /** 텍스트 검사 → { ok, reason } */
  function check(text) {
    const raw = (text || '').trim();
    if (!raw) return { ok: false, reason: '내용을 입력해 주세요.' };
    if (raw.length > 100) return { ok: false, reason: '100자 이내로 써 주세요.' };
    if (PHONE_RE.test(raw) || DIGIT_RUN_RE.test(raw) || MAIL_RE.test(raw)) {
      return { ok: false, reason: '전화번호나 개인정보는 담을 수 없어요.' };
    }
    if (LINK_RE.test(raw)) return { ok: false, reason: '링크는 담을 수 없어요.' };
    const vs = variants(raw);
    for (const w of BAD_WORDS) {
      const a = normalize(w), b = w.toLowerCase();
      if (vs.some((v) => v.includes(a) || v.includes(b))) return { ok: false, reason: '따뜻한 말로 다시 적어 주세요.' };
    }
    const jamo = (raw.match(/[ㄱ-ㅎ]+/g) || []).join('');
    if (BAD_CHO.some((c) => jamo.includes(c))) return { ok: false, reason: '따뜻한 말로 다시 적어 주세요.' };
    return { ok: true, reason: '' };
  }

  window.Filter = { check, normalize };
})();
