# Week 6: Putting an LLM Behind Your API

One endpoint. Messy thing in, clean validated JSON out. Not a chatbot.

---

## The one idea

**An LLM is a slow, clever, sometimes-wrong external API.**

That's the whole mental model. Calling a model is an HTTP request to someone else's server — one that
takes seconds, gives different words each time, costs money, and will confidently hand you garbage.

---

## You already did this in Week 5

| Scraper (W5) | LLM endpoint (W7) |
|---|---|
| `fetch()` a page | Call the model |
| Page HTML is untrusted | Model's answer is untrusted |
| Zod schema before storing | Zod schema before returning |
| Failures → `errors.json` | Failures → `quarantine.jsonl` |
| Retry 5xx, never 404 | Retry 429/5xx, never 401 |
| `cache/` so you don't hammer the site | `LLM_STUB=1` so you don't burn quota |
| 10s timeout | 30s timeout |

Six of seven rows are things you already wrote. **The new part is ~30 lines.**

---

## The whole endpoint, in six lines

```
validate the input       -> reject garbage before you spend a call
build the prompt         -> from a file, with a version number
call the model           -> timeout, retries on the right errors only
parse + validate output  -> against your schema
repair once if it failed -> hand the model its own error message
return clean JSON        -> or a clear 422 — never raw model text
```

Each stage builds one line.

---

## Key terms

| Term | Meaning |
|---|---|
| **closed list** | Fixed set of allowed values, decided in advance. Anything else = validation failure |
| **enum** | How a closed list is written in Zod |
| **stub mode** | Return a fake answer instead of calling the model, so dev costs nothing |
| **kill switch** | Env var that turns the feature off without a deploy |
| **repair retry** | One extra call sending the model its own broken answer + the error |
| **quarantine** | A log for answers that failed validation, kept with the reason |
| **temperature** | How varied answers are. Near `0` for classification |
| **token** | What models bill in. ~¾ of a word. Input *and* output counted |
| **prompt injection** | Text in the input trying to override your instructions |
| **eval** | A few inputs with known-correct answers, run automatically |
| **422** | "I understood you, but I couldn't produce a valid result" |
| **504** | "Something I depend on took too long" |

---

## The habit being taught

> **Decide what "correct" looks like before you call the model.**

Beginners call the model, see a nice answer, build around it — then can't tell when it breaks.
Write the output shape down first (`JOB-CARD.md`), make the model fill it in, then check it.

**Your job must pass three rules:**

| Rule | Test |
|---|---|
| Closed output | Can you draw the JSON on paper before writing code? |
| One decision | One request in, one answer out. No memory → not a chatbot |
| A human could grade it | Can you look at an input and say if the output is right? |

If you can't grade it, you can't test it, and you'll never know when it breaks.

---

## Where a model is the WRONG tool

- ❌ **Arithmetic** — it approximates. Code can add.
- ❌ **Exact lookups** — if it's in your database, query your database.
- ❌ **Anything code can compute** — dates, currency, sorting, string matching.
- ❌ **Anything where quietly wrong 5% of the time is unacceptable** — payments, permissions, deletions.

Good LLM job = **fuzzy input** + **small set of acceptable answers** + **something downstream that catches a bad one**.

---

## Three env vars are the whole provider

```
LLM_BASE_URL    https://openrouter.ai/api/v1   |  http://localhost:11434/v1/
LLM_API_KEY     sk-or-v1-...                   |  the literal string "ollama"
LLM_MODEL       openrouter/free                |  gemma3:1b
```

Same code, same SDK. **Never name a variable after a company** — `OPENAI_KEY` bakes a provider
assumption into your config.

You install the package called `openai` even when not using OpenAI. It's the *client library* whose
request shape everyone copied.

---

## OpenRouter traps

| Trap | Reality |
|---|---|
| Free models return **404** | Not a broken URL. Flip both switches at `openrouter.ai/settings/privacy` |
| Those switches | Your prompts may be published/trained on. **Never send real personal data** |
| **50 calls/day** | And **failed calls count**. A bad retry loop eats the day in 90 seconds |

---

## What was built

```
src/
  routes/enrich.js    HTTP layer — reads req, picks status codes
  llm/
    schema.js         input + output schemas, closed lists
    enrich.js         the work — stub now, model later
    hello.js          Stage 0 throwaway proof-of-life
prompts/              (Stage 2)
evals/cases.json      (Stage 5)
JOB-CARD.md           the spec
.env.example          every variable, NO values
```

---

## Stage 0 — prove a model answers you

1. Write `JOB-CARD.md` first
2. Provider signup, key into `.env` (git-ignored **before** you commit)
3. `.env.example` with the same names, **no values**
4. `hello.js` — ask the model to reply `ready`

```js
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const res = await client.chat.completions.create({
  model: process.env.LLM_MODEL,
  messages: [{ role: 'user', content: 'Reply with exactly the word: ready' }],
});
console.log(res.choices[0].message.content);
```

**Run:** `node --env-file=.env src/llm/hello.js`

---

## Stage 1 — build the endpoint before the AI

### Two layers, not one

| File | Knows about | Never mentions |
|---|---|---|
| `routes/enrich.js` | req, res, status codes | models |
| `llm/enrich.js` | models | HTTP |

**Why it matters:** Stage 5's eval script imports `enrichBook()` and calls it directly. If that logic
lived in the route handler, the script would have to boot a server to test itself.

### Two schemas, not one

| Schema | Guards | Zod |
|---|---|---|
| **Input** | Your quota | `z.object` — **strips** unknown keys |
| **Output** | Your contract | `z.strictObject` — **rejects** unknown keys |

Liberal in what you accept, strict in what you emit. Lenient input means you can POST a whole scraped
record and the extra fields are ignored. Strict output enforces "never add fields" in code, not hope.

```js
export const enrichInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(6000).nullable().optional(),
});

export const enrichOutputSchema = z.strictObject({
  category: z.enum(CATEGORIES),          // closed list
  summary: z.string().min(1).max(200),
  quality_flags: z.array(z.enum(QUALITY_FLAGS)),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(300),
});
```

Export the closed lists as **arrays** — three places need the same list (schema, prompt, eval script)
and they must never drift.

### Request flow

```
POST /enrich
  ├─ input.safeParse(req.body)
  │     └─ fails? → 400 { error, field }     ← no model call, no cost
  ├─ LLM_STUB=1 ? → hard-coded answer
  └─ output.safeParse(result) → 200
```

**Validate input first.** Every rejected request is a model call you didn't pay for.

**Validate your own output too — even in stub mode.** It proves the stub satisfies your contract. A
stub that doesn't match is a lie that costs an hour at Stage 3.

### Stub mode is not a toy

You'll restart the server 40 times this week. With `LLM_STUB=1` all 40 are free and instant.

```js
if (process.env.LLM_STUB === '1') {
  return { category: 'other', summary: `Stubbed for "${title}"`, quality_flags: [],
           confidence: 0.1, reason: 'Stub mode on.' };
}
```

---

## Stages 2–5 (pending)

| Stage | What |
|---|---|
| **2** | Prompt as a versioned file `prompts/enrich-v1.md`. Five parts: role · output shape · rules · **when unsure** · 2–3 examples. User data as a separate `user` message. `temperature: 0` |
| **3** | Parse (strip code fences) → validate → **repair once** → else `422` + quarantine log. Never return raw model text |
| **4** | `timeout: 30000` (SDK default is **10 minutes**). Retry 429/5xx with backoff+jitter, never 401/403. Log tokens + duration. `LLM_ENABLED=false` kill switch |
| **5** | `evals/cases.json` with 8 labelled cases. Run them, record the real score in the README |

---

## Gotchas already hit

| What happened | Lesson |
|---|---|
| Real API key pasted into **`.env.example`** and committed | `.env` is ignored, `.env.example` is **committed**. They look identical. Names in one, values in the other |
| Job card said `title` ≤100 chars — real max was **175** | Pick limits by measuring your data, not guessing round numbers |
| Job card said `description` ≤1000 — real max **4374** | Would have rejected over half the dataset |
| Category list was 7 fiction genres, no `other` | **7 of 14 real books had nowhere to go.** Model is forced to answer wrong and sound confident |
| `Young Adult` sat alongside `Fantasy` | Audience vs genre — overlapping options give different answers for the same book = eval noise |
| Two Zod versions in one repo (v3 in `scraper/`, v4 at root) | `z.string().url()` in v3 became `z.url()` in v4 |

---

## Status codes cheat sheet

| Code | When |
|---|---|
| `200` | Valid answer, schema-checked |
| `400` | Bad input — **name the field**, before any model call |
| `422` | Model's answer couldn't be repaired into valid JSON |
| `503` | Kill switch on (`LLM_ENABLED=false`) |
| `504` | Model call timed out |

---

## Golden rules

1. ✅ Write the output shape **before** calling the model
2. ✅ Validate input first — rejected requests cost nothing
3. ✅ Model output is **untrusted input**. Schema, then validate, then quarantine
4. ✅ **Never return raw model text** — your schema is your contract
5. ✅ Prompt lives in a **file with a version number**. Prompts are code
6. ✅ Untrusted content goes in the **user message**, never the system prompt
7. ✅ Set an explicit timeout. The SDK default is ten minutes
8. ✅ Never retry `401` — a bad key stays bad, and the retry burns quota
