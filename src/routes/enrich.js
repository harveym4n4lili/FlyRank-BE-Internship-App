import express from 'express';
import { enrichBook } from '../llm/enrich.js';
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
    let result;
    try {
        result = await enrichBook(book);
    } catch (error) {
        // the provider call failed (bad key, wrong model, out of quota...).
        // answer in JSON instead of letting Express send an HTML page with a
        // stack trace. Stage 4 splits this into 504 (timeout) and 503 (kill switch).
        return res.status(502).json({
            error: 'The model call failed',
            provider_status: error.status ?? null,
            detail: error.message,
        });
    }

  // STAGE 2 ONLY: a real model answer comes back as unchecked text, returned
  // as-is so you can read it with your own eyes. Stage 3 deletes this branch:
  // the text gets parsed, validated and repaired, and raw model text is never
  // returned to a caller again.
    if ('raw' in result) {
        return res.status(200).json({
            prompt_version: result.promptVersion,
            model: result.model,
            raw: result.raw,
        });
    }

  // 4. Validate our own output before returning it.
  //
  //    This runs even in stub mode, on purpose: it proves the stub actually
  //    satisfies the contract. A stub that quietly does not match the schema
  //    is a lie that costs an hour at Stage 3.
    const output = enrichOutputSchema.safeParse(result);

    if (!output.success) {
        return res.status(500).json({
            error: 'Produced a result that failed our own output schema',
            detail: describeIssues(output.error),
        });
    }

    return res.status(200).json(output.data);
});

export default router;
