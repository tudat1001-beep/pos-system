import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all orders
router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { status, date, userId } = req.query;

  const where: any = {};

  if (status) {
    where.status = String(status);
  }

  if (userId) {
    where.userId = String(userId);
  }

  if (date) {
    const startOfDay = new Date(String(date));
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(String(date));
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = { gte: startOfDay, lte: endOfDay };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

// Get single order
router.get("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order);
});

// Create order
router.post("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { customerId, items, notes, discount = 0 } = req.body;
  const userId = req.user?.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Order must have at least one item" });
  }

  // Calculate totals and validate stock
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} not found` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }

    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      total: itemTotal,
    });

    // Update stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: product.stock - item.quantity },
    });
  }

  const finalAmount = totalAmount - discount;

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD${Date.now()}`,
      userId: userId!,
      customerId: customerId || null,
      totalAmount,
      discount,
      finalAmount,
      notes,
      status: "COMPLETED",
      type: "POS",
      items: { create: orderItems },
    },
    include: {
      user: { select: { id: true, name: true } },
      customer: true,
      items: { include: { product: true } },
    },
  });

  // Update customer points
  if (customerId) {
    const points = Math.floor(finalAmount / 1000);
    await prisma.customer.update({
      where: { id: customerId },
      data: { points: { increment: points } },
    });
  }

  res.status(201).json(order);
});

// Update order status
router.patch("/:id/status", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, name: true } },
      customer: true,
      items: { include: { product: true } },
    },
  });

  res.json(order);
});

// Cancel order
router.post("/:id/cancel", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Restore stock
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  const cancelled = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  res.json(cancelled);
});

export default router;
