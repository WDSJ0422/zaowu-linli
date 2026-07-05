import { id, json, now, readJson, requireUser, required } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const { results } = await env.DB.prepare(
    "SELECT i.*,p.name AS printer_name,p.phone AS printer_phone,p.wechat AS printer_wechat FROM inquiries i LEFT JOIN printers p ON p.id=i.printer_id WHERE i.buyer_id=? OR p.owner_id=? ORDER BY i.created_at DESC"
  )
    .bind(user.id, user.id)
    .all();
  return json({ inquiries: results || [] });
}

export async function onRequestPost({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const missing = required(body, ["item", "material", "color", "size", "address", "recipient", "phone"]);
  if (missing) return json({ error: "请填写完整询价信息" }, 422);
  if (!body.model_link && !body.upload_name && !body.catalog_model_id) {
    return json({ error: "请上传模型文件、选择平台模型，或粘贴外部模型链接" }, 422);
  }
  let printer = null;
  if (body.printer_id && body.printer_id !== "random") {
    printer = await env.DB.prepare("SELECT id FROM printers WHERE id=? AND active=1").bind(body.printer_id).first();
  } else {
    printer = await env.DB.prepare("SELECT id FROM printers WHERE active=1 ORDER BY RANDOM() LIMIT 1").first();
  }
  if (!printer) return json({ error: "目前没有可咨询的打印机主" }, 422);
  const inquiryId = id("inquiry");
  await env.DB.prepare(
    "INSERT INTO inquiries (id,buyer_id,printer_id,item,icon,reference_price,model_link,upload_name,material,color,size,address,recipient,phone,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      inquiryId,
      user.id,
      printer.id,
      body.item,
      body.icon || "◫",
      body.reference_price || 59,
      body.model_link || "",
      body.upload_name || "",
      body.material,
      body.color,
      body.size,
      body.address,
      body.recipient,
      body.phone,
      "待商家报价",
      now()
    )
    .run();
  return json({ inquiry_id: inquiryId, status: "created" }, 201);
}

