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
    const result = await enrichBook(book);

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
