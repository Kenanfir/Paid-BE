// Player Controller - Player operations endpoints
import { Response } from "express";
import { PrismaClient, ObligationStatus, PaymentMethod } from "@prisma/client";
import { Decimal as _Decimal } from "@prisma/client/runtime/library";
import { sendSuccess, sendError } from "../utils/response";
import {
  PlayerAuthenticatedRequest,
  PlayerProfileUpdateInput,
  MarkAsPaidInput,
} from "../types";

const prisma = new PrismaClient();

// =====================================
// Get My Profile
// GET /api/player/me
// =====================================
export const getMyProfile = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId, isActive: true },
    });

    if (!player) {
      sendError(res, "Player not found", [], 404);
      return;
    }

    sendSuccess(res, "Profile retrieved successfully", {
      id: player.id,
      name: player.name,
      email: player.email,
      phone: player.phone,
      photoUrl: player.photoUrl,
      linkedUserId: player.userId,
    });
  } catch (error) {
    console.error("Get player profile error:", error);
    sendError(res, "Failed to retrieve profile", [], 500);
  }
};

// =====================================
// Update My Profile
// PUT /api/player/me
// =====================================
export const updateMyProfile = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { name, email, phone, photoUrl } =
      req.body as PlayerProfileUpdateInput;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });

    sendSuccess(res, "Profile updated successfully", {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      photoUrl: updated.photoUrl,
    });
  } catch (error) {
    console.error("Update player profile error:", error);
    sendError(res, "Failed to update profile", [], 500);
  }
};

// =====================================
// Get My Sessions
// GET /api/player/sessions
// =====================================
export const getMySessions = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { status = "all" } = req.query as { status?: string };

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // Get player's session participations
    const participations = await prisma.sessionParticipant.findMany({
      where: { playerId, isActive: true },
      include: {
        session: {
          include: {
            host: true,
            obligations: {
              where: { payerId: playerId },
            },
          },
        },
      },
    });

    let items = participations.map((p) => {
      const obligation = p.session.obligations[0];
      return {
        sessionId: p.session.id,
        sessionName: p.session.name,
        date: p.session.sessionDate,
        hostName: p.session.host.name,
        myObligation: obligation
          ? {
              id: obligation.id,
              amount: Number(obligation.amount),
              status: obligation.status,
            }
          : null,
      };
    });

    // Filter by status if specified
    if (status !== "all") {
      const statusMap: Record<string, ObligationStatus | null> = {
        pending: ObligationStatus.PENDING,
        paid: ObligationStatus.MARKED_PAID,
        verified: ObligationStatus.VERIFIED,
      };

      items = items.filter((item) => {
        if (!item.myObligation) return false;
        return item.myObligation.status === statusMap[status];
      });
    }

    sendSuccess(res, "Sessions retrieved successfully", { items });
  } catch (error) {
    console.error("Get player sessions error:", error);
    sendError(res, "Failed to retrieve sessions", [], 500);
  }
};

// =====================================
// Get My Obligations
// GET /api/player/obligations
// =====================================
export const getMyObligations = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { status = "all" } = req.query as { status?: string };

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const whereClause: Record<string, unknown> = { payerId: playerId };
    if (status !== "all") {
      whereClause.status = status as ObligationStatus;
    }

    const obligations = await prisma.obligation.findMany({
      where: whereClause,
      include: {
        session: {
          include: { host: true },
        },
        payments: {
          include: { proofs: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const items = obligations.map((o) => ({
      id: o.id,
      session: {
        id: o.session.id,
        name: o.session.name,
        date: o.session.sessionDate,
        hostName: o.session.host.name,
        hostPhone: o.session.host.phone,
      },
      amount: Number(o.amount),
      status: o.status,
      payment: o.payments[0]
        ? {
            id: o.payments[0].id,
            method: o.payments[0].method,
            referenceNumber: o.payments[0].referenceNumber,
            paidAt: o.payments[0].paidAt,
            proof: o.payments[0].proofs[0]
              ? {
                  id: o.payments[0].proofs[0].id,
                  mediaUrl: "placeholder", // TODO: Get actual URL
                  status: o.payments[0].proofs[0].status,
                  rejectionReason: o.payments[0].proofs[0].rejectionReason,
                  verifiedAt: o.payments[0].proofs[0].verifiedAt,
                }
              : null,
          }
        : null,
    }));

    const totalOwed = obligations
      .filter((o) => o.status !== ObligationStatus.VERIFIED)
      .reduce((sum, o) => sum + Number(o.amount), 0);

    const summary = {
      totalOwed,
      pending: obligations.filter((o) => o.status === ObligationStatus.PENDING)
        .length,
      paid: obligations.filter((o) => o.status !== ObligationStatus.PENDING)
        .length,
    };

    sendSuccess(res, "Obligations retrieved successfully", {
      obligations: items,
      summary,
    });
  } catch (error) {
    console.error("Get player obligations error:", error);
    sendError(res, "Failed to retrieve obligations", [], 500);
  }
};

// =====================================
// Get Obligation Details
// GET /api/player/obligations/:obligationId
// =====================================
export const getObligationDetails = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { obligationId } = req.params;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
      include: {
        session: {
          include: {
            host: true,
            expenseItems: true,
            participants: { where: { isActive: true } },
          },
        },
        payments: {
          include: { proofs: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!obligation) {
      sendError(res, "Obligation not found", [], 404);
      return;
    }

    if (obligation.payerId !== playerId) {
      sendError(
        res,
        "Permission denied",
        [
          {
            field: "obligation",
            message: "This obligation belongs to another player",
          },
        ],
        403,
      );
      return;
    }

    const totalAmount = obligation.session.expenseItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );
    const playerCount = obligation.session.participants.length;
    const perPersonAmount = Math.round(totalAmount / playerCount);

    sendSuccess(res, "Obligation details retrieved", {
      id: obligation.id,
      session: {
        id: obligation.session.id,
        name: obligation.session.name,
        date: obligation.session.sessionDate,
        groupPhotoUrl: obligation.session.groupPhotoUrl,
      },
      host: {
        name: obligation.session.host.name,
        phone: obligation.session.host.phone,
        email: obligation.session.host.email,
      },
      amount: Number(obligation.amount),
      status: obligation.status,
      payment: obligation.payments[0]
        ? {
            id: obligation.payments[0].id,
            method: obligation.payments[0].method,
            referenceNumber: obligation.payments[0].referenceNumber,
            paidAt: obligation.payments[0].paidAt,
            proof: obligation.payments[0].proofs[0] || null,
          }
        : null,
      expenses: obligation.session.expenseItems.map((e) => ({
        description: e.description,
        subtotal: Number(e.amount) * e.quantity,
      })),
      playerCount,
      perPersonAmount,
    });
  } catch (error) {
    console.error("Get obligation details error:", error);
    sendError(res, "Failed to retrieve obligation", [], 500);
  }
};

// =====================================
// Mark as Paid
// POST /api/player/obligations/:obligationId/pay
// =====================================
export const markAsPaid = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { obligationId } = req.params;
    const { method, referenceNumber } = req.body as MarkAsPaidInput;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
    });

    if (!obligation) {
      sendError(res, "Obligation not found", [], 404);
      return;
    }

    if (obligation.payerId !== playerId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    if (
      obligation.status !== ObligationStatus.PENDING &&
      obligation.status !== ObligationStatus.REJECTED
    ) {
      sendError(
        res,
        "Already paid",
        [
          {
            field: "status",
            message: "This obligation is already marked as paid",
          },
        ],
        409,
      );
      return;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        obligationId,
        method: method as PaymentMethod,
        amount: obligation.amount,
        referenceNumber,
      },
    });

    // Update obligation status
    await prisma.obligation.update({
      where: { id: obligationId },
      data: { status: ObligationStatus.MARKED_PAID },
    });

    sendSuccess(res, "Payment marked successfully", {
      obligationId,
      paymentId: payment.id,
      status: ObligationStatus.MARKED_PAID,
      paidAt: payment.paidAt,
    });
  } catch (error) {
    console.error("Mark as paid error:", error);
    sendError(res, "Failed to mark payment", [], 500);
  }
};

// =====================================
// Upload Payment Proof (Placeholder)
// POST /api/player/payments/:paymentId/proof
// =====================================
export const uploadPaymentProof = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { paymentId: _paymentId } = req.params;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // TODO: Implement file upload
    sendSuccess(res, "Proof uploaded successfully", {
      proofId: "placeholder",
      status: "PENDING",
      uploadedAt: new Date(),
      mediaUrl: "placeholder-url",
    });
  } catch (error) {
    console.error("Upload proof error:", error);
    sendError(res, "Failed to upload proof", [], 500);
  }
};

// =====================================
// Get Payment Status
// GET /api/player/payments/:paymentId
// =====================================
export const getPaymentStatus = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { paymentId } = req.params;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        obligation: true,
        proofs: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    if (!payment) {
      sendError(res, "Payment not found", [], 404);
      return;
    }

    if (payment.obligation.payerId !== playerId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    sendSuccess(res, "Payment status retrieved", {
      paymentId: payment.id,
      obligationId: payment.obligationId,
      amount: Number(payment.amount),
      method: payment.method,
      referenceNumber: payment.referenceNumber,
      status: payment.obligation.status,
      paidAt: payment.paidAt,
      proof: payment.proofs[0]
        ? {
            id: payment.proofs[0].id,
            mediaUrl: "placeholder",
            status: payment.proofs[0].status,
            rejectionReason: payment.proofs[0].rejectionReason,
            verifiedAt: payment.proofs[0].verifiedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    sendError(res, "Failed to retrieve payment status", [], 500);
  }
};

// =====================================
// Resubmit Proof (Placeholder)
// POST /api/player/payments/:paymentId/proof/resubmit
// =====================================
export const resubmitProof = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // TODO: Implement proof resubmission
    sendSuccess(res, "Proof resubmitted successfully", {
      proofId: "placeholder",
      status: "PENDING",
      uploadedAt: new Date(),
    });
  } catch (error) {
    console.error("Resubmit proof error:", error);
    sendError(res, "Failed to resubmit proof", [], 500);
  }
};

// =====================================
// Enroll Face (Placeholder)
// POST /api/player/face/enroll
// =====================================
export const enrollFace = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // TODO: Implement face enrollment
    sendSuccess(res, "Face enrolled successfully", {
      embeddingId: "placeholder",
      enrolledAt: new Date(),
    });
  } catch (error) {
    console.error("Enroll face error:", error);
    sendError(res, "Failed to enroll face", [], 500);
  }
};

// =====================================
// Delete Face Enrollment
// DELETE /api/player/face/:embeddingId
// =====================================
export const deleteFaceEnrollment = async (
  req: PlayerAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const playerId = req.playerId;
    const { embeddingId } = req.params;

    if (!playerId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const embedding = await prisma.playerFaceEmbedding.findUnique({
      where: { id: embeddingId },
    });

    if (!embedding || embedding.playerId !== playerId) {
      sendError(res, "Embedding not found or permission denied", [], 404);
      return;
    }

    await prisma.playerFaceEmbedding.delete({
      where: { id: embeddingId },
    });

    sendSuccess(res, "Face enrollment deleted successfully", null);
  } catch (error) {
    console.error("Delete face enrollment error:", error);
    sendError(res, "Failed to delete enrollment", [], 500);
  }
};
