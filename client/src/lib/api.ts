import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

class Api {
  async login(username: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) throw new Error('Đăng nhập thất bại');
    
    localStorage.setItem('user', JSON.stringify(data));
    return { user: data, token: data.id };
  }

  getMe() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('user');
  }

  // Products
  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean }) {
    let query = supabase.from('products').select('*, category:categories(*)');
    
    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    if (params?.category) {
      query = query.eq('categoryId', params.category);
    }
    if (params?.lowStock) {
      query = query.lte('stock', 'minStock');
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createProduct(data: any) {
    const { data: result, error } = await supabase.from('products').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  async updateProduct(id: string, data: any) {
    const { data: result, error } = await supabase.from('products').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  // Categories
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*, _count:products(count)');
    if (error) throw error;
    return data;
  }

  async createCategory(data: any) {
    const { data: result, error } = await supabase.from('categories').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  // Orders
  async getOrders(params?: { status?: string; date?: string }) {
    let query = supabase.from('orders').select('*, user:users(id, name), customer:customers(id, name, phone), items:order_items(*, product:products(*))');
    
    if (params?.status) query = query.eq('status', params.status);
    if (params?.date) query = query.gte('createdAt', params.date);
    
    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createOrder(data: any) {
    const { items, ...orderData } = data;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) throw orderError;

    if (items?.length) {
      const orderItems = items.map((item: any) => ({
        ...item,
        orderId: order.id
      }));
      await supabase.from('order_items').insert(orderItems);
    }

    return order;
  }

  async cancelOrder(id: string) {
    const { error } = await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', id);
    if (error) throw error;
  }

  // Customers
  async getCustomers(params?: { search?: string }) {
    let query = supabase.from('customers').select('*');
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getCustomerByPhone(phone: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).single();
    if (error) throw error;
    return data;
  }

  async createCustomer(data: any) {
    const { data: result, error } = await supabase.from('customers').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  async updateCustomer(id: string, data: any) {
    const { data: result, error } = await supabase.from('customers').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  // Users
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }

  async createUser(data: any) {
    const { data: result, error } = await supabase.from('users').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  async updateUser(id: string, data: any) {
    const { data: result, error } = await supabase.from('users').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  // Dashboard
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const [todayOrders, monthOrders, products, customers, lowStock] = await Promise.all([
      supabase.from('orders').select('finalAmount').gte('createdAt', today).eq('status', 'COMPLETED'),
      supabase.from('orders').select('finalAmount').gte('createdAt', monthStart).eq('status', 'COMPLETED'),
      supabase.from('products').select('id'),
      supabase.from('customers').select('id'),
      supabase.from('products').select('id, stock, minStock').lte('stock', 10)
    ]);

    return {
      todayRevenue: todayOrders.data?.reduce((sum, o) => sum + o.finalAmount, 0) || 0,
      todayOrders: todayOrders.data?.length || 0,
      monthRevenue: monthOrders.data?.reduce((sum, o) => sum + o.finalAmount, 0) || 0,
      monthOrders: monthOrders.data?.length || 0,
      totalProducts: products.data?.length || 0,
      totalCustomers: customers.data?.length || 0,
      lowStockCount: lowStock.data?.length || 0
    };
  }

  async getDashboardData(period?: string) {
    const days = period === 'month' ? 30 : period === 'year' ? 365 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [orders, lowStockProducts] = await Promise.all([
      supabase.from('orders').select('*, items:order_items(quantity, price, product:products(name))').gte('createdAt', startDate).eq('status', 'COMPLETED'),
      supabase.from('products').select('id, name, sku, stock, minStock').lte('stock', 10).limit(5)
    ]);

    const productMap = new Map();
    orders.data?.forEach(order => {
      order.items?.forEach((item: any) => {
        const p = productMap.get(item.product?.id) || { id: item.product?.id, name: item.product?.name, quantity: 0, revenue: 0 };
        p.quantity += item.quantity;
        p.revenue += item.price * item.quantity;
        productMap.set(item.product?.id, p);
      });
    });

    return {
      summary: {
        totalRevenue: orders.data?.reduce((sum, o) => sum + o.finalAmount, 0) || 0,
        totalOrders: orders.data?.length || 0,
        totalItems: orders.data?.reduce((sum, o) => sum + o.items?.length || 0, 0) || 0,
        avgOrderValue: orders.data?.length ? orders.data.reduce((sum, o) => sum + o.finalAmount, 0) / orders.data.length : 0
      },
      topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      lowStockProducts: lowStockProducts.data || [],
      recentOrders: orders.data?.slice(0, 10) || [],
      categoryBreakdown: []
    };
  }
}

export const api = new Api();
