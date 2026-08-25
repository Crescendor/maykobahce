async function testWhatsApp() {
  const phone = '+905418445100';
  const apiKey = '5815335';
  const text = '🌸 *Mayko Bahçe WhatsApp Bildirim Sistemi Aktif!*\n\nSistem başarıyla bağlandı. /last mektupları ve yakma talepleri anında cebinize gelecek! ✨';
  
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${apiKey}`;
  console.log('Sending CallMeBot WhatsApp request...');
  const res = await fetch(url);
  const body = await res.text();
  console.log('Response Status:', res.status);
  console.log('Response Body:', body);
}

testWhatsApp();
