/**
 * Application configuration.
 *
 * Edit the defaults below, or override any value at deploy time without
 * touching this file by defining `window.MENU_CONFIG` before `js/main.js`
 * loads (see README.md):
 *
 *   <script>
 *     window.MENU_CONFIG = {
 *       api: { baseUrl: 'https://api.example.com/api/v1' },
 *       mock: { enabled: false },
 *     };
 *   </script>
 */

const defaults = {
  api: {
    /** Root of the REST API, without a trailing slash. */
    baseUrl: 'http://127.0.0.1:8000/api/v1',
    /** Paths appended to baseUrl. Trailing slashes match Django's defaults. */
    endpoints: {
      restaurant: '/restaurant/',
      categories: '/categories/',
      /** Called as /dishes/?category=<slug> */
      dishes: '/dishes/',
    },
    /** Query parameter used to filter dishes by category. */
    categoryParam: 'category',
    timeoutMs: 10000,
    /** Extra attempts after a network error, timeout, 429 or 5xx. */
    retries: 2,
    retryDelayMs: 600,
    /** Upper bound when following DRF-style `next` pagination links. */
    maxPages: 20,
  },

  mock: {
    /** true = read the JSON files in /mock instead of calling the API. */
    enabled: true,
    basePath: './mock',
    /** Simulated network delay, so loading states can be checked. */
    latencyMs: 350,
  },

  /** Used for price formatting (Intl.NumberFormat). */
  locale: 'en-US',
  /** Used when the API does not send a currency. */
  fallbackCurrency: 'USD',
  /** false hides dishes with is_available = false instead of greying them out. */
  showUnavailableDishes: true,
};

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function deepMerge(base, override) {
  if (!isPlainObject(override)) return base;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isPlainObject(value) && isPlainObject(base[key])
      ? deepMerge(base[key], value)
      : value;
  }
  return result;
}

function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(object);
}

export const config = deepFreeze(deepMerge(defaults, window.MENU_CONFIG));
