// Cloudflare Edge API endpoint for Published Meadow Objects (PNGs, Text, Drawings)

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
      const cached = await env.MAYKO_KV.get('meadow_objects_cache', 'json');
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
      ).bind('global_meadow_v1').all();

      let objects = [];
      if (results && results.length > 0) {
        try {
          objects = JSON.parse(results[0].data);
        } catch (e) {}
      }

      // Populate KV cache
      if (env.MAYKO_KV) {
        try {
          await env.MAYKO_KV.put('meadow_objects_cache', JSON.stringify(objects), { expirationTtl: 86400 });
        } catch (e) {}
      }

      return new Response(JSON.stringify(objects), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=10'
        }
      });
    } catch (e) {
      console.error('D1 GET meadow_objects error:', e);
    }
  }

  return new Response(JSON.stringify([]), {
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

    const objects = body.objects || [];
    const dataJson = JSON.stringify(objects);
    const nowIso = new Date().toISOString();

    if (env.DB) {
      await ensureTable(env.DB);
      await env.DB.prepare(`
        INSERT INTO meadow_objects (id, data, updated_at)
        VALUES ('global_meadow_v1', ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `).bind(dataJson, nowIso).run();
    }

    if (env.MAYKO_KV) {
      try {
        await env.MAYKO_KV.put('meadow_objects_cache', dataJson, { expirationTtl: 86400 });
      } catch (e) {}
    }

    return new Response(JSON.stringify({ success: true, count: objects.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
