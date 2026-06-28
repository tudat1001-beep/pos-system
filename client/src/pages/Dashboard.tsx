import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DashboardStats } from '../types';
import { formatCurrency } from '../lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Doanh thu hôm nay',
      value: formatCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      subtext: `${stats?.todayOrders || 0} đơn hàng`,
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats?.monthRevenue || 0),
      icon: TrendingUp,
      color: 'bg-blue-500',
      subtext: `${stats?.monthOrders || 0} đơn hàng`,
    },
    {
      title: 'Tổng sản phẩm',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      subtext: 'Sản phẩm',
    },
    {
      title: 'Tổng khách hàng',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-orange-500',
      subtext: 'Khách hàng',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hệ thống bán hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {(stats?.lowStockCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                Cảnh báo: {stats?.lowStockCount} sản phẩm sắp hết hàng
              </p>
              <p className="text-sm text-amber-600">
                Cần nhập thêm hàng để tránh hết stock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/pos"
            className="flex flex-col items-center gap-2 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            <span className="font-medium text-gray-900">Bán hàng</span>
          </a>
          <a
            href="/products"
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Package className="w-8 h-8 text-purple-600" />
            <span className="font-medium text-gray-900">Sản phẩm</span>
          </a>
          <a
            href="/orders"
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="font-medium text-gray-900">Đơn hàng</span>
          </a>
          <a
            href="/customers"
            className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Users className="w-8 h-8 text-orange-600" />
            <span className="font-medium text-gray-900">Khách hàng</span>
          </a>
        </div>
      </div>
    </div>
  );
}
