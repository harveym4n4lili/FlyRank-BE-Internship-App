# The Polite Scraper

A small scraping pipeline for [books.toscrape.com](https://books.toscrape.com): it downloads the first three
catalogue pages, visits all 60 book pages, turns messy HTML into clean validated JSON, survives a broken page,
and writes an honest report at the end of every run.

**FlyRank Internship · Backend Track · Week 5 · Assignment A9**

---

## Target classification

**Site:** https://books.toscrape.com

**Why this site:** toscrape.com is built for developers to test their scrapers, and acts as a sandbox.

**Scope:** The first 3 catalogue pages only (60 books). The scraper follows the site's own "next" link and stops after page 3.

**Data collected:** title, product URL, price, availability, rating, description, plus provenance (source page and fetch time).

**Why that is appropriate here:** The site exists specifically so that people can practise scraping on it, the
data is fictional catalogue content containing no personal or proprietary information, and this run stays
deliberately small — three pages, fetched slowly and cached locally, so the server is asked for each page only
once no matter how often the script is re-run.

**robots.txt check:** Requested `https://books.toscrape.com/robots.txt` once on 2026-09-11. The server returned **404 Not Found** — no robots file found. A missing robots file means there are no published crawl rules to obey; it is not itself permission to scrape. Permission here comes from the site describing itself as a practice sandbox.

> I will not reuse this code on another site without checking its rules and terms first.

---

## Record schema

Every record is checked against a Zod schema (`src/schema.js`) **before** it is written. A record that fails
goes to `errors.json` with the reason and never reaches `books.json`.

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | non-empty |
| `product_url` | string | the canonical URL — the record's identity. Must start with `https://` |
| `price_text` | string | exactly as the page wrote it, e.g. `"£51.77"` |
| `price_gbp` | number | the cleaned value, e.g. `51.77` |
| `availability_text` | string | e.g. `"In stock (22 available)"` |
| `rating_text` | string | e.g. `"Three"` — the page stores this in a CSS class, not as text |
| `description` | string \| null | **the only optional field.** `null` when the book has none — never invented |
| `source_page` | string | which catalogue page this book was found on |
| `fetched_at` | string | ISO timestamp of when the HTML actually arrived from the site |

The raw text and the cleaned value live side by side on purpose: when a price looks wrong weeks later, you want
to see what the page said, not only what the scraper made of it.

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "price_gbp": 51.77,
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "It's hard to imagine a world without A Light in the Attic...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-09-11T10:58:11.482Z"
}
```

**Idempotency:** each run replaces the output files rather than appending, and book URLs are de-duplicated
during discovery. Running the scraper twice produces the same 60 records — not 120.

---

## Politeness rules

Every request that actually leaves this machine:

- **User-agent:** `FlyRankInternshipA9/1.0 (+https://github.com/harveym4n4lili/FlyRank-BE-Internship-App)`
  — an honest name with a link back, so anyone reading their server logs can see who is calling.
- **Timeout:** 10 seconds. A request that hangs forever would block the whole run.
- **Delay between requests:** at least 500 ms between any two requests that actually reach the site. The gap is
  enforced inside the fetcher rather than by its callers, so no code path can skip it by accident. Cache hits
  never wait — they never leave this machine.
- **Status check:** the status code is checked *before* the body is read. Only `200` is treated as a page;
  anything else is a failed fetch, not HTML to parse.
- **Cache:** every fetched page is saved to `cache/`. Later runs read the saved copy, so the site is asked for
  each page exactly once no matter how many times the script is re-run during development.

---

## Honest limitation

<!-- TODO Stage 6: one real limitation of this scraper. -->

---

## Why no browser was needed

<!-- TODO Stage 6: one sentence. -->

---

## Ethics note

<!-- TODO Stage 6: in your own words. -->

---

## Sample run report

<!-- TODO Stage 6: paste a real output/run-report.json here as proof. -->
