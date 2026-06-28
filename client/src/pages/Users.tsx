import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { formatDate } from '../lib/utils';
import { Plus, Edit, X, Shield, UserCog } from 'lucide-react';

interface Permissions {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canManageCustomers: boolean;
  canProcessReturns: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    permissions: {
      canManageProducts: true,
      canManageOrders: true,
      canViewReports: false,
      canManageCustomers: true,
      canProcessReturns: false,
    } as Permissions,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateUser(editing.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
        });
      } else {
        await api.createUser({
          ...form,
          permissions: JSON.stringify(form.permissions),
        });
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      permissions: {
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: false,
        canManageCustomers: true,
        canProcessReturns: false,
      },
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      permissions: {
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: false,
        canManageCustomers: true,
        canProcessReturns: false,
      },
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
          <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
          <p className="text-gray-500">{users.length} nhân viên</p>
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
          Thêm nhân viên
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  user.role === 'OWNER' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  {user.role === 'OWNER' ? (
                    <Shield className="w-6 h-6 text-primary-600" />
                  ) : (
                    <UserCog className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.role === 'OWNER' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEdit(user)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">@{user.username}</span>
              </div>
              {user.email && (
                <p className="text-gray-500">{user.email}</p>
              )}
              {user.phone && (
                <p className="text-gray-500">{user.phone}</p>
              )}
              <p className="text-gray-400 text-xs">
                Ngày tạo: {formatDate(user.createdAt || new Date())}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!!editing}
                    required={!editing}
                  />
                </div>
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required={!editing}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="STAFF"
                      checked={form.role === 'STAFF'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    />
                    <span>Nhân viên</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="OWNER"
                      checked={form.role === 'OWNER'}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    />
                    <span>Chủ cửa hàng</span>
                  </label>
                </div>
              </div>

              {form.role === 'STAFF' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                  <div className="space-y-2 border rounded-lg p-3">
                    <label className="flex items-center justify-between">
                      <span>Quản lý sản phẩm</span>
                      <input
                        type="checkbox"
                        checked={form.permissions.canManageProducts}
                        onChange={e => setForm({
                          ...form,
                          permissions: { ...form.permissions, canManageProducts: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Xử lý đơn hàng</span>
                      <input
                        type="checkbox"
                        checked={form.permissions.canManageOrders}
                        onChange={e => setForm({
                          ...form,
                          permissions: { ...form.permissions, canManageOrders: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Xem báo cáo</span>
                      <input
                        type="checkbox"
                        checked={form.permissions.canViewReports}
                        onChange={e => setForm({
                          ...form,
                          permissions: { ...form.permissions, canViewReports: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Quản lý khách hàng</span>
                      <input
                        type="checkbox"
                        checked={form.permissions.canManageCustomers}
                        onChange={e => setForm({
                          ...form,
                          permissions: { ...form.permissions, canManageCustomers: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Xử lý đổi/trả hàng</span>
                      <input
                        type="checkbox"
                        checked={form.permissions.canProcessReturns}
                        onChange={e => setForm({
                          ...form,
                          permissions: { ...form.permissions, canProcessReturns: e.target.checked }
                        })}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>
              )}

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
                  {editing ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
