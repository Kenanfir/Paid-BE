import jwt from "jsonwebtoken";
import { env } from "../config/environment";

// Token payload types
export interface TokenPayload {
  id?: string;
  email?: string;
  type: "user" | "player" | "magic_link";
  playerId?: string;
  purpose?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token
 * @param payload The payload to encode in the token
 * @returns The generated JWT token
 */
export const generateToken = (
  payload: Omit<TokenPayload, "iat" | "exp">,
): string => {
  return jwt.sign(payload as object, env.JWT_SECRET, {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  });
};

/**
 * Generate a short-lived token for magic links
 * @param payload The payload to encode in the token
 * @param expiresInHours Expiration time in hours (default: 24)
 * @returns The generated JWT token
 */
export const generateMagicLinkToken = (
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresInHours = 24,
): string => {
  return jwt.sign(payload as object, env.JWT_SECRET, {
    expiresIn: 60 * 60 * expiresInHours,
  });
};

/**
 * Verify and decode a JWT token
 * @param token The JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};

/**
 * Extract a token from the Authorization header
 * @param authHeader The Authorization header value
 * @returns The token if present and valid, null otherwise
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};
