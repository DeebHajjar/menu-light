const SAFE_MEDIA_PROTOCOLS = new Set(['http:', 'https:', 'blob:']);
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Turns an image value from the API into a safe absolute URL, or null.
 * Relative paths ("/media/x.jpg") are resolved against `base`
 * (the API origin in production, the page itself in mock mode).
 */
export function resolveMediaUrl(value, base = document.baseURI) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();

  if (raw.startsWith('data:')) {
    return /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(raw) ? raw : null;
  }

  try {
    const url = new URL(raw, base);
    return SAFE_MEDIA_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** Only http(s) links are rendered as clickable links. */
export function safeExternalUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function telHref(phone) {
  const digits = String(phone ?? '').replace(/[^\d+]/g, '');
  return digits.length >= 4 ? `tel:${digits}` : null;
}

export function mailtoHref(email) {
  const value = String(email ?? '').trim();
  return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(value) ? `mailto:${value}` : null;
}
