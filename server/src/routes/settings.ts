import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, ownerOnly } from "../middleware/auth.js";

const router = Router();

// Get all settings
router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  const settings = await prisma.setting.findMany();
  res.json(settings);
});

// Get single setting
router.get("/:key", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { key } = req.params;

  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) {
    return res.status(404).json({ error: "Setting not found" });
  }

  res.json(setting);
});

// Create or update setting
router.post("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ error: "Key is required" });
  }

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  res.json(setting);
});

// Update setting
router.put("/:key", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { key } = req.params;
  const { value } = req.body;

  const setting = await prisma.setting.update({
    where: { key },
    data: { value },
  });

  res.json(setting);
});

export default router;
