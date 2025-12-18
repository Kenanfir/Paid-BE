// Types for Authentication
import { User, Player } from '@prisma/client';

// =====================================
// Request Types
// =====================================

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface MagicLinkGenerateInput {
  playerId: string;
  purpose: 'payment' | 'view';
  expiresInHours?: number;
}

export interface MagicLinkVerifyInput {
  token: string;
}

// =====================================
// Response Types
// =====================================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface MagicLinkGenerateResponse {
  token: string;
  expiresAt: Date;
  link: string;
}

export interface MagicLinkVerifyResponse {
  player: {
    id: string;
    name: string;
    email: string | null;
  };
  accessToken: string;
  purpose: string;
}

// =====================================
// JWT Payload Types
// =====================================

export interface JWTPayload {
  id: string;
  email: string;
  type: 'user' | 'player';
  playerId?: string;
}

export interface MagicLinkJWTPayload {
  playerId: string;
  purpose: string;
  type: 'magic_link';
}

// =====================================
// Utility Types
// =====================================

export type SafeUser = Omit<User, 'passwordHash'>;
export type SafePlayer = Pick<Player, 'id' | 'name' | 'email' | 'phone' | 'photoUrl'>;
