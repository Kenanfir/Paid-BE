// Types for User Management

// =====================================
// Request Types
// =====================================

export interface UserProfileUpdateInput {
  name?: string;
  phone?: string;
  photoUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// =====================================
// Response Types
// =====================================

export interface UserStatsResponse {
  sessionsHosted: number;
  sessionsParticipated: number;
  totalCollected: number;
  totalPaid: number;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  stats: UserStatsResponse;
}

export interface UserProfileUpdateResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
}

export interface PhotoUploadResponse {
  photoUrl: string;
}

export interface UserHostedSessionResponse {
  id: string;
  name: string;
  date: Date | null;
  status: string;
  totalAmount: number | null;
  playerCount: number;
  pendingPayments: number;
}

export interface PaymentSummaryResponse {
  asHost: {
    totalSessions: number;
    totalCollected: number;
    pending: number;
    activeSessions: number;
  };
  asPlayer: {
    totalSessions: number;
    totalPaid: number;
    pending: number;
  };
}

// =====================================
// Query Types
// =====================================

export interface UserSessionsQuery {
  status?: string;
  page?: number;
  limit?: number;
}
