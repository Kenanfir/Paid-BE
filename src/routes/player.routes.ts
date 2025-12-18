// Player Routes - Player operations endpoints
import { Router } from 'express';
import * as playerController from '../controllers/player.controller';
import { authenticatePlayerToken } from '../middlewares/auth.middleware';
import { validate } from '../utils/validation';
import {
    updatePlayerProfileValidation,
    getPlayerObligationsValidation,
    obligationIdParamValidation,
    markAsPaidValidation,
    paymentIdParamValidation,
    getPlayerSessionsValidation,
    faceEmbeddingIdValidation,
} from '../validations/player.validation';

const router = Router();

// All player routes require player authentication
router.use(authenticatePlayerToken);

// Profile
router.get('/me', playerController.getMyProfile);
router.put('/me', updatePlayerProfileValidation, validate, playerController.updateMyProfile);

// Sessions
router.get('/sessions', getPlayerSessionsValidation, validate, playerController.getMySessions);

// Obligations
router.get('/obligations', getPlayerObligationsValidation, validate, playerController.getMyObligations);
router.get('/obligations/:obligationId', obligationIdParamValidation, validate, playerController.getObligationDetails);
router.post('/obligations/:obligationId/pay', markAsPaidValidation, validate, playerController.markAsPaid);

// Payments
router.get('/payments/:paymentId', paymentIdParamValidation, validate, playerController.getPaymentStatus);
router.post('/payments/:paymentId/proof', paymentIdParamValidation, validate, playerController.uploadPaymentProof);
router.post('/payments/:paymentId/proof/resubmit', paymentIdParamValidation, validate, playerController.resubmitProof);

// Face enrollment
router.post('/face/enroll', playerController.enrollFace);
router.delete('/face/:embeddingId', faceEmbeddingIdValidation, validate, playerController.deleteFaceEnrollment);

export default router;
