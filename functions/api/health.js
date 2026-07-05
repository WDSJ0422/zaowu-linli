import { json } from "../_lib.js";

export async function onRequestGet({ env }) {
  const ok = !!env.DB;
  return json({ ok, service: "zaowu-linli", database: ok ? "bound" : "missing" });
}

