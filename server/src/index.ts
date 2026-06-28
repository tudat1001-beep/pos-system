import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import userRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";
import settingsRoutes from "./routes/settings.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Make prisma available in routes
app.locals.prisma = prisma;

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/products", authMiddleware, productRoutes);
app.use("/api/categories", authMiddleware, categoryRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/settings", authMiddleware, settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
