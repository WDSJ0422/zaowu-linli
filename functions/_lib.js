export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function required(body, fields) {
  for (const field of fields) {
    if (!String(body[field] || "").trim()) return `${field} is required`;
  }
  return "";
}

export function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").trim();
}

export function now() {
  return Date.now();
}

export function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function hashPassword(password, salt = crypto.randomUUID()) {
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { salt, hash };
}

export async function createSession(env, userId) {
  const token = crypto.randomUUID() + "." + crypto.randomUUID();
  const createdAt = now();
  const expiresAt = createdAt + 1000 * 60 * 60 * 24 * 30;
  await env.DB.prepare("INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)")
    .bind(token, userId, createdAt, expiresAt)
    .run();
  return token;
}

export async function authUser(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT u.id,u.name,u.phone,u.role,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?"
  )
    .bind(token, now())
    .first();
  return row || null;
}

export async function requireUser(request, env) {
  const user = await authUser(request, env);
  if (!user) return { error: json({ error: "请先登录" }, 401) };
  return { user };
}

