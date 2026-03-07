'use strict';

const UsageLog = require('../models/UsageLog');
const Subscription = require('../models/Subscription');
const aiService = require('../services/aiService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Check whether a user has an active subscription.
 */
async function hasActiveSubscription(userId) {
  const sub = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  });
  return !!sub;
}

// POST /api/ai/analyze
const analyze = asyncHandler(async (req, res) => {
  const { user } = req;

  // RBAC: admins bypass subscription gate
  if (user.role !== 'admin' && !(await hasActiveSubscription(user._id))) {
    throw ApiError.forbidden('Active subscription required to use AI features');
  }

  const { prompt = '', pageContent = '', mode = 'summarize' } = req.body;

  if (!prompt && !pageContent) {
    throw ApiError.badRequest('prompt or pageContent is required');
  }

  const { result, tokensUsed, traditionalAnalysis } = await aiService.analyze({
    prompt,
    pageContent,
    mode,
  });

  await UsageLog.create({
    userId: user._id,
    action: 'ai_query',
    details: { mode, tokensUsed },
  });

  res.json({ result, tokensUsed, traditionalAnalysis });
});

// POST /api/ai/smart-extract
const smartExtract = asyncHandler(async (req, res) => {
  const { user } = req;

  if (user.role !== 'admin' && !(await hasActiveSubscription(user._id))) {
    throw ApiError.forbidden('Active subscription required to use AI features');
  }

  const { pageContent, extractionGoal } = req.body;

  const parsed = await aiService.smartExtract({ pageContent, extractionGoal });

  await UsageLog.create({
    userId: user._id,
    action: 'ai_query',
    details: { mode: 'smart-extract', extractionGoal },
  });

  res.json(parsed);
});

// POST /api/ai/pattern-analyze  (FREE – traditional analysis only, no subscription needed)
const patternAnalyze = asyncHandler(async (req, res) => {
  const { pageContent } = req.body;
  const result = aiService.patternOnlyAnalysis(pageContent);
  res.json(result);
});

module.exports = { analyze, smartExtract, patternAnalyze };
