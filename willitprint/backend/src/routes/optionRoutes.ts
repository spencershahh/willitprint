import express from 'express';
import { analyzeOption } from '../controllers/optionController';

const router = express.Router();

// POST /api/analyze-option
router.post('/analyze-option', analyzeOption);

export default router; 