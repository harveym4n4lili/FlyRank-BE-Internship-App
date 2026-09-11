// Entry point for the polite scraper.
// This is a one-shot script, not a server: it runs the pipeline, writes its
// output files, prints a report, and exits.

import { discoverBookUrls } from './crawler.js';
import { cacheNameFor, extractBook } from './parse.js';
import { fetchPage } from './fetcher.js';
import { normalizeBook } from './normalize.js';
import { bookSchema, describeIssues } from './schema.js';
import { writeJson } from './store.js';

// --- discover -------------------------------------------------------------

const { cataloguePages, discovered, uniqueBooks } = await discoverBookUrls();

console.log(`catalogue_pages=${cataloguePages.length}`);
console.log(`discovered=${discovered}`);
console.log(`unique_urls=${uniqueBooks.length}`);

// --- extract, normalize, validate -----------------------------------------

const validBooks = [];
const invalidBooks = [];

for (const book of uniqueBooks) {
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
}

console.log(`detail_pages=${uniqueBooks.length}`);

// --- store ----------------------------------------------------------------

await writeJson('books.json', validBooks);
await writeJson('errors.json', invalidBooks);

console.log(`valid_records=${validBooks.length}`);
console.log(`invalid_records=${invalidBooks.length}`);
