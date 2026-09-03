// Cloudflare Pages Function: /api/geo
// Returns client geolocation metadata and specifies if visitor is from Bursa

export async function onRequestGet(context) {
  const { request } = context;
  const city = request.headers.get('cf-ipcity') || (request.cf && request.cf.city) || '';
  const country = request.headers.get('cf-ipcountry') || (request.cf && request.cf.country) || '';
  const isBursa = String(city).toLowerCase().includes('bursa') || String(request.headers.get('cf-region') || '').toLowerCase().includes('bursa');

  return new Response(
    JSON.stringify({
      city: city || 'Bilinmeyen Şehir',
      country: country || 'TR',
      isBursa: Boolean(isBursa)
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
