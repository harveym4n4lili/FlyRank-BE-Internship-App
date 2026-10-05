import { z } from 'zod';

export const CATEGORIES = [
  'fiction',
  'nonfiction',
  'poetry',
  'childrens',
  'graphic_novel',
  'other',
];

export const QUALITY_FLAGS = [
  'duplicated_description',
  'missing_description',
  'truncated',
  'promotional_language',
];

// schema for the input to the enrichment job, so we can validate it before calling a model
export const enrichInputSchema = z.object({
  title: z
    .string({ error: 'title is required and must be a string' })
    .min(1, 'title must not be empty')
    .max(300, 'title must be 300 characters or fewer'),

  // some books genuinely have no description — null is a valid answer, not an error
  description: z
    .string()
    .max(6000, 'description must be 6000 characters or fewer')
    .nullable()
    .optional(),
});

// schema for the output of the enrichment job, so we can validate it before returning it to the client
export const enrichOutputSchema = z.strictObject({
  category: z.enum(CATEGORIES),
  summary: z.string().min(1).max(200),
  quality_flags: z.array(z.enum(QUALITY_FLAGS)),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(300),
});

/** the field that failed, so a 400 can name it: "title", "description" */
export function firstField(error) {
  return error.issues[0]?.path.join('.') || '(body)';
}

/** every problem on one readable line, for logs and for the repair retry */
export function describeIssues(error) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
