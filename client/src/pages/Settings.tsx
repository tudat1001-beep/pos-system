import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Store, Phone, MapPin, Mail, Save, CreditCard, ChevronDown, Check } from 'lucide-react';

interface Settings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_tax: string;
  bank_bin: string;
  bank_account: string;
  bank_account_name: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    store_name: 'ShopVue POS',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_tax: '',
    bank_bin: '',
    bank_account: '',
    bank_account_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [searchBank, setSearchBank] = useState('');

  useEffect(() => {
    loadSettings();
    loadBanks();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const settingsObj: any = {};
        data.forEach((s: any) => {
          settingsObj[s.key] = s.value;
        });
        setSettings({
          store_name: settingsObj.store_name || 'ShopVue POS',
          store_address: settingsObj.store_address || '',
          store_phone: settingsObj.store_phone || '',
          store_email: settingsObj.store_email || '',
          store_tax: settingsObj.store_tax || '',
          bank_bin: settingsObj.bank_bin || '',
          bank_account: settingsObj.bank_account || '',
          bank_account_name: settingsObj.bank_account_name || '',
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await fetch('https://api.vietqr.io/v2/banks');
      const data = await response.json();
      if (data.code === '00') {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  };

  const selectedBank = banks.find(b => b.bin === settings.bank_bin);

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(searchBank.toLowerCase()) ||
    b.shortName.toLowerCase().includes(searchBank.toLowerCase()) ||
    b.bin.includes(searchBank)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const keys = [
        'store_name', 'store_address', 'store_phone', 'store_email', 'store_tax',
        'bank_bin', 'bank_account', 'bank_account_name'
      ];

      await Promise.all(keys.map(key => 
        fetch('/api/settings', {
          method: 'POST',
          headers,
          body: JSON.stringify({ key, value: (settings as any)[key] }),
        })
      ));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt cửa hàng</h1>
        <p className="text-gray-500">Quản lý thông tin cửa hàng của bạn</p>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold">Thông tin cửa hàng</h2>
            <p className="text-sm text-gray-500">Hiển thị trên hóa đơn</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={e => setSettings({ ...settings, store_name: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <textarea
              value={settings.store_address}
              onChange={e => setSettings({ ...settings, store_address: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={settings.store_phone}
                onChange={e => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.store_email}
                onChange={e => setSettings({ ...settings, store_email: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
            <input
              type="text"
              value={settings.store_tax}
              onChange={e => setSettings({ ...settings, store_tax: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Bank Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold">Thông tin thanh toán</h2>
            <p className="text-sm text-gray-500">QR VietQR trên hóa đơn</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBankDropdown(!showBankDropdown)}
                className="w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between bg-white"
              >
                {selectedBank ? (
                  <div className="flex items-center gap-3">
                    <img src={selectedBank.logo} alt="" className="w-8 h-8 object-contain" />
                    <span>{selectedBank.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Chọn ngân hàng...</span>
                )}
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showBankDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64">
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder="Tìm ngân hàng..."
                      value={searchBank}
                      onChange={e => setSearchBank(e.target.value)}
                      className="w-full px-3 py-2 border rounded text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredBanks.slice(0, 50).map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSettings({ ...settings, bank_bin: bank.bin });
                          setShowBankDropdown(false);
                          setSearchBank('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                      >
                        <img src={bank.logo} alt="" className="w-8 h-8 object-contain" />
                        <div className="flex-1">
                          <p className="font-medium">{bank.shortName}</p>
                          <p className="text-xs text-gray-500">{bank.name}</p>
                        </div>
                        {settings.bank_bin === bank.bin && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
            <input
              type="text"
              value={settings.bank_account}
              onChange={e => setSettings({ ...settings, bank_account: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="VD: 1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
            <input
              type="text"
              value={settings.bank_account_name}
              onChange={e => setSettings({ ...settings, bank_account_name: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="VD: NGUYEN VAN A"
            />
          </div>

          {/* Preview QR */}
          {settings.bank_bin && settings.bank_account && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Xem trước QR:</p>
              <img
                src={`https://img.vietqr.io/image/${settings.bank_bin}-${settings.bank_account}-compact.png?amount=0&addInfo=test&accountName=${encodeURIComponent(settings.bank_account_name || '')}`}
                alt="QR Preview"
                className="w-40 h-40 mx-auto object-contain bg-white rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : saved ? (
            <>
              <Save className="w-5 h-5" />
              Đã lưu!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
