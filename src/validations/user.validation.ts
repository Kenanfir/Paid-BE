// Validation schemas for User endpoints
import { body, query } from 'express-validator';

// =====================================
// Profile Validation
// =====================================
export const updateUserProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
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
// Password Validation
// =====================================
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

// =====================================
// Sessions Query Validation
// =====================================
export const getUserSessionsValidation = [
  query('status')
    .optional()
    .isIn(['DRAFT', 'SPLIT_CONFIRMED', 'CLOSED', 'all'])
    .withMessage('Invalid status value'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
