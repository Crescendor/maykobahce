// Cloudflare Pages Function: /api/flower/[id] (DELETE flower)

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const flowerId = params.id;

  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    const deleteCode = body.deleteCode;
    const adminPassword = body.adminPassword;
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

    let authorized = false;

    // Admin authorization
    if (adminPassword && adminPassword === expectedAdminPass) {
      authorized = true;
    }

    if (env.DB && !authorized) {
      // Fetch flower delete_code from D1 to verify
      const flower = await env.DB.prepare('SELECT delete_code FROM flowers WHERE id = ?')
        .bind(flowerId)
        .first();

      if (flower && (flower.delete_code === deleteCode || !flower.delete_code)) {
        authorized = true;
      }
    } else if (!env.DB) {
      authorized = true;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Geçersiz silme kodu veya yetki hatası!' }), {
        status: 403
      });
    }

    // Delete from D1 Database
    if (env.DB) {
      await env.DB.prepare('DELETE FROM flowers WHERE id = ?').bind(flowerId).run();

      // Invalidate KV cache
      if (env.MAYKO_KV) {
        context.waitUntil(env.MAYKO_KV.delete('flowers_cache'));
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Çiçek başarıyla silindi.' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
