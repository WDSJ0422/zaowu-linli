import { id, json, now, readJson, requireUser, required } from "../_lib.js";

function normalizeImageData(value) {
  const image = String(value || "").trim();
  if (!image) return "";
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
    throw new Error("图片格式只支持 JPG、PNG、WebP");
  }
  if (image.length > 420000) {
    throw new Error("图片太大，请换一张更小的图片");
  }
  return image;
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT m.id,m.owner_id,m.printer_id,m.name,m.category,m.material,m.reference_price,
            m.license,m.description,m.file_name,m.image_data,m.created_at,
            u.name AS author_name,p.name AS printer_name,p.city AS printer_city
       FROM maker_models m
       JOIN users u ON u.id=m.owner_id
       JOIN printers p ON p.id=m.printer_id
      WHERE m.active=1
      ORDER BY m.created_at DESC`
  ).all();
  return json({ models: results || [] });
}

export async function onRequestPost({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const missing = required(body, ["name", "category", "material", "reference_price", "license"]);
  if (missing) return json({ error: "请填写完整模型展示信息" }, 422);

  const printer = await env.DB.prepare("SELECT id FROM printers WHERE owner_id=?").bind(user.id).first();
  if (!printer) return json({ error: "请先发布打印机资料，再上传设计模型" }, 422);

  const modelId = id("model");
  const price = Math.max(0, Math.round(Number(body.reference_price) || 29));
  let imageData = "";
  try {
    imageData = normalizeImageData(body.image_data);
  } catch (err) {
    return json({ error: err.message || "图片保存失败" }, 422);
  }

  await env.DB.prepare(
    `INSERT INTO maker_models
      (id,owner_id,printer_id,name,category,material,reference_price,license,description,file_name,image_data,active,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      modelId,
      user.id,
      printer.id,
      String(body.name || "").trim(),
      String(body.category || "").trim(),
      String(body.material || "").trim(),
      price,
      String(body.license || "").trim(),
      String(body.description || "").trim(),
      String(body.file_name || "").trim(),
      imageData,
      1,
      now(),
      now()
    )
    .run();

  return json({ model_id: modelId, status: "created" }, 201);
}
