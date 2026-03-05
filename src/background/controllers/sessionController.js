/**
 * Session controller
 * @module sessionController
 */

import { Session, SessionStatus } from '../models/Session.js';
import { saveSession, getSession, getAllSessions, deleteSession } from '../services/storageService.js';
import { createResponse } from '../utils/messageFormatter.js';
import { createErrorResponse } from '../middleware/errorHandler.js';
import { validateSession } from '../services/validationService.js';
import { logInfo, logError } from '../../shared/utils/logging.js';

/**
 * Creates a new session
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function createSessionHandler(req, sendResponse) {
  try {
    const { name, url, settings } = req.payload || {};
    const session = new Session({ name, url, settings });
    const validation = session.validate();
    if (!validation.valid) {
      sendResponse(createResponse(false, null, validation.errors.join(', ')));
      return;
    }
    await saveSession(session.toJSON());
    logInfo('Session created', session.id);
    sendResponse(createResponse(true, session.toJSON()));
  } catch (err) {
    logError('Failed to create session', err);
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Loads a session by ID
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function loadSession(req, sendResponse) {
  try {
    const { sessionId } = req.payload || {};
    if (!sessionId) {
      sendResponse(createResponse(false, null, 'sessionId is required'));
      return;
    }
    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      sendResponse(createResponse(false, null, `Session ${sessionId} not found`));
      return;
    }
    sendResponse(createResponse(true, sessionData));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Updates an existing session
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function updateSessionHandler(req, sendResponse) {
  try {
    const { sessionId, updates } = req.payload || {};
    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      sendResponse(createResponse(false, null, `Session ${sessionId} not found`));
      return;
    }
    const session = Session.fromJSON({ ...sessionData, ...updates });
    session.touch();
    await saveSession(session.toJSON());
    sendResponse(createResponse(true, session.toJSON()));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Deletes a session
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function deleteSessionHandler(req, sendResponse) {
  try {
    const { sessionId } = req.payload || {};
    if (!sessionId) {
      sendResponse(createResponse(false, null, 'sessionId is required'));
      return;
    }
    await deleteSession(sessionId);
    logInfo('Session deleted', sessionId);
    sendResponse(createResponse(true, { deleted: true }));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Lists all sessions
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function listSessions(req, sendResponse) {
  try {
    const sessions = await getAllSessions();
    const list = Object.values(sessions).sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    sendResponse(createResponse(true, list));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}
