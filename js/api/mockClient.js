import { ApiError } from './ApiError.js';
import { wait } from './httpClient.js';

/**
 * Serves /mock/*.json through the same `get()` interface as the HTTP client,
 * so the rest of the app cannot tell the difference.
 *
 * If `window.__MENU_MOCK_DATA__` exists ({ restaurant, categories, dishes }),
 * it is used instead of fetching the files (handy for single-file previews).
 */
export function createMockClient({ endpoints, categoryParam, basePath, latencyMs = 0 }) {
  const resources = new Map([
    [endpoints.restaurant, 'restaurant'],
    [endpoints.categories, 'categories'],
    [endpoints.dishes, 'dishes'],
  ]);
  const files = new Map();

  function load(name) {
    const inline = window.__MENU_MOCK_DATA__?.[name];
    if (inline) return Promise.resolve(structuredClone(inline));

    if (!files.has(name)) {
      const request = fetch(`${basePath}/${name}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .catch((cause) => {
          files.delete(name);
          throw new ApiError(`Mock file "${name}.json" could not be loaded.`, { code: 'network', cause });
        });
      files.set(name, request);
    }
    return files.get(name).then((data) => structuredClone(data));
  }

  async function get(path, { params = {}, signal } = {}) {
    await wait(latencyMs, signal);

    const resource = resources.get(path);
    if (!resource) {
      throw new ApiError(`No mock data for "${path}".`, { code: 'not_found', status: 404 });
    }

    const data = await load(resource);
    const category = params[categoryParam];
    if (resource === 'dishes' && category) {
      return data.filter((dish) => dish.category === category);
    }
    return data;
  }

  return { get };
}
