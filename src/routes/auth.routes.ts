// Auth Routes - Authentication endpoints
import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validate } from "../utils/validation";
import {
  registerValidation,
  loginValidation,
  generateMagicLinkValidation,
  verifyMagicLinkValidation,
} from "../validations/auth.validation";

const router = Router();

// Public routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post(
  "/magic-link/verify",
  verifyMagicLinkValidation,
  validate,
  authController.verifyMagicLink,
);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.post(
  "/magic-link",
  authenticateToken,
  generateMagicLinkValidation,
  validate,
  authController.generateMagicLink,
);

export default router;
