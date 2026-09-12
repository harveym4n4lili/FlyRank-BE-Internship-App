import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// output/ sits next to src/, like cache/
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'output');

/**
 * write one output file, replacing whatever was there before.
 *
 * this replace-don't-append behaviour is what makes the scraper idempotent:
 * run it twice and you get 60 records, not 120.
 */
export async function writeJson(fileName, data) {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
