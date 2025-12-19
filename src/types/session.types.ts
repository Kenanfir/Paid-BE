// Types for Session Management
import { SessionStatus, ParticipantRole } from "@prisma/client";

// =====================================
// Request Types
// =====================================

export interface SessionCreateInput {
  name: string;
  description?: string;
  date: string; // ISO date string
}

export interface SessionUpdateInput {
  name?: string;
  description?: string;
  date?: string;
}

export interface AddPlayersInput {
  players: PlayerInput[];
}

export interface PlayerInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface ExpenseItemInput {
  description: string;
  amount: number;
  quantity?: number;
}

export interface AddExpensesInput {
  items: ExpenseItemInput[];
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  quantity?: number;
}

export interface FaceConfirmationInput {
  detectedFaceId: string;
  playerId: string;
}

export interface ConfirmFaceMappingsInput {
  confirmations: FaceConfirmationInput[];
}

export interface VerifyPaymentInput {
  action: "approve" | "reject";
  rejectionReason?: string;
}

// =====================================
// Response Types
// =====================================

export interface SessionHostResponse {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface SessionPlayerResponse {
  id: string;
  name: string;
  photoUrl: string | null;
  role: ParticipantRole;
}

export interface ExpenseItemResponse {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export interface SessionSummaryResponse {
  id: string;
  name: string;
  date: Date | null;
  status: SessionStatus;
  totalAmount: number | null;
  playerCount: number;
  myRole?: ParticipantRole;
  host: SessionHostResponse;
}

export interface SessionDetailResponse {
  id: string;
  name: string;
  description: string | null;
  date: Date | null;
  status: SessionStatus;
  groupPhotoUrl: string | null;
  host: SessionHostResponse;
  players: SessionPlayerResponse[];
  expenses: ExpenseItemResponse[];
  totalAmount: number | null;
  perPersonAmount: number | null;
}

export interface AddPlayersResponse {
  addedCount: number;
  players: SessionPlayerResponse[];
}

export interface GroupPhotoUploadResponse {
  mediaAssetId: string;
  status: SessionStatus;
  groupPhotoUrl: string;
}

export interface DetectedFaceSuggestion {
  playerId: string;
  playerName: string;
  confidence: number;
}

export interface DetectedFaceResponse {
  id: string;
  faceIndex: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  suggestions: DetectedFaceSuggestion[];
  confirmedPlayer: SessionPlayerResponse | null;
}

export interface FaceDetectionResultsResponse {
  status: SessionStatus;
  detectedFaces: DetectedFaceResponse[];
}

export interface ConfirmFaceMappingsResponse {
  confirmedCount: number;
}

export interface ExpenseSummaryResponse {
  items: ExpenseItemResponse[];
  totalAmount: number;
  playerCount: number;
  perPersonAmount: number;
}

export interface ObligationSummaryResponse {
  id: string;
  payerId: string;
  payerName: string;
  amount: number;
  status: string;
}

export interface SplitGenerateResponse {
  status: SessionStatus;
  totalAmount: number;
  playerCount: number;
  perPersonAmount: number;
  obligations: ObligationSummaryResponse[];
}

export interface ObligationsListResponse {
  obligations: ObligationSummaryResponse[];
  summary: {
    total: number;
    pending: number;
    verified: number;
  };
}

export interface CloseSessionResponse {
  status: SessionStatus;
  summary: {
    totalCollected: number;
    playerCount: number;
  };
}

// =====================================
// Query Types
// =====================================

export interface SessionListQuery {
  page?: number;
  limit?: number;
  role?: "host" | "player" | "all";
  status?: SessionStatus | "all";
  sortBy?: "date" | "created_at" | "name";
  sortOrder?: "asc" | "desc";
}
