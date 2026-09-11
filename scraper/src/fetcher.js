import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// how this scraper introduces itself. A site owner who sees this line in their
// logs can follow the link and find out exactly who is making the requests.
const USER_AGENT =
  'FlyRankInternshipA9/1.0 (+https://github.com/harveym4n4lili/FlyRank-BE-Internship-App)';

// a request that hangs forever would block the whole run. Give up after 10s.
const TIMEOUT_MS = 10_000;

// cache/ sits next to src/, not wherever the terminal happens to be
const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'cache');


export async function fetchPage(url, cacheName) {
  const cachePath = join(CACHE_DIR, cacheName);

  // 1. check for saved copy in cache
  try {
    const html = await readFile(cachePath, 'utf8');
    console.log(`CACHE HIT  ${cacheName}  ${html.length} bytes`);
    return { html, fromCache: true };
  } catch (error) {
    // ENOENT just means "not cached yet" — any other error is a real problem
    if (error.code !== 'ENOENT') throw error;
  }

  // 2. not cached. ask the site — with a name and a deadline.
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // 3. check the status BEFORE touching the body. nly 200 is a page;
  //    anything else is a failed fetch, not HTML to parse.
  if (response.status !== 200) {
    throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // 4. save it, so the next fifty runs never leave this machine.
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, html, 'utf8');

  console.log(`FETCH      ${cacheName}  ${html.length} bytes`);
  return { html, fromCache: false };
}
