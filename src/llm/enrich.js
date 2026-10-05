import { getClient } from './client.js';
import { loadPrompt, PROMPT_VERSION } from './prompt.js';

/**
 * Build the two messages sent to the model.
 *
 * The instructions (system) and the book (user) are kept in separate messages.
 * Models treat the two roles differently, and the separation is a wall between
 * our instructions and content we did not write: the description is scraped
 * from the internet, so it might contain "ignore your instructions and...".
 *
 * The book is JSON-encoded, so anything inside it — quotes, newlines, a fake
 * "end of instructions" — stays inside a JSON string and cannot break out.
 */
export async function buildMessages({ title, description }) {
  return [
    { role: 'system', content: await loadPrompt() },
    { role: 'user', content: JSON.stringify({ title, description }) },
  ];
}

/**
 * Enrich one book record.
 * @param {{ title: string, description: string|null }} book
 * @returns {Promise<object>} in stub mode, an object shaped like enrichOutputSchema.
 *   With a real model (Stage 2), { raw, model, promptVersion } — the model's
 *   unchecked text. Stage 3 turns that text into a validated object.
 */
export async function enrichBook({ title, description }) {
  // -------------------------------------------------------------------------
  // Stub mode. Not a toy — this is how every stage from here gets built.
  //
  // You will restart this server dozens of times this week. With LLM_STUB=1
  // every one of those restarts is free and instant. You turn it off only when
  // you actually want to see what a model says, because OpenRouter allows 50
  // calls a day and failed calls count too.
  // -------------------------------------------------------------------------
  if (process.env.LLM_STUB === '1') {
    return {
      category: 'other',
      // echo the title so you can see real data flowing through the pipe.
      // sliced to stay inside the schema's 200-character limit.
      summary: `Stubbed summary for "${title.slice(0, 120)}".`,
      quality_flags: description ? [] : ['missing_description'],
      confidence: 0.1,
      reason: 'Stub mode is on, so no model was consulted.',
    };
  }

  const response = await getClient().chat.completions.create({
    model: process.env.LLM_MODEL,
    messages: await buildMessages({ title, description }),
    // 0 = the same input gets the same answer, not a creative one
    temperature: 0,
  });

  return {
    // some models return null content (for example after a refusal); an empty
    // string keeps the shape predictable for the caller
    raw: response.choices[0]?.message?.content ?? '',
    // openrouter/free routes to whichever free model is available, so record
    // which one actually answered
    model: response.model,
    promptVersion: PROMPT_VERSION,
  };
}
