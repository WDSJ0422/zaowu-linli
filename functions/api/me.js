import { json, readJson, requireUser } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  return json({ user });
}

export async function onRequestPut({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const name = String(body.name || user.name).trim();
  await env.DB.prepare("UPDATE users SET name=? WHERE id=?").bind(name, user.id).run();
  return json({ user: { ...user, name } });
}

