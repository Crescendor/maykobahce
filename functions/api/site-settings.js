// Cloudflare Edge API endpoint for Global Site Settings (Melancholy Mode / Siyah Beyaz Bahçe Modu)

async function ensureTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS meadow_objects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `).run();
  } catch (e) {}
}

export async function onRequestGet({ env }) {
  // 1. Check KV Cache first
  if (env.MAYKO_KV) {
    try {
      const cached = await env.MAYKO_KV.get('site_settings_cache', 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=5'
          }
        });
      }
    } catch (e) {}
  }

  // 2. Fetch from D1 Database
  if (env.DB) {
    await ensureTable(env.DB);
    try {
      const { results } = await env.DB.prepare(
        'SELECT data FROM meadow_objects WHERE id = ?'
      ).bind('site_settings').all();

      let settings = { isMelancholyMode: false };
      if (results && results.length > 0) {
        try {
          settings = JSON.parse(results[0].data);
        } catch (e) {}
      }

      if (env.MAYKO_KV && settings) {
        try {
          await env.MAYKO_KV.put('site_settings_cache', JSON.stringify(settings), { expirationTtl: 86400 });
        } catch (e) {}
      }

      return new Response(JSON.stringify(settings), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=5'
        }
      });
    } catch (e) {}
  }

  return new Response(JSON.stringify({ isMelancholyMode: false }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

import { sendDiscordWebhook } from './_discord.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const adminPassword = body.adminPassword;
    const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

    if (!adminPassword || adminPassword !== expectedAdminPass) {
      return new Response(JSON.stringify({ error: 'Yetki hatası!' }), { status: 403 });
    }

    // Test Discord Webhook notification if requested
    if (body.testDiscordWebhook) {
      const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
      const city = request.headers.get('cf-ipcity') || (request.cf && request.cf.city) || '';
      const country = request.headers.get('cf-ipcountry') || (request.cf && request.cf.country) || '';

      await sendDiscordWebhook(env, 'test_notification', {
        action: 'Discord Webhook Test Bildirimi Başarılı',
        ip: clientIp,
        location: city && country ? `${city}, ${country}` : country || city || 'Türkiye',
        device: 'Admin Yönetim Paneli'
      });

      return new Response(JSON.stringify({ success: true, tested: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const settings = body.settings || { isMelancholyMode: false, discordWebhookUrl: '' };
    const dataJson = JSON.stringify(settings);
    const nowIso = new Date().toISOString();

    if (env.DB) {
      await ensureTable(env.DB);
      await env.DB.prepare(`
        INSERT INTO meadow_objects (id, data, updated_at)
        VALUES ('site_settings', ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      `).bind(dataJson, nowIso).run();
    }

    if (env.MAYKO_KV) {
      try {
        await env.MAYKO_KV.put('site_settings_cache', dataJson, { expirationTtl: 86400 });
      } catch (e) {}
    }

    return new Response(JSON.stringify({ success: true, settings }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
