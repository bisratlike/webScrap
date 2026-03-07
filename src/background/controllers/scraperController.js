/**
 * Scraper controller
 * @module scraperController
 */

import { ExtractionJob, JobStatus } from '../models/ExtractionJob.js';
import { Session, SessionStatus } from '../models/Session.js';
import { sendMessageToTab, getCurrentTab } from '../utils/chromeApiWrapper.js';
import { createResponse } from '../utils/messageFormatter.js';
import { validateScrapeRequest } from '../services/validationService.js';
import { saveSession, getSession, getAllSessions } from '../services/storageService.js';
import { createErrorResponse, handleError } from '../middleware/errorHandler.js';
import { logInfo, logError } from '../../shared/utils/logging.js';
import { MESSAGES } from '../../shared/constants/messages.js';

/** @type {Map<string, ExtractionJob>} */
const activeJobs = new Map();

/**
 * Handles a start scraping request
 * @param {object} req - Incoming message
 * @param {Function} sendResponse
 */
export async function startScraping(req, sendResponse) {
  try {
    const validation = validateScrapeRequest(req);
    if (!validation.valid) {
      sendResponse(createResponse(false, null, validation.errors.join(', ')));
      return;
    }

    const tab = await getCurrentTab();
    const { selectors, sessionId } = req.payload;
    const url = req.payload.url || tab.url;

    // Load or create session
    let sessionData = sessionId ? await getSession(sessionId) : null;
    const session = sessionData ? Session.fromJSON(sessionData) : new Session({ url, name: `Scrape of ${tab.title || url}` });
    session.status = SessionStatus.RUNNING;
    session.url = url;
    session.selectors = selectors;
    session.touch();

    const job = new ExtractionJob({ sessionId: session.id, url, selectors });
    activeJobs.set(job.id, job);
    session.jobIds.push(job.id);
    await saveSession(session.toJSON());

    // Send message to content script
    const result = await sendMessageToTab(tab.id, {
      type: MESSAGES.SCRAPE_START,
      payload: { jobId: job.id, selectors, url },
    });

    logInfo('Scraping started', { jobId: job.id, url });
    sendResponse(createResponse(true, { jobId: job.id, sessionId: session.id }));
  } catch (err) {
    logError('Failed to start scraping', err);
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Handles a stop scraping request
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function stopScraping(req, sendResponse) {
  try {
    const tab = await getCurrentTab();
    const { jobId } = req.payload || {};

    if (jobId && activeJobs.has(jobId)) {
      const job = activeJobs.get(jobId);
      job.status = JobStatus.CANCELLED;
      activeJobs.delete(jobId);
    }

    await sendMessageToTab(tab.id, { type: MESSAGES.SCRAPE_STOP, payload: { jobId } });
    logInfo('Scraping stopped', { jobId });
    sendResponse(createResponse(true, { stopped: true }));
  } catch (err) {
    logError('Failed to stop scraping', err);
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Gets the status of a scraping job
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function getStatus(req, sendResponse) {
  try {
    const { jobId } = req.payload || {};
    if (!jobId) {
      sendResponse(createResponse(false, null, 'jobId is required'));
      return;
    }
    const job = activeJobs.get(jobId);
    if (!job) {
      sendResponse(createResponse(false, null, `Job ${jobId} not found`));
      return;
    }
    sendResponse(createResponse(true, job.toJSON()));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Handles scraping result from content script
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function handleScrapingResult(req, sendResponse) {
  try {
    const { jobId, sessionId, results, error } = req.payload || {};
    const job = activeJobs.get(jobId);

    if (job) {
      if (error) {
        job.markError(error);
      } else {
        job.markComplete(results || []);
      }
    }

    if (sessionId) {
      const sessionData = await getSession(sessionId);
      if (sessionData) {
        const session = Session.fromJSON(sessionData);
        session.status = error ? SessionStatus.ERROR : SessionStatus.COMPLETE;
        if (!error && results) {
          session.extractedData = [...(session.extractedData || []), ...results];
        }
        session.touch();
        await saveSession(session.toJSON());
      }
    }

    logInfo('Scraping result handled', { jobId, count: results?.length });
    sendResponse(createResponse(true, { processed: true }));
  } catch (err) {
    logError('Failed to handle scraping result', err);
    sendResponse(createErrorResponse(err));
  }
}
