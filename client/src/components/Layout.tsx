import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  UserCog,
  Settings,
  Grid3X3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', ownerOnly: false },
  { to: '/pos', icon: ShoppingCart, label: 'Bán hàng (POS)', ownerOnly: false },
  { to: '/orders', icon: ClipboardList, label: 'Đơn hàng', ownerOnly: false },
  { to: '/products', icon: Package, label: 'Sản phẩm', ownerOnly: false },
  { to: '/categories', icon: Grid3X3, label: 'Danh mục', ownerOnly: false },
  { to: '/customers', icon: Users, label: 'Khách hàng', ownerOnly: false },
  { to: '/users', icon: UserCog, label: 'Nhân viên', ownerOnly: true },
  { to: '/settings', icon: Settings, label: 'Cài đặt', ownerOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => !item.ownerOnly || user?.role === 'OWNER');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-bold text-lg text-gray-900">POS System</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg z-30 transform transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {filteredNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
