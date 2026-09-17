/**
 * Normalizers turn raw API payloads into the shapes the UI relies on.
 * They are forgiving on input (missing fields, strings vs numbers, nested
 * objects) and strict on output, so rendering code never has to guard.
 */
import { resolveMediaUrl, safeExternalUrl } from '../utils/url.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function text(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function number(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Accepts ["a", "b"], [{ name: "a" }], or "a, b". */
function textList(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string' ? value.split(',') : [];
  return items
    .map((item) => (isObject(item) ? text(item.name ?? item.label) : text(item)))
    .filter(Boolean);
}

/** Accepts "summer-menu", { slug: "summer-menu" } or a numeric id. */
function reference(value) {
  if (isObject(value)) return text(value.slug ?? value.id);
  return text(value);
}

function slugify(value) {
  return text(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function byOrder(a, b) {
  return a.order - b.order || a.name.localeCompare(b.name);
}

/** Supports a plain array, DRF pagination ({ results, next }) or { data: [] }. */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return { items: payload, next: null };
  if (isObject(payload) && Array.isArray(payload.results)) {
    return { items: payload.results, next: payload.next || null };
  }
  if (isObject(payload) && Array.isArray(payload.data)) {
    return { items: payload.data, next: payload.next || null };
  }
  return null;
}

export function normalizeRestaurant(raw, { mediaBase, fallbackCurrency }) {
  const data = isObject(raw) ? raw : {};
  return {
    name: text(data.name, 'Menu'),
    tagline: text(data.tagline),
    description: text(data.description),
    logo: resolveMediaUrl(data.logo, mediaBase),
    heroImage: resolveMediaUrl(data.hero_image, mediaBase),
    currency: text(data.currency, fallbackCurrency).toUpperCase(),
    address: text(data.address),
    phone: text(data.phone),
    email: text(data.email),
    openingHours: (Array.isArray(data.opening_hours) ? data.opening_hours : [])
      .filter(isObject)
      .map((row) => ({ days: text(row.days), hours: text(row.hours) }))
      .filter((row) => row.days || row.hours),
    socialLinks: (Array.isArray(data.social_links) ? data.social_links : [])
      .filter(isObject)
      .map((link) => ({ label: text(link.label), url: safeExternalUrl(link.url) }))
      .filter((link) => link.label && link.url),
  };
}

export function normalizeCategory(raw, { mediaBase }) {
  if (!isObject(raw)) return null;
  const name = text(raw.name);
  const slug = text(raw.slug) || slugify(name) || text(raw.id);
  if (!name || !slug) return null;

  return {
    id: raw.id ?? slug,
    slug,
    name,
    description: text(raw.description),
    image: resolveMediaUrl(raw.image, mediaBase),
    order: number(raw.order, 0),
    dishCount: number(raw.dish_count),
  };
}

export function normalizeDish(raw, { mediaBase }) {
  if (!isObject(raw)) return null;
  const name = text(raw.name);
  if (!name) return null;

  return {
    id: raw.id ?? (text(raw.slug) || slugify(name)),
    slug: text(raw.slug) || slugify(name),
    name,
    description: text(raw.description),
    ingredients: textList(raw.ingredients),
    price: number(raw.price),
    image: resolveMediaUrl(raw.image, mediaBase),
    category: reference(raw.category),
    tags: textList(raw.tags).map((tag) => tag.toLowerCase()),
    isAvailable: raw.is_available !== false,
    order: number(raw.order, 0),
  };
}
