async function testWebhook() {
  const webhookUrl = 'https://api.botghost.com/webhook/1537216840496058388/qd01kweb03sx5coj8ct3m';
  const apiKey = 'd8257fc27d80e699332b5a7fb773d';

  const botGhostPayload = {
    is_aysenur: 'true',
    title: 'Mayko Bahçe Test',
    event_type: 'last_page_entered',
    event_message: '🚪 SİTEYE YENİ ZİYARETÇİ GİRDİ!',
    message: '🚪 SİTEYE YENİ ZİYARETÇİ GİRDİ!',
    device_id: 'dev_uu756pefo_msyyhe2u',
    ip: '127.0.0.1',
    location: 'Bursa, TR',
    device: 'Windows (Masaüstü)',
    stage: 'Final Mektubu Ekranı',
    duration: '0 saniye',
    variables: [
      { name: 'event_type', variable: '{event_type}', value: 'last_page_entered' },
      { name: 'event_message', variable: '{event_message}', value: '🚪 SİTEYE YENİ ZİYARETÇİ GİRDİ!' },
      { name: 'is_aysenur', variable: '{is_aysenur}', value: 'true' }
    ]
  };

  console.log('Sending test POST with Authorization header...');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(botGhostPayload)
    });

    const text = await res.text();
    console.log('Status Code:', res.status);
    console.log('Response Text:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testWebhook();
