/**
 * Entry point: wires configuration, data source and the app together.
 */
import { config } from './config.js';
import { createHttpClient } from './api/httpClient.js';
import { createMockClient } from './api/mockClient.js';
import { createMenuService } from './api/menuService.js';
import { createApp } from './app.js';

const { api, mock } = config;

const client = mock.enabled
  ? createMockClient({
      endpoints: api.endpoints,
      categoryParam: api.categoryParam,
      basePath: mock.basePath,
      latencyMs: mock.latencyMs,
    })
  : createHttpClient({
      baseUrl: api.baseUrl,
      timeoutMs: api.timeoutMs,
      retries: api.retries,
      retryDelayMs: api.retryDelayMs,
    });

const service = createMenuService(client, {
  endpoints: api.endpoints,
  categoryParam: api.categoryParam,
  maxPages: api.maxPages,
  // Relative image paths resolve against the page in mock mode,
  // and against the API origin in production.
  mediaBase: mock.enabled ? document.baseURI : new URL(api.baseUrl, window.location.href).href,
  fallbackCurrency: config.fallbackCurrency,
});

createApp({ config, service }).start();
