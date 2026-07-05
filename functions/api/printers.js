import { id, json, now, readJson, requireUser, required } from "../_lib.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id,owner_id,name,model,city,materials,size,price,phone,wechat,active,rating,eta,created_at FROM printers WHERE active=1 ORDER BY created_at DESC"
  ).all();
  return json({ printers: results || [] });
}

export async function onRequestPost({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const missing = required(body, ["name", "model", "city", "materials", "size", "price"]);
  if (missing) return json({ error: "请填写完整打印机资料" }, 422);
  const old = await env.DB.prepare("SELECT id FROM printers WHERE owner_id=?").bind(user.id).first();
  const active = body.active === false ? 0 : 1;
  if (old) {
    await env.DB.prepare(
      "UPDATE printers SET name=?,model=?,city=?,materials=?,size=?,price=?,phone=?,wechat=?,active=?,eta=? WHERE owner_id=?"
    )
      .bind(
        body.name,
        body.model,
        body.city,
        body.materials,
        body.size,
        body.price,
        body.phone || "",
        body.wechat || "",
        active,
        active ? "今天可咨询" : "暂不接需求",
        user.id
      )
      .run();
    return json({ printer_id: old.id, status: "updated" });
  }
  const printerId = id("printer");
  await env.DB.prepare(
    "INSERT INTO printers (id,owner_id,name,model,city,materials,size,price,phone,wechat,active,rating,eta,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      printerId,
      user.id,
      body.name,
      body.model,
      body.city,
      body.materials,
      body.size,
      body.price,
      body.phone || "",
      body.wechat || "",
      active,
      "5.0",
      active ? "今天可咨询" : "暂不接需求",
      now()
    )
    .run();
  return json({ printer_id: printerId, status: "created" }, 201);
}

