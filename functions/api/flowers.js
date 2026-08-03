// Cloudflare Pages Function: /api/flowers (GET all, POST new flower)

async function ensureSchema(db) {
  if (!db) return;
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN approved INTEGER DEFAULT 1').run(); } catch (e) {}
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN animation TEXT DEFAULT NULL').run(); } catch (e) {}
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN animation_color TEXT DEFAULT NULL').run(); } catch (e) {}
  try { await db.prepare('ALTER TABLE flowers ADD COLUMN real_sender TEXT DEFAULT NULL').run(); } catch (e) {}
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const adminPassword = url.searchParams.get('adminPassword');
  const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';
  const isAdmin = adminPassword === expectedAdminPass;

  if (env.DB) {
    try {
      await ensureSchema(env.DB);
      const query = isAdmin
        ? 'SELECT * FROM flowers ORDER BY created_at DESC LIMIT 3000'
        : 'SELECT * FROM flowers WHERE approved = 1 OR approved IS NULL ORDER BY created_at DESC LIMIT 3000';

      const { results } = await env.DB.prepare(query).all();

      let formattedFlowers = (results || []).map((row) => ({
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
        stemAngle: row.stem_angle || 0,
        approved: (row.approved === undefined || row.approved === null) ? 1 : Number(row.approved),
        animation: row.animation || null,
        animationColor: row.animation_color || null,
        realSender: row.real_sender || null
      }));

      // Extra strict safety filter for non-admin public requests
      if (!isAdmin) {
        formattedFlowers = formattedFlowers.filter((f) => f.approved === 1);
      }

      // Only cache public approved flowers in KV
      if (env.MAYKO_KV && !isAdmin) {
        context.waitUntil(
          env.MAYKO_KV.put('flowers_cache', JSON.stringify(formattedFlowers), { expirationTtl: 86400 })
        );
      }

      return new Response(JSON.stringify(formattedFlowers), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': isAdmin ? 'no-cache' : 'public, max-age=3, s-maxage=5',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      console.error('D1 Get Error:', err);
    }
  }

  // KV fallback for public requests
  if (env.MAYKO_KV && !isAdmin) {
    try {
      const cached = await env.MAYKO_KV.get('flowers_cache', 'json');
      if (cached && Array.isArray(cached)) {
        return new Response(JSON.stringify(cached.filter((f) => f.approved === 1)), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3, s-maxage=5',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (err) {}
  }

  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const flower = await request.json();

    if (!flower || !flower.id || flower.x === undefined || flower.y === undefined) {
      return new Response(JSON.stringify({ error: 'Geçersiz çiçek verisi' }), { status: 400 });
    }

    // All newly planted flowers live immediately (approved = 1)
    const approved = 1;

    if (env.DB) {
      try {
        await ensureSchema(env.DB);
        await env.DB.prepare(
          `INSERT INTO flowers (id, x, y, name, instagram, note, is_anonymous, is_private, password, delete_code, created_at, strokes_json, stem_type, stem_color, scale, stem_angle, approved, animation, animation_color, real_sender)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
            flower.stemAngle || 0,
            approved,
            flower.animation || null,
            flower.animationColor || null,
            flower.realSender || null
          )
          .run();
      } catch (err) {
        console.error('D1 Insert Error:', err);
      }
    }

    // Update KV cache immediately
    if (env.MAYKO_KV) {
      try {
        const existing = (await env.MAYKO_KV.get('flowers_cache', 'json')) || [];
        const newEntry = { ...flower, approved, realSender: flower.realSender || null };
        const updated = [newEntry, ...existing.filter((f) => f.id !== flower.id)];
        await env.MAYKO_KV.put('flowers_cache', JSON.stringify(updated), { expirationTtl: 86400 });
      } catch (err) {}
    }

    return new Response(JSON.stringify({ success: true, flower: { ...flower, approved } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 201
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
