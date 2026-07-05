import { createSession, hashPassword, json, normalizePhone, readJson } from "../../_lib.js";

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const phone = normalizePhone(body.phone);
  const user = await env.DB.prepare(
    "SELECT id,name,phone,role,password_hash,password_salt,created_at FROM users WHERE phone=?"
  )
    .bind(phone)
    .first();
  if (!user) return json({ error: "手机号或密码不正确" }, 401);
  const { hash } = await hashPassword(body.password || "", user.password_salt);
  if (hash !== user.password_hash) return json({ error: "手机号或密码不正确" }, 401);
  const token = await createSession(env, user.id);
  return json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
}

