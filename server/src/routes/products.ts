import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Remove Vietnamese diacritics for search
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"));
}

// Get all products
router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { search, category, lowStock } = req.query;

  const where: any = { isActive: true };

  if (search) {
    const normalizedSearch = normalizeText(String(search));
    // Get all products first, then filter in JS for Vietnamese search
    where.AND = [{
      OR: [
        { name: { contains: String(search) } },
        { sku: { contains: String(search) } },
        { barcode: { contains: String(search) } },
      ],
    }];
  }

  if (category) {
    where.categoryId = String(category);
  }

  if (lowStock === "true") {
    where.stock = { lte: 5 };
  }

  let products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // Apply Vietnamese-insensitive search
  if (search) {
    const normalizedSearch = normalizeText(String(search));
    products = products.filter(p => 
      normalizeText(p.name).includes(normalizedSearch) ||
      p.sku.toLowerCase().includes(normalizedSearch) ||
      (p.barcode && p.barcode.toLowerCase().includes(normalizedSearch))
    );
  }

  res.json(products);
});

// Get single product
router.get("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

// Create product
router.post("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { name, sku, barcode, description, price, costPrice, stock, minStock, categoryId, image } = req.body;

  if (!name || !sku || price === undefined) {
    return res.status(400).json({ error: "Name, SKU, and price are required" });
  }

  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) {
    return res.status(400).json({ error: "SKU already exists" });
  }

  if (barcode) {
    const existingBarcode = await prisma.product.findUnique({ where: { barcode } });
    if (existingBarcode) {
      return res.status(400).json({ error: "Barcode already exists" });
    }
  }

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      barcode,
      description,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : null,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 5,
      categoryId,
      image,
    },
    include: { category: true },
  });

  res.status(201).json(product);
});

// Update product
router.put("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { name, sku, barcode, description, price, costPrice, stock, minStock, categoryId, image, isActive } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      sku,
      barcode,
      description,
      price: price ? parseFloat(price) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      minStock: minStock ? parseInt(minStock) : undefined,
      categoryId,
      image,
      isActive: isActive !== undefined ? isActive : undefined,
    },
    include: { category: true },
  });

  res.json(product);
});

// Delete product
router.delete("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ message: "Product deactivated" });
});

// Update stock
router.patch("/:id/stock", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { quantity, type } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const newStock = type === "add" 
    ? product.stock + parseInt(quantity)
    : product.stock - parseInt(quantity);

  if (newStock < 0) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { stock: newStock },
  });

  res.json(updated);
});

export default router;
