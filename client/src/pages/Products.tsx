import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Product, Category } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Image,
  AlertTriangle
} from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '5',
    categoryId: '',
    image: '',
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 5,
      };

      if (editing) {
        await api.updateProduct(editing.id, data);
      } else {
        await api.createProduct(data);
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      description: product.description || '',
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      categoryId: product.categoryId || '',
      image: product.image || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '5',
      categoryId: '',
      image: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-gray-500">{products.length} sản phẩm</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Danh mục</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Giá bán</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tồn kho</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.stock <= product.minStock && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sắp hết
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-1 rounded text-sm ${
                      product.stock <= product.minStock
                        ? 'bg-red-100 text-red-700'
                        : product.stock <= 20
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho tối thiểu</label>
                  <input
                    type="number"
                    value={form.minStock}
                    onChange={e => setForm({ ...form, minStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
