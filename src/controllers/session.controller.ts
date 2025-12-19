// Session Controller - Session management endpoints
import { Response } from "express";
import { PrismaClient, SessionStatus, ParticipantRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { sendSuccess, sendError } from "../utils/response";
import {
  AuthenticatedRequest,
  SessionCreateInput,
  SessionUpdateInput,
  AddPlayersInput,
  AddExpensesInput,
  UpdateExpenseInput,
  ConfirmFaceMappingsInput,
  VerifyPaymentInput,
} from "../types";

const prisma = new PrismaClient();

// =====================================
// Create Session
// POST /api/sessions
// =====================================
export const createSession = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, description, date } = req.body as SessionCreateInput;

    if (!userId) {
      sendError(
        res,
        "Authentication required",
        [{ field: "token", message: "No token provided" }],
        401,
      );
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { linkedPlayer: true },
    });

    if (!user) {
      sendError(res, "User not found", [], 404);
      return;
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        hostId: userId,
        name,
        description,
        sessionDate: new Date(date),
        status: SessionStatus.DRAFT,
      },
      include: {
        host: { select: { id: true, name: true } },
      },
    });

    // Add host as first participant
    if (user.linkedPlayer) {
      await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          playerId: user.linkedPlayer.id,
          role: ParticipantRole.HOST,
        },
      });
    }

    sendSuccess(
      res,
      "Session created successfully",
      {
        id: session.id,
        name: session.name,
        description: session.description,
        date: session.sessionDate,
        status: session.status,
        totalAmount: null,
        playerCount: user.linkedPlayer ? 1 : 0,
        host: {
          id: session.host.id,
          name: session.host.name,
        },
        createdAt: session.createdAt,
      },
      201,
    );
  } catch (error) {
    console.error("Create session error:", error);
    sendError(
      res,
      "Failed to create session",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Get My Sessions
// GET /api/sessions
// =====================================
export const getMySessions = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      page = "1",
      limit = "10",
      role = "all",
      status = "all",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get user's player record
    const player = await prisma.player.findUnique({
      where: { userId },
    });

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (role === "host") {
      whereClause.hostId = userId;
    } else if (role === "player" && player) {
      whereClause.participants = {
        some: { playerId: player.id, isActive: true },
      };
    } else if (player) {
      // All sessions where user is host or participant
      whereClause.OR = [
        { hostId: userId },
        { participants: { some: { playerId: player.id, isActive: true } } },
      ];
    }

    if (status !== "all") {
      whereClause.status = status as SessionStatus;
    }

    // Build order clause
    const orderBy: Record<string, string> = {};
    if (sortBy === "date") {
      orderBy.sessionDate = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get sessions
    const [sessions, totalItems] = await Promise.all([
      prisma.session.findMany({
        where: whereClause,
        include: {
          host: { select: { id: true, name: true } },
          participants: { where: { isActive: true } },
          obligations: true, // Include obligations for paid count
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.session.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    const items = sessions.map((session) => {
      // Count verified/paid obligations
      const paidCount =
        session.obligations?.filter((o) => o.status === "VERIFIED").length || 0;
      // Count only non-host players - they are the ones who need to pay
      const nonHostPlayers = session.participants.filter(
        (p) => p.role !== "HOST",
      );
      const obligationCount = nonHostPlayers.length;

      return {
        id: session.id,
        name: session.name,
        date: session.sessionDate,
        status: session.status,
        totalAmount: session.totalAmount ? Number(session.totalAmount) : null,
        playerCount: session.participants.length,
        paidCount: paidCount,
        totalObligations: obligationCount,
        myRole:
          session.hostId === userId
            ? ParticipantRole.HOST
            : ParticipantRole.PLAYER,
        host: {
          id: session.host.id,
          name: session.host.name,
        },
      };
    });

    sendSuccess(res, "Sessions retrieved successfully", {
      items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    sendError(
      res,
      "Failed to retrieve sessions",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Get Session Details
// GET /api/sessions/:sessionId
// =====================================
export const getSessionDetails = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        host: { select: { id: true, name: true, photoUrl: true, bankName: true, bankAccountNumber: true, bankAccountName: true } },
        participants: {
          where: { isActive: true },
          include: { player: true },
        },
        expenseItems: true,
        obligations: true, // Include obligations for payment status
      },
    });

    if (!session) {
      sendError(
        res,
        "Session not found",
        [{ field: "sessionId", message: "Session does not exist" }],
        404,
      );
      return;
    }

    // Calculate per-person amount (only divide among non-host players)
    const totalAmount = session.expenseItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );
    // Count non-host players for proper division
    const nonHostPlayers = session.participants.filter(
      (p) => p.role !== "HOST",
    );
    const totalObligations = nonHostPlayers.length;
    const perPersonAmount =
      totalObligations > 0 ? Math.round(totalAmount / totalObligations) : 0;

    // Count paid obligations
    const paidCount =
      session.obligations?.filter((o) => o.status === "VERIFIED").length || 0;

    // Map players with their payment status
    const playersWithPayment = session.participants.map((p) => {
      // Find obligation for this player (if they're not the host)
      const obligation = session.obligations?.find(
        (o) => o.payerId === p.player.id,
      );

      return {
        id: p.player.id,
        name: p.player.name,
        photoUrl: p.player.photoUrl,
        role: p.role,
        email: p.player.email,
        phone: p.player.phone,
        // Payment info (null for host since they don't owe)
        paymentStatus:
          p.role === "HOST" ? null : obligation?.status || "PENDING",
        amountOwed: p.role === "HOST" ? null : perPersonAmount,
        obligationId: obligation?.id || null,
      };
    });

    sendSuccess(res, "Session details retrieved successfully", {
      id: session.id,
      name: session.name,
      description: session.description,
      date: session.sessionDate,
      status: session.status,
      groupPhotoUrl: session.groupPhotoUrl,
      host: {
        id: session.host.id,
        name: session.host.name,
        photoUrl: session.host.photoUrl,
        bankAccount: session.host.bankName ? {
          bankName: session.host.bankName,
          accountNumber: session.host.bankAccountNumber,
          accountName: session.host.bankAccountName,
        } : null,
      },
      players: playersWithPayment,
      expenses: session.expenseItems.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        quantity: e.quantity,
        subtotal: Number(e.amount) * e.quantity,
      })),
      totalAmount,
      perPersonAmount,
      paidCount,
      totalObligations,
    });
  } catch (error) {
    console.error("Get session details error:", error);
    sendError(
      res,
      "Failed to retrieve session",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Update Session
// PUT /api/sessions/:sessionId
// =====================================
export const updateSession = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { name, description, date } = req.body as SessionUpdateInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // Check session exists and user is host
    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(
        res,
        "Permission denied",
        [
          {
            field: "session",
            message: "Only the host can modify this session",
          },
        ],
        403,
      );
      return;
    }

    // Update session
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { sessionDate: new Date(date) }),
      },
    });

    sendSuccess(res, "Session updated successfully", updated);
  } catch (error) {
    console.error("Update session error:", error);
    sendError(
      res,
      "Failed to update session",
      [{ field: "server", message: "An error occurred" }],
      500,
    );
  }
};

// =====================================
// Delete Session
// DELETE /api/sessions/:sessionId
// =====================================
export const deleteSession = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: { obligations: { where: { status: "PENDING" } } },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    // Soft delete
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false, deletedAt: new Date() },
    });

    sendSuccess(res, "Session deleted successfully", null);
  } catch (error) {
    console.error("Delete session error:", error);
    sendError(res, "Failed to delete session", [], 500);
  }
};

// =====================================
// Add Players
// POST /api/sessions/:sessionId/players
// =====================================
export const addPlayers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { players } = req.body as AddPlayersInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    if (
      session.status === SessionStatus.SPLIT_CONFIRMED ||
      session.status === SessionStatus.CLOSED
    ) {
      sendError(
        res,
        "Cannot modify session",
        [
          {
            field: "status",
            message: "Cannot add players after split is confirmed",
          },
        ],
        409,
      );
      return;
    }

    const addedPlayers: Array<{
      id: string;
      name: string;
      email: string | null;
      role: ParticipantRole;
    }> = [];

    for (const playerData of players) {
      // Find or create player
      let player = await prisma.player.findFirst({
        where: {
          OR: [
            playerData.email ? { email: playerData.email } : {},
            { name: playerData.name, email: null },
          ].filter((c) => Object.keys(c).length > 0),
        },
      });

      if (!player) {
        player = await prisma.player.create({
          data: {
            name: playerData.name,
            email: playerData.email,
            phone: playerData.phone,
          },
        });
      }

      // Add to session if not already
      const existing = await prisma.sessionParticipant.findUnique({
        where: { sessionId_playerId: { sessionId, playerId: player.id } },
      });

      if (!existing) {
        await prisma.sessionParticipant.create({
          data: {
            sessionId,
            playerId: player.id,
            role: ParticipantRole.PLAYER,
          },
        });

        addedPlayers.push({
          id: player.id,
          name: player.name,
          email: player.email,
          role: ParticipantRole.PLAYER,
        });
      }
    }

    sendSuccess(res, "Players added successfully", {
      addedCount: addedPlayers.length,
      players: addedPlayers,
    });
  } catch (error) {
    console.error("Add players error:", error);
    sendError(res, "Failed to add players", [], 500);
  }
};

// =====================================
// Remove Player
// DELETE /api/sessions/:sessionId/players/:playerId
// =====================================
export const removePlayer = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId, playerId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session || session.hostId !== userId) {
      sendError(res, "Session not found or permission denied", [], 404);
      return;
    }

    if (
      session.status === SessionStatus.SPLIT_CONFIRMED ||
      session.status === SessionStatus.CLOSED
    ) {
      sendError(res, "Cannot modify session", [], 409);
      return;
    }

    await prisma.sessionParticipant.updateMany({
      where: { sessionId, playerId },
      data: { isActive: false },
    });

    sendSuccess(res, "Player removed successfully", null);
  } catch (error) {
    console.error("Remove player error:", error);
    sendError(res, "Failed to remove player", [], 500);
  }
};

// =====================================
// Add Expenses
// POST /api/sessions/:sessionId/expenses
// =====================================
export const addExpenses = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { items } = req.body as AddExpensesInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    const createdItems = await Promise.all(
      items.map((item) =>
        prisma.expenseItem.create({
          data: {
            sessionId,
            description: item.description,
            amount: new Decimal(item.amount),
            quantity: item.quantity || 1,
          },
        }),
      ),
    );

    // Calculate total
    const allItems = await prisma.expenseItem.findMany({
      where: { sessionId },
    });
    const totalAmount = allItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );

    // Update session total
    await prisma.session.update({
      where: { id: sessionId },
      data: { totalAmount: new Decimal(totalAmount) },
    });

    sendSuccess(res, "Expenses added successfully", {
      items: createdItems.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        quantity: e.quantity,
        subtotal: Number(e.amount) * e.quantity,
      })),
      totalAmount,
    });
  } catch (error) {
    console.error("Add expenses error:", error);
    sendError(res, "Failed to add expenses", [], 500);
  }
};

// =====================================
// Get Expense Summary
// GET /api/sessions/:sessionId/expenses
// =====================================
export const getExpenseSummary = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        expenseItems: true,
        participants: { where: { isActive: true } },
      },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    const totalAmount = session.expenseItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );
    const playerCount = session.participants.length;
    const perPersonAmount =
      playerCount > 0 ? Math.round(totalAmount / playerCount) : 0;

    sendSuccess(res, "Expenses retrieved successfully", {
      items: session.expenseItems.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        quantity: e.quantity,
        subtotal: Number(e.amount) * e.quantity,
      })),
      totalAmount,
      playerCount,
      perPersonAmount,
    });
  } catch (error) {
    console.error("Get expense summary error:", error);
    sendError(res, "Failed to retrieve expenses", [], 500);
  }
};

// =====================================
// Update Expense
// PUT /api/sessions/:sessionId/expenses/:expenseId
// =====================================
export const updateExpense = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId, expenseId } = req.params;
    const { description, amount, quantity } = req.body as UpdateExpenseInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session || session.hostId !== userId) {
      sendError(res, "Session not found or permission denied", [], 404);
      return;
    }

    const updated = await prisma.expenseItem.update({
      where: { id: expenseId },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && { amount: new Decimal(amount) }),
        ...(quantity !== undefined && { quantity }),
      },
    });

    sendSuccess(res, "Expense updated successfully", updated);
  } catch (error) {
    console.error("Update expense error:", error);
    sendError(res, "Failed to update expense", [], 500);
  }
};

// =====================================
// Delete Expense
// DELETE /api/sessions/:sessionId/expenses/:expenseId
// =====================================
export const deleteExpense = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId, expenseId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session || session.hostId !== userId) {
      sendError(res, "Session not found or permission denied", [], 404);
      return;
    }

    await prisma.expenseItem.delete({ where: { id: expenseId } });

    sendSuccess(res, "Expense deleted successfully", null);
  } catch (error) {
    console.error("Delete expense error:", error);
    sendError(res, "Failed to delete expense", [], 500);
  }
};

// =====================================
// Generate Split
// POST /api/sessions/:sessionId/split
// =====================================
export const generateSplit = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        expenseItems: true,
        participants: { where: { isActive: true }, include: { player: true } },
        host: { include: { linkedPlayer: true } },
      },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    // Calculate totals
    const totalAmount = session.expenseItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );
    const playerCount = session.participants.length;
    const perPersonAmount = Math.round(totalAmount / playerCount);

    // Get host's player ID (payee)
    const hostPlayerId = session.host.linkedPlayer?.id;
    if (!hostPlayerId) {
      sendError(res, "Host player not found", [], 500);
      return;
    }

    const obligations: Array<{
      id: string;
      payerId: string;
      payerName: string;
      amount: number;
      status: string;
    }> = [];

    // Create obligations for each non-host participant
    for (const participant of session.participants) {
      if (participant.role === ParticipantRole.HOST) continue;

      const idempotencyKey = `${sessionId}:${participant.playerId}`;

      // Check if obligation already exists (idempotency)
      let obligation = await prisma.obligation.findUnique({
        where: { idempotencyKey },
      });

      if (!obligation) {
        obligation = await prisma.obligation.create({
          data: {
            sessionId,
            payerId: participant.playerId,
            payeeId: hostPlayerId,
            amount: new Decimal(perPersonAmount),
            idempotencyKey,
          },
        });
      }

      obligations.push({
        id: obligation.id,
        payerId: participant.playerId,
        payerName: participant.player.name,
        amount: Number(obligation.amount),
        status: obligation.status,
      });
    }

    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.SPLIT_CONFIRMED,
        totalAmount: new Decimal(totalAmount),
      },
    });

    sendSuccess(res, "Split generated successfully", {
      status: SessionStatus.SPLIT_CONFIRMED,
      totalAmount,
      playerCount,
      perPersonAmount,
      obligations,
    });
  } catch (error) {
    console.error("Generate split error:", error);
    sendError(res, "Failed to generate split", [], 500);
  }
};

// =====================================
// Get Obligations
// GET /api/sessions/:sessionId/obligations
// =====================================
export const getObligations = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        obligations: {
          include: { payer: true },
        },
      },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    const obligations = session.obligations.map((o) => ({
      id: o.id,
      payerId: o.payerId,
      payerName: o.payer.name,
      amount: Number(o.amount),
      status: o.status,
    }));

    const summary = {
      total: obligations.length,
      pending: obligations.filter(
        (o) => o.status === "PENDING" || o.status === "MARKED_PAID",
      ).length,
      verified: obligations.filter((o) => o.status === "VERIFIED").length,
    };

    sendSuccess(res, "Obligations retrieved successfully", {
      obligations,
      summary,
    });
  } catch (error) {
    console.error("Get obligations error:", error);
    sendError(res, "Failed to retrieve obligations", [], 500);
  }
};

// =====================================
// Mark Player as Paid
// POST /api/sessions/:sessionId/players/:playerId/mark-paid
// Creates obligation if needed and marks as VERIFIED
// =====================================
export const markPlayerAsPaid = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    // Convert to lowercase for UUID case-insensitive comparison (Swift sends uppercase)
    const playerId = req.params.playerId.toLowerCase();

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // Get session with host info
    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        host: { include: { linkedPlayer: true } },
        participants: { where: { isActive: true } },
        expenseItems: true,
      },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Only the host can mark players as paid", [], 403);
      return;
    }

    // Verify player is a participant
    const participant = session.participants.find(
      (p) => p.playerId === playerId,
    );
    if (!participant) {
      sendError(res, "Player not found in session", [], 404);
      return;
    }

    if (participant.role === "HOST") {
      sendError(res, "Cannot mark host as paid - they do not owe", [], 400);
      return;
    }

    // Calculate per-person amount
    const totalAmount = session.expenseItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );
    const nonHostPlayers = session.participants.filter(
      (p) => p.role !== "HOST",
    );
    const perPersonAmount =
      nonHostPlayers.length > 0
        ? Math.round(totalAmount / nonHostPlayers.length)
        : 0;

    // Get host's player ID (payee)
    const hostPlayerId = session.host.linkedPlayer?.id;
    if (!hostPlayerId) {
      sendError(res, "Host player not found", [], 500);
      return;
    }

    // Check for existing obligation or create one
    const idempotencyKey = `${sessionId}:${playerId}`;
    let obligation = await prisma.obligation.findUnique({
      where: { idempotencyKey },
    });

    if (!obligation) {
      // Create obligation and mark as verified in one go
      obligation = await prisma.obligation.create({
        data: {
          sessionId,
          payerId: playerId,
          payeeId: hostPlayerId,
          amount: new Decimal(perPersonAmount),
          idempotencyKey,
          status: "VERIFIED",
        },
      });
    } else {
      // Update existing obligation to verified
      obligation = await prisma.obligation.update({
        where: { id: obligation.id },
        data: { status: "VERIFIED" },
      });
    }

    sendSuccess(res, "Player marked as paid successfully", {
      obligationId: obligation.id,
      status: "VERIFIED",
      amount: Number(obligation.amount),
    });
  } catch (error) {
    console.error("Mark player as paid error:", error);
    sendError(res, "Failed to mark player as paid", [], 500);
  }
};

// =====================================
// Verify Payment
// POST /api/sessions/:sessionId/obligations/:obligationId/verify
// =====================================
export const verifyPayment = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId, obligationId } = req.params;
    const { action, rejectionReason } = req.body as VerifyPaymentInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
    });

    if (!session || session.hostId !== userId) {
      sendError(res, "Session not found or permission denied", [], 404);
      return;
    }

    const newStatus = action === "approve" ? "VERIFIED" : "REJECTED";

    await prisma.obligation.update({
      where: { id: obligationId },
      data: { status: newStatus },
    });

    // If rejecting, update payment proof status
    if (action === "reject") {
      const payment = await prisma.payment.findFirst({
        where: { obligationId },
        include: { proofs: true },
      });

      if (payment && payment.proofs.length > 0) {
        await prisma.paymentProof.update({
          where: { id: payment.proofs[0].id },
          data: {
            status: "REJECTED",
            rejectionReason,
            verifiedBy: userId,
            verifiedAt: new Date(),
          },
        });
      }
    }

    sendSuccess(res, `Payment ${action}d successfully`, { status: newStatus });
  } catch (error) {
    console.error("Verify payment error:", error);
    sendError(res, "Failed to verify payment", [], 500);
  }
};

// =====================================
// Close Session
// POST /api/sessions/:sessionId/close
// =====================================
export const closeSession = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId, isActive: true },
      include: {
        obligations: true,
        participants: { where: { isActive: true } },
      },
    });

    if (!session) {
      sendError(res, "Session not found", [], 404);
      return;
    }

    if (session.hostId !== userId) {
      sendError(res, "Permission denied", [], 403);
      return;
    }

    // Check all obligations are verified
    const pendingObligations = session.obligations.filter(
      (o) => o.status !== "VERIFIED",
    );
    if (pendingObligations.length > 0) {
      sendError(
        res,
        "Cannot close session",
        [
          {
            field: "obligations",
            message: "Not all payments have been verified",
          },
        ],
        400,
      );
      return;
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CLOSED },
    });

    const totalCollected = session.obligations.reduce(
      (sum, o) => sum + Number(o.amount),
      0,
    );

    sendSuccess(res, "Session closed successfully", {
      status: SessionStatus.CLOSED,
      summary: {
        totalCollected,
        playerCount: session.participants.length,
      },
    });
  } catch (error) {
    console.error("Close session error:", error);
    sendError(res, "Failed to close session", [], 500);
  }
};

// =====================================
// Upload Group Photo (Placeholder)
// POST /api/sessions/:sessionId/photo
// =====================================
export const uploadGroupPhoto = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId: _sessionId } = req.params;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // TODO: Implement file upload and face detection
    sendSuccess(res, "Photo uploaded, face detection started", {
      mediaAssetId: "placeholder",
      status: SessionStatus.PROCESSING_FACES,
      groupPhotoUrl: "placeholder-url",
    });
  } catch (error) {
    console.error("Upload photo error:", error);
    sendError(res, "Failed to upload photo", [], 500);
  }
};

// =====================================
// Get Face Detection Results (Placeholder)
// GET /api/sessions/:sessionId/faces
// =====================================
export const getFaceDetectionResults = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId: _sessionId } = req.params;

    // TODO: Implement face detection results
    sendSuccess(res, "Faces retrieved successfully", {
      status: SessionStatus.READY_TO_SPLIT,
      detectedFaces: [],
    });
  } catch (error) {
    console.error("Get faces error:", error);
    sendError(res, "Failed to retrieve faces", [], 500);
  }
};

// =====================================
// Confirm Face Mappings (Placeholder)
// POST /api/sessions/:sessionId/faces/confirm
// =====================================
export const confirmFaceMappings = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId: _sessionId } = req.params;
    const { confirmations } = req.body as ConfirmFaceMappingsInput;

    if (!userId) {
      sendError(res, "Authentication required", [], 401);
      return;
    }

    // TODO: Implement face confirmation
    sendSuccess(res, "Face mappings confirmed", {
      confirmedCount: confirmations.length,
    });
  } catch (error) {
    console.error("Confirm faces error:", error);
    sendError(res, "Failed to confirm faces", [], 500);
  }
};

// =====================================
// Send Reminder (Placeholder)
// POST /api/sessions/:sessionId/obligations/:obligationId/remind
// =====================================
export const sendReminder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // TODO: Implement reminder sending
    sendSuccess(res, "Reminder sent successfully", null);
  } catch (error) {
    console.error("Send reminder error:", error);
    sendError(res, "Failed to send reminder", [], 500);
  }
};
