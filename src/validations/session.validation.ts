// Validation schemas for Session endpoints
import { body, param, query } from 'express-validator';

// =====================================
// Session CRUD Validation
// =====================================
export const createSessionValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Session name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Session name must be between 2 and 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be at most 1000 characters'),
    body('date')
        .notEmpty()
        .withMessage('Session date is required')
        .isISO8601()
        .withMessage('Invalid date format. Use ISO 8601 format'),
];

export const updateSessionValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Session name must be between 2 and 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be at most 1000 characters'),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format. Use ISO 8601 format'),
];

export const sessionIdValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
];

export const getSessionsValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('role')
        .optional()
        .isIn(['host', 'player', 'all'])
        .withMessage('Role must be "host", "player", or "all"'),
    query('status')
        .optional()
        .isIn(['DRAFT', 'PROCESSING_FACES', 'READY_TO_SPLIT', 'SPLIT_CONFIRMED', 'CLOSED', 'all'])
        .withMessage('Invalid status value'),
    query('sortBy')
        .optional()
        .isIn(['date', 'created_at', 'name'])
        .withMessage('Sort by must be "date", "created_at", or "name"'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be "asc" or "desc"'),
];

// =====================================
// Player Management Validation
// =====================================
export const addPlayersValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    body('players')
        .isArray({ min: 1 })
        .withMessage('At least one player is required'),
    body('players.*.name')
        .trim()
        .notEmpty()
        .withMessage('Player name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Player name must be between 2 and 255 characters'),
    body('players.*.email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('players.*.phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
];

export const removePlayerValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    param('playerId')
        .isUUID()
        .withMessage('Valid player ID is required'),
];

// =====================================
// Expense Management Validation
// =====================================
export const addExpensesValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('At least one expense item is required'),
    body('items.*.description')
        .trim()
        .notEmpty()
        .withMessage('Expense description is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Description must be at most 255 characters'),
    body('items.*.amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a non-negative number'),
    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
];

export const updateExpenseValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    param('expenseId')
        .isUUID()
        .withMessage('Valid expense ID is required'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Description must be at most 255 characters'),
    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a non-negative number'),
    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
];

export const expenseIdValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    param('expenseId')
        .isUUID()
        .withMessage('Valid expense ID is required'),
];

// =====================================
// Face Detection Validation
// =====================================
export const confirmFaceMappingsValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    body('confirmations')
        .isArray({ min: 1 })
        .withMessage('At least one confirmation is required'),
    body('confirmations.*.detectedFaceId')
        .isUUID()
        .withMessage('Valid detected face ID is required'),
    body('confirmations.*.playerId')
        .isUUID()
        .withMessage('Valid player ID is required'),
];

// =====================================
// Payment Verification Validation
// =====================================
export const verifyPaymentValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    param('obligationId')
        .isUUID()
        .withMessage('Valid obligation ID is required'),
    body('action')
        .isIn(['approve', 'reject'])
        .withMessage('Action must be "approve" or "reject"'),
    body('rejectionReason')
        .if(body('action').equals('reject'))
        .notEmpty()
        .withMessage('Rejection reason is required when rejecting'),
];

export const obligationIdValidation = [
    param('sessionId')
        .isUUID()
        .withMessage('Valid session ID is required'),
    param('obligationId')
        .isUUID()
        .withMessage('Valid obligation ID is required'),
];
