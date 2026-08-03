// Cloudflare Pages Function: /api/special-content (Secure Serverless Secret Content Delivery)

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();
    const norm = (password || '')
      .toLowerCase()
      .trim()
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i');

    if (norm === 'nail') {
      return new Response(
        JSON.stringify({
          success: true,
          title: "Bahçene hoş geldin. 🌸",
          text: "Bu bahçe tamamen senin için yapıldı. Eğer istersen bırakacağın çiçek tamamen anonim olacak. Sana rastgele bir ad vereceğim çiçeğini eklerken ve Burak'ın bundan haberi olmayacak. İsterim ki sen de sürpriz yap. Yollarınız yine kesiştiğinde bunu gülerek anlatırsın.",
          loveNote: "Seni her şeyden çok seviyorum. ❤️",
          btnAnon: "🎭 Anonim olarak gönder",
          btnReal: "🌸 Ayşenur olarak gönder"
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    return new Response(JSON.stringify({ success: false, error: 'Hatalı cevap' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
