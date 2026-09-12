// Entry point for the polite scraper.
// This is a one-shot script, not a server: it runs the pipeline, writes its
// output files, prints a report, and exits.

import { discoverBookUrls } from './crawler.js';
import { cacheNameFor, extractBook } from './parse.js';
import { fetchPage, fetchStats } from './fetcher.js';
import { normalizeBook } from './normalize.js';
import { bookSchema, describeIssues } from './schema.js';
import { writeJson } from './store.js';

const startedAt = new Date();

// run with `npm start -- --inject-failure` to add one book URL that does not
// exist. proves a broken page is logged and skipped instead of killing the run.
const INJECT_FAILURE = process.argv.includes('--inject-failure');

// --- discover -------------------------------------------------------------

const { cataloguePages, discovered, uniqueBooks } = await discoverBookUrls();

if (INJECT_FAILURE) {
  uniqueBooks.push({
    product_url: 'https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html',
    source_page: cataloguePages[0],
  });
  console.log('INJECTED   one deliberately broken book URL');
}

console.log(`catalogue_pages=${cataloguePages.length}`);
console.log(`discovered=${discovered}`);
console.log(`unique_urls=${uniqueBooks.length}`);

// --- extract, normalize, validate -----------------------------------------

const validBooks = [];
const invalidBooks = [];
const failedPages = [];

for (const book of uniqueBooks) {
  // each page is handled on its own. one page that cannot be fetched or parsed
  // is recorded and skipped — the other fifty-nine still make it through.
  try {
    const { html, fetchedAt } = await fetchPage(book.product_url, cacheNameFor(book.product_url));

    const raw = extractBook(html, {
      product_url: book.product_url,
      source_page: book.source_page,
      fetched_at: fetchedAt,
    });

    const candidate = normalizeBook(raw);

    // nothing reaches books.json without passing the schema first
    const result = bookSchema.safeParse(candidate);

    if (result.success) {
      validBooks.push(result.data);
    } else {
      invalidBooks.push({
        product_url: candidate.product_url,
        reason: describeIssues(result.error),
        record: candidate,
      });
    }
  } catch (error) {
    failedPages.push({ product_url: book.product_url, reason: error.message });
    console.log(`FAILED     ${book.product_url}  ${error.message}`);
  }
}

// --- store ----------------------------------------------------------------

const finishedAt = new Date();

await writeJson('books.json', validBooks);
await writeJson('errors.json', invalidBooks);

// a scraper that reports nothing can fail silently for weeks
await writeJson('run-report.json', {
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  duration_seconds: Number(((finishedAt - startedAt) / 1000).toFixed(2)),
  catalogue_pages: cataloguePages.length,
  book_urls_discovered: discovered,
  book_urls_unique: uniqueBooks.length,
  pages_fetched: fetchStats.fetched,
  cache_hits: fetchStats.cacheHits,
  retries: fetchStats.retries,
  valid_records: validBooks.length,
  invalid_records: invalidBooks.length,
  failed_pages: failedPages.length,
  failures: failedPages,
});

console.log(`valid_records=${validBooks.length}`);
console.log(`invalid_records=${invalidBooks.length}`);
console.log(`failed_pages=${failedPages.length}`);
