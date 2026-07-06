import { createSession, hashPassword, id, json, normalizePhone, readJson, required, now } from "../../_lib.js";

const TERMS_VERSION = "2026-07-06";
const PRIVACY_VERSION = "2026-07-06";

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const missing = required(body, ["name", "phone", "password"]);
  if (missing) return json({ error: "请填写昵称、手机号和密码" }, 422);
  const phone = normalizePhone(body.phone);
  if (!/^(\+?86)?1\d{10}$/.test(phone)) return json({ error: "请输入有效的中国大陆手机号" }, 422);
  if (String(body.password).length < 6) return json({ error: "密码至少 6 位" }, 422);

  const exists = await env.DB.prepare("SELECT id FROM users WHERE phone=?").bind(phone).first();
  if (exists) return json({ error: "该手机号已经注册，请直接登录" }, 409);

  const userId = id("user");
  const role = body.role === "printer" ? "printer" : "buyer";
  const { salt, hash } = await hashPassword(body.password);
  const agreedAt = now();
  await env.DB.prepare(
    "INSERT INTO users (id,name,phone,password_hash,password_salt,role,terms_version,privacy_version,agreed_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
  )
    .bind(userId, String(body.name).trim(), phone, hash, salt, role, TERMS_VERSION, PRIVACY_VERSION, agreedAt, agreedAt)
    .run();
  const token = await createSession(env, userId);
  return json({
    token,
    user: {
      id: userId,
      name: String(body.name).trim(),
      phone,
      role,
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      agreed_at: agreedAt,
    },
  }, 201);
}
