import { ApiError } from './ApiError.js';
import {
  byOrder,
  normalizeCategory,
  normalizeDish,
  normalizeRestaurant,
  unwrapList,
} from '../models/normalize.js';

/**
 * The only module that knows which endpoints exist.
 * UI code calls these methods and receives normalized, sorted data.
 *
 * Responses are cached for the life of the page. A failed request is removed
 * from the cache so "Try again" performs a fresh request.
 */
export function createMenuService(client, {
  endpoints,
  categoryParam = 'category',
  maxPages = 20,
  mediaBase,
  fallbackCurrency = 'USD',
}) {
  const cache = new Map();
  const context = { mediaBase, fallbackCurrency };

  function remember(key, load) {
    if (!cache.has(key)) {
      const pending = load().catch((error) => {
        cache.delete(key);
        throw error;
      });
      cache.set(key, pending);
    }
    return cache.get(key);
  }

  /** Reads a list endpoint, following `next` links when the API paginates. */
  async function getAll(path, params) {
    const items = [];
    let payload = await client.get(path, { params });

    for (let page = 1; ; page += 1) {
      const list = unwrapList(payload);
      if (!list) {
        throw new ApiError(`Unexpected response format from ${path}.`, { code: 'parse', details: payload });
      }
      items.push(...list.items);
      if (!list.next || page >= maxPages) break;
      payload = await client.get(list.next);
    }
    return items;
  }

  function normalizeAll(items, normalize) {
    return items
      .map((item) => normalize(item, context))
      .filter(Boolean)
      .sort(byOrder);
  }

  return {
    getRestaurant() {
      return remember('restaurant', async () => (
        normalizeRestaurant(await client.get(endpoints.restaurant), context)
      ));
    },

    getCategories() {
      return remember('categories', async () => (
        normalizeAll(await getAll(endpoints.categories), normalizeCategory)
      ));
    },

    getDishes(categorySlug) {
      return remember(`dishes:${categorySlug}`, async () => (
        normalizeAll(
          await getAll(endpoints.dishes, { [categoryParam]: categorySlug }),
          normalizeDish,
        )
      ));
    },

    clearCache() {
      cache.clear();
    },
  };
}
