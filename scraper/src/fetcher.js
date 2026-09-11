import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
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

// minimum gap between two requests that actually reach the site
const DELAY_MS = 500;

// when the last real request went out (0 = none yet this run)
let lastRequestAt = 0;

// hold the next real request back until at least DELAY_MS has passed since the
// last one. cache hits never call this, so reading saved pages stays instant.
async function waitTurn() {
  const sinceLastRequest = Date.now() - lastRequestAt;
  if (sinceLastRequest < DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS - sinceLastRequest));
  }
  lastRequestAt = Date.now();
}


// how long to pause before the single retry
const RETRY_DELAY_MS = 1_000;

// counted across the whole run so the report can tell the truth about it
export const fetchStats = { fetched: 0, cacheHits: 0, retries: 0 };

// an HTTP status that was not 200. carries the status so the retry rule can
// tell "the server is struggling" apart from "the page does not exist".
class HttpError extends Error {
  constructor(url, status, statusText) {
    super(`${url} returned ${status} ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

// is this failure worth one more attempt?
function isWorthRetrying(error) {
  // the request gave up waiting — the site may just have been slow
  if (error.name === 'TimeoutError') return true;

  // 5xx means the server broke, not us. it may well work a second later.
  if (error instanceof HttpError) return error.status >= 500;

  // everything else is a definite no. in particular:
  //   404 — the page does not exist; asking again will not create it
  //   403 — the site said no; asking again is how a polite robot becomes a pest
  return false;
}

// one attempt: wait our turn, ask the site, check the status before the body
async function requestOnce(url) {
  await waitTurn();

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // check the status BEFORE touching the body. only 200 is a page;
  // anything else is a failed fetch, not HTML to parse.
  if (response.status !== 200) {
    throw new HttpError(url, response.status, response.statusText);
  }

  return response.text();
}

export async function fetchPage(url, cacheName) {
  const cachePath = join(CACHE_DIR, cacheName);

  // 1. check for saved copy in cache
  try {
    const html = await readFile(cachePath, 'utf8');

    // these bytes arrived when the cache file was written, not now. provenance
    // should record when the fact was actually collected from the site.
    const { mtime } = await stat(cachePath);

    fetchStats.cacheHits++;
    console.log(`CACHE HIT  ${cacheName}  ${html.length} bytes`);
    return { html, fromCache: true, fetchedAt: mtime.toISOString() };
  } catch (error) {
    // ENOENT just means "not cached yet" — any other error is a real problem
    if (error.code !== 'ENOENT') throw error;
  }

  // 2. not cached. ask the site, with one retry if it is worth retrying.
  let html;
  try {
    html = await requestOnce(url);
  } catch (error) {
    if (!isWorthRetrying(error)) throw error;

    fetchStats.retries++;
    console.log(`RETRY      ${cacheName}  ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

    // second and final attempt. if this throws, the caller deals with it.
    html = await requestOnce(url);
  }

  const fetchedAt = new Date().toISOString();

  // 3. save it, so the next fifty runs never leave this machine.
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, html, 'utf8');

  fetchStats.fetched++;
  console.log(`FETCH      ${cacheName}  ${html.length} bytes`);
  return { html, fromCache: false, fetchedAt };
}
