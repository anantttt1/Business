import fs from 'fs';
import path from 'path';
import { getOrder, saveOrder } from './_lib/store.js';
import { verifyDownloadToken, verifyOrderToken } from './_lib/crypto.js';
import { getTemplatePrice, TEMPLATE_PRICES } from './_lib/pricing.js';
import { json, cors, clientIp, rateLimit } from './_lib/http.js';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function u16(n) {
  return Buffer.from([n & 255, (n >>> 8) & 255]);
}
function u32(n) {
  return Buffer.from([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
}
function zipStore(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8');
    const crc = crc32(data);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    const central = Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralDir.length), u32(offset), u16(0)
  ]);
  return Buffer.concat([...locals, centralDir, end]);
}

function safeTemplateId(id) {
  const s = String(id || '');
  if (!/^[a-z0-9-]{2,40}$/.test(s)) return null;
  if (!TEMPLATE_PRICES[s]) return null;
  return s;
}

function collectTemplateFiles(templateId) {
  const id = safeTemplateId(templateId);
  if (!id) return null;
  const roots = [
    path.join(process.cwd(), 'public', 'portfolio-builder', 'templates', id),
    path.join(process.cwd(), 'dist', 'portfolio-builder', 'templates', id)
  ];
  const root = roots.find((r) => fs.existsSync(r));
  if (!root) return null;
  const out = [];
  function walk(dir, base) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      const rel = path.join(base, ent.name).replace(/\\/g, '/');
      if (ent.isDirectory()) walk(full, rel);
      else out.push({ name: 'template/' + rel, data: fs.readFileSync(full) });
    }
  }
  walk(root, '');
  out.push({
    name: 'README.md',
    data: '# ' + id + ' template\n\nPurchased via AP Creative Studio.\nOpen files inside `template/`.\n'
  });
  return out;
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('dl:' + clientIp(req), 20, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token') || '';
  const verified = verifyDownloadToken(token);
  if (!verified) return json(res, 403, { error: 'Invalid or expired download token' });

  const tplId = safeTemplateId(verified.templateId);
  if (!tplId || tplId !== verified.templateId) {
    return json(res, 403, { error: 'Invalid template' });
  }

  let order = await getOrder(verified.orderId);
  // Fallback: orderToken query (signed) if store cold
  if (!order) {
    const ot = url.searchParams.get('orderToken') || '';
    const fromTok = ot ? verifyOrderToken(ot) : null;
    if (
      fromTok &&
      fromTok.id === verified.orderId &&
      fromTok.templateId === verified.templateId &&
      (fromTok.status === 'APPROVED' || fromTok.status === 'PAYMENT_CONFIRMED') &&
      fromTok.downloadToken === token
    ) {
      order = fromTok;
    }
  }

  if (!order) return json(res, 404, { error: 'Order not found' });
  if (order.status !== 'APPROVED' && order.status !== 'PAYMENT_CONFIRMED') {
    return json(res, 403, { error: 'Payment not approved', status: order.status });
  }
  if (order.templateId !== verified.templateId) {
    return json(res, 403, { error: 'Template mismatch' });
  }
  const tpl = getTemplatePrice(order.templateId);
  if (!tpl) return json(res, 400, { error: 'Unknown template' });

  try {
    if (order.id && typeof order === 'object') {
      order.downloadedAt = Date.now();
      order.downloadCount = (order.downloadCount || 0) + 1;
      await saveOrder(order);
    }
  } catch (e) {}

  const files = collectTemplateFiles(order.templateId);
  if (!files || !files.length) {
    return json(res, 200, {
      unlocked: true,
      orderId: order.id,
      templateId: order.templateId,
      templateName: order.templateName,
      limitation:
        'Server could not read private template files from disk. Unlock granted. Preview HTML under /portfolio-builder/templates may still be publicly reachable unless moved to private storage.'
    });
  }

  const zip = zipStore(files);
  const fname = tpl.id + '-template.zip';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="' + fname + '"');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(zip);
}
