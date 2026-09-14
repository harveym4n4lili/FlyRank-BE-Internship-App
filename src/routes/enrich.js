import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        
    } catch (error) {
        res.status(404).send({ error: 'An error occurred while commencing job.' });
    }
}) // 

export default router;