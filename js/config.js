/* ============================================================
 *  설정 파일
 *  - 아래 두 값이 비어 있으면 '로컬 모드'로 동작합니다.
 *    (브라우저만으로 바로 작동, 염원은 이 브라우저에만 저장)
 *  - Supabase 값을 채우면 '서버 모드'가 되어 여러 사람이
 *    함께 쓰고, 서버 Gemini 검열이 켜집니다. (README 참고)
 *
 *  ※ 여기 적는 ANON KEY 는 공개돼도 되는 '공개 키'입니다.
 *    절대 넣지 말 것: SERVICE_ROLE_KEY, GEMINI_API_KEY
 *    → 이 둘은 Vercel 서버(환경변수)에만 둡니다.
 * ============================================================ */
window.CONFIG = {
  // [권장·무료] Google 시트 모드 — Apps Script 웹 앱 배포 주소(…/exec)를 넣으면 켜집니다.
  // 이 값이 있으면 아래 Supabase 설정은 무시됩니다.
  APPS_SCRIPT_URL: "",
  SUPABASE_URL: "",       // 예) https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "",  // 예) eyJhbGciOi...
  WISH_COOLDOWN_SEC: 30,  // 염원 도배 방지: 올린 뒤 다음 글까지 대기(초)
  MAX_LANTERNS: 24,       // 화면에 동시에 떠 있을 연등 최대 개수
};
