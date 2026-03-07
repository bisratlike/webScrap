'use strict';

const ApiError = require('../utils/ApiError');
const patternService = require('./patternService');

// ─── Gemini setup ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  suggest_selectors:
    'You are a web scraping expert. Given the page HTML structure, suggest optimal CSS selectors to extract the requested data. Return a JSON array of {name, selector, description} objects.',
  analyze_data:
    'You are a data analyst. Analyse the scraped data and provide insights. Return JSON with {summary, patterns, suggestions}.',
  summarize:
    'Summarise the key information from this web page content. Be concise.',
  extract_schema:
    'Identify and suggest a data schema for the content on this page. Return JSON.',
};

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') {
    throw ApiError.unavailable('Gemini AI is not configured. Set GEMINI_API_KEY in .env');
  }
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  return new GoogleGenerativeAI(key);
}

// ─── Exported service functions ───────────────────────────────────────────────

/**
 * Run AI analysis with an optional traditional-analysis preamble.
 *
 * When `pageContent` is provided, the traditional pattern-recognition
 * pipeline runs first.  Its output is injected into the Gemini prompt as
 * structured context, giving the LLM a head-start and reducing
 * hallucinations.
 *
 * @param {{ prompt?: string, pageContent?: string, mode?: string }} opts
 * @returns {{ result: string, tokensUsed: number, traditionalAnalysis?: object }}
 */
async function analyze({ prompt = '', pageContent = '', mode = 'summarize' }) {
  if (!prompt && !pageContent) {
    throw ApiError.badRequest('prompt or pageContent is required');
  }

  // ── Step 1: traditional pattern recognition ───────────────────────────────
  let traditionalAnalysis = null;
  if (pageContent) {
    traditionalAnalysis = patternService.analyzeHtml(pageContent);
  }

  // ── Step 2: build Gemini prompt with traditional context ──────────────────
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.summarize;

  let fullPrompt = systemPrompt + '\n\n';

  if (traditionalAnalysis) {
    fullPrompt += `Traditional pattern analysis found:\n${JSON.stringify(traditionalAnalysis, null, 2)}\n\n`;
    fullPrompt += 'Use the above analysis as a starting point and improve upon it.\n\n';
  }

  if (prompt) fullPrompt += `User request: ${prompt}\n\n`;
  if (pageContent) fullPrompt += `Page Content:\n${pageContent}`;

  fullPrompt = fullPrompt.trim();

  // ── Step 3: call Gemini ───────────────────────────────────────────────────
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const aiResult = await model.generateContent(fullPrompt);
  const response = aiResult.response;
  const resultText = response.text();
  const tokensUsed = response.usageMetadata
    ? (response.usageMetadata.totalTokenCount || 0)
    : 0;

  return { result: resultText, tokensUsed, traditionalAnalysis };
}

/**
 * Smart extraction: traditional CSS selectors + AI enhancement.
 *
 * @param {{ pageContent: string, extractionGoal: string }} opts
 * @returns {{ selectors: Array, extractionPlan: string, traditionalAnalysis: object }}
 */
async function smartExtract({ pageContent, extractionGoal }) {
  if (!pageContent) throw ApiError.badRequest('pageContent is required');
  if (!extractionGoal) throw ApiError.badRequest('extractionGoal is required');

  // ── Traditional analysis ──────────────────────────────────────────────────
  const traditionalAnalysis = patternService.analyzeHtml(pageContent);

  // ── Gemini prompt, seeded with traditional results ────────────────────────
  const fullPrompt = `You are a web scraping expert.

Traditional pattern recognition already found the following:
${JSON.stringify(traditionalAnalysis, null, 2)}

Extraction goal: ${extractionGoal}

Using the above as a starting point, return a JSON object with:
- selectors: array of {name, selector, type, description}
- extractionPlan: concise step-by-step instructions as a string

Page Content:
${pageContent}`;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const aiResult = await model.generateContent(fullPrompt);
  const text = aiResult.response.text();

  // Parse JSON from Gemini response
  let parsed = {
    selectors: traditionalAnalysis.suggestedSelectors || [],
    extractionPlan: text,
    traditionalAnalysis,
  };

  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const aiParsed = JSON.parse(jsonMatch[1]);
      parsed = { ...aiParsed, traditionalAnalysis };
    }
  } catch {
    // fallback to raw text + traditional selectors
  }

  return parsed;
}

/**
 * Pattern-only analysis (no AI) – returns traditional analysis results.
 * Free endpoint: no subscription required.
 *
 * @param {string} pageContent
 * @returns {{ patterns, suggestedSelectors, schema, summary }}
 */
function patternOnlyAnalysis(pageContent) {
  if (!pageContent) throw ApiError.badRequest('pageContent is required');
  return patternService.analyzeHtml(pageContent);
}

module.exports = { analyze, smartExtract, patternOnlyAnalysis };
