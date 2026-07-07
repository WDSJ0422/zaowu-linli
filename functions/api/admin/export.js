import { json } from "../../_lib.js";

export async function onRequestGet({ request, env }) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: "未授权" }, 401);
  const users = await env.DB.prepare("SELECT id,name,phone,role,created_at FROM users ORDER BY created_at DESC").all();
  const printers = await env.DB.prepare("SELECT * FROM printers ORDER BY created_at DESC").all();
  const inquiries = await env.DB.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
  const makerModels = await env.DB.prepare("SELECT * FROM maker_models ORDER BY created_at DESC").all();
  return json({
    users: users.results || [],
    printers: printers.results || [],
    inquiries: inquiries.results || [],
    maker_models: makerModels.results || [],
  });
}
