import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all categories
router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  res.json(categories);
});

// Get single category
router.get("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: { where: { isActive: true } } },
  });

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  res.json(category);
});

// Create category
router.post("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { name, slug, image } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const categorySlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug: categorySlug }] },
  });

  if (existing) {
    return res.status(400).json({ error: "Category already exists" });
  }

  const category = await prisma.category.create({
    data: { name, slug: categorySlug, image },
  });

  res.status(201).json(category);
});

// Update category
router.put("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { name, slug, image } = req.body;

  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, image },
  });

  res.json(category);
});

// Delete category
router.delete("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ message: "Category deactivated" });
});

export default router;
