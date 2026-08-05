// Cloudflare Pages Function: /api/special-content (Secure Serverless Secret Content Delivery)

function normalizeAnswer(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .replace(/\s+/g, ''); // strip all whitespace for flexible matching
}

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const { password } = await request.json();
    const norm = normalizeAnswer(password);

    // Accept "Süt Çorbası" (and all variations: sutcorbasi, sut corbasi, süt çorbası, etc.) or legacy "nail"
    if (norm === 'sutcorbasi' || norm === 'nail') {
      return new Response(
        JSON.stringify({
          success: true,
          title: "Hoş geldin, Mayko. 🌸",
          introText: "Bazen bazı duygular kelimelere sığmaz. Bu bahçe de tam bunun için var.\n\nBuraya bırakacağın her çiçek, her not ve her renk sessizce büyüyecek; tıpkı unutulmayan güzel anılar gibi.\n\nDilersen ismini gizleyebilirsin, dilersen kendinden bir iz bırakabilirsin. Belki bir gün yollarınız yeniden kesişir... O zaman bugün ektiğin çiçekler, anlatamadığın her şeyi senin yerine fısıldar.",
          loveNote: "Ne olursa olsun... Seni sevmekten hiç vazgeçmedim. ❤️",
          noticeTitle: "Küçük bir not",
          noticeBody: "Eğer çiçeğini anonim olarak gönderirsen, sistem bunu bana hiçbir şekilde göstermeyecek. Böylece bıraktığın çiçek ve yazdığın not yalnızca senin sırrın olarak kalacak.\n\nBir gün yeniden konuşmaya başladığımızda, bana o çiçeğin sana ait olduğunu söyleyebilmen için çiçeğine ait bağlantıyı (linki) lütfen saklamayı unutma.\n\nEğer çiçeğine gizli bir not eklersen, o not da yine bana hiçbir şekilde gösterilmeyecek. O satırlar, yalnızca sen istediğinde gün yüzüne çıkacak.",
          footerNote: "Bazı bekleyişler zamana değil, sevgiye dayanır. Benimkisi de tam olarak böyle... Seni özlemle bekliyorum. ❤️",
          questionText: "Anonim olarak bir çiçek yollamak istiyor musun?",
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
