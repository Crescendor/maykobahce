// Cloudflare Edge API endpoint: Unlock Private Note securely with Password

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const flowerId = body.flowerId;
    const password = (body.password || '').trim().toUpperCase();
    const adminPassword = body.adminPassword || '';
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

    if (!flowerId) {
      return new Response(JSON.stringify({ error: 'Eksik parametre' }), { status: 400 });
    }

    // Admin bypass unlock
    if (adminPassword && adminPassword === expectedAdminPass) {
      if (env.DB) {
        const flower = await env.DB.prepare('SELECT note FROM flowers WHERE id = ?').bind(flowerId).first();
        if (flower) {
          return new Response(JSON.stringify({ success: true, note: flower.note || '' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    }

    if (env.DB) {
      const flower = await env.DB.prepare('SELECT password, note FROM flowers WHERE id = ?').bind(flowerId).first();

      if (flower) {
        const dbPass = (flower.password || '').trim().toUpperCase();
        if (dbPass && dbPass === password) {
          return new Response(JSON.stringify({ success: true, note: flower.note || '' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Hatalı şifre' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500 });
  }
}
