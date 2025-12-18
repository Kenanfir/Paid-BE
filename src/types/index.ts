// Types index file - re-exports all types
import { Request } from 'express';
import { User, Player } from '@prisma/client';

// Re-export all types
export * from './auth.types';
export * from './session.types';
export * from './player.types';
export * from './user.types';

// =====================================
// Common Types
// =====================================

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: ApiErrorDetail[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// =====================================
// Extended Request Types
// =====================================

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export interface PlayerAuthenticatedRequest extends Request {
  player?: Player;
  playerId?: string;
}

// =====================================
// Utility Types
// =====================================

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
