async function testHeaders() {
  const webhookUrl = 'https://api.botghost.com/webhook/1537216840496058388/qd01kweb03sx5coj8ct3m';
  const apiKey = 'd8257fc27d80e699332b5a7fb773d';

  const payload = { event_type: 'last_page_entered', message: 'test' };

  const testCases = [
    { name: 'No auth', headers: {} },
    { name: 'Authorization: apiKey', headers: { 'Authorization': apiKey } },
    { name: 'Authorization: Bearer apiKey', headers: { 'Authorization': `Bearer ${apiKey}` } },
    { name: 'x-api-key: apiKey', headers: { 'x-api-key': apiKey } },
    { name: 'api-key: apiKey', headers: { 'api-key': apiKey } },
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tc.headers },
        body: JSON.stringify(payload)
      });
      const txt = await res.text();
      console.log(`[${tc.name}] -> Status: ${res.status}, Body: ${txt}`);
    } catch (e) {
      console.error(`[${tc.name}] Error:`, e);
    }
  }
}

testHeaders();
