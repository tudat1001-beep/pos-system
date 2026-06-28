export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'OWNER' | 'STAFF';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  points: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  image?: string;
  category?: Category;
  categoryId?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'POS' | 'ONLINE' | 'PHONE';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  discount: number;
  finalAmount: number;
  notes?: string;
  createdAt: string;
  user: { id: string; name: string };
  customer?: { id: string; name: string; phone?: string };
  items: OrderItem[];
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
}

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    avgOrderValue: number;
  };
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
  lowStockProducts: { id: string; name: string; sku: string; stock: number; minStock: number }[];
  recentOrders: any[];
  categoryBreakdown: { name: string; revenue: number }[];
}
