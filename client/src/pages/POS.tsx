import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Product, Category, Customer } from '../types';
import { formatCurrency } from '../lib/utils';
import Invoice from '../components/Invoice';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  User,
  Trash2,
  Check,
  Receipt,
  Printer
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_tax: string;
  bank_bin: string;
  bank_account: string;
  bank_account_name: string;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers(customerSearch);
    } else {
      setCustomerSuggestions([]);
    }
  }, [customerSearch]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const settings: any = {};
        data.forEach((s: any) => {
          settings[s.key] = s.value;
        });
        setStoreSettings(settings as StoreSettings);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      const customers = await api.getCustomers({ search: query });
      setCustomerSuggestions(customers.slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchSearch && matchCategory && p.stock > 0;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity < product.stock) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectCustomer = (c: Customer) => {
    setCustomer(c);
    setCustomerSearch('');
    setCustomerSuggestions([]);
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setCustomer(null);
    setCustomerSearch('');
    setCustomerSuggestions([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      const order = await api.createOrder({
        customerId: customer?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setLastOrder(order);
      setCart([]);
      setCustomer(null);
      setCustomerSearch('');
      setSuccess(true);
      setShowInvoice(true);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header - Large Search */}
        <div className="p-4 border-b">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm sản phẩm theo tên, mã SKU, barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="text-left p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all active:scale-95"
              >
                <p className="font-semibold text-gray-900 line-clamp-2 text-sm min-h-[2.5rem]">
                  {product.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">{product.sku}</p>
                <p className="text-xl font-bold text-primary-600 mt-2">
                  {formatCurrency(product.price)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Kho: {product.stock}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 bg-white rounded-xl shadow-sm flex flex-col">
        {/* Customer Search with Autocomplete */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Khách hàng
          </label>
          {customer ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-800">{customer.name}</p>
                <p className="text-sm text-green-600">{customer.phone} • {customer.points} điểm</p>
              </div>
              <button
                onClick={clearCustomer}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={customerSearchRef}
                type="text"
                placeholder="Tìm khách hàng theo tên hoặc số điện thoại..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {showCustomerDropdown && customerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerSuggestions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.phone || 'Không có SDT'} • {c.points} điểm</p>
                    </button>
                  ))}
                </div>
              )}
              {customerSearch.length >= 2 && customerSuggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                  Không tìm thấy khách hàng
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
              <p>Giỏ hàng trống</p>
              <p className="text-sm mt-1">Click vào sản phẩm để thêm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-2 hover:bg-gray-100 rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-2 hover:bg-gray-100 rounded-r-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Tổng cộng ({cartCount} sản phẩm)</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg transition-colors"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            ) : success && !showInvoice ? (
              <>
                <Check className="w-6 h-6" />
                Thanh toán thành công!
              </>
            ) : (
              <>
                <ShoppingCart className="w-6 h-6" />
                Thanh toán
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && lastOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold">Hóa đơn</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="In hóa đơn"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <Invoice order={lastOrder} storeInfo={storeSettings || undefined} />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowInvoice(false)}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close customer dropdown */}
      {showCustomerDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowCustomerDropdown(false)}
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
    </div>
  );
}
