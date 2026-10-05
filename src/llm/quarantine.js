import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// logs/ sits at the project root, two folders up from src/llm/
const LOGS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'logs');
const QUARANTINE_FILE = join(LOGS_DIR, 'quarantine.jsonl');

/**
 * Set aside an answer that could not be repaired, with everything needed to
 * work out later what went wrong: the input, the model's raw text for each
 * attempt, the error, and the prompt version.
 *
 * .jsonl = "JSON Lines": one complete JSON object per line, appended, never
 * rewritten. Easy to add to, easy to read back one line at a time.
 *
 * Never throws. Failing to write the log must not crash the request — the
 * caller still gets its 422.
 */
export async function quarantine(entry) {
  try {
    await mkdir(LOGS_DIR, { recursive: true });
    const line = JSON.stringify({ at: new Date().toISOString(), ...entry });
    await appendFile(QUARANTINE_FILE, `${line}\n`, 'utf8');
  } catch (error) {
    console.error('could not write to the quarantine log:', error.message);
  }
}
