// Types for Player Operations
import {
  ObligationStatus,
  PaymentMethod,
  VerificationStatus,
} from "@prisma/client";

// =====================================
// Request Types
// =====================================

export interface PlayerProfileUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface MarkAsPaidInput {
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

// =====================================
// Response Types
// =====================================

export interface PlayerProfileResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  linkedUserId: string | null;
}

export interface PlayerSessionResponse {
  sessionId: string;
  sessionName: string;
  date: Date | null;
  hostName: string;
  myObligation: {
    id: string;
    amount: number;
    status: ObligationStatus;
  } | null;
}

export interface ObligationSessionInfo {
  id: string;
  name: string;
  date: Date | null;
  hostName: string;
  hostPhone: string | null;
  groupPhotoUrl: string | null;
}

export interface ObligationHostInfo {
  name: string;
  phone: string | null;
  email: string | null;
}

export interface ObligationExpenseInfo {
  description: string;
  subtotal: number;
}

export interface PaymentProofInfo {
  id: string;
  mediaUrl: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  verifiedAt: Date | null;
}

export interface PaymentInfo {
  id: string;
  method: PaymentMethod;
  referenceNumber: string | null;
  paidAt: Date;
  proof: PaymentProofInfo | null;
}

export interface ObligationResponse {
  id: string;
  session: {
    id: string;
    name: string;
    date: Date | null;
    hostName: string;
    hostPhone: string | null;
  };
  amount: number;
  status: ObligationStatus;
  payment: PaymentInfo | null;
}

export interface ObligationDetailResponse {
  id: string;
  session: ObligationSessionInfo;
  host: ObligationHostInfo;
  amount: number;
  status: ObligationStatus;
  payment: PaymentInfo | null;
  expenses: ObligationExpenseInfo[];
  playerCount: number;
  perPersonAmount: number;
}

export interface PlayerObligationsListResponse {
  obligations: ObligationResponse[];
  summary: {
    totalOwed: number;
    pending: number;
    paid: number;
  };
}

export interface MarkAsPaidResponse {
  obligationId: string;
  paymentId: string;
  status: ObligationStatus;
  paidAt: Date;
}

export interface UploadProofResponse {
  proofId: string;
  status: VerificationStatus;
  uploadedAt: Date;
  mediaUrl: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  obligationId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string | null;
  status: ObligationStatus;
  paidAt: Date;
  proof: PaymentProofInfo | null;
}

export interface FaceEnrollResponse {
  embeddingId: string;
  enrolledAt: Date;
}

// =====================================
// Query Types
// =====================================

export interface PlayerObligationsQuery {
  status?: ObligationStatus | "all";
}

export interface PlayerSessionsQuery {
  status?: "pending" | "paid" | "verified" | "all";
}
