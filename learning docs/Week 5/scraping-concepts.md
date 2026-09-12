# Week 5: Web Scraping

Turning messy HTML into clean, checked JSON — politely.

---

## What is a scraper?

A program that reads a web page **built for humans** and pulls out data **for machines**.

Not "open a page and copy the text." It is a chain of steps, each one provable:

```
classify → fetch → extract → normalize → validate → store → report
```

| Step | The question | The proof |
|------|--------------|-----------|
| Classify | May I automate this site? | A note in the README |
| Fetch | Did the page really arrive? | Saved HTML + status 200 |
| Extract | Which parts do I need? | Raw text fields |
| Normalize | How does `"£51.77"` become a number? | Clean values, absolute URLs |
| Validate | Is this safe to store? | Schema check; bad records set aside |
| Store | Can another program use it? | `books.json` |
| Report | Did the run actually work? | Honest numbers |

**Why this order matters:** every step trusts the one before it. Parse before checking the status and you'll
happily extract zero books from a 404 page — and report success.

---

## Three habits

1. **Check before you collect.** Classify the target before writing any code.
2. **Be a polite guest.** Say who you are, go slowly, never hammer a site.
3. **Trust nothing you scraped.** A web page is *untrusted input* — validate before storing.

---

## Key terms

| Term | Meaning |
|------|---------|
| **Sandbox** | A site built for practice. `books.toscrape.com` exists for this |
| **robots.txt** | A site's note to robots about where they're welcome. Missing ≠ permission |
| **User-agent** | Header naming who is calling. A polite one has a contact link |
| **Timeout** | Max wait before giving up. Never wait forever |
| **Cache** | Saved copy, reused locally. The site gets asked once, not fifty times |
| **Relative URL** | `../book/index.html` — useless without a base |
| **Absolute URL** | `https://site.com/catalogue/book/index.html` — complete |
| **Provenance** | The receipt: *where* (`source_page`) and *when* (`fetched_at`) a fact came from |
| **Schema validator** | Library checking fields + types before storage (Zod / Pydantic) |
| **Idempotency** | Running twice gives the same result. A rerun updates, never duplicates |

---

## Scraper vs server

The big mental shift from Week 4:

| | Express API (W4) | Scraper (W5) |
|---|---|---|
| Lifetime | Runs forever, waits | Runs once, exits |
| Triggered by | Someone calling an endpoint | You typing `npm start` |
| Output | HTTP responses | Files on disk |
| Has a port | Yes | **No** |

A scraper is a script. No Express, no routes, no port.

---

## What was built

**Stack:** Node 24 (built-in `fetch`) · **Cheerio** (HTML parser) · **Zod** (schema validator)

```
scraper/
  src/
    index.js      entry — runs the pipeline, prints the summary
    fetcher.js    polite fetch + cache (all politeness lives here)
    crawler.js    walks the catalogue, collects book URLs
    parse.js      extracts the 8 raw fields per book
  cache/          saved HTML (git-ignored)
  output/         books.json, errors.json, run-report.json
```

**Run it:**
```bash
cd scraper
npm install
npm start
```

---

### Stage 0 — Classify

Read what the site says about itself. Request `robots.txt` once, record the result.

`books.toscrape.com/robots.txt` → **404**. Written down honestly: a missing robots file means there are no
published rules to obey — it is *not* permission. Permission came from the site calling itself a sandbox.

---

### Stage 1 — Fetch once, cache once

Four rules, all inside `fetcher.js`:

```js
const USER_AGENT = 'FlyRankInternshipA9/1.0 (+https://github.com/...)';  // honest name + link
const TIMEOUT_MS = 10_000;                                                // never hang forever
const DELAY_MS = 500;                                                     // gap between real requests
```

**Order matters inside `fetchPage()`:**

1. Check cache first → `CACHE HIT`, return, site untouched
2. Not cached → `waitTurn()`, then `fetch()` with user-agent + timeout
3. **Check status before reading the body** — only `200` is a page
4. Save to `cache/`, return

**Checkpoint:** run twice → `FETCH` then `CACHE HIT`.

> **`if (error.code !== 'ENOENT') throw error`**
> A bare `catch {}` would swallow *every* read failure — permission denied, disk full — and silently re-fetch.
> `ENOENT` ("no such file") is the only error that legitimately means "not cached yet."

---

### Stage 2 — Discover the pages

```js
// relative href → absolute, resolved against the page it came from
const productUrl = new URL(href, pageUrl).href;

// let the site tell us where page 2 is, instead of inventing the URL
const nextHref = $('li.next a').attr('href');
```

- **Never glue URL strings.** `new URL(href, base)` implements the real rules (`../`, absolute paths, etc.)
- **Follow the site's own "next" link.** Hardcoding `page-1/2/3` is a *guess* about structure; reading its
  navigation is a *fact*
- **Dedupe with a `Map`** keyed by URL, so a book seen twice is stored once

**Checkpoint:** `catalogue_pages=3`, `discovered=60`, `unique_urls=60`.

---

### Stage 3 — Extract the raw record

Eight keys, every time:

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-09-11T10:58:11.482Z"
}
```

- Selectors aim at `.product_main`, **not the whole document** — "the first thing that looks like a price"
  betrays you the day the page grows a second price
- Missing description → `null`. Never invent text that wasn't there
- `fetched_at` comes from the **cache file's mtime**, not `Date.now()` — stamping cached bytes "now" writes a
  lie into your data

**Checkpoint:** one complete record printed + `detail_pages=60`.

---

### Stage 4 — Normalize, validate, store *(pending)*

`price_text` → numeric `price_gbp`, Zod schema, failures to `errors.json`, good records to `books.json`.
Rerun must still give **60, not 120**.

### Stage 5 — Survive failures *(pending)*

try/catch per page. Retry once on timeout/5xx — **never** on 404 or 403. Write `run-report.json`.

### Stage 6 — Publish *(pending)*

README a stranger can run in 5 minutes.

---

## Real gotchas hit

| What happened | Why |
|---|---|
| `article.product_pod a` would give **40 links for 20 books** | Each card links to the book twice — thumbnail *and* title. Fix: `h3 a` |
| `.star-rating` `.text()` returns **empty** | The rating is in the *class name*: `<p class="star-rating Three">`. Read the attribute |
| Descriptions came back **doubled**, ending `...more` | Real page content — the site renders preview + full text in one `<p>`. Faithful extraction, not a bug |
| Reported 50449 bytes, file was 50469 | `.length` counts **characters**; the file is **bytes**. 20 books × `£` (2 bytes in UTF-8) = 20 |

---

## Politeness cheat sheet

| Rule | Value | Why |
|------|-------|-----|
| User-agent | `FlyRankInternshipA9/1.0 (+repo-link)` | They can find out who you are |
| Timeout | 10s | A hung request blocks the whole run |
| Delay | 500ms between **real** requests | Cache hits never wait |
| Status check | Before reading the body | A 404 has a body too |
| Cache | Every page saved to `cache/` | Restart 50× → site sees 1 request |

> Politeness lives **inside the fetcher**, not in its callers. If every caller has to remember it, one of them
> eventually won't.

---

## Ethics

- Use an **official API** when one exists
- **Never** bypass logins, paywalls, or blocks
- Collect **only what you need**
- Classify the target **before** writing code — and don't reuse a scraper on another site without re-checking
