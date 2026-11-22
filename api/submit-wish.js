/* ============================================================
 *  Vercel 서버리스 함수 — 염원 제출 (게시 전 검열)
 *  POST /api/submit-wish   body: { content, sessionId }
 *
 *  흐름:
 *   1) 서버에서도 기본 금칙어/전화번호 재검사
 *   2) Gemini API 로 '부적절한 글인가' 2차 판정
 *   3) 통과한 글만 Supabase 에 status='public' 으로 저장
 *
 *  필요한 환경변수 (Vercel Project Settings → Environment Variables):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY   (※ 절대 프론트에 넣지 말 것)
 *   - GEMINI_API_KEY
 *   - GEMINI_MODEL  (선택, 기본 gemini-2.5-flash)
 * ============================================================ */
import { createClient } from "@supabase/supabase-js";

const PHONE_RE = /(01[016789])[-\s.]?\d{3,4}[-\s.]?\d{4}/;
const SERVER_BADWORDS = ["시발", "씨발", "병신", "지랄", "개새끼", "좆", "존나", "닥쳐", "꺼져"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "POST only" });
  }

  const { content, sessionId } = req.body || {};
  const text = (content || "").trim();

  // ---- 기본 검증 ----
  if (!text) return res.json({ ok: false, reason: "내용이 비어 있어요." });
  if (text.length > 100) return res.json({ ok: false, reason: "100자 이내로 써 주세요." });
  if (PHONE_RE.test(text) || /\d{8,}/.test(text)) {
    return res.json({ ok: false, reason: "전화번호나 개인정보는 담을 수 없어요." });
  }
  const lowered = text.replace(/\s/g, "");
  if (SERVER_BADWORDS.some((w) => lowered.includes(w))) {
    return res.json({ ok: false, reason: "따뜻한 말로 다시 적어 주세요." });
  }

  // ---- 2차: Gemini 검열 ----
  try {
    const verdict = await moderateWithGemini(text);
    if (!verdict.allowed) {
      return res.json({ ok: false, reason: "조금 더 따뜻한 말로 적어 주세요." });
    }
  } catch (e) {
    console.error("Gemini 검열 실패:", e);
    // 검열기가 죽었을 때: 안전하게 '보류'로 저장 → 교사가 확인 후 공개
    return saveWish(res, text, sessionId, "pending",
      "올렸어요. 선생님 확인 후 등불이 켜질 거예요.");
  }

  // ---- 통과 → 저장(공개) ----
  return saveWish(res, text, sessionId, "public");
}

/* Gemini 로 부적절성 판정 → { allowed: boolean } */
async function moderateWithGemini(text) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const prompt =
    "너는 초등학생이 쓰는 '마음쉼터' 게시물을 심사하는 검열기야.\n" +
    "다음 글에 욕설, 비방, 특정인 저격·조롱, 차별·혐오, 성적 표현, " +
    "개인정보(이름·연락처), 폭력·자해 조장이 있으면 부적절(false)이야.\n" +
    "평범한 소망·감정·응원은 적절(true)이야.\n" +
    "오직 JSON 한 줄로만 답해: {\"allowed\": true} 또는 {\"allowed\": false}\n\n" +
    "글: " + text;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 20 },
    }),
  });

  const data = await resp.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const m = out.match(/\{[^}]*\}/);
  if (!m) return { allowed: false };
  try {
    return { allowed: JSON.parse(m[0]).allowed === true };
  } catch {
    return { allowed: false };
  }
}

/* Supabase 에 저장 */
async function saveWish(res, content, sessionId, status, okMsg) {
  const supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await supa
    .from("wishes")
    .insert({ content, session_id: sessionId || null, status });
  if (error) {
    console.error(error);
    return res.json({ ok: false, reason: "저장 중 문제가 생겼어요." });
  }
  return res.json({ ok: status === "public", pending: status === "pending", reason: okMsg });
}
