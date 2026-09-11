import { z } from 'zod';

/**
 * the shape of a finished record, written down once.
 * every record is checked against this before it is allowed into books.json —
 * a web page is untrusted input, so nothing is stored on trust.
 */
export const bookSchema = z.object({
  title: z.string().min(1),

  // the canonical URL: this is the record's identity
  product_url: z.string().url().startsWith('https://'),

  // raw and clean live side by side
  price_text: z.string().min(1),
  price_gbp: z.number().nonnegative(),

  availability_text: z.string().min(1),
  rating_text: z.string().min(1),

  // the only optional field — some books genuinely have no description
  description: z.string().nullable(),

  // provenance
  source_page: z.string().url(),
  fetched_at: z.string().datetime(),
});

/**
 * flatten zod's issue list into one readable line for errors.json,
 * e.g. "price_gbp: Expected number, received null"
 */
export function describeIssues(error) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
