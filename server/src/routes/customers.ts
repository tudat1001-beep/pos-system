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

// Get all customers
router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { search } = req.query;

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  // Apply Vietnamese-insensitive search
  if (search) {
    const normalizedSearch = normalizeText(String(search));
    const filtered = customers.filter(c => 
      normalizeText(c.name).includes(normalizedSearch) ||
      (c.phone && c.phone.includes(normalizedSearch)) ||
      (c.email && normalizeText(c.email).includes(normalizedSearch))
    );
    return res.json(filtered);
  }

  res.json(customers);
});

// Get single customer
router.get("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { take: 10, orderBy: { createdAt: "desc" } } },
  });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  res.json(customer);
});

// Create customer
router.post("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { name, phone, email, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (phone) {
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
  }

  const customer = await prisma.customer.create({
    data: { name, phone, email, address },
  });

  res.status(201).json(customer);
});

// Update customer
router.put("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  if (phone) {
    const existing = await prisma.customer.findFirst({
      where: { phone, NOT: { id } },
    });
    if (existing) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: { name, phone, email, address },
  });

  res.json(customer);
});

// Delete customer
router.delete("/:id", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { id } = req.params;

  await prisma.customer.delete({ where: { id } });

  res.json({ message: "Customer deleted" });
});

// Get customer by phone
router.get("/phone/:phone", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { phone } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { phone },
  });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  res.json(customer);
});

export default router;
