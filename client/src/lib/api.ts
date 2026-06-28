// Mock data for demo purposes
const MOCK_USERS = [
  { id: '1', username: 'admin', password: 'admin123', name: 'Admin User', role: 'ADMIN', email: 'admin@pos.com' },
  { id: '2', username: 'staff', password: 'staff123', name: 'Staff User', role: 'STAFF', email: 'staff@pos.com' }
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Đồ uống', slug: 'do-uong', image: null, isActive: true, products: [
    { id: 'p1', name: 'Cà phê đen', sku: 'CF001', price: 25000, stock: 100, categoryId: '1' },
    { id: 'p2', name: 'Cà phê sữa', sku: 'CF002', price: 30000, stock: 80, categoryId: '1' },
    { id: 'p3', name: 'Trà sữa', sku: 'TS001', price: 35000, stock: 50, categoryId: '1' },
    { id: 'p4', name: 'Nước cam', sku: 'NC001', price: 28000, stock: 3, categoryId: '1' },
  ]},
  { id: '2', name: 'Bánh', slug: 'banh', image: null, isActive: true, products: [
    { id: 'p5', name: 'Bánh mì', sku: 'BM001', price: 15000, stock: 30, categoryId: '2' },
    { id: 'p6', name: 'Bánh ngọt', sku: 'BN001', price: 20000, stock: 20, categoryId: '2' },
  ]},
  { id: '3', name: 'Snack', slug: 'snack', image: null, isActive: true, products: [
    { id: 'p7', name: 'Khoai tây', sku: 'KT001', price: 18000, stock: 40, categoryId: '3' },
    { id: 'p8', name: 'Bim bim', sku: 'BB001', price: 12000, stock: 5, categoryId: '3' },
  ]},
];

const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Khách lẻ', phone: null, points: 0 },
  { id: 'c2', name: 'Nguyễn Văn A', phone: '0909123456', points: 150, email: 'nva@email.com' },
  { id: 'c3', name: 'Trần Thị B', phone: '0912345678', points: 320, email: 'ttb@email.com' },
];

let MOCK_ORDERS = [
  { id: 'o1', orderNumber: 'ORD001', type: 'POS', status: 'COMPLETED', totalAmount: 85000, discount: 0, finalAmount: 85000, userId: '1', customerId: 'c1', createdAt: new Date(Date.now() - 3600000).toISOString(), items: [
    { id: 'i1', productId: 'p1', quantity: 2, price: 25000, total: 50000 },
    { id: 'i2', productId: 'p3', quantity: 1, price: 35000, total: 35000 },
  ]},
  { id: 'o2', orderNumber: 'ORD002', type: 'POS', status: 'COMPLETED', totalAmount: 48000, discount: 3000, finalAmount: 45000, userId: '2', customerId: 'c2', createdAt: new Date(Date.now() - 7200000).toISOString(), items: [
    { id: 'i3', productId: 'p2', quantity: 1, price: 30000, total: 30000 },
    { id: 'i4', productId: 'p5', quantity: 1, price: 15000, total: 15000 },
  ]},
];

let nextOrderId = 3;
let nextItemId = 10;

class MockApi {
  currentUser = null;
  products = MOCK_CATEGORIES.flatMap(c => c.products);

  async login(username: string, password: string) {
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
    this.currentUser = { ...user };
    delete this.currentUser.password;
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    localStorage.setItem('token', 'mock-token-' + Date.now());
    return { user: this.currentUser, token: this.currentUser.id };
  }

  getMe() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean }) {
    let result = [...this.products];
    if (params?.search) {
      result = result.filter(p => p.name.toLowerCase().includes(params.search!.toLowerCase()));
    }
    if (params?.category) {
      result = result.filter(p => p.categoryId === params.category);
    }
    if (params?.lowStock) {
      result = result.filter(p => p.stock <= 5);
    }
    return result;
  }

  async createProduct(data: any) {
    const newProduct = { id: 'p' + Date.now(), ...data, stock: data.stock || 0 };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: any) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.products[idx] = { ...this.products[idx], ...data };
      return this.products[idx];
    }
    throw new Error('Product not found');
  }

  async deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
  }

  async getCategories() {
    return MOCK_CATEGORIES.map(c => ({
      ...c,
      products: undefined,
      _count: { products: c.products.length }
    }));
  }

  async createCategory(data: any) {
    return { id: 'c' + Date.now(), ...data, isActive: true };
  }

  async getOrders(params?: { status?: string; date?: string }) {
    return MOCK_ORDERS.map(o => ({
      ...o,
      user: MOCK_USERS.find(u => u.id === o.userId),
      customer: MOCK_CUSTOMERS.find(c => c.id === o.customerId),
      items: o.items.map(i => ({
        ...i,
        product: this.products.find(p => p.id === i.productId)
      }))
    }));
  }

  async createOrder(data: any) {
    const order = {
      id: 'o' + (nextOrderId++),
      orderNumber: 'ORD' + String(nextOrderId).padStart(3, '0'),
      type: 'POS',
      status: 'COMPLETED',
      totalAmount: data.totalAmount,
      discount: data.discount || 0,
      finalAmount: data.finalAmount,
      userId: this.currentUser?.id || '1',
      customerId: data.customerId || 'c1',
      createdAt: new Date().toISOString(),
      items: data.items.map((i: any) => ({
        id: 'i' + (nextItemId++),
        ...i
      }))
    };
    MOCK_ORDERS.unshift(order);
    return order;
  }

  async cancelOrder(id: string) {
    const order = MOCK_ORDERS.find(o => o.id === id);
    if (order) order.status = 'CANCELLED';
  }

  async getCustomers(params?: { search?: string }) {
    let result = [...MOCK_CUSTOMERS];
    if (params?.search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        c.phone?.includes(params.search!)
      );
    }
    return result;
  }

  async getCustomerByPhone(phone: string) {
    return MOCK_CUSTOMERS.find(c => c.phone === phone) || null;
  }

  async createCustomer(data: any) {
    const customer = { id: 'c' + Date.now(), points: 0, ...data };
    MOCK_CUSTOMERS.push(customer);
    return customer;
  }

  async updateCustomer(id: string, data: any) {
    const idx = MOCK_CUSTOMERS.findIndex(c => c.id === id);
    if (idx >= 0) {
      MOCK_CUSTOMERS[idx] = { ...MOCK_CUSTOMERS[idx], ...data };
      return MOCK_CUSTOMERS[idx];
    }
    throw new Error('Customer not found');
  }

  async getUsers() {
    return MOCK_USERS.map(u => {
      const { password, ...user } = u;
      return user;
    });
  }

  async createUser(data: any) {
    return { id: 'u' + Date.now(), ...data };
  }

  async updateUser(id: string, data: any) {
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) Object.assign(user, data);
    return user;
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = MOCK_ORDERS.filter(o => o.createdAt.startsWith(today) && o.status === 'COMPLETED');
    return {
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.finalAmount, 0) || 156000,
      todayOrders: todayOrders.length || 3,
      monthRevenue: MOCK_ORDERS.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.finalAmount, 0) || 2450000,
      monthOrders: MOCK_ORDERS.filter(o => o.status === 'COMPLETED').length || 45,
      totalProducts: this.products.length,
      totalCustomers: MOCK_CUSTOMERS.length,
      lowStockCount: this.products.filter(p => p.stock <= 5).length
    };
  }

  async getDashboardData(period?: string) {
    return {
      summary: {
        totalRevenue: MOCK_ORDERS.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.finalAmount, 0),
        totalOrders: MOCK_ORDERS.filter(o => o.status === 'COMPLETED').length,
        totalItems: MOCK_ORDERS.reduce((sum, o) => sum + o.items.length, 0),
        avgOrderValue: 45000
      },
      topProducts: [
        { id: 'p1', name: 'Cà phê đen', quantity: 45, revenue: 1125000 },
        { id: 'p2', name: 'Cà phê sữa', quantity: 38, revenue: 1140000 },
        { id: 'p3', name: 'Trà sữa', quantity: 30, revenue: 1050000 },
      ],
      lowStockProducts: this.products.filter(p => p.stock <= 5).map(p => ({
        id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: 5
      })),
      recentOrders: MOCK_ORDERS.slice(0, 5).map(o => ({
        ...o,
        user: MOCK_USERS.find(u => u.id === o.userId),
        customer: MOCK_CUSTOMERS.find(c => c.id === o.customerId)
      })),
      categoryBreakdown: MOCK_CATEGORIES.map(c => ({
        name: c.name,
        revenue: c.products.reduce((sum, p) => sum + p.price * 10, 0),
        count: c.products.length
      }))
    };
  }
}

export const api = new MockApi();
