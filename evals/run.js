// Runs every case in evals/cases.json through the real POST /enrich endpoint
// and reports how many came back right.
//
//   1. start the server with LLM_STUB=0 and LLM_ENABLED=true
//   2. in a second terminal:   node evals/run.js
//
// Uses one model call per case — more if a case needs a repair or a retry. On
// OpenRouter's free tier that is about 8 of the day's 50 calls per run.

import { readFile, writeFile } from 'node:fs/promises';
import { PROMPT_VERSION } from '../src/llm/prompt.js';

const ENDPOINT = process.env.EVAL_URL ?? 'http://localhost:3000/enrich';

// OpenRouter's free tier allows 20 requests a minute. 3.5 s apart keeps a run
// well under that, even when a case needs a repair call.
const PAUSE_MS = 3_500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'));

/** compare one response with what the case expected. returns a list of problems. */
function problemsWith(expected, status, body) {
  if (status !== 200) {
    return [`HTTP ${status}: ${body?.error ?? 'no error message'}`];
  }

  const problems = [];
  if (body.category !== expected.category) {
    problems.push(`category was "${body.category}", expected "${expected.category}"`);
  }
  if (expected.max_confidence !== undefined && body.confidence > expected.max_confidence) {
    problems.push(`confidence was ${body.confidence}, expected at most ${expected.max_confidence}`);
  }
  for (const flag of expected.flags_include ?? []) {
    if (!body.quality_flags?.includes(flag)) {
      problems.push(`quality_flags did not include "${flag}"`);
    }
  }
  return problems;
}

console.log(`\nRunning ${cases.length} cases against ${ENDPOINT} (prompt ${PROMPT_VERSION})\n`);

const results = [];

for (const testCase of cases) {
  const startedAt = Date.now();
  let status;
  let body;
  let source;
  let model;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase.input),
    });
    status = response.status;
    source = response.headers.get('x-enrichment-source');
    model = response.headers.get('x-enrichment-model');
    body = await response.json().catch(() => null);
  } catch (error) {
    console.error(`Could not reach ${ENDPOINT}: ${error.message}`);
    console.error('Is the server running?  node --env-file=.env index.js');
    process.exit(1);
  }

  // an eval against the stub or the fallback measures nothing — stop early
  // instead of reporting a meaningless score
  if (status === 200 && source !== 'model') {
    console.error(`Case ${testCase.id} was answered by "${source}", not a model.`);
    console.error('Set LLM_STUB=0 and LLM_ENABLED=true in .env, restart the server, then run again.');
    process.exit(1);
  }

  const problems = problemsWith(testCase.expected, status, body);
  const categoryOk = status === 200 && body.category === testCase.expected.category;

  results.push({
    id: testCase.id,
    kind: testCase.kind,
    title: testCase.input.title,
    expected: testCase.expected,
    status,
    got: body,
    model,
    category_ok: categoryOk,
    all_checks_ok: problems.length === 0,
    problems,
    duration_ms: Date.now() - startedAt,
  });

  const mark = problems.length === 0 ? 'PASS' : 'FAIL';
  console.log(
    `${mark}  ${String(testCase.id).padStart(2)}. [${testCase.kind.padEnd(9)}] ` +
      `${testCase.input.title.slice(0, 38).padEnd(38)} ` +
      `expected ${testCase.expected.category.padEnd(13)} got ${String(body?.category ?? '-').padEnd(13)} ` +
      `conf ${body?.confidence ?? '-'}  (${model ?? 'no model'})`,
  );

  if (testCase !== cases.at(-1)) {
    await sleep(PAUSE_MS);
  }
}

// --- the score -------------------------------------------------------------

const total = results.length;
const categoryScore = results.filter((r) => r.category_ok).length;
const fullScore = results.filter((r) => r.all_checks_ok).length;
const percent = (n) => Math.round((n / total) * 100);
const date = new Date().toISOString().slice(0, 10);
const models = [...new Set(results.map((r) => r.model).filter(Boolean))];

console.log(`\nCategory (key field):  ${categoryScore}/${total}  (${percent(categoryScore)}%)`);
console.log(`All checks:            ${fullScore}/${total}  (${percent(fullScore)}%)`);

const failures = results.filter((r) => !r.all_checks_ok);
if (failures.length > 0) {
  console.log('\nFailed cases:');
  for (const r of failures) {
    console.log(`  ${r.id}. ${r.title} — ${r.problems.join('; ')}`);
  }
}

await writeFile(
  new URL('./last-run.json', import.meta.url),
  `${JSON.stringify({ date, prompt_version: PROMPT_VERSION, endpoint: ENDPOINT, category_score: `${categoryScore}/${total}`, all_checks_score: `${fullScore}/${total}`, models, results }, null, 2)}\n`,
  'utf8',
);

