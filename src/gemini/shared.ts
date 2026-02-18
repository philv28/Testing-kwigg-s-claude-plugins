/**
 * Shared Gemini API utilities used by both text generation and image generation.
 */

/**
 * Base error reasons common to all Gemini API calls.
 */
export type ApiErrorReason =
  | 'api_key_missing'
  | 'timeout'
  | 'auth_error'
  | 'rate_limit'
  | 'safety_filter'
  | 'model_error'
  | 'generation_error';

/**
 * Check whether the GEMINI_API_KEY environment variable is set.
 */
export function isApiKeySet(): boolean {
  return !!process.env['GEMINI_API_KEY'];
}

/**
 * Classify a caught error into an ApiErrorReason.
 */
export function classifyError(err: unknown): { error: ApiErrorReason; errorMessage: string } {
  if (!(err instanceof Error)) {
    return { error: 'generation_error', errorMessage: String(err) };
  }

  const msg = err.message.toLowerCase();

  if (msg.includes('api_key') || msg.includes('api key') || msg.includes('apikey')) {
    return { error: 'auth_error', errorMessage: err.message };
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('resource exhausted') || msg.includes('quota')) {
    return { error: 'rate_limit', errorMessage: err.message };
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('authentication') || msg.includes('permission')) {
    return { error: 'auth_error', errorMessage: err.message };
  }
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harmful')) {
    return { error: 'safety_filter', errorMessage: err.message };
  }
  if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('timed out') || msg.includes('timedout') || msg.includes('aborted')) {
    return { error: 'timeout', errorMessage: err.message };
  }
  if (msg.includes('model not found') || msg.includes('models/') || msg.includes('404')) {
    return { error: 'model_error', errorMessage: err.message };
  }

  return { error: 'generation_error', errorMessage: err.message };
}
