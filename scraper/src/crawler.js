import * as cheerio from 'cheerio';
import { fetchPage } from './fetcher.js';

const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';

// the declared scope of this assignment: the first three catalogue pages
const MAX_PAGES = 3;

/**
 * walk the catalogue from page 1, collecting every book link it finds.
 * returns { cataloguePages, discovered, uniqueUrls }
 */
export async function discoverBookUrls() {
  const cataloguePages = [];
  const bookUrls = [];

  let pageUrl = START_URL;
  let pageNumber = 1;

  while (pageUrl && pageNumber <= MAX_PAGES) {
    const { html } = await fetchPage(pageUrl, `catalogue-page-${pageNumber}.html`);
    const $ = cheerio.load(html);

    cataloguePages.push(pageUrl);

    // each product_pod holds two links to the same book — the thumbnail and
    // the title — so aim at the title heading to get one link per book
    $('article.product_pod h3 a').each((_, element) => {
      const href = $(element).attr('href');

      // hrefs here are relative ("a-light-in-the-attic_1000/index.html"), so
      // resolve them against the page they came from. never glue strings.
      bookUrls.push(new URL(href, pageUrl).href);
    });

    // let the site tell us where the next page is instead of inventing the URL
    const nextHref = $('li.next a').attr('href');
    pageUrl = nextHref ? new URL(nextHref, pageUrl).href : null;
    pageNumber++;
  }

  // a Set keeps only the first sighting of each URL
  const uniqueUrls = [...new Set(bookUrls)];

  return { cataloguePages, discovered: bookUrls.length, uniqueUrls };
}
