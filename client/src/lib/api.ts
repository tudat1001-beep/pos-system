const API_URL = (import.meta.env.VITE_API_URL as string) || '/api';

class Api {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Products
  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.lowStock) query.set('lowStock', 'true');
    return this.request(`/products?${query}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/products', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(data: any) {
    return this.request('/categories', { method: 'POST', body: JSON.stringify(data) });
  }

  // Orders
  async getOrders(params?: { status?: string; date?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    return this.request(`/orders?${query}`);
  }

  async createOrder(data: any) {
    return this.request('/orders', { method: 'POST', body: JSON.stringify(data) });
  }

  async cancelOrder(id: string) {
    return this.request(`/orders/${id}/cancel`, { method: 'POST' });
  }

  // Customers
  async getCustomers(params?: { search?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    return this.request(`/customers?${query}`);
  }

  async getCustomerByPhone(phone: string) {
    return this.request(`/customers/phone/${phone}`);
  }

  async createCustomer(data: any) {
    return this.request('/customers', { method: 'POST', body: JSON.stringify(data) });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(data: any) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardData(period?: string) {
    return this.request(`/dashboard?period=${period || 'week'}`);
  }
}

export const api = new Api();
