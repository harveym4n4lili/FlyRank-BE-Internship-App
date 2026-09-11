// Entry point for the polite scraper.
// This is a one-shot script, not a server: it runs the pipeline, writes its
// output files, prints a report, and exits.

import { discoverBookUrls } from './crawler.js';

const { cataloguePages, discovered, uniqueUrls } = await discoverBookUrls();

console.log(`catalogue_pages=${cataloguePages.length}`);
console.log(`discovered=${discovered}`);
console.log(`unique_urls=${uniqueUrls.length}`);
