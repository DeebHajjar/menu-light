import { ApiError } from './ApiError.js';

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Builds a request URL.
 * Absolute URLs (e.g. DRF `next` links) are used as they are; paths are
 * appended to baseUrl.
 */
export function buildUrl(baseUrl, pathOrUrl, params = {}) {
  const url = ABSOLUTE_URL.test(pathOrUrl)
    ? new URL(pathOrUrl)
    : new URL(`${baseUrl.replace(/\/+$/, '')}/${String(pathOrUrl).replace(/^\/+/, '')}`, window.location.href);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function abortError(cause) {
  return new ApiError('The request was cancelled.', { code: 'aborted', cause });
}

/** Resolves after `ms`, or rejects early if `signal` aborts. */
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError(signal.reason));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError(signal.reason));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function readErrorBody(response) {
  try {
    const type = response.headers.get('content-type') || '';
    return type.includes('json') ? await response.json() : await response.text();
  } catch {
    return null;
  }
}

/**
 * Creates a small JSON client for GET requests.
 * Returns { get(pathOrUrl, { params, signal }) }.
 */
export function createHttpClient({
  baseUrl,
  timeoutMs = 10000,
  retries = 2,
  retryDelayMs = 600,
  headers = {},
}) {
  async function requestOnce(url, signal) {
    if (signal?.aborted) throw abortError(signal.reason);

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort(signal.reason);
    signal?.addEventListener('abort', forwardAbort, { once: true });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...headers },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApiError(`The server answered with status ${response.status}.`, {
          code: response.status === 404 ? 'not_found' : 'http',
          status: response.status,
          details: await readErrorBody(response),
        });
      }

      if (response.status === 204) return null;

      try {
        return await response.json();
      } catch (cause) {
        throw new ApiError('The server response was not valid JSON.', { code: 'parse', cause });
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (timedOut) {
        throw new ApiError(`No response within ${timeoutMs / 1000} seconds.`, { code: 'timeout', cause: error });
      }
      if (signal?.aborted) throw abortError(error);
      throw new ApiError('The server could not be reached.', { code: 'network', cause: error });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forwardAbort);
    }
  }

  async function get(pathOrUrl, { params, signal } = {}) {
    const url = buildUrl(baseUrl, pathOrUrl, params);

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await requestOnce(url, signal);
      } catch (error) {
        const canRetry = error instanceof ApiError && error.isRetryable && attempt < retries;
        if (!canRetry) throw error;
        // Exponential backoff with a little jitter: 600ms, 1200ms, 2400ms…
        const delay = retryDelayMs * 2 ** attempt + Math.random() * 150;
        await wait(delay, signal);
      }
    }
  }

  return { get };
}

export { wait };
