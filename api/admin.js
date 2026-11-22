/* ============================================================
 *  Vercel 서버리스 함수 — 교사 관리 API
 *  비밀번호(ADMIN_PASSWORD)로 보호되는 간단한 관리 엔드포인트.
 *
 *  POST /api/admin   body: { password, action, id? }
 *   action:
 *     "list"     → 전체 염원 목록(최근순)
 *     "reported" → 신고된 글만
 *     "hide"     → id 글 숨김(status='hidden')
 *     "show"     → id 글 공개(status='public')
 *     "delete"   → id 글 삭제
 *
 *  환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD
 * ============================================================ */
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { password, action, id } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, reason: "비밀번호가 올바르지 않습니다." });
  }

  const supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    if (action === "list" || action === "reported") {
      let q = supa.from("wishes").select("*").order("created_at", { ascending: false }).limit(200);
      if (action === "reported") q = q.eq("reported", true);
      const { data, error } = await q;
      if (error) throw error;
      return res.json({ ok: true, items: data });
    }

    if (["hide", "show", "delete"].includes(action)) {
      if (!id) return res.json({ ok: false, reason: "대상 id가 없습니다." });
      if (action === "delete") {
        const { error } = await supa.from("wishes").delete().eq("id", id);
        if (error) throw error;
      } else {
        const status = action === "hide" ? "hidden" : "public";
        const { error } = await supa.from("wishes").update({ status }).eq("id", id);
        if (error) throw error;
      }
      return res.json({ ok: true });
    }

    return res.json({ ok: false, reason: "알 수 없는 action." });
  } catch (e) {
    console.error(e);
    return res.json({ ok: false, reason: "처리 중 오류가 발생했습니다." });
  }
}
