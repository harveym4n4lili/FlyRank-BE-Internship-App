import OpenAI from 'openai';
import { logEvent } from './log.js';

// at most 2 retries, so at most 3 attempts per model call. kept low on purpose:
// each attempt can take up to 30 s, and on a free tier every attempt — failed
// or not — spends one of the day's 50 calls.
export const MAX_RETRIES = 2;

// exponential backoff: wait 1 s before the first retry, 2 s before the second
const BASE_DELAY_MS = 1_000;

// jitter: up to this much random extra wait, so many clients that failed at the
// same moment do not all retry at the same moment too
const MAX_JITTER_MS = 250;

// if the server asks us to wait longer than this, give up instead. holding the
// caller's HTTP request open for a minute is worse than an honest error.
const MAX_RETRY_AFTER_MS = 10_000;

/** the request gave up waiting — the SDK throws this when `timeout` fires */
export function isTimeout(error) {
  return error instanceof OpenAI.APIConnectionTimeoutError;
}

/**
 * Is this failure worth another attempt?
 *
 *   yes — timeout: the model may just have been slow
 *   yes — 429: rate limited; it may work after a short wait
 *   yes — 5xx: the provider broke, not us; it may work a moment later
 *   no  — 400: our request is wrong, and will still be wrong
 *   no  — 401: a bad key will still be a bad key in four seconds
 *   no  — 403: forbidden stays forbidden
 *   no  — anything else, including network errors with no status (a wrong
 *         LLM_BASE_URL does not fix itself)
 */
export function isRetryable(error) {
  if (isTimeout(error)) return true;
  if (error.status === 429) return true;
  if (error.status >= 500) return true;
  return false;
}

/**
 * How long the server told us to wait, in ms, or null if it didn't say.
 *
 * Retry-After comes in two formats, and handling only the first is a real bug:
 *   "7"                              -> seconds
 *   "Wed, 21 Oct 2026 07:28:00 GMT"  -> a date
 */
export function retryAfterMs(error) {
  const value = error.headers?.get?.('retry-after');
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());

  return null;
}

/** exponential backoff with jitter: retry 1 -> ~1 s, retry 2 -> ~2 s */
export function backoffMs(retryNumber) {
  return BASE_DELAY_MS * 2 ** (retryNumber - 1) + Math.random() * MAX_JITTER_MS;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `attempt` and retry it under the rules above.
 *
 * `attempt` receives the retry number (0 for the first try) so it can log it.
 * If the failure is not retryable, or the retries are used up, the last error
 * is thrown unchanged for the caller to deal with.
 */
export async function withRetry(attempt) {
  for (let retry = 0; ; retry++) {
    try {
      return await attempt(retry);
    } catch (error) {
      if (!isRetryable(error) || retry >= MAX_RETRIES) {
        throw error;
      }

      // obey the server when it says how long to wait, instead of guessing
      const serverWait = retryAfterMs(error);
      if (serverWait !== null && serverWait > MAX_RETRY_AFTER_MS) {
        throw error;
      }
      const waitMs = Math.round(serverWait ?? backoffMs(retry + 1));

      logEvent('llm_retry', {
        retry: retry + 1,
        wait_ms: waitMs,
        reason: isTimeout(error) ? 'timeout' : error.status,
        waited_because: serverWait !== null ? 'retry-after header' : 'backoff',
      });

      await sleep(waitMs);
    }
  }
}
