import { getClient, LLM_TIMEOUT_MS } from './client.js';
import { loadPrompt, PROMPT_VERSION } from './prompt.js';
import { checkAnswer } from './parse.js';
import { quarantine } from './quarantine.js';
import { withRetry, isTimeout } from './retry.js';
import { logEvent } from './log.js';
import { InvalidModelAnswerError, ModelTimeoutError } from './errors.js';

// the kill switch. LLM_ENABLED=false turns the model off without a deploy —
// for a provider outage, a bill spike, or a model saying something it
// shouldn't. anything else (including the variable being missing) leaves it on.
function llmEnabled() {
  return process.env.LLM_ENABLED !== 'false';
}

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
 * One call to the model — retried under the rules in retry.js — returning its
 * raw text and which model answered.
 *
 * Every attempt writes one structured log line: the cost log. That is what
 * answers "how much will this cost at ten thousand requests a day".
 *
 * @param {Array} messages
 * @param {'first'|'repair'} purpose  whether this is the first try or the repair
 */
async function callModel(messages, purpose) {
  try {
    return await withRetry(async (retry) => {
      const startedAt = Date.now();

      try {
        const response = await getClient().chat.completions.create({
          model: process.env.LLM_MODEL,
          messages,
          // 0 = the same input gets the same answer, not a creative one
          temperature: 0,
        });

        logEvent('llm_call', {
          outcome: 'ok',
          prompt_version: PROMPT_VERSION,
          // openrouter/free routes to whichever free model is available, so
          // record which one actually answered
          model: response.model,
          repair: purpose === 'repair',
          retry,
          input_tokens: response.usage?.prompt_tokens ?? null,
          output_tokens: response.usage?.completion_tokens ?? null,
          duration_ms: Date.now() - startedAt,
        });

        return {
          // some models return null content (for example after a refusal); an
          // empty string keeps it a string, and checkAnswer then rejects it
          // like any other bad answer
          text: response.choices[0]?.message?.content ?? '',
          model: response.model,
        };
      } catch (error) {
        // failed calls are logged too: on a metered tier they still cost quota
        logEvent('llm_call', {
          outcome: 'error',
          prompt_version: PROMPT_VERSION,
          model: process.env.LLM_MODEL,
          repair: purpose === 'repair',
          retry,
          status: isTimeout(error) ? 'timeout' : (error.status ?? 'no response'),
          duration_ms: Date.now() - startedAt,
        });
        throw error;
      }
    });
  } catch (error) {
    // still timing out after the retries: turn the SDK's error into our own,
    // so the route can answer 504 without knowing which SDK we use
    if (isTimeout(error)) {
      throw new ModelTimeoutError(LLM_TIMEOUT_MS);
    }
    throw error;
  }
}

/**
 * Enrich one book record.
 * @param {{ title: string, description: string|null }} book
 * @returns {Promise<{ data: object, meta: object }>}
 *   data — an object that has passed enrichOutputSchema
 *   meta — how it was produced: the source ('model', 'stub' or 'fallback'),
 *          which model, which prompt, whether it needed a repair. Kept apart
 *          from data so it never leaks into the contract.
 * @throws {InvalidModelAnswerError} when the answer is still invalid after one repair
 * @throws {ModelTimeoutError} when the model is still too slow after retrying
 */
export async function enrichBook({ title, description }) {
  // -------------------------------------------------------------------------
  // Kill switch. Checked before anything else, so when it is off no model call
  // can happen — not even through stub mode's code path.
  //
  // The fallback is deterministic: the same book always gets the same answer,
  // built by code from facts we already have. confidence 0 tells any caller
  // that nothing was actually analysed.
  // -------------------------------------------------------------------------
  if (!llmEnabled()) {
    logEvent('llm_skipped', { reason: 'kill switch (LLM_ENABLED=false)' });

    return {
      data: {
        category: 'other',
        summary: `Automatic enrichment is switched off, so "${title.slice(0, 120)}" was not analysed.`,
        quality_flags: description ? [] : ['missing_description'],
        confidence: 0,
        reason: 'The AI feature is disabled, so a safe default was returned.',
      },
      meta: { source: 'fallback', model: null, promptVersion: PROMPT_VERSION, repaired: false },
    };
  }

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
      data: {
        category: 'other',
        // echo the title so you can see real data flowing through the pipe.
        // sliced to stay inside the schema's 200-character limit.
        summary: `Stubbed summary for "${title.slice(0, 120)}".`,
        quality_flags: description ? [] : ['missing_description'],
        confidence: 0.1,
        reason: 'Stub mode is on, so no model was consulted.',
      },
      meta: { source: 'stub', model: null, promptVersion: PROMPT_VERSION, repaired: false },
    };
  }

  const messages = await buildMessages({ title, description });

  // --- attempt 1 ------------------------------------------------------------
  const first = await callModel(messages, 'first');
  const firstCheck = checkAnswer(first.text);

  if (firstCheck.ok) {
    return {
      data: firstCheck.data,
      meta: { source: 'model', model: first.model, promptVersion: PROMPT_VERSION, repaired: false },
    };
  }

  // --- attempt 2: repair once, and only once ----------------------------------
  // the same conversation, plus the model's own broken answer, plus exactly why
  // it was rejected. most failures are fixed here.
  const second = await callModel([
    ...messages,
    { role: 'assistant', content: first.text },
    {
      role: 'user',
      content:
        `Your previous answer was rejected for this reason: ${firstCheck.error}\n` +
        'Return only corrected JSON matching the schema.',
    },
  ], 'repair');
  const secondCheck = checkAnswer(second.text);

  if (secondCheck.ok) {
    return {
      data: secondCheck.data,
      meta: { source: 'model', model: second.model, promptVersion: PROMPT_VERSION, repaired: true },
    };
  }

  // --- give up cleanly ---------------------------------------------------------
  // no third attempt, no guessed default. set the evidence aside and tell the
  // caller plainly that there is no valid answer.
  await quarantine({
    prompt_version: PROMPT_VERSION,
    input: { title, description },
    attempts: [
      { model: first.model, raw: first.text, error: firstCheck.error },
      { model: second.model, raw: second.text, error: secondCheck.error },
    ],
  });

  throw new InvalidModelAnswerError(secondCheck.error, PROMPT_VERSION);
}
