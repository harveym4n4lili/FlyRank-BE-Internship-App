import OpenAI from 'openai';

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
    });
  }
  return client;
}
