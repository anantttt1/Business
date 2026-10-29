import { json, cors, rateLimit, clientIp } from './_lib/http.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('qr:' + clientIp(req), 40, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }

  const url = new URL(req.url, 'http://localhost');
  const data = String(url.searchParams.get('data') || '').slice(0, 512);
  if (!data || !data.startsWith('upi://')) {
    return json(res, 400, { error: 'data must be a upi:// URI' });
  }

  try {
    const upstream =
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=' +
      encodeURIComponent(data);
    const r = await fetch(upstream, { redirect: 'follow' });
    if (!r.ok) throw new Error('QR upstream ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(buf);
  } catch (e) {
    return json(res, 502, { error: 'Could not generate QR image' });
  }
}
