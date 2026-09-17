/**
 * Hash-based routing, so category pages can be linked, shared and reached
 * with the back button without any server configuration.
 *
 *   (no hash) or #top  → { name: 'home' }
 *   #menu              → { name: 'menu' }
 *   #menu/<slug>       → { name: 'category', slug }
 */
const MENU = '#menu';

export const routes = {
  menu: () => MENU,
  category: (slug) => `${MENU}/${encodeURIComponent(slug)}`,
};

export function parseHash(hash = window.location.hash) {
  if (hash === MENU || hash === `${MENU}/`) return { name: 'menu' };

  if (hash.startsWith(`${MENU}/`)) {
    const segment = hash.slice(MENU.length + 1).split('/')[0];
    try {
      const slug = decodeURIComponent(segment);
      return slug ? { name: 'category', slug } : { name: 'menu' };
    } catch {
      return { name: 'menu' };
    }
  }

  return { name: 'home' };
}

/** Calls `handler(route, { initial })` now and on every hash change. */
export function startRouter(handler) {
  window.addEventListener('hashchange', () => handler(parseHash(), { initial: false }));
  handler(parseHash(), { initial: true });
}
