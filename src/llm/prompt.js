import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// the prompt in use. it is also the file name in prompts/, and from Stage 3 on
// it is logged with every call so a change in answer quality can be traced to
// the prompt version that caused it. switching to v2 is a one-line change here.
export const PROMPT_VERSION = 'enrich-v1';

// prompts/ sits at the project root, two folders up from src/llm/
const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'prompts');

let cachedPrompt = null;

// read the prompt file once, then reuse it. edits to the file take effect
// after a server restart.
export async function loadPrompt() {
  if (cachedPrompt === null) {
    cachedPrompt = await readFile(join(PROMPTS_DIR, `${PROMPT_VERSION}.md`), 'utf8');
  }

  console.log(`Using prompt version ${PROMPT_VERSION}:\n${cachedPrompt}\n`);

  return cachedPrompt;
}
