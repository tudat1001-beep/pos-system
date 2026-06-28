import { Router } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, ownerOnly } from "../middleware/auth.js";

const router = Router();

// Get all users (owner only)
router.get("/", ownerOnly, async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
});

// Get single user
router.get("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// Create user (owner only)
router.post("/", ownerOnly, async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { username, password, name, email, phone, role } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      role: role || "STAFF",
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  res.status(201).json(user);
});

// Update user
router.put("/:id", ownerOnly, async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { name, email, phone, role, isActive } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { name, email, phone, role, isActive },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  res.json(user);
});

// Update password
router.patch("/:id/password", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Only allow user to change own password or owner to reset
  if (req.user?.id !== id && req.user?.role !== "OWNER") {
    return res.status(403).json({ error: "Permission denied" });
  }

  if (req.user?.id === id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  res.json({ message: "Password updated" });
});

// Delete user (owner only)
router.delete("/:id", ownerOnly, async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  if (id === req.user?.id) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ message: "User deactivated" });
});

export default router;
