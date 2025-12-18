// Auth Middleware - Authentication and authorization
import { Response, NextFunction, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { extractTokenFromHeader, verifyToken } from '../utils/token';
import { sendError } from '../utils/response';
import { AuthenticatedRequest, PlayerAuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

/**
 * Authenticate user token
 * Verifies JWT and attaches user to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      sendError(res, 'Authentication required', [
        { field: 'token', message: 'No token provided' },
      ], 401);
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      sendError(res, 'Authentication failed', [
        { field: 'token', message: 'Invalid or expired token' },
      ], 401);
      return;
    }

    // Check if this is a user token
    if (payload.type === 'user' && payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id, isActive: true },
      });

      if (!user) {
        sendError(res, 'Authentication failed', [
          { field: 'token', message: 'User not found' },
        ], 401);
        return;
      }

      req.user = user;
      req.userId = user.id;
      return next();
    }

    // Check if this is a magic link token (also valid for some user endpoints)
    if (payload.type === 'magic_link' && payload.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: payload.playerId, isActive: true },
        include: { linkedUser: true },
      });

      if (!player) {
        sendError(res, 'Authentication failed', [
          { field: 'token', message: 'Player not found' },
        ], 401);
        return;
      }

      // If player has linked user, use that
      if (player.linkedUser) {
        req.user = player.linkedUser;
        req.userId = player.linkedUser.id;
        return next();
      }
    }

    sendError(res, 'Authentication failed', [
      { field: 'token', message: 'Invalid token type' },
    ], 401);
  } catch (error) {
    console.error('Authentication error:', error);
    sendError(res, 'Authentication error', [
      { field: 'auth', message: 'An error occurred during authentication' },
    ], 500);
  }
};

/**
 * Authenticate player token
 * Supports both user tokens (with linked player) and magic link tokens
 */
export const authenticatePlayerToken = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      sendError(res, 'Authentication required', [
        { field: 'token', message: 'No token provided' },
      ], 401);
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      sendError(res, 'Authentication failed', [
        { field: 'token', message: 'Invalid or expired token' },
      ], 401);
      return;
    }

    // Magic link token - direct player access
    if (payload.type === 'magic_link' && payload.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: payload.playerId, isActive: true },
      });

      if (!player) {
        sendError(res, 'Authentication failed', [
          { field: 'token', message: 'Player not found' },
        ], 401);
        return;
      }

      req.player = player;
      req.playerId = player.id;
      return next();
    }

    // User token - find linked player
    if (payload.type === 'user' && payload.id) {
      const player = await prisma.player.findUnique({
        where: { userId: payload.id, isActive: true },
      });

      if (!player) {
        sendError(res, 'Authentication failed', [
          { field: 'token', message: 'Player record not found for user' },
        ], 401);
        return;
      }

      req.player = player;
      req.playerId = player.id;
      return next();
    }

    sendError(res, 'Authentication failed', [
      { field: 'token', message: 'Invalid token type' },
    ], 401);
  } catch (error) {
    console.error('Player authentication error:', error);
    sendError(res, 'Authentication error', [
      { field: 'auth', message: 'An error occurred during authentication' },
    ], 500);
  }
};

/**
 * Optional authentication
 * Attaches user if token provided, but allows request to proceed without token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next();
    }

    if (payload.type === 'user' && payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id, isActive: true },
      });

      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    return next();
  } catch (error) {
    // Log but don't fail - optional auth
    console.error('Optional auth error:', error);
    return next();
  }
};
