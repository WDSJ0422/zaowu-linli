import { json, now, readJson, requireUser, required } from "../../_lib.js";

const MAX_IMAGE_DATA_LENGTH = 420000;

function cleanText(value) {
  return String(value || "").trim();
}

function cleanPrice(value) {
  return Math.max(0, Math.round(Number(value) || 29));
}

function cleanImageData(value) {
  const image = cleanText(value);
  if (!image) return "";
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
    throw new Error("图片格式只支持 JPG、PNG、WebP");
  }
  if (image.length > MAX_IMAGE_DATA_LENGTH) {
    throw new Error("图片太大，请换一张更小的图片");
  }
  return image;
}

async function requireOwner(env, userId, modelId) {
  const row = await env.DB.prepare("SELECT owner_id FROM maker_models WHERE id=?").bind(modelId).first();
  if (!row) return { error: json({ error: "模型不存在" }, 404) };
  if (row.owner_id !== userId) return { error: json({ error: "只能管理自己上传的模型" }, 403) };
  return { ok: true };
}

export async function onRequestGet({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const { results } = await env.DB.prepare(
    `SELECT m.id,m.owner_id,m.printer_id,m.name,m.category,m.material,m.reference_price,
            m.license,m.description,m.file_name,m.image_data,m.active,m.created_at,m.updated_at,
            p.name AS printer_name,p.city AS printer_city
       FROM maker_models m
       JOIN printers p ON p.id=m.printer_id
      WHERE m.owner_id=?
      ORDER BY m.created_at DESC`
  )
    .bind(user.id)
    .all();
  return json({ models: results || [] });
}

export async function onRequestPatch({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const modelId = cleanText(body.id);
  if (!modelId) return json({ error: "缺少模型 ID" }, 422);

  const owner = await requireOwner(env, user.id, modelId);
  if (owner.error) return owner.error;

  try {
    await env.DB.prepare(
      `UPDATE maker_models
          SET name=?,
              category=?,
              material=?,
              reference_price=?,
              license=?,
              description=?,
              file_name=?,
              image_data=?,
              active=?,
              updated_at=?
        WHERE id=?`
    )
      .bind(
        cleanText(body.name),
        cleanText(body.category),
        cleanText(body.material),
        cleanPrice(body.reference_price),
        cleanText(body.license),
        cleanText(body.description),
        cleanText(body.file_name),
        cleanImageData(body.image_data),
        body.active === false || body.active === 0 ? 0 : 1,
        now(),
        modelId
      )
      .run();
  } catch (err) {
    return json({ error: err.message || "保存失败" }, 422);
  }

  return json({ ok: true, model_id: modelId });
}

export async function onRequestDelete({ request, env }) {
  const { user, error } = await requireUser(request, env);
  if (error) return error;
  const body = await readJson(request);
  const modelId = cleanText(body.id);
  if (!modelId) return json({ error: "缺少模型 ID" }, 422);

  const owner = await requireOwner(env, user.id, modelId);
  if (owner.error) return owner.error;

  await env.DB.prepare("UPDATE maker_models SET active=0,updated_at=? WHERE id=?").bind(now(), modelId).run();
  return json({ ok: true, model_id: modelId });
}
