// User Controller - User management endpoints
import { Request, Response } from 'express';
import { PrismaClient, SessionStatus, ObligationStatus } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword, comparePassword } from '../utils/password';
import {
  AuthenticatedRequest,
  UserProfileUpdateInput,
  ChangePasswordInput,
} from '../types';

const prisma = new PrismaClient();

// =====================================
// Get My Profile
// GET /api/users/me
// =====================================
export const getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        sessions: {
          where: { isActive: true },
          include: {
            obligations: true,
          },
        },
        linkedPlayer: {
          include: {
            sessionParticipants: {
              where: { isActive: true },
              include: {
                session: {
                  include: { obligations: true },
                },
              },
            },
            obligationsAsPayer: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', [], 404);
      return;
    }

    // Calculate stats
    const sessionsHosted = user.sessions.length;
    const totalCollected = user.sessions.reduce((sum, session) => {
      const verified = session.obligations
        .filter((o) => o.status === ObligationStatus.VERIFIED)
        .reduce((s, o) => s + Number(o.amount), 0);
      return sum + verified;
    }, 0);

    const sessionsParticipated = user.linkedPlayer?.sessionParticipants.length || 0;
    const totalPaid = user.linkedPlayer?.obligationsAsPayer
      .filter((o) => o.status === ObligationStatus.VERIFIED)
      .reduce((sum, o) => sum + Number(o.amount), 0) || 0;

    sendSuccess(res, 'Profile retrieved successfully', {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      stats: {
        sessionsHosted,
        sessionsParticipated,
        totalCollected,
        totalPaid,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    sendError(res, 'Failed to retrieve profile', [], 500);
  }
};

// =====================================
// Update My Profile
// PUT /api/users/me
// =====================================
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, phone, photoUrl } = req.body as UserProfileUpdateInput;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });

    // Also update linked player if exists
    await prisma.player.updateMany({
      where: { userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });

    sendSuccess(res, 'Profile updated successfully', {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      photoUrl: updated.photoUrl,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    sendError(res, 'Failed to update profile', [], 500);
  }
};

// =====================================
// Upload Profile Photo (Placeholder)
// POST /api/users/me/photo
// =====================================
export const uploadProfilePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    // TODO: Implement file upload
    sendSuccess(res, 'Photo uploaded successfully', {
      photoUrl: 'placeholder-url',
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    sendError(res, 'Failed to upload photo', [], 500);
  }
};

// =====================================
// Get My Sessions (as Host)
// GET /api/users/me/sessions
// =====================================
export const getMySessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { status = 'all', page = '1', limit = '10' } = req.query as Record<string, string>;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Record<string, unknown> = {
      hostId: userId,
      isActive: true,
    };

    if (status !== 'all') {
      whereClause.status = status as SessionStatus;
    }

    const [sessions, totalItems] = await Promise.all([
      prisma.session.findMany({
        where: whereClause,
        include: {
          participants: { where: { isActive: true } },
          obligations: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.session.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    const items = sessions.map((session) => ({
      id: session.id,
      name: session.name,
      date: session.sessionDate,
      status: session.status,
      totalAmount: session.totalAmount ? Number(session.totalAmount) : null,
      playerCount: session.participants.length,
      pendingPayments: session.obligations.filter(
        (o) => o.status === ObligationStatus.PENDING || o.status === ObligationStatus.MARKED_PAID
      ).length,
    }));

    sendSuccess(res, 'Sessions retrieved successfully', {
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
    console.error('Get user sessions error:', error);
    sendError(res, 'Failed to retrieve sessions', [], 500);
  }
};

// =====================================
// Get Payment Summary
// GET /api/users/me/summary
// =====================================
export const getPaymentSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    // Get hosted sessions
    const hostedSessions = await prisma.session.findMany({
      where: { hostId: userId, isActive: true },
      include: { obligations: true },
    });

    const totalHostedSessions = hostedSessions.length;
    const activeSessions = hostedSessions.filter(
      (s) => s.status !== SessionStatus.CLOSED
    ).length;

    const asHostStats = hostedSessions.reduce(
      (acc, session) => {
        const verified = session.obligations
          .filter((o) => o.status === ObligationStatus.VERIFIED)
          .reduce((sum, o) => sum + Number(o.amount), 0);
        const pending = session.obligations
          .filter((o) => o.status !== ObligationStatus.VERIFIED)
          .reduce((sum, o) => sum + Number(o.amount), 0);

        return {
          totalCollected: acc.totalCollected + verified,
          pending: acc.pending + pending,
        };
      },
      { totalCollected: 0, pending: 0 }
    );

    // Get player obligations
    const player = await prisma.player.findUnique({
      where: { userId },
      include: {
        sessionParticipants: { where: { isActive: true } },
        obligationsAsPayer: true,
      },
    });

    const asPlayerStats = {
      totalSessions: player?.sessionParticipants.length || 0,
      totalPaid: player?.obligationsAsPayer
        .filter((o) => o.status === ObligationStatus.VERIFIED)
        .reduce((sum, o) => sum + Number(o.amount), 0) || 0,
      pending: player?.obligationsAsPayer
        .filter((o) => o.status !== ObligationStatus.VERIFIED)
        .reduce((sum, o) => sum + Number(o.amount), 0) || 0,
    };

    sendSuccess(res, 'Summary retrieved successfully', {
      asHost: {
        totalSessions: totalHostedSessions,
        totalCollected: asHostStats.totalCollected,
        pending: asHostStats.pending,
        activeSessions,
      },
      asPlayer: asPlayerStats,
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    sendError(res, 'Failed to retrieve summary', [], 500);
  }
};

// =====================================
// Change Password
// POST /api/users/me/password
// =====================================
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      sendError(res, 'User not found', [], 404);
      return;
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      sendError(res, 'Invalid password', [
        { field: 'currentPassword', message: 'Current password is incorrect' },
      ], 400);
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    sendSuccess(res, 'Password changed successfully', null);
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', [], 500);
  }
};

// =====================================
// Delete Account
// DELETE /api/users/me
// =====================================
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      sendError(res, 'Authentication required', [], 401);
      return;
    }

    // Check for active sessions with pending payments
    const activeSessions = await prisma.session.findMany({
      where: {
        hostId: userId,
        isActive: true,
        status: { not: SessionStatus.CLOSED },
      },
      include: {
        obligations: {
          where: { status: { not: ObligationStatus.VERIFIED } },
        },
      },
    });

    const sessionsWithPending = activeSessions.filter((s) => s.obligations.length > 0);

    if (sessionsWithPending.length > 0) {
      sendError(res, 'Cannot delete account', [
        {
          field: 'sessions',
          message: `You have ${sessionsWithPending.length} active sessions with pending payments`,
        },
      ], 400);
      return;
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });

    // Also soft delete linked player
    await prisma.player.updateMany({
      where: { userId },
      data: { isActive: false, deletedAt: new Date() },
    });

    sendSuccess(res, 'Account deleted successfully', null);
  } catch (error) {
    console.error('Delete account error:', error);
    sendError(res, 'Failed to delete account', [], 500);
  }
};
