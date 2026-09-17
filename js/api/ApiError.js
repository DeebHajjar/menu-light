/**
 * Every failure coming out of the API layer is an ApiError, so the UI only
 * has to reason about one shape.
 *
 * code: 'network' | 'timeout' | 'http' | 'not_found' | 'parse' | 'aborted'
 */
export class ApiError extends Error {
  constructor(message, { code = 'http', status = null, details = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get isRetryable() {
    if (this.code === 'network' || this.code === 'timeout') return true;
    return this.code === 'http' && (this.status === 429 || this.status >= 500);
  }
}
