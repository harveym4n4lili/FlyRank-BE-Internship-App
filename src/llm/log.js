/**
 * Write one structured log line to stdout.
 *
 * "Structured" means a JSON object with named fields instead of a sentence, so
 * both people and programs can search it: every line with "event":"llm_call",
 * every call over 5000 ms, the total output_tokens for a day.
 *
 * It goes to stdout rather than a file of our own: where logs end up (a
 * terminal, a file, a log service) is the environment's decision, not the
 * app's.
 */
export function logEvent(event, fields = {}) {
  console.log(JSON.stringify({ at: new Date().toISOString(), event, ...fields }));
}
