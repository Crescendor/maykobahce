// Cloudflare Edge API endpoint for Global Custom Outer Background PNG Image

async function ensureTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS meadow_objects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `).run();
  } catch (e) {
    console.error('ensureTable meadow_objects error:', e);
  }
}

export async function onRequestGet({ env }) {
  // 1. Try KV Cache first for maximum speed
  if (env.MAYKO_KV) {
    try {
      const cached = await env.MAYKO_KV.get('custom_bg_cache', 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=10'
          }
        });
      }
    } catch (e) {}
  }

  // 2. Fetch from Cloudflare D1 Database
  if (env.DB) {
    await ensureTable(env.DB);
    try {
      const { results } = await env.DB.prepare(
        'SELECT data FROM meadow_objects WHERE id = ?'
      ).bind('global_custom_bg').all();

      let customBg = null;
      if (results && results.length > 0) {
        try {
          customBg = JSON.parse(results[0].data);
        } catch (e) {}
      }

      // Populate KV cache
      if (env.MAYKO_KV && customBg) {
        try {
          await env.MAYKO_KV.put('custom_bg_cache', JSON.stringify(customBg), { expirationTtl: 86400 });
        } catch (e) {}
      }

      return new Response(JSON.stringify(customBg), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=10'
        }
      });
    } catch (e) {
      console.error('D1 GET custom_bg error:', e);
    }
  }

  return new Response(JSON.stringify(null), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const adminPassword = body.adminPassword;
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

    if (!adminPassword || adminPassword !== expectedAdminPass) {
      return new Response(JSON.stringify({ error: 'Yetki hatası!' }), { status: 403 });
    }

    const customBg = body.customBg || null;
    const dataJson = JSON.stringify(customBg);
    const nowIso = new Date().toISOString();

    if (env.DB) {
      await ensureTable(env.DB);
      await env.DB.prepare(`
        INSERT INTO meadow_objects (id, data, updated_at)
        VALUES ('global_custom_bg', ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `).bind(dataJson, nowIso).run();
    }

    if (env.MAYKO_KV) {
      try {
        if (customBg) {
          await env.MAYKO_KV.put('custom_bg_cache', dataJson, { expirationTtl: 86400 });
        } else {
          await env.MAYKO_KV.delete('custom_bg_cache');
        }
      } catch (e) {}
    }

    return new Response(JSON.stringify({ success: true, customBg }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
