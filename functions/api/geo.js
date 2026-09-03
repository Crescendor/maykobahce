export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId') || '';

  const city = request.headers.get('cf-ipcity') || (request.cf && request.cf.city) || '';
  const country = request.headers.get('cf-ipcountry') || (request.cf && request.cf.country) || '';

  const cityLower = String(city).toLowerCase();
  const isStrictBursa = cityLower.includes('bursa') && !cityLower.includes('izmir');
  const isAysenurDev = String(deviceId).trim() === 'dev_uu756pefo_msyyhe2u';

  const isAysenur = isAysenurDev || isStrictBursa;

  return new Response(
    JSON.stringify({
      city: city || 'Bilinmeyen Şehir',
      country: country || 'TR',
      isBursa: isStrictBursa,
      isAysenur: isAysenur,
      isAysenurDevice: isAysenurDev
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
