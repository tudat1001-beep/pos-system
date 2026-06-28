import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { Search, Eye, X } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
        <p className="text-gray-500">{orders.length} đơn hàng</p>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm đơn hàng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mã đơn</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.customer?.name || 'Khách lẻ'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(order.finalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Chi tiết đơn hàng</h3>
                <p className="text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.customer?.name || 'Khách lẻ'}</p>
                  {selectedOrder.customer?.phone && (
                    <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nhân viên</p>
                  <p className="font-medium">{selectedOrder.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Sản phẩm</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng tiền</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Thanh toán</span>
                  <span>{formatCurrency(selectedOrder.finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
