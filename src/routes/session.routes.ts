// Session Routes - Session management endpoints
import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../utils/validation';
import {
    createSessionValidation,
    updateSessionValidation,
    sessionIdValidation,
    getSessionsValidation,
    addPlayersValidation,
    removePlayerValidation,
    addExpensesValidation,
    updateExpenseValidation,
    expenseIdValidation,
    confirmFaceMappingsValidation,
    verifyPaymentValidation,
    obligationIdValidation,
} from '../validations/session.validation';

const router = Router();

// All session routes require authentication
router.use(authenticateToken);

// Session CRUD
router.post('/', createSessionValidation, validate, sessionController.createSession);
router.get('/', getSessionsValidation, validate, sessionController.getMySessions);
router.get('/:sessionId', sessionIdValidation, validate, sessionController.getSessionDetails);
router.put('/:sessionId', updateSessionValidation, validate, sessionController.updateSession);
router.delete('/:sessionId', sessionIdValidation, validate, sessionController.deleteSession);

// Player management
router.post('/:sessionId/players', addPlayersValidation, validate, sessionController.addPlayers);
router.delete('/:sessionId/players/:playerId', removePlayerValidation, validate, sessionController.removePlayer);

// Group photo & face detection
router.post('/:sessionId/photo', sessionIdValidation, validate, sessionController.uploadGroupPhoto);
router.get('/:sessionId/faces', sessionIdValidation, validate, sessionController.getFaceDetectionResults);
router.post('/:sessionId/faces/confirm', confirmFaceMappingsValidation, validate, sessionController.confirmFaceMappings);

// Expense management
router.post('/:sessionId/expenses', addExpensesValidation, validate, sessionController.addExpenses);
router.get('/:sessionId/expenses', sessionIdValidation, validate, sessionController.getExpenseSummary);
router.put('/:sessionId/expenses/:expenseId', updateExpenseValidation, validate, sessionController.updateExpense);
router.delete('/:sessionId/expenses/:expenseId', expenseIdValidation, validate, sessionController.deleteExpense);

// Split & obligations
router.post('/:sessionId/split', sessionIdValidation, validate, sessionController.generateSplit);
router.get('/:sessionId/obligations', sessionIdValidation, validate, sessionController.getObligations);
router.post('/:sessionId/obligations/:obligationId/verify', verifyPaymentValidation, validate, sessionController.verifyPayment);
router.post('/:sessionId/obligations/:obligationId/remind', obligationIdValidation, validate, sessionController.sendReminder);

// Close session
router.post('/:sessionId/close', sessionIdValidation, validate, sessionController.closeSession);

export default router;
