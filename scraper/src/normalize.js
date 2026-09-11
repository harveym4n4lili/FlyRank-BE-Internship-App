/**
 * "£51.77" -> 51.77
 *
 * pull the digits out rather than stripping a hard-coded "£", so a page that
 * switches currency symbol or adds whitespace does not silently produce NaN.
 * returns null when nothing numeric is there — the schema then rejects the
 * record instead of storing a broken price.
 */
export function parsePriceGbp(priceText) {
  const match = String(priceText).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/**
 * take a raw record and add the cleaned values alongside the originals.
 * the raw text is kept: when a value looks wrong later, you want to see
 * exactly what the page said, not just what we made of it.
 */
export function normalizeBook(raw) {
  return {
    ...raw,
    price_gbp: parsePriceGbp(raw.price_text),
  };
}
