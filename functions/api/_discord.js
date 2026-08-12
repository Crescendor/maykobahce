export async function getDiscordWebhookConfig(env) {
  let webhookUrl = env.DISCORD_WEBHOOK_URL || null;
  let apiKey = env.BOTGHOST_API_KEY || null;

  if (env.MAYKO_KV) {
    try {
      const cached = await env.MAYKO_KV.get('site_settings_cache', 'json');
      if (cached) {
        if (cached.discordWebhookUrl) webhookUrl = cached.discordWebhookUrl;
        if (cached.botGhostApiKey) apiKey = cached.botGhostApiKey;
      }
    } catch (e) {}
  }
  if (env.DB && !webhookUrl) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT data FROM meadow_objects WHERE id = ?'
      ).bind('site_settings').all();
      if (results && results.length > 0) {
        const s = JSON.parse(results[0].data);
        if (s) {
          if (s.discordWebhookUrl) webhookUrl = s.discordWebhookUrl;
          if (s.botGhostApiKey) apiKey = s.botGhostApiKey;
        }
      }
    } catch (e) {}
  }
  return { webhookUrl, apiKey };
}

export async function sendDiscordWebhook(env, eventType, data = {}, timestamp = null) {
  try {
    const { webhookUrl, apiKey } = await getDiscordWebhookConfig(env);
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
      return;
    }

    let title = '🌸 Mayko Bahçe Etkinliği';
    let color = 3718648; // Blue
    let description = '';
    const fields = [];

    if (eventType === 'melancholy_quote_viewed') {
      title = '🥀 Hüzün Modu - Karşılama Ekranı Geçildi';
      color = 11029239; // Purple #a855f7
      description = 'Ziyaretçi hüzün modundaki George Eliot sözünü gördü ve "Bahçeyi Gör" butonuna basarak bahçeye girdi.';
    } else if (eventType === 'trigger_detected') {
      title = '🌸 Ayşenur Triggerı Algılandı (Soru Ekranı Açıldı)';
      color = 16101131; // Amber #f59e0b
      description = 'Kullanıcı Ayşenur / Lukac ismi veya Instagram hesabı girdi ve soru doğrulama modalı açıldı.';
    } else if (eventType === 'trigger_answered') {
      title = '✅ Ayşenur Sorusu Doğrulandı (Süt Çorbası)';
      color = 3462041; // Emerald #34d399
      description = 'Kullanıcı "Süt Çorbası" sorusuna doğru yanıt verdi ve özel karşılama ekranı açıldı!';
    } else if (eventType === 'flower_planted') {
      title = '🌷 Yeni Çiçek Bahçeye Dikildi!';
      color = 16731501; // Pink #ff4d6d
      description = 'Bahçeye yeni bir çiçek başarıyla eklendi.';
    } else if (eventType === 'draft_abandoned') {
      title = '📝 Yarım Bırakılan Çiçek (Form Kapatıldı)';
      color = 16478608; // Rose #fb7185
      description = 'Ziyaretçi çiçek çizim veya detay formunu doldururken eklemeden kapattı.';
    } else if (eventType === 'flower_deleted') {
      title = '🗑️ Çiçek Bahçeden Silindi';
      color = 15679793; // Red #ef4444
      description = 'Bir çiçek bahçeden kaldırıldı.';
    } else if (eventType === 'test_notification') {
      title = '🔔 Discord & BotGhost Webhook Test Bildirimi';
      color = 3718648; // Sky Blue #38bdf8
      description = 'Mayko Bahçe Webhook entegrasyonu sorunsuz bir şekilde bağlandı ve çalışıyor!';
    }

    if (data.name || data.typedName) {
      fields.push({ name: '👤 İsim / Gönderen', value: String(data.name || data.typedName), inline: true });
    }
    if (data.instagram || data.typedInstagram) {
      fields.push({ name: '📸 Instagram', value: String(data.instagram || data.typedInstagram), inline: true });
    }
    if (data.realSender) {
      fields.push({ name: '🌸 Gerçek Gönderen', value: String(data.realSender), inline: true });
    }
    if (data.answerInput) {
      fields.push({ name: '💬 Girilen Cevap', value: String(data.answerInput), inline: true });
    }
    if (data.note) {
      fields.push({ name: '📝 Not Metni', value: String(data.note).slice(0, 1000), inline: false });
    }
    if (data.stage) {
      fields.push({ name: '📍 Kaldığı Aşama', value: String(data.stage), inline: true });
    }
    if (data.strokeCount !== undefined) {
      fields.push({ name: '🎨 Çizim Detayı', value: `${data.strokeCount} adet fırça darbesi`, inline: true });
    }
    if (data.ip) {
      fields.push({ name: '🌐 IP Adresi', value: `\`${data.ip}\``, inline: true });
    }
    if (data.location) {
      fields.push({ name: '📍 Konum / Ülke / Şehir', value: String(data.location), inline: true });
    }
    if (data.device) {
      fields.push({ name: '📱 Cihaz & Tarayıcı', value: String(data.device), inline: false });
    }
    if (data.viewport || data.screenRes) {
      fields.push({ name: '🖥️ Ekran Çözünürlüğü', value: String(data.viewport || data.screenRes), inline: true });
    }
    if (data.deleteCode) {
      fields.push({ name: '🔑 Silme Kodu', value: `\`${data.deleteCode}\``, inline: true });
    }
    if (data.deletedBy) {
      fields.push({ name: '⚠️ Silen Kişi', value: String(data.deletedBy), inline: true });
    }

    // 1. BotGhost Webhook Compatibility (https://api.botghost.com/webhook/...)
    if (webhookUrl.includes('botghost.com')) {
      const summaryText = `${title}\n${description}\n\n` +
        fields.map((f) => `• ${f.name}: ${f.value}`).join('\n');

      const botGhostPayload = {
        variables: [
          { name: 'message', variable: '{event_message}', value: summaryText },
          { name: 'event_message', variable: '{event_message}', value: summaryText },
          { name: 'title', variable: '{title}', value: title },
          { name: 'event_type', variable: '{event_type}', value: eventType },
          { name: 'ip', variable: '{ip}', value: String(data.ip || 'Bilinmiyor') },
          { name: 'location', variable: '{location}', value: String(data.location || 'Bilinmiyor') },
          { name: 'device', variable: '{device}', value: String(data.device || 'Bilinmiyor') },
          { name: 'name', variable: '{name}', value: String(data.name || data.typedName || '') },
          { name: 'note', variable: '{note}', value: String(data.note || '') },
          { name: 'instagram', variable: '{instagram}', value: String(data.instagram || data.typedInstagram || '') },
          { name: 'answer', variable: '{answer}', value: String(data.answerInput || '') }
        ]
      };

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = apiKey;
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(botGhostPayload)
      });
      return;
    }

    // 2. Standard Discord Webhook (https://discord.com/api/webhooks/...)
    const payload = {
      username: 'Mayko Bahçe Bildirim',
      avatar_url: 'https://mayko.pages.dev/mayko_logo.png',
      embeds: [
        {
          title,
          color,
          description,
          fields,
          footer: { text: 'Mayko Bahçe Güvenlik & Etkinlik Takip Sistemi' },
          timestamp: timestamp || new Date().toISOString()
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('sendDiscordWebhook error:', err);
  }
}
