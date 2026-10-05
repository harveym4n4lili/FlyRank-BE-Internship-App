import express from 'express';
import { enrichBook, InvalidModelAnswerError } from '../llm/enrich.js';
import {
  enrichInputSchema,
  enrichOutputSchema,
  describeIssues,
  firstField,
} from '../llm/schema.js';

const router = express.Router();

/**
 * @swagger
 * /enrich:
 *   post:
 *     summary: Classify a book record and flag problems in its description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Enriched record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                 summary:
 *                   type: string
 *                 quality_flags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 confidence:
 *                   type: number
 *                 reason:
 *                   type: string
 *       400:
 *         description: Invalid input - the response names the offending field
 *       422:
 *         description: The model's answer was still invalid after one repair attempt
 *       502:
 *         description: The model provider call failed
 */
router.post('/', async (req, res) => {

    //1. validate input
    const input = enrichInputSchema.safeParse(req.body);

    if (!input.success) {
        return res.status(400).json({
            error: describeIssues(input.error),
            field: firstField(input.error),
        });
    }

  // 2. extract the book data from the validated input
    const book = {
        title: input.data.title,
        // absent and null mean the same thing here: this book has no description
        description: input.data.description ?? null,
    };

  // 3. Do the work. In stub mode this never touches the network.
  //    enrichBook parses, validates and repairs the model's answer itself, so
  //    raw model text never reaches this file, let alone the caller.
    let result;
    try {
        result = await enrichBook(book);
    } catch (error) {
        // the model answered, but even after one repair the answer did not
        // match our schema. it has been logged to logs/quarantine.jsonl.
        // the message is our own wording, never the model's text.
        if (error instanceof InvalidModelAnswerError) {
            return res.status(422).json({
                error: 'The model did not return a valid answer, even after one repair attempt.',
                detail: error.message,
                prompt_version: error.promptVersion,
            });
        }

        // the provider call failed (bad key, wrong model, out of quota...).
        // answer in JSON instead of letting Express send an HTML page with a
        // stack trace. Stage 4 splits this into 504 (timeout) and 503 (kill switch).
        return res.status(502).json({
            error: 'The model call failed',
            provider_status: error.status ?? null,
            detail: error.message,
        });
    }

  // 4. Validate the output one last time before it leaves the building.
  //
  //    enrichBook already checked it, so this should never fail. It stays as a
  //    final guard on the contract: if it ever does fail, that's a bug in our
  //    own code, so the answer is a 500 rather than a 422.
    const output = enrichOutputSchema.safeParse(result.data);

    if (!output.success) {
        return res.status(500).json({
            error: 'Produced a result that failed our own output schema',
            detail: describeIssues(output.error),
        });
    }

    return res.status(200).json(output.data);
});

export default router;
