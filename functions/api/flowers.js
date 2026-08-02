// Cloudflare Pages Function: /api/flowers (GET all, POST new flower)

export async function onRequestGet(context) {
  const { env } = context;

  // 1. Try serving from Cloudflare KV Edge Cache first (0 D1 read cost!)
  if (env.MAYKO_KV) {
    try {
      const cached = await env.MAYKO_KV.get('flowers_cache', 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=10, s-maxage=30',
            'X-Cache': 'HIT-KV'
          }
        });
      }
    } catch (err) {}
  }

  // 2. If not in KV, query D1 Database
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM flowers ORDER BY created_at DESC LIMIT 3000'
      ).all();

      const formattedFlowers = (results || []).map((row) => ({
        id: row.id,
        x: row.x,
        y: row.y,
        name: row.name || 'Anonim',
        instagram: row.instagram || '',
        note: row.note || '',
        isAnonymous: Boolean(row.is_anonymous),
        isPrivate: Boolean(row.is_private),
        password: row.password || null,
        deleteCode: row.delete_code,
        createdAt: row.created_at,
        strokes: JSON.parse(row.strokes_json || '[]'),
        stemType: row.stem_type || 'classic',
        stemColor: row.stem_color || '#52b788',
        scale: row.scale || 1,
        stemAngle: row.stem_angle || 0
      }));

      // Cache in KV for fast edge reads
      if (env.MAYKO_KV) {
        context.waitUntil(
          env.MAYKO_KV.put('flowers_cache', JSON.stringify(formattedFlowers), { expirationTtl: 300 })
        );
      }

      return new Response(JSON.stringify(formattedFlowers), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10, s-maxage=30',
          'X-Cache': 'MISS-D1'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // Fallback empty array if DB not bound yet
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const flower = await request.json();

    if (!flower || !flower.id || flower.x === undefined || flower.y === undefined) {
      return new Response(JSON.stringify({ error: 'Geçersiz çiçek verisi' }), { status: 400 });
    }

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO flowers (id, x, y, name, instagram, note, is_anonymous, is_private, password, delete_code, created_at, strokes_json, stem_type, stem_color, scale, stem_angle)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          flower.id,
          flower.x,
          flower.y,
          flower.name || 'Anonim',
          flower.instagram || '',
          flower.note || '',
          flower.isAnonymous ? 1 : 0,
          flower.isPrivate ? 1 : 0,
          flower.password || null,
          flower.deleteCode || '',
          flower.createdAt || new Date().toISOString(),
          JSON.stringify(flower.strokes || []),
          flower.stemType || 'classic',
          flower.stemColor || '#52b788',
          flower.scale || 1,
          flower.stemAngle || 0
        )
        .run();

      // Invalidate KV cache so next GET fetches fresh data
      if (env.MAYKO_KV) {
        context.waitUntil(env.MAYKO_KV.delete('flowers_cache'));
      }
    }

    return new Response(JSON.stringify({ success: true, flower }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
