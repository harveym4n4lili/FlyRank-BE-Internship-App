import OpenAI from 'openai';

// the longest we wait for one model call. the SDK's default is ten minutes,
// which would hold an HTTP connection open long enough for the endpoint to
// look dead. when this fires, the route answers 504.
export const LLM_TIMEOUT_MS = 30_000;

let client = null;

// one client for the whole app, built from the three LLM_ env vars.
//
// created on first use rather than when the file is imported: the OpenAI
// constructor throws if LLM_API_KEY is missing, and that would stop the server
// from starting at all — even in stub mode, where no key is needed.
export function getClient() {
  if (client === null) {
    client = new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      timeout: LLM_TIMEOUT_MS,
      // the SDK retries twice by default, silently. switched off on purpose:
      // retry.js decides what to retry, waits with backoff, obeys Retry-After,
      // and logs every attempt. two retry systems stacked would turn one
      // request into as many as nine calls.
      maxRetries: 0,
    });
  }
  return client;
}
