// Routes Index - Main router configuration
import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import sessionRoutes from "./session.routes";
import playerRoutes from "./player.routes";
import userRoutes from "./user.routes";

const router = Router();

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "paid-api",
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/player", playerRoutes);
router.use("/users", userRoutes);

export default router;
