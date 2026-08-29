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

export async function sendDiscordWebhook(
  env,
  eventType,
  data = {},
  timestamp = null,
  overrideWebhookUrl = null,
  overrideApiKey = null
) {
  try {
    const config = await getDiscordWebhookConfig(env);
    const webhookUrl = overrideWebhookUrl || config.webhookUrl;
    const apiKey = overrideApiKey !== undefined && overrideApiKey !== null ? overrideApiKey : config.apiKey;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
      return { success: false, error: 'Geçersiz veya boş Webhook URL. Lütfen Webhook URL alanını doldurun.' };
    }

    // Ignore excluded / developer device IDs and automated bot locations (Moses Lake, Omaha, Boardman, Quincy, Ashburn, etc.)
    const IGNORED_DEVICE_IDS = ['dev_m2troqnl9_mswunr9c', 'dev_guest'];
    const devId = String((data && data.deviceId) || '').trim().toLowerCase();
    const locationStr = String((data && data.location) || '').toLowerCase();
    const userAgentStr = String((data && data.device) || '').toLowerCase();

    // Block dev_guest or developer device IDs
    if (devId && (devId.includes('dev_guest') || IGNORED_DEVICE_IDS.includes(devId))) {
      return { success: true, ignored: true };
    }

    // Block datacenter bot locations (Moses Lake, Omaha, Boardman, Quincy, Ashburn, Des Moines, San Jose, Mountain View)
    const BOT_LOCATIONS = ['moses lake', 'omaha', 'boardman', 'quincy', 'ashburn', 'des moines', 'council bluffs', 'san jose', 'mountain view'];
    if (BOT_LOCATIONS.some(loc => locationStr.includes(loc))) {
      return { success: true, ignored: true };
    }

    // Block bot / crawler user-agent strings
    const BOT_USER_AGENTS = ['bot', 'crawler', 'spider', 'googlebot', 'bingbot', 'yandexbot', 'headless', 'python', 'curl', 'wget'];
    if (BOT_USER_AGENTS.some(bot => userAgentStr.includes(bot))) {
      return { success: true, ignored: true };
    }

    let title = '🌸 Mayko Bahçe Etkinliği';
    let color = 3718648; // Blue
    let description = '';
    const fields = [];

    if (eventType === 'last_phrase_reached') {
      title = `📜 Ziyaretçi Cümleye Ulaştı: "${data.phraseText || '-'}"`;
      color = 3801080; // Sky Blue #3a86ff
      description = `Ziyaretçi /last sayfasını kaydırırken şu cümleyi ekranda görüntüledi:\n\n**"${data.phraseText || '-'}"**`;
      if (data.phraseIndex !== undefined) {
        fields.push({ name: '🔢 Cümle Sırası', value: `${Number(data.phraseIndex) + 1} / 8`, inline: true });
      }
    } else if (eventType === 'last_timer_reached') {
      title = '⏳ Ziyaretçi Canlı Geri Sayım Sayacı Ekranına Ulaştı!';
      color = 16750848; // Amber #fa8c16
      description = 'Ziyaretçi kaydırmaya devam ederek canlı saliseli geri sayım sayacı ekranına ulaştı (Sayaç ekranda görünür durumda).\n\n**"Bize dair elimde kalan tüm verilerin otomatik olarak silinmesine.."**';
      if (data.countdownStr) {
        fields.push({ name: '⏳ Sayaç Değeri', value: String(data.countdownStr), inline: true });
      }
    } else if (eventType === 'last_scroll_started' || eventType === 'first_scroll_started') {
      title = '📜 Ziyaretçi /last Sayfasını Kaydırmaya Başladı!';
      color = 3801080; // Sky Blue #3a86ff
      description = 'Ziyaretçi siteye girdikten sonra ilk fare/parmak kaydırmasını yaptı ve cümleler akmaya başladı.';
    } else if (eventType === 'section_reached') {
      title = '📖 Ziyaretçi Yeni Bir Paragrafa Ulaştı';
      color = 5338094; // Cyan #516beee
      description = 'Ziyaretçi sayfayı kaydırarak ilerliyor:';
    } else if (eventType === 'food_input_typed') {
      title = '💬 Yemek Kutusuna Cevap Yazıldı';
      color = 16750848; // Orange #fa8c16
      description = 'Ziyaretçi "sen o yemeği iyi bilirsin" kutusuna bir cevap yazdı / denedi.';
    } else if (eventType === 'sut_corbasi_unlocked') {
      title = '🍲 Süt Çorbası Şifresi Çözüldü & Evine Hoş Geldin Ekranı Açıldı!';
      color = 3462041; // Emerald Green #34d399
      description = 'Ziyaretçi "sen o yemeği iyi bilirsin" kutusuna "Süt Çorbası" yazdı ve Ayşenur mektubunun kilidini açtı!';
    } else if (eventType === 'aysenur_letter_reached') {
      title = '🌹 Ayşenur Mektubu Ekranına Ulaşıldı';
      color = 14749257; // Rose Crimson #e11d48
      description = 'Ziyaretçi "Ayşenur, ben seni gerçekten de çok özledim." mektubuna geldi ve okumaya devam ediyor.';
    } else if (eventType === 'page_bottom_reached') {
      title = '🏔️ Sayfanın En Altına (Gül Dağları & Mektup Alanına) Ulaşıldı';
      color = 16101131; // Amber #f59e0b
      description = 'Ziyaretçi tüm mektubu baştan sona okudu ve en alttaki mektup bırakma alanına geldi!';
    } else if (eventType === 'letter_submitted') {
      title = '💌 Ayşenur Yeni Bir Mektup Gönderdi!';
      color = 16723558; // Bright Crimson #ff1493
      description = 'Sana özel yeni bir mektup bırakıldı!';
    } else if (eventType === 'letter_draft_update' || eventType === 'letter_draft_abandoned') {
      title = eventType === 'letter_draft_abandoned' ? '⚠️ Mektup Yarım Bırakıldı / Sayfadan Ayrıldı' : '✍️ Canlı Mektup Taslağı Yazılıyor';
      color = 16478608; // Rose #fb7185
      description = eventType === 'letter_draft_abandoned' ? 'Ziyaretçi mektup yazarken sayfayı kapattı veya ayrıldı. En son yazılan metin aşağıdadır:' : 'Ziyaretçi mektup kutusuna yazı yazıyor:';
    } else if (eventType === 'visitor_left_page' || eventType === 'last_page_abandoned') {
      const isAys = data.is_aysenur === true || data.is_aysenur === 'true' || eventType === 'last_page_abandoned';
      title = isAys ? '🚪🌹 Ayşenur Sayfadan Ayrıldı / Sekmeyi Kapattı' : '🚪 Ziyaretçi Sayfadan Ayrıldı';
      color = isAys ? 14749257 : 9740472; // Crimson or Slate Gray
      description = `Ziyaretçi /last sayfasından veya siteden ayrıldı.\n⏱️ **Sitede Kaldığı Süre:** ${data.duration || 'Bilinmiyor'}\n📍 **Terk Ettiği Yer:** ${data.stage || 'Bilinmiyor'}`;
    } else if (eventType === 'last_first_scroll') {
      title = '📜 /last Sayfasında İlk Kaydırma Yapıldı (Çekmece Açıldı)';
      color = 3801080; // Sky Blue
      description = 'Ziyaretçi /last sayfasında ilk kaydırmayı yaptı ve siyah ahşap çekmece açıldı.';
    } else if (eventType === 'last_matchbox_clicked') {
      title = '🔥 /last Kibrit Kutusu Açıldı!';
      color = 16750848; // Orange
      description = 'Ziyaretçi çekmecedeki kibrit kutusuna tıkladı ve kibrit kutusu yana kayarak açıldı.';
    } else if (eventType === 'last_letter_opened') {
      title = '✉️ /last Son Mektup Açıldı & Okunuyor';
      color = 14749257; // Crimson Rose
      description = 'Ziyaretçi zarfın içindeki son mektubu ("Bir delinin son mesajı") açtı ve okuyor.';
    } else if (eventType === 'last_burn_modal_opened') {
      title = '⚠️ /last "Mektubu Yak" Karar Modalı Açıldı';
      color = 16711680; // Red
      description = 'Ziyaretçi "Mektubu yak.." butonuna bastı ve onay uyarısını görüntülüyor.';
    } else if (eventType === 'last_burn_modal_choice') {
      title = `🔥 /last Mektup Yakma Kararı: ${data.choice || '-'}`;
      color = data.accepted ? 16711680 : 9740472;
      description = data.accepted
        ? '⚠️ Ayşenur mektubu ve tüm verileri kalıcı olarak yakmayı KABUL ETTİ!'
        : '🛡️ Ayşenur mektubu yakma uyarısını VAZGEÇ butonuna basarak iptal etti.';
    } else if (eventType === 'last_letter_burned') {
      title = '🔥💥 /last MEKTUP VE SAYFA KİBRİTLE YAKILDI!';
      color = 16711680; // Bright Fire Red
      description = 'Ayşenur kibriti zımparaya sürttü! Alevler tüm mektubu ve sayfayı yakarak küllere çevirdi!';
    } else if (eventType === 'last_lock_clicked' || eventType === 'last_note_draft_update' || eventType === 'last_note_draft_abandoned') {
      title = data.noteText ? '🟢 /last "Mektubu Sakla" Formu & Canlı Nota Yazılan Metin' : '🟢 /last "Mektubu Sakla" Formu Açıldı';
      color = 3462041; // Emerald Green
      description = data.noteText ? 'Ziyaretçi "Mektubu Sakla" butonuna bastı ve nota canlı olarak yazı yazıyor:' : 'Ziyaretçi "Mektubu Sakla" butonuna bastı ve kilitli not yazma alanını açtı.';
    } else if (eventType === 'last_note_locked') {
      title = '🔒✉️ /last Mektup Mühürlendi, Not Ekledi ve Kriptolandı!';
      color = 3462041; // Emerald Green
      description = `Ziyaretçi mektuba ek notunu bıraktı, kilitleme tarihini seçti ve SHA-256 ile mühürledi.\n📅 **Açılacağı Tarih:** ${data.targetDate || '-'}\n🔑 **SHA-256 Kodu:** \`${data.sha256Code || '-'}\``;
    } else if (eventType === 'last_letter_zoom_toggled') {
      title = data.isZoomed ? '🔍 /last Mektup Tıklanarak Büyütüldü (Odaklandı)' : '🔍 /last Mektup Tıklanarak Küçültüldü (Uzaklaştırıldı)';
      color = 3801080; // Sky Blue
      description = data.isZoomed ? 'Ziyaretçi mektuba tıklayarak ekranda BÜYÜTTÜ ve daha yakından okuyor.' : 'Ziyaretçi mektuba tekrar tıklayarak mektubu normal boyutuna KÜÇÜLTTÜ.';
    } else if (eventType === 'last_reset_clicked') {
      title = '🔄 /last Test Cihazı Sayfayı Söndürdü / Sıfırladı';
      color = 3801080;
      description = 'Test cihazı (dev_m2troqnl9_mswunr9c) "Söndür / Sıfırla" butonuna basarak yakılan/kilitlenen sayfayı sıfırladı.';
    } else if (eventType === 'melancholy_quote_viewed') {
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

    if (data.letterMode) {
      fields.push({ name: '✉️ Gönderim Modu', value: String(data.letterMode), inline: true });
    }
    if (data.targetDate) {
      fields.push({ name: '📅 İleri Tarih / Saat', value: String(data.targetDate), inline: true });
    }
    if (data.letterText) {
      fields.push({ name: '📜 Güncel Mektup İçeriği', value: String(data.letterText).slice(0, 1024), inline: false });
    }
    if (data.allTypedHistory && data.allTypedHistory !== data.letterText) {
      fields.push({ name: '🔤 Tüm Yazılanlar (Silinenler Dahil)', value: String(data.allTypedHistory).slice(0, 1024), inline: false });
    }
    if (data.deletedText) {
      fields.push({ name: '✂️ Silinen / Geri Alınan Kısımlar', value: String(data.deletedText).slice(0, 1024), inline: false });
    }
    if (data.draftLength !== undefined) {
      fields.push({ name: '📏 Karakter Sayısı', value: `${data.draftLength} karakter`, inline: true });
    }
    if (data.deviceId) {
      fields.push({ name: '🔑 Cihaz Kimliği / Parmak İzi', value: `\`${data.deviceId}\``, inline: true });
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
    if (data.answerInput || data.answer) {
      fields.push({ name: '💬 Girilen Cevap', value: String(data.answerInput || data.answer), inline: true });
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

      const isAysenur = (
        data.is_aysenur === true ||
        data.is_aysenur === 'true' ||
        eventType === 'sut_corbasi_unlocked' ||
        eventType === 'aysenur_letter_reached' ||
        eventType === 'page_bottom_reached' ||
        eventType === 'letter_submitted' ||
        eventType === 'letter_draft_update' ||
        eventType === 'letter_draft_abandoned' ||
        eventType === 'trigger_detected' ||
        eventType === 'trigger_answered' ||
        (data.realSender && data.realSender.includes('Ayşenur'))
      ) ? 'true' : 'false';

      const botGhostEventType = (eventType === 'last_phrase_reached' || eventType === 'last_timer_reached' || eventType === 'last_letter_fully_unfolded')
        ? 'last_scroll_started'
        : (eventType === 'last_page_abandoned' ? 'visitor_left_page' : eventType);

      const rawVars = [
        { name: 'message', variable: '{event_message}', value: summaryText || data.action || '-' },
        { name: 'event_message', variable: '{event_message}', value: summaryText || data.action || '-' },
        { name: 'title', variable: '{title}', value: title || 'Mayko Bahçe' },
        { name: 'event_type', variable: '{event_type}', value: botGhostEventType },
        { name: 'is_aysenur', variable: '{is_aysenur}', value: isAysenur },
        { name: 'letter_text', variable: '{letter_text}', value: String(data.letterText || '-') },
        { name: 'letter', variable: '{letter}', value: String(data.letterText || '-') },
        { name: 'all_typed_text', variable: '{all_typed_text}', value: String(data.allTypedHistory || data.letterText || '-') },
        { name: 'deleted_text', variable: '{deleted_text}', value: String(data.deletedText || '-') },
        { name: 'letter_mode', variable: '{letter_mode}', value: String(data.letterMode || '-') },
        { name: 'target_date', variable: '{target_date}', value: String(data.targetDate || '-') },
        { name: 'draft_length', variable: '{draft_length}', value: String(data.draftLength || '-') },
        { name: 'device_id', variable: '{device_id}', value: String(data.deviceId || '-') },
        { name: 'ip', variable: '{ip}', value: String(data.ip || 'Bilinmiyor') },
        { name: 'location', variable: '{location}', value: String(data.location || 'Bilinmiyor') },
        { name: 'device', variable: '{device}', value: String(data.device || 'Bilinmiyor') },
        { name: 'name', variable: '{name}', value: String(data.name || data.typedName || '-') },
        { name: 'note', variable: '{note}', value: String(data.note || '-') },
        { name: 'answer', variable: '{answer}', value: String(data.answerInput || data.answer || '-') },
        { name: 'stage', variable: '{stage}', value: String(data.stage || '-') },
        { name: 'duration', variable: '{duration}', value: String(data.duration || '-') },
        { name: 'scroll_status', variable: '{scroll_status}', value: String(data.scrollStatus || data.stage || 'Kaydırma Yapıldı') },
        { name: 'scroll_progress', variable: '{scroll_progress}', value: String(data.scrollProgress || data.stage || '-') },
        { name: 'scroll_percentage', variable: '{scroll_percentage}', value: String(data.scrollPercentage || '-') },
        { name: 'sha256_code', variable: '{sha256_code}', value: String(data.sha256Code || data.sha256 || '-') },
        { name: 'sha256', variable: '{sha256}', value: String(data.sha256Code || data.sha256 || '-') },
        { name: 'button_click_time', variable: '{button_click_time}', value: String(data.buttonClickTime || (data.duration ? `${data.duration} sonra` : '-')) },
        { name: 'button_click_seconds', variable: '{button_click_seconds}', value: String(data.buttonClickSeconds || '-') },
        { name: 'phrase_text', variable: '{phrase_text}', value: String(data.phraseText || '-') },
        { name: 'phrase_index', variable: '{phrase_index}', value: data.phraseIndex !== undefined ? String(Number(data.phraseIndex) + 1) : '-' },
        { name: 'phrase_duration', variable: '{phrase_duration}', value: String(data.prevPhraseDuration || data.phraseDuration || data.lastPhraseDuration || '-') },
        { name: 'countdown_str', variable: '{countdown_str}', value: String(data.countdownStr || '-') },
        { name: 'click_type', variable: '{click_type}', value: String(data.clickType || '-') },
        { name: 'target_element', variable: '{target_element}', value: String(data.targetElement || '-') },
        { name: 'coordinates', variable: '{coordinates}', value: String(data.coordinates || '-') },
        { name: 'pressed_key', variable: '{pressed_key}', value: String(data.key || '-') }
      ];

      const botGhostPayload = {
        is_aysenur: isAysenur,
        title: title || 'Mayko Bahçe',
        event_type: botGhostEventType,
        answer: String(data.answerInput || data.answer || '-'),
        stage: String(data.stage || '-'),
        duration: String(data.duration || '-'),
        button_click_time: String(data.buttonClickTime || (data.duration ? `${data.duration} sonra` : '-')),
        button_click_seconds: String(data.buttonClickSeconds || '-'),
        scroll_status: String(data.scrollStatus || data.stage || 'Kaydırma Yapıldı'),
        scroll_percentage: String(data.scrollPercentage || '-'),
        letter_text: String(data.letterText || '-'),
        sha256_code: String(data.sha256Code || data.sha256 || '-'),
        all_typed_text: String(data.allTypedHistory || data.letterText || '-'),
        deleted_text: String(data.deletedText || '-'),
        letter_mode: String(data.letterMode || '-'),
        target_date: String(data.targetDate || '-'),
        phrase_text: String(data.phraseText || '-'),
        phrase_index: data.phraseIndex !== undefined ? String(Number(data.phraseIndex) + 1) : '-',
        phrase_duration: String(data.prevPhraseDuration || data.phraseDuration || data.lastPhraseDuration || '-'),
        countdown_str: String(data.countdownStr || '-'),
        click_type: String(data.clickType || '-'),
        target_element: String(data.targetElement || '-'),
        coordinates: String(data.coordinates || '-'),
        pressed_key: String(data.key || '-'),
        device_id: String(data.deviceId || '-'),
        ip: String(data.ip || 'Bilinmiyor'),
        location: String(data.location || 'Bilinmiyor'),
        device: String(data.device || 'Bilinmiyor'),
        variables: rawVars.map((v) => ({
          name: v.name,
          variable: v.variable,
          value: v.value && String(v.value).trim() ? String(v.value) : '-'
        }))
      };

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = apiKey;
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(botGhostPayload)
      });

      const resText = await res.text().catch(() => '');
      if (res.ok) {
        return { success: true, status: res.status };
      } else {
        return {
          success: false,
          status: res.status,
          error: `BotGhost Hatası (${res.status}): ${resText || res.statusText || 'Bilinmeyen hata'}. (401 hatası ise lütfen BotGhost API Key alanını doldurun).`
        };
      }
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

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resText = await res.text().catch(() => '');
    if (res.ok || res.status === 204) {
      return { success: true, status: res.status };
    } else {
      return {
        success: false,
        status: res.status,
        error: `Discord Hatası (${res.status}): ${resText || res.statusText || 'Bilinmeyen hata'}`
      };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
