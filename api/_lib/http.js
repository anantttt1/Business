const MAX_BODY = 5 * 1024 * 1024; // 5 MB hard cap (screenshot path allows 4 MB)

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Body too large'), { code: 'BODY_TOO_LARGE' }));
        try {
          req.destroy();
        } catch (e) {}
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function cors(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  // Same-origin API only — do not reflect arbitrary Origin
  const origin = req.headers.origin;
  if (origin && typeof origin === 'string') {
    try {
      const u = new URL(origin);
      const host = (req.headers.host || '').split(':')[0];
      if (
        u.hostname === host ||
        u.hostname.endsWith('.vercel.app') ||
        u.hostname === 'localhost' ||
        u.hostname === '127.0.0.1'
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret, X-Webhook-Secret');
      }
    } catch (e) {}
  }
}

export function clientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    ''
  );
}

const buckets = globalThis.__AP_RATE__ || (globalThis.__AP_RATE__ = new Map());

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    b = { start: now, count: 0 };
    buckets.set(key, b);
  }
  b.count += 1;
  // Prevent unbounded map growth
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.start > windowMs * 2) buckets.delete(k);
    }
  }
  return b.count <= limit;
}
