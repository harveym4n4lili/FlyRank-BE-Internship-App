/**
 * Enrich one book record.
 * @param {{ title: string, description: string|null }} book
 * @returns {Promise<object>} an object shaped like enrichOutputSchema
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

  // Stage 2 replaces this with: load the prompt file, call the model.
  throw new Error(
    'Real model calls arrive in Stage 2. Set LLM_STUB=1 in .env for now.',
  );
}
