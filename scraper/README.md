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

## Run it

Requires **Node.js 20 or newer** (the scraper uses the built-in `fetch`). Nothing else — no database, no API
key, no account.

```bash
cd scraper
npm install
npm start
```

That is the whole setup. The first run fetches 63 pages from the site at a deliberate 500 ms apart, so it takes
about half a minute; every run after that reads from the local cache and finishes in well under a second.

Three files land in `output/`:

| File | What it holds |
|------|---------------|
| `books.json` | The 60 validated records |
| `errors.json` | Records that failed schema validation, with the reason |
| `run-report.json` | Counts, failures, cache hits, and duration for that run |

Saved HTML goes to `cache/` (git-ignored). The site is asked for each page exactly once no matter how many
times the script is re-run.

**Built with:** Node.js · [Cheerio](https://cheerio.js.org/) for parsing · [Zod](https://zod.dev/) for schema
validation.

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

## Failure handling

One broken page must not take the run down. Each page is handled on its own: a page that cannot be fetched or
parsed is logged, skipped, and counted — the other records still make it through.

| Situation | What happens |
|-----------|--------------|
| Timeout, or a `5xx` server error | Wait a second, try **once** more |
| `404 Not Found` | No retry — the page does not exist, so asking again will not create it |
| `403 Forbidden` | No retry — the site said no, and asking again is how a polite robot becomes a pest |
| Still failing after that | Logged and skipped; recorded in `run-report.json` with its reason |

Every run ends by writing `output/run-report.json` with start time, duration, pages fetched, cache hits,
retries, valid records, invalid records, and failed pages. A scraper that reports nothing can fail silently for
weeks.

### Proving it

```bash
npm start -- --inject-failure
```

That adds a single book URL which does not exist. The run still finishes, the 60 good records still land in
`books.json`, and the report shows `failed_pages: 1` with the reason. Failure is injected on **our** side
deliberately — never by hammering the real site.

---

## Honest limitation

**The `description` field contains duplicated text.** Books to Scrape renders a truncated preview *and* the
full description inside the same `<p>` element, to drive its expand/collapse widget. The scraper captures that
paragraph faithfully, so most descriptions read as the first ~350 characters, then the whole text again, ending
in `...more`.

This is deliberate. Stage 3's rule is to store what the page actually said and never invent or silently trim
text, so the duplication is preserved rather than cleaned away. Splitting it reliably would mean guessing at
where the preview ends — and a guess that is wrong on one book in sixty is worse than honest raw text. A
cleaning step belongs in normalization, with the raw value kept alongside it, which is exactly what
`price_text` / `price_gbp` already does for prices.

Two smaller ones worth naming:

- **The delay is a flat 500 ms.** It does not read a `Retry-After` header or back off exponentially, so a site
  actively asking for more patience would not be heard.
- **Selectors assume this site's markup.** `.product_main`, `li.next` and `star-rating` are specific to Books
  to Scrape. A layout change breaks extraction — quietly, since the run would still report success with empty
  fields. Schema validation is the backstop, and it is why `title` and `price_gbp` are required.

---

## Why no browser was needed

Every field this scraper collects is already present in the HTML the server sends, so a headless browser would
only add startup time, memory, and complexity to arrive at exactly the same bytes — you can confirm it by
viewing the page source and finding all 20 book titles sitting there in plain markup.

---

## Ethics note

Scraping is reading someone else's server on their dime, so the rules I hold myself to are simple:

- **Use an official API when one exists.** If the site publishes the data deliberately, take it that way — it
  is cheaper for them, more stable for me, and unambiguous about permission.
- **Never bypass a login, a paywall, or a block.** Those are the site saying no. A `403` is an answer, not an
  obstacle to route around.
- **Collect only what I need.** Three catalogue pages, nine fields. Not the whole site because it was there.
- **Classify before writing code.** Check what the site says about itself and what its `robots.txt` asks for,
  and write the answer down before the first request — not after.
- **Identify myself and go slowly.** A real user-agent with a link back, and a delay that means the site barely
  notices I was there.

The habit underneath all of it: a scraper is a guest. Being technically able to take something is not the same
as being welcome to.

---

## Sample run report

A real `output/run-report.json`, from a cached re-run:

```json
{
  "started_at": "2026-09-11T17:23:08.680Z",
  "finished_at": "2026-09-11T17:23:08.864Z",
  "duration_seconds": 0.18,
  "catalogue_pages": 3,
  "book_urls_discovered": 60,
  "book_urls_unique": 60,
  "pages_fetched": 0,
  "cache_hits": 63,
  "retries": 0,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failures": []
}
```

`pages_fetched: 0` alongside `cache_hits: 63` is the cache doing its job: this run produced all 60 records
without sending a single request to the site.

And the same run with a deliberately broken URL injected (`npm start -- --inject-failure`):

```json
{
  "duration_seconds": 0.66,
  "book_urls_discovered": 60,
  "book_urls_unique": 61,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 1,
  "failures": [
    {
      "product_url": "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html",
      "reason": "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html returned 404 Not Found"
    }
  ]
}
```

The run finished, the 404 was not retried, and all 60 good records still reached `books.json`.
