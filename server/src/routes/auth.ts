import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const prisma = req.app.locals.prisma as PrismaClient;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

router.post("/register", async (req, res) => {
  const { username, password, name, email, phone, role } = req.body;
  const prisma = req.app.locals.prisma as PrismaClient;

  if (!username || !password || !name) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
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
  });

  res.status(201).json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const prisma = req.app.locals.prisma as PrismaClient;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
