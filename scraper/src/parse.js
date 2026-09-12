import * as cheerio from 'cheerio';

// the page wraps its text in newlines and padding, so collapse it to one line
function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * turn one book page into a raw record: eight keys, every time.
 * nothing is cleaned into numbers here — that is Stage 4's job.
 */
export function extractBook(html, { product_url, source_page, fetched_at }) {
  const $ = cheerio.load(html);

  // aim at the product area, not the whole document. "the first thing that
  // looks like a price" works today and betrays you the day the page grows a
  // second price — a banner, a related item, a discount badge.
  const main = $('.product_main');

  // the rating is written into the class name, not the text:
  // <p class="star-rating Three">
  const ratingClasses = (main.find('.star-rating').attr('class') ?? '').split(/\s+/);
  const rating_text = ratingClasses.find((name) => name && name !== 'star-rating') ?? null;

  // the description is the paragraph that follows the description header.
  // books without one have no such element at all — store null rather than
  // inventing text that was never on the page.
  const descriptionParagraph = $('#product_description').next('p');
  const description = descriptionParagraph.length
    ? cleanText(descriptionParagraph.text())
    : null;

  return {
    title: cleanText(main.find('h1').text()),
    product_url,
    price_text: cleanText(main.find('.price_color').text()),
    availability_text: cleanText(main.find('.availability').text()),
    rating_text,
    description,

    // provenance: the receipt showing where and when this came from
    source_page,
    fetched_at,
  };
}

/**
 * build the cache filename for a book page from its URL slug, so each book
 * gets a stable, readable file:
 * .../catalogue/a-light-in-the-attic_1000/index.html
 *   -> book-a-light-in-the-attic_1000.html
 */
export function cacheNameFor(productUrl) {
  const segments = new URL(productUrl).pathname.split('/').filter(Boolean);
  return `book-${segments.at(-2)}.html`;
}
