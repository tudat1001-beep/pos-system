const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

class Api {
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  getMe() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Products
  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStock) query.append('lowStock', 'true');
    
    const res = await fetch(`${API_BASE}/products?${query}`, { headers: getHeaders() });
    return await res.json();
  }

  async createProduct(data: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async updateProduct(id: string, data: any) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async deleteProduct(id: string) {
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getHeaders() });
  }

  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    return await res.json();
  }

  async createCategory(data: any) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  // Orders
  async getOrders(params?: { status?: string; date?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.date) query.append('date', params.date);
    
    const res = await fetch(`${API_BASE}/orders?${query}`, { headers: getHeaders() });
    return await res.json();
  }

  async createOrder(data: any) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async cancelOrder(id: string) {
    await fetch(`${API_BASE}/orders/${id}/cancel`, { method: 'PATCH', headers: getHeaders() });
  }

  // Customers
  async getCustomers(params?: { search?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    
    const res = await fetch(`${API_BASE}/customers?${query}`, { headers: getHeaders() });
    return await res.json();
  }

  async getCustomerByPhone(phone: string) {
    const res = await fetch(`${API_BASE}/customers/phone/${phone}`, { headers: getHeaders() });
    return await res.json();
  }

  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async updateCustomer(id: string, data: any) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  // Users
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return await res.json();
  }

  async createUser(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    return await res.json();
  }

  async getDashboardData(period?: string) {
    const query = period ? `?period=${period}` : '';
    const res = await fetch(`${API_BASE}/dashboard${query}`, { headers: getHeaders() });
    return await res.json();
  }
}

export const api = new Api();
