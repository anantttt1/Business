/**
 * Order store.
 * - Prefer Upstash Redis REST if KV_REST_API_URL + KV_REST_API_TOKEN are set (durable).
 * - Otherwise in-memory Map (NOT durable across serverless cold starts — local/dev only).
 *
 * States: CREATED | EVIDENCE_SUBMITTED | PENDING_REVIEW | APPROVED | REJECTED | EXPIRED
 */

const mem = globalThis.__AP_ORDERS__ || (globalThis.__AP_ORDERS__ = new Map());
const utrIndex = globalThis.__AP_UTR__ || (globalThis.__AP_UTR__ = new Map());
const hashIndex = globalThis.__AP_HASH__ || (globalThis.__AP_HASH__ = new Map());

function hasKv() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvSet(key, value, exSeconds) {
  const body = ['SET', key, JSON.stringify(value)];
  if (exSeconds) body.push('EX', String(exSeconds));
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('KV SET failed ' + res.status);
  return res.json();
}

async function kvGet(key) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['GET', key])
  });
  if (!res.ok) throw new Error('KV GET failed ' + res.status);
  const data = await res.json();
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return data.result;
  }
}

const ORDER_TTL = 60 * 60 * 24 * 14;

export async function saveOrder(order) {
  if (hasKv()) {
    await kvSet('order:' + order.id, order, ORDER_TTL);
    if (order.utr) await kvSet('utr:' + order.utr.toUpperCase(), order.id, ORDER_TTL);
    if (order.screenshotHash) await kvSet('hash:' + order.screenshotHash, order.id, ORDER_TTL);
    let list = (await kvGet('order:index')) || [];
    if (!Array.isArray(list)) list = [];
    if (!list.includes(order.id)) {
      list.unshift(order.id);
      list = list.slice(0, 500);
      await kvSet('order:index', list, ORDER_TTL);
    }
    return order;
  }
  mem.set(order.id, order);
  if (order.utr) utrIndex.set(order.utr.toUpperCase(), order.id);
  if (order.screenshotHash) hashIndex.set(order.screenshotHash, order.id);
  return order;
}

export async function getOrder(id) {
  if (hasKv()) return kvGet('order:' + id);
  return mem.get(id) || null;
}

export async function findByUtr(utr) {
  if (!utr) return null;
  const key = String(utr).toUpperCase();
  if (hasKv()) {
    const oid = await kvGet('utr:' + key);
    if (!oid) return null;
    return getOrder(oid);
  }
  const oid = utrIndex.get(key);
  return oid ? mem.get(oid) : null;
}

export async function findByHash(hash) {
  if (!hash) return null;
  if (hasKv()) {
    const oid = await kvGet('hash:' + hash);
    if (!oid) return null;
    return getOrder(oid);
  }
  const oid = hashIndex.get(hash);
  return oid ? mem.get(oid) : null;
}

export async function listOrders(limit = 100) {
  if (hasKv()) {
    const list = (await kvGet('order:index')) || [];
    const out = [];
    for (const id of list.slice(0, limit)) {
      const o = await getOrder(id);
      if (o) out.push(o);
    }
    return out;
  }
  return Array.from(mem.values())
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

export function storeMode() {
  return hasKv() ? 'upstash-kv' : 'memory-ephemeral';
}
