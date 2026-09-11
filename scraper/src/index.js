// Entry point for the polite scraper.
// This is a one-shot script, not a server: it runs the pipeline, writes its
// output files, prints a report, and exits.

import { discoverBookUrls } from './crawler.js';
import { cacheNameFor, extractBook } from './parse.js';
import { fetchPage } from './fetcher.js';

const { cataloguePages, discovered, uniqueBooks } = await discoverBookUrls();

console.log(`catalogue_pages=${cataloguePages.length}`);
console.log(`discovered=${discovered}`);
console.log(`unique_urls=${uniqueBooks.length}`);

// visit every book page and pull its raw fields
const rawRecords = [];

for (const book of uniqueBooks) {
  const { html, fetchedAt } = await fetchPage(book.product_url, cacheNameFor(book.product_url));

  rawRecords.push(
    extractBook(html, {
      product_url: book.product_url,
      source_page: book.source_page,
      fetched_at: fetchedAt,
    }),
  );
}

console.log(`detail_pages=${rawRecords.length}`);
console.log('\nexample raw record:');
console.log(JSON.stringify(rawRecords[0], null, 2));
