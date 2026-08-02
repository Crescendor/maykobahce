// Cloudflare Pages Function: /api/admin/login (Verify Admin Secret)

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();
    const expectedPassword = env.ADMIN_PASSWORD || 'Doxish44_';

    if (password && password === expectedPassword) {
      return new Response(JSON.stringify({ authenticated: true, message: 'Yönetici girişi başarılı.' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ authenticated: false, error: 'Hatalı yönetici şifresi!' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
