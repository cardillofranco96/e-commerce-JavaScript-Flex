// Utility module for FlamaGamer
// Exports helpers: safeFetch, safeGetItem, safeSetItem, tryParseJSON, formatCurrency,
// clampInt, deepClone, validateCoupon, applyDiscounts, calcTotals, checkStock

const DEFAULT_CURRENCY = 'ARS';

export async function safeFetch(url, opts = {}, retries = 1, backoff = 300) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      return { ok: true, data };
    }
    const text = await res.text();
    return { ok: true, data: text };
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return safeFetch(url, opts, retries - 1, Math.round(backoff * 1.5));
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function tryParseJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export function safeGetItem(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : tryParseJSON(v, v); } catch { return fallback; }
}

export function safeSetItem(key, value) {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch { return false; }
}

export function formatCurrency(amount = 0, currency = DEFAULT_CURRENCY) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num).replace(/\s/g, '');
}

export function clampInt(v, min = 0, max = 9999) {
  const n = Math.trunc(Number(v) || 0);
  return Math.min(max, Math.max(min, n));
}

export function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// Coupons: local mocked list. Expandable via data/*.json if needed.
const BUILT_IN_COUPONS = [
  { code: 'FLAMAGAMER10', pct: 10, expires: '2099-12-31', singleUse: false }
];

export function validateCoupon(code, coupons = BUILT_IN_COUPONS) {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  const c = (coupons || []).find(x => x.code === normalized);
  if (!c) return null;
  const now = new Date();
  if (c.expires && new Date(c.expires) < now) return null;
  return { ...c };
}

export function applyDiscounts(cart = [], coupons = []) {
  const subtotal = cart.reduce((s, it) => s + (Number(it.precio || it.price || 0) * Number(it.cantidad || it.qty || 1)), 0);
  let discount = 0;
  for (const c of coupons || []) {
    const valid = validateCoupon(c && c.code ? c.code : c);
    if (valid && valid.pct) discount += Math.round((subtotal * valid.pct) / 100);
  }
  return { subtotal, discount: Math.max(0, discount), total: Math.max(0, subtotal - discount) };
}

export function calcTotals(cart = [], options = {}) {
  const taxPct = Number(options.taxPercent || 0) || 0;
  const shipping = Number(options.shipping || 0) || 0;
  const coupons = options.coupons || [];
  const { subtotal, discount, total: afterDiscount } = applyDiscounts(cart, coupons);
  const tax = Math.round(afterDiscount * (taxPct / 100));
  const total = Math.max(0, afterDiscount + tax + shipping);
  return { subtotal, discount, tax, shipping, total };
}

export function checkStock(cart = [], products = []) {
  const problems = [];
  const map = new Map(products.map(p => [p.id, p]));
  for (const item of cart) {
    const prod = map.get(item.id) || products.find(p=>p.id === item.id);
    const qty = Number(item.cantidad || item.qty || 0);
    if (!prod) { problems.push({ id: item.id, reason: 'missing' }); continue; }
    const stock = Number(prod.stock || 0);
    if (stock <= 0) problems.push({ id: item.id, reason: 'out_of_stock', available: stock });
    else if (qty > stock) problems.push({ id: item.id, reason: 'insufficient', requested: qty, available: stock });
  }
  return problems;
}

export default {
  safeFetch, tryParseJSON, safeGetItem, safeSetItem, formatCurrency,
  clampInt, deepClone, validateCoupon, applyDiscounts, calcTotals, checkStock
};
