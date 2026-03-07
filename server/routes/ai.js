'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPTS = {
  suggest_selectors:
    'You are a web scraping expert. Given the page HTML structure, suggest optimal CSS selectors to extract the requested data. Return a JSON array of {name, selector, description} objects.',
  analyze_data:
    'You are a data analyst. Analyze this scraped data and provide insights. Return JSON with {summary, patterns, suggestions}.',
  summarize:
    'Summarize the key information from this web page content.',
  extract_schema:
    'Identify and suggest a data schema for the content on this page.',
};

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') {
    throw Object.assign(new Error('Gemini AI is not configured. Set GEMINI_API_KEY in .env'), { status: 503 });
  }
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  return new GoogleGenerativeAI(key);
}

function hasActiveSubscription(userId) {
  const sub = getDb()
    .prepare(`
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(userId);
  return !!sub;
}

// POST /api/ai/analyze
router.post('/analyze', authenticateToken, async (req, res, next) => {
  try {
    const { user } = req;

    if (user.role !== 'admin' && !hasActiveSubscription(user.id)) {
      return res.status(403).json({ error: 'Active subscription required to use AI features' });
    }

    const { prompt, pageContent, mode = 'summarize' } = req.body;

    if (!prompt && !pageContent) {
      return res.status(400).json({ error: 'prompt or pageContent is required' });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.summarize;
    const fullPrompt = `${systemPrompt}\n\n${prompt || ''}\n\nPage Content:\n${pageContent || ''}`.trim();

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    const tokensUsed = response.usageMetadata
      ? (response.usageMetadata.totalTokenCount || 0)
      : 0;

    getDb().prepare(
      'INSERT INTO usage_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ai_query', JSON.stringify({ mode, tokensUsed }));

    res.json({ result: text, tokensUsed });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/smart-extract
router.post('/smart-extract', authenticateToken, async (req, res, next) => {
  try {
    const { user } = req;

    if (user.role !== 'admin' && !hasActiveSubscription(user.id)) {
      return res.status(403).json({ error: 'Active subscription required to use AI features' });
    }

    const { pageContent, extractionGoal } = req.body;

    if (!pageContent || !extractionGoal) {
      return res.status(400).json({ error: 'pageContent and extractionGoal are required' });
    }

    const fullPrompt = `You are a web scraping expert.
Given the following page content and extraction goal, return a JSON object with:
- selectors: array of {name, selector, type, description}
- extractionPlan: step-by-step instructions as a string

Extraction goal: ${extractionGoal}

Page Content:
${pageContent}`;

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    getDb().prepare(
      'INSERT INTO usage_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ai_query', JSON.stringify({ mode: 'smart-extract', extractionGoal }));

    // Attempt to parse JSON from the response
    let parsed = { selectors: [], extractionPlan: text };
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      }
    } catch (_) {
      // fallback to raw text
    }

    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
