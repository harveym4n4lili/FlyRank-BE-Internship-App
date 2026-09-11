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

```bash
cd scraper
npm install
npm start
```

Outputs land in `output/`:

| File | What it holds |
|------|---------------|
| `books.json` | The validated records |
| `errors.json` | Records that failed validation, with the reason |
| `run-report.json` | Counts, failures, cache hits, duration |

Saved HTML goes to `cache/` (git-ignored). The first run fetches from the site; later runs read the cache, so
the site is asked once no matter how many times you re-run the script.

---

## Record schema

<!-- TODO Stage 4: document the finished record shape here once the Zod schema exists. -->

---

## Politeness rules

Every request that actually leaves this machine:

<!-- TODO Stage 1-3: fill in as you build them. -->

- **User-agent:**
- **Timeout:**
- **Delay between requests:**
- **Status check:**
- **Cache:**

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
