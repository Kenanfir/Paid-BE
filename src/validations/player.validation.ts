// Validation schemas for Player endpoints
import { body, param, query } from 'express-validator';

// =====================================
// Profile Validation
// =====================================
export const updatePlayerProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Name must be between 2 and 255 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    body('photoUrl')
        .optional()
        .isURL()
        .withMessage('Invalid photo URL format'),
];

// =====================================
// Obligations Validation
// =====================================
export const getPlayerObligationsValidation = [
    query('status')
        .optional()
        .isIn(['PENDING', 'MARKED_PAID', 'VERIFIED', 'REJECTED', 'all'])
        .withMessage('Invalid status value'),
];

export const obligationIdParamValidation = [
    param('obligationId')
        .isUUID()
        .withMessage('Valid obligation ID is required'),
];

// =====================================
// Payment Validation
// =====================================
export const markAsPaidValidation = [
    param('obligationId')
        .isUUID()
        .withMessage('Valid obligation ID is required'),
    body('method')
        .isIn(['CASH', 'TRANSFER', 'EWALLET', 'OTHER'])
        .withMessage('Payment method must be CASH, TRANSFER, EWALLET, or OTHER'),
    body('referenceNumber')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Reference number must be at most 255 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be at most 500 characters'),
];

export const paymentIdParamValidation = [
    param('paymentId')
        .isUUID()
        .withMessage('Valid payment ID is required'),
];

// =====================================
// Sessions Query Validation
// =====================================
export const getPlayerSessionsValidation = [
    query('status')
        .optional()
        .isIn(['pending', 'paid', 'verified', 'all'])
        .withMessage('Status must be pending, paid, verified, or all'),
];

// =====================================
// Face Enrollment Validation
// =====================================
export const faceEmbeddingIdValidation = [
    param('embeddingId')
        .isUUID()
        .withMessage('Valid embedding ID is required'),
];
