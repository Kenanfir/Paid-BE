// Validation schemas for Authentication endpoints
import { body } from 'express-validator';

// =====================================
// Register User Validation
// =====================================
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
];

// =====================================
// Login User Validation
// =====================================
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// =====================================
// Magic Link Validation
// =====================================
export const generateMagicLinkValidation = [
  body('playerId')
    .isUUID()
    .withMessage('Valid player ID is required'),
  body('purpose')
    .isIn(['payment', 'view'])
    .withMessage('Purpose must be either "payment" or "view"'),
  body('expiresInHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiry must be between 1 and 168 hours (1 week)'),
];

export const verifyMagicLinkValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 32 })
    .withMessage('Invalid token format'),
];
