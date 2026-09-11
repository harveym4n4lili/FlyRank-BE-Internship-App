// Entry point for the polite scraper.
// This is a one-shot script, not a server: it runs the pipeline, writes its
// output files, prints a report, and exits.

import { fetchPage } from './fetcher.js';

const CATALOGUE_PAGE_1 = 'https://books.toscrape.com/catalogue/page-1.html';

await fetchPage(CATALOGUE_PAGE_1, 'catalogue-page-1.html');
