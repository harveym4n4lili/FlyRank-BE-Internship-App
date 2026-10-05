import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

try {
  const response = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    messages: [{ role: 'user', content: 'Reply with exactly the word: ready' }],
  });

  console.log('model said:', response.choices[0].message.content);
} catch (error) {
  // The three failures that actually happen on day one, named plainly.
  console.error(`\nfailed: ${error.status ?? ''} ${error.message}\n`);

  if (error.status === 404) {
    console.error(
      'A 404 here usually is NOT a broken URL. It usually means the model name is wrong. Check LLM_MODEL in .env.',
    );
  }

  if (error.status === 401) {
    console.error('A 401 means the key is wrong or missing. Check LLM_API_KEY in .env.');
  }

  if (error.status === 429) {
    console.error(
      'A 429 means you are out of quota. OpenRouter free tier is 20 requests\n' +
        'per minute and 50 per day — and failed requests count too.',
    );
  }

  process.exit(1);
}
