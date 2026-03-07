'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { analyze, smartExtract, patternAnalyze } = require('../controllers/aiController');

const router = Router();

// POST /api/ai/analyze           – requires auth + subscription (or admin)
router.post('/analyze', authenticate, analyze);

// POST /api/ai/smart-extract     – requires auth + subscription (or admin)
router.post('/smart-extract', authenticate, smartExtract);

// POST /api/ai/pattern-analyze   – requires auth only (no subscription gate)
router.post('/pattern-analyze', authenticate, patternAnalyze);

module.exports = router;
