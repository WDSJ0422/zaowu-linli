import { json, readJson } from "../../_lib.js";

function requireAdmin(request, env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_TOKEN && token === env.ADMIN_TOKEN);
}

export async function onRequestDelete({ request, env }) {
  if (!requireAdmin(request, env)) return json({ error: "未授权" }, 401);

  const body = await readJson(request);
  const userId = String(body.id || "").trim();
  if (!userId) return json({ error: "缺少用户 ID" }, 400);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(userId).run();
  await env.DB.prepare("DELETE FROM inquiries WHERE buyer_id=?").bind(userId).run();
  await env.DB.prepare("DELETE FROM inquiries WHERE printer_id IN (SELECT id FROM printers WHERE owner_id=?)")
    .bind(userId)
    .run();
  await env.DB.prepare("DELETE FROM printers WHERE owner_id=?").bind(userId).run();
  await env.DB.prepare("DELETE FROM users WHERE id=?").bind(userId).run();

  return json({ ok: true, deletedUserId: userId });
}
