// User Routes - User management endpoints
import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../utils/validation';
import {
  updateUserProfileValidation,
  changePasswordValidation,
  getUserSessionsValidation,
} from '../validations/user.validation';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Profile
router.get('/me', userController.getMyProfile);
router.put('/me', updateUserProfileValidation, validate, userController.updateMyProfile);
router.post('/me/photo', userController.uploadProfilePhoto);
router.delete('/me', userController.deleteAccount);

// Password
router.post('/me/password', changePasswordValidation, validate, userController.changePassword);

// Sessions & Summary
router.get('/me/sessions', getUserSessionsValidation, validate, userController.getMySessions);
router.get('/me/summary', userController.getPaymentSummary);

export default router;
