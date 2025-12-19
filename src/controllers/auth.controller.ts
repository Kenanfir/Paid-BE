// Auth Controller - Authentication endpoints
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/token";
import {
  RegisterInput,
  LoginInput,
  MagicLinkGenerateInput,
  MagicLinkVerifyInput,
  AuthenticatedRequest,
} from "../types";

const prisma = new PrismaClient();

// =====================================
// Register User
// POST /api/auth/register
// =====================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body as RegisterInput;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(
        res,
        "Registration failed",
        [{ field: "email", message: "Email already in use" }],
        400,
      );
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
      },
    });

    // Also create a player record linked to this user
    await prisma.player.create({
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      type: "user",
    });

    sendSuccess(
      res,
      "User registered successfully",
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          photoUrl: user.photoUrl,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    sendError(
      res,
      "Registration failed",
      [{ field: "server", message: "An error occurred during registration" }],
      500,
    );
  }
};

// =====================================
// Login User
// POST /api/auth/login
// =====================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email, isActive: true },
    });

    if (!user || !user.passwordHash) {
      sendError(
        res,
        "Login failed",
        [{ field: "credentials", message: "Invalid email or password" }],
        401,
      );
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      sendError(
        res,
        "Login failed",
        [{ field: "credentials", message: "Invalid email or password" }],
        401,
      );
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      type: "user",
    });

    sendSuccess(res, "Login successful", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        photoUrl: user.photoUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendError(
      res,
      "Login failed",
      [{ field: "server", message: "An error occurred during login" }],
      500,
    );
  }
};

// =====================================
// Get Profile
// GET /api/auth/profile
// =====================================
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendError(
        res,
        "Authentication required",
        [{ field: "token", message: "No token provided" }],
        401,
      );
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      sendError(
        res,
        "User not found",
        [{ field: "user", message: "User does not exist" }],
        404,
      );
      return;
    }

    sendSuccess(res, "Profile retrieved successfully", {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    sendError(
      res,
      "Failed to retrieve profile",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Generate Magic Link (Host)
// POST /api/auth/magic-link
// =====================================
export const generateMagicLink = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      playerId,
      purpose,
      expiresInHours = 24,
    } = req.body as MagicLinkGenerateInput;

    if (!userId) {
      sendError(
        res,
        "Authentication required",
        [{ field: "token", message: "No token provided" }],
        401,
      );
      return;
    }

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId, isActive: true },
    });

    if (!player) {
      sendError(
        res,
        "Player not found",
        [{ field: "playerId", message: "Player does not exist" }],
        404,
      );
      return;
    }

    // Generate random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Calculate expiration
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Store hashed token
    await prisma.magicLinkToken.create({
      data: {
        playerId,
        tokenHash,
        expiresAt,
        purpose,
      },
    });

    // Generate link (base URL would come from env)
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const link = `${baseUrl}/pay?token=${rawToken}`;

    sendSuccess(res, "Magic link generated successfully", {
      token: rawToken,
      expiresAt,
      link,
    });
  } catch (error) {
    console.error("Generate magic link error:", error);
    sendError(
      res,
      "Failed to generate magic link",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Verify Magic Link
// POST /api/auth/magic-link/verify
// =====================================
export const verifyMagicLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.body as MagicLinkVerifyInput;

    // Hash the incoming token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token
    const magicToken = await prisma.magicLinkToken.findUnique({
      where: { tokenHash },
      include: { player: true },
    });

    if (!magicToken) {
      sendError(
        res,
        "Token verification failed",
        [
          {
            field: "token",
            message: "Token is invalid, expired, or already used",
          },
        ],
        401,
      );
      return;
    }

    // Check expiration
    if (magicToken.expiresAt < new Date()) {
      sendError(
        res,
        "Token verification failed",
        [
          {
            field: "token",
            message: "Token is invalid, expired, or already used",
          },
        ],
        401,
      );
      return;
    }

    // Check if already used
    if (magicToken.usedAt) {
      sendError(
        res,
        "Token verification failed",
        [
          {
            field: "token",
            message: "Token is invalid, expired, or already used",
          },
        ],
        401,
      );
      return;
    }

    // Mark as used
    await prisma.magicLinkToken.update({
      where: { id: magicToken.id },
      data: { usedAt: new Date() },
    });

    // Generate limited-scope JWT for player
    const accessToken = generateToken({
      playerId: magicToken.playerId,
      purpose: magicToken.purpose,
      type: "magic_link",
    });

    sendSuccess(res, "Token verified successfully", {
      player: {
        id: magicToken.player.id,
        name: magicToken.player.name,
        email: magicToken.player.email,
      },
      accessToken,
      purpose: magicToken.purpose,
    });
  } catch (error) {
    console.error("Verify magic link error:", error);
    sendError(
      res,
      "Token verification failed",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};
