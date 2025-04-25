import express, { Router } from 'express';
import { analyzeOption, getAvailableOptions, getAvailableStrikes, getCurrentStockPrice } from '../controllers/optionController';

const router = Router();

// POST /api/analyze-option
router.post('/analyze-option', analyzeOption);

// GET /api/available-options
router.get('/available-options', getAvailableOptions);

// GET /api/available-strikes
router.get('/available-strikes', getAvailableStrikes);

// GET /api/stock-price
router.get('/stock-price', getCurrentStockPrice);

export default router; 