import { enrichOutputSchema, describeIssues } from './schema.js';

/**
 * Pull a JSON object out of a model's reply.
 *
 * Models are asked for bare JSON but don't always obey. They wrap it in a code
 * fence, add "Sure! Here's the JSON:" in front, or pad it with blank lines.
 * This finds the object inside all of that.
 *
 * Returns { ok: true, value } or { ok: false, error }. It never throws: a bad
 * answer is a normal event here, not an exception.
 */
export function extractJson(text) {
  let candidate = String(text ?? '').trim();

  // ```json { ... } ```  ->  { ... }
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    candidate = fenced[1];
  }

  // "Sure! Here's the JSON: { ... } Hope that helps"  ->  { ... }
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end < start) {
    return { ok: false, error: 'The answer did not contain a JSON object.' };
  }

  try {
    return { ok: true, value: JSON.parse(candidate.slice(start, end + 1)) };
  } catch {
    // our own wording on purpose: JSON.parse's message quotes part of the
    // model's text, and model text must never reach the caller
    return { ok: false, error: 'The answer contained a JSON object that could not be parsed.' };
  }
}

/**
 * Parse a model's reply AND check it against the output schema.
 *
 * Valid JSON is not the same as a valid answer: {"category": "horror", ...}
 * parses perfectly and is still wrong, because "horror" is not in our list.
 *
 * Returns { ok: true, data } or { ok: false, error }.
 */
export function checkAnswer(text) {
  const parsed = extractJson(text);
  if (!parsed.ok) {
    return parsed;
  }

  const result = enrichOutputSchema.safeParse(parsed.value);
  if (!result.success) {
    return {
      ok: false,
      error: `The JSON did not match the schema: ${describeIssues(result.error)}`,
    };
  }

  return { ok: true, data: result.data };
}
