import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;
  const { period = "today" } = req.query;

  let startDate: Date;
  const endDate = new Date();

  switch (period) {
    case "week":
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default: // today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
  }

  // Revenue & Orders
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { items: true },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalOrders = orders.length;
  const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  // Average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Top products
  const productSales = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  const topProducts = await Promise.all(
    productSales.map(async (ps) => {
      const product = await prisma.product.findUnique({ where: { id: ps.productId } });
      return {
        id: ps.productId,
        name: product?.name || "Unknown",
        quantity: ps._sum.quantity || 0,
        revenue: ps._sum.total || 0,
      };
    })
  );

  // Daily sales for chart
  const dailySales = await prisma.order.groupBy({
    by: ["createdAt"],
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { finalAmount: true },
    _count: true,
    orderBy: { createdAt: "asc" },
  });

  // Low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { lte: 5 },
    },
    select: { id: true, name: true, sku: true, stock: true, minStock: true },
    take: 10,
  });

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      customer: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  // Staff performance
  const staffPerformance = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { finalAmount: true },
    _count: true,
  });

  const staffData = await Promise.all(
    staffPerformance.map(async (sp) => {
      const user = await prisma.user.findUnique({ where: { id: sp.userId } });
      return {
        id: sp.userId,
        name: user?.name || "Unknown",
        orders: sp._count,
        revenue: sp._sum.finalAmount || 0,
      };
    })
  );

  // Category breakdown
  const categorySales = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { total: true },
  });

  const categoryBreakdown = await Promise.all(
    categorySales.map(async (cs) => {
      const product = await prisma.product.findUnique({
        where: { id: cs.productId },
        include: { category: true },
      });
      return {
        category: product?.category?.name || "Khác",
        revenue: cs._sum.total || 0,
      };
    })
  );

  // Group by category
  const categorySummary = categoryBreakdown.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.revenue;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    summary: {
      totalRevenue,
      totalOrders,
      totalItems,
      avgOrderValue,
    },
    topProducts,
    dailySales: dailySales.map((ds) => ({
      date: ds.createdAt,
      revenue: ds._sum.finalAmount || 0,
      orders: ds._count,
    })),
    lowStockProducts,
    recentOrders,
    staffPerformance: staffData,
    categoryBreakdown: Object.entries(categorySummary).map(([name, revenue]) => ({ name, revenue })),
  });
});

// Get statistics for dashboard cards
router.get("/stats", async (req: AuthRequest, res) => {
  const prisma = req.app.locals.prisma as PrismaClient;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: "COMPLETED" },
    _sum: { finalAmount: true },
    _count: true,
  });

  const monthOrders = await prisma.order.aggregate({
    where: {
      createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
      status: "COMPLETED",
    },
    _sum: { finalAmount: true },
    _count: true,
  });

  const totalProducts = await prisma.product.count({ where: { isActive: true } });
  const totalCustomers = await prisma.customer.count();
  const lowStockCount = await prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } });

  res.json({
    todayRevenue: todayOrders._sum.finalAmount || 0,
    todayOrders: todayOrders._count,
    monthRevenue: monthOrders._sum.finalAmount || 0,
    monthOrders: monthOrders._count,
    totalProducts,
    totalCustomers,
    lowStockCount,
  });
});

export default router;
