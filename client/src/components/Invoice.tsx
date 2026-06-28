import { formatCurrency, formatDateTime } from '../lib/utils';
import { Order } from '../types';
import { Store, Phone, MapPin, CreditCard } from 'lucide-react';

interface InvoiceProps {
  order: Order;
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    tax?: string;
    bank_bin?: string;
    bank_account?: string;
    bank_account_name?: string;
  };
}

export default function Invoice({ order, storeInfo }: InvoiceProps) {
  const hasBankInfo = storeInfo?.bank_bin && storeInfo?.bank_account;

  return (
    <div id="invoice-print" className="bg-white p-4 rounded-xl">
      {/* Header */}
      <div className="text-center mb-4 pb-4 border-b border-black">
        <h2 className="text-lg font-bold uppercase">{storeInfo?.name || 'POS System'}</h2>
        {storeInfo?.address && (
          <p className="text-xs mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {storeInfo.address}
          </p>
        )}
        {storeInfo?.phone && (
          <p className="text-xs flex items-center justify-center gap-1">
            <Phone className="w-3 h-3" /> {storeInfo.phone}
          </p>
        )}
        {storeInfo?.tax && (
          <p className="text-xs">MST: {storeInfo.tax}</p>
        )}
      </div>

      {/* Invoice Info */}
      <div className="text-xs mb-4 pb-4 border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>Mã HD:</span>
          <span className="font-mono font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Ngày:</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Khách:</span>
          <span>{order.customer?.name || 'Khách lẻ'}</span>
        </div>
        {order.customer?.phone && (
          <div className="flex justify-between">
            <span>SDT:</span>
            <span>{order.customer.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Thu ngân:</span>
          <span>{order.user.name}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 pb-4 border-b border-dashed border-gray-400">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1 font-semibold">Sản phẩm</th>
              <th className="text-center py-1 font-semibold">SL</th>
              <th className="text-right py-1 font-semibold">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                </td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="text-xs mb-4 pb-4 border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>Tổng tiền:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold uppercase mt-2 pt-2 border-t border-black">
          <span>Thanh toán:</span>
          <span>{formatCurrency(order.finalAmount)}</span>
        </div>
      </div>

      {/* VietQR Bank Payment */}
      {hasBankInfo && (
        <div className="text-center mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Quét QR để chuyển khoản</span>
          </div>
          <img
            src={`https://img.vietqr.io/image/${storeInfo.bank_bin}-${storeInfo.bank_account}-compact.png?amount=${Math.round(order.finalAmount)}&addInfo=${encodeURIComponent(order.orderNumber)}&accountName=${encodeURIComponent(storeInfo.bank_account_name || '')}`}
            alt="VietQR"
            className="w-44 h-44 mx-auto object-contain bg-white rounded-lg shadow"
          />
          <div className="mt-3 text-xs space-y-1">
            <p className="font-semibold text-gray-800">{formatCurrency(order.finalAmount)}</p>
            <p className="text-gray-600">STK: {storeInfo.bank_account}</p>
            <p className="text-gray-600">ND: {order.orderNumber}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs border-t border-dashed border-gray-400 pt-4">
        <p className="font-semibold">Cảm ơn quý khách!</p>
        <p className="mt-1">Hẹn gặp lại!</p>
      </div>
    </div>
  );
}
