// Cloudflare Pages Function: /api/flower/[id] (DELETE, PATCH)

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const flowerId = params.id;

  try {
    let body = {};
    try { body = await request.json(); } catch (e) { }

    const deleteCode = (body.deleteCode || '').trim().toUpperCase();
    const adminPassword = body.adminPassword || '';
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';
    let authorized = false;

    if (adminPassword && adminPassword === expectedAdminPass) {
      authorized = true;
    }

    if (env.DB && !authorized) {
      await ensureSchema(env.DB);
      const flower = await env.DB.prepare('SELECT delete_code FROM flowers WHERE id = ?')
        .bind(flowerId).first();

      if (flower) {
        const dbCode = (flower.delete_code || '').trim().toUpperCase();
        if (!dbCode || dbCode === deleteCode) {
          authorized = true;
        }
      }
    } else if (!env.DB) {
      authorized = true;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Geçersiz silme kodu veya yetki hatası!' }), { status: 403 });
    }

    if (env.DB) {
      await env.DB.prepare('DELETE FROM flowers WHERE id = ?').bind(flowerId).run();
    }

    if (env.MAYKO_KV) {
      try {
        await env.MAYKO_KV.delete('flowers_cache');
      } catch (e) { }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function ensureSchema(db) {
  if (!db) return;
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN approved INTEGER DEFAULT 0').run(); } catch (e) { }
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN animation TEXT DEFAULT NULL').run(); } catch (e) { }
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN animation_color TEXT DEFAULT NULL').run(); } catch (e) { }
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN real_sender TEXT DEFAULT NULL').run(); } catch (e) { }
}

// PATCH /api/flower/[id] — Admin: approve or set animation
export async function onRequestPatch(context) {
  const { request, params, env } = context;
  const flowerId = params.id;

  try {
    const body = await request.json();
    const adminPassword = body.adminPassword;
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

    if (!adminPassword || adminPassword !== expectedAdminPass) {
      return new Response(JSON.stringify({ error: 'Yetki hatası!' }), { status: 403 });
    }

    if (env.DB) {
      await ensureSchema(env.DB);
      const updates = [];
      const values = [];

      if (body.approved !== undefined) { updates.push('approved = ?'); values.push(body.approved ? 1 : 0); }
      if (body.animation !== undefined) { updates.push('animation = ?'); values.push(body.animation || null); }
      if (body.animationColor !== undefined) { updates.push('animation_color = ?'); values.push(body.animationColor || null); }
      if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name || 'Anonim'); }
      if (body.note !== undefined) { updates.push('note = ?'); values.push(body.note || ''); }
      if (body.instagram !== undefined) { updates.push('instagram = ?'); values.push(body.instagram || ''); }
      if (body.x !== undefined) { updates.push('x = ?'); values.push(body.x); }
      if (body.y !== undefined) { updates.push('y = ?'); values.push(body.y); }

      if (updates.length > 0) {
        values.push(flowerId);
        await env.DB.prepare(`UPDATE flowers SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      }
    }

    if (env.MAYKO_KV) {
      try {
        await env.MAYKO_KV.delete('flowers_cache');
      } catch (e) { }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
