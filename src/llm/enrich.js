import { getClient } from './client.js';
import { loadPrompt, PROMPT_VERSION } from './prompt.js';
import { checkAnswer } from './parse.js';
import { quarantine } from './quarantine.js';

/**
 * Thrown when the model's answer still fails after one repair attempt.
 * The route turns this into a 422. It carries our own error wording only —
 * never the model's text to avoid leaking it to the client — and the prompt version that produced it.
 */
export class InvalidModelAnswerError extends Error {
  constructor(reason, promptVersion) {
    super(reason);
    this.name = 'InvalidModelAnswerError';
    this.promptVersion = promptVersion;
  }
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

// one call to the model. returns its raw text and which model answered.
async function callModel(messages) {
  const response = await getClient().chat.completions.create({
    model: process.env.LLM_MODEL,
    messages,
    // 0 = the same input gets the same answer, not a creative one
    temperature: 0,
  });

  return {
    // some models return null content (for example after a refusal); an empty
    // string keeps it a string, and checkAnswer then rejects it like any other
    // bad answer
    text: response.choices[0]?.message?.content ?? '',
    // openrouter/free routes to whichever free model is available, so record
    // which one actually answered
    model: response.model,
  };
}

/**
 * Enrich one book record.
 * @param {{ title: string, description: string|null }} book
 * @returns {Promise<{ data: object, meta: object }>}
 *   data — an object that has passed enrichOutputSchema
 *   meta — how it was produced: which model, which prompt, whether it needed a
 *          repair. Kept apart from data so it never leaks into the contract.
 * @throws {InvalidModelAnswerError} when the answer is still invalid after one repair
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
      data: {
        category: 'other',
        // echo the title so you can see real data flowing through the pipe.
        // sliced to stay inside the schema's 200-character limit.
        summary: `Stubbed summary for "${title.slice(0, 120)}".`,
        quality_flags: description ? [] : ['missing_description'],
        confidence: 0.1,
        reason: 'Stub mode is on, so no model was consulted.',
      },
      meta: { model: 'stub', promptVersion: PROMPT_VERSION, repaired: false },
    };
  }

  const messages = await buildMessages({ title, description });

  // --- attempt 1 ------------------------------------------------------------
  const first = await callModel(messages);
  const firstCheck = checkAnswer(first.text);

  if (firstCheck.ok) {
    return {
      data: firstCheck.data,
      meta: { model: first.model, promptVersion: PROMPT_VERSION, repaired: false },
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
  ]);
  const secondCheck = checkAnswer(second.text);

  if (secondCheck.ok) {
    return {
      data: secondCheck.data,
      meta: { model: second.model, promptVersion: PROMPT_VERSION, repaired: true },
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
