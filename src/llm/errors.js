// The errors the LLM layer can throw on purpose. The route reads the class of
// an error to choose the status code, so each one maps to exactly one answer.

/**
 * The model answered, but the answer still failed the schema after one repair
 * attempt. The route turns this into a 422. It carries our own error wording
 * only — never the model's text, to avoid leaking it to the client — and the
 * prompt version that produced it.
 */
export class InvalidModelAnswerError extends Error {
  constructor(reason, promptVersion) {
    super(reason);
    this.name = 'InvalidModelAnswerError';
    this.promptVersion = promptVersion;
  }
}

/**
 * The model did not answer in time, even after retrying. The route turns this
 * into a 504.
 */
export class ModelTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`The model did not answer within ${timeoutMs / 1000} seconds, even after retrying.`);
    this.name = 'ModelTimeoutError';
  }
}
