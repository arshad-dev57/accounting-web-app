'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Settings, Plus, X, Edit, Trash2, Save,
  Package, Tag, Ruler, Scale, Truck,
  MapPin, Box, Layers, ChevronDown, Search,
  ArrowLeft, CheckCircle, AlertCircle,
  FileText, Hash, Loader2,
  ShoppingCart, Clock, Globe, CreditCard,
  Shield, Boxes, Building2
} from 'lucide-react';
import { settingService } from '../../api/settings/route';

// ============================================================
// SETTINGS CATEGORIES
// ============================================================
const productSettingCategories = [
  { id: 'productType', label: 'Product Types', icon: Package, description: 'Manage product types (Physical, Digital, Service)' },
  { id: 'rackLocation', label: 'Rack Locations', icon: MapPin, description: 'Manage warehouse rack locations' },
  { id: 'zone', label: 'Zones', icon: Layers, description: 'Manage warehouse zones' },
  { id: 'weightUnit', label: 'Weight Units', icon: Scale, description: 'Manage weight units (KG, Grams, LBs)' },
  { id: 'dimensionUnit', label: 'Dimension Units', icon: Ruler, description: 'Manage dimension units (cm, inches, ft)' },
  { id: 'size', label: 'Sizes', icon: Tag, description: 'Manage product sizes (S, M, L, XL)' },
  { id: 'shippingClass', label: 'Shipping Classes', icon: Truck, description: 'Manage shipping classes' },
  { id: 'stockUnit', label: 'Stock Units', icon: Box, description: 'Manage stock units (Pcs, KG, Meter)' },
  { id: 'taxType', label: 'Tax Types', icon: FileText, description: 'Manage tax types (Inclusive, Exclusive, Zero Rated, Exempt)' },
];

const orderSettingCategories = [
  { id: 'orderType', label: 'Order Types', icon: ShoppingCart, description: 'Manage order types (Standard, Bulk, Wholesale, Express, Pre-Order, Backorder)' },
  { id: 'priority', label: 'Priorities', icon: Clock, description: 'Manage order priorities (Low, Medium, High, Urgent)' },
  { id: 'orderSource', label: 'Order Sources', icon: Globe, description: 'Manage order sources (Web, Mobile, In-Store, Phone, WhatsApp, Email, B2B Portal)' },
  { id: 'shippingMethod', label: 'Shipping Methods', icon: Truck, description: 'Manage shipping methods (Standard, Express, Same Day, Next Day, Pickup, Freight)' },
  { id: 'paymentMethod', label: 'Payment Methods', icon: CreditCard, description: 'Manage payment methods (Cash, Bank Transfer, Credit Card, Cheque, Online, COD)' },
  { id: 'shippingCarrier', label: 'Shipping Carriers', icon: Boxes, description: 'Manage shipping carriers (DHL, FedEx, TCS, UPS, Aramex)' },
  { id: 'physicalStatus', label: 'Physical Status', icon: Shield, description: 'Manage physical status (Physical, Digital, Service, Hybrid)' },
];

// ============================================================
// SETTINGS LIST COMPONENT
// ============================================================
function SettingsList({
  category,
  data,
  onAdd,
  onEdit,
  onDelete,
  loading
}: {
  category: string;
  data: any[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const dataArray = Array.isArray(data) ? data : [];
  const filteredData = dataArray.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const allCategories = [...productSettingCategories, ...orderSettingCategories];
  const categoryInfo = allCategories.find(c => c.id === category);
  const Icon = categoryInfo?.icon || Settings;

  const showSymbol = category === 'currency';
  const showCode = category === 'currency';
  const showZone = category === 'rackLocation';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7c4dff]/10 rounded-lg">
            <Icon className="w-5 h-5 text-[#7c4dff]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{categoryInfo?.label}</h3>
            <p className="text-sm text-gray-500">{categoryInfo?.description}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${categoryInfo?.label?.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                {showSymbol && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>}
                {showCode && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>}
                {showZone && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#7c4dff] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-lg font-medium text-gray-500">No items found</p>
                      <p className="text-sm text-gray-400">Click "Add New" to create one</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.name}
                      {item.isDefault && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </td>
                    {showSymbol && <td className="px-4 py-3 font-mono text-gray-600">{item.symbol || '-'}</td>}
                    {showCode && <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.code || '-'}</td>}
                    {showZone && <td className="px-4 py-3 text-gray-600">{item.zone || '-'}</td>}
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                          disabled={item.isDefault}
                        >
                          <Trash2 className={`w-4 h-4 ${item.isDefault ? 'opacity-30 cursor-not-allowed' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADD/EDIT FORM MODAL
// ============================================================
function SettingsFormModal({
  category,
  item,
  onSave,
  onCancel,
  saving
}: {
  category: string;
  item: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(item?.name || '');
  const [symbol, setSymbol] = useState(item?.symbol || '');
  const [code, setCode] = useState(item?.code || '');
  const [zone, setZone] = useState(item?.zone || '');
  const [isDefault, setIsDefault] = useState(item?.isDefault || false);

  const allCategories = [...productSettingCategories, ...orderSettingCategories];
  const categoryInfo = allCategories.find(c => c.id === category);
  const Icon = categoryInfo?.icon || Settings;
  const isEditing = !!item;
  const isCurrency = category === 'currency';
  const isRackLocation = category === 'rackLocation';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      category,
      name,
      isDefault,
    };
    if (isCurrency) {
      payload.symbol = symbol;
      payload.code = code;
    }
    if (isRackLocation) {
      payload.zone = zone;
    }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7c4dff]/10 rounded-lg">
              <Icon className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {isEditing ? 'Edit' : 'Add'} {categoryInfo?.label?.slice(0, -1)}
            </h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${categoryInfo?.label?.slice(0, -1).toLowerCase()} name...`}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          {isCurrency && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Symbol</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g., $, €, £" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g., PKR, USD" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </>
          )}

          {isRackLocation && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50">
                <option value="">Select zone...</option>
                <option value="Receiving">Receiving</option>
                <option value="Storage">Storage</option>
                <option value="Picking">Picking</option>
                <option value="Shipping">Shipping</option>
                <option value="Returns">Returns</option>
                <option value="Bulk">Bulk</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-[#7c4dff] rounded border-gray-300"
            />
            <label className="text-sm font-medium text-gray-700">Set as Default</label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================
export default function ProductSettingsPage() {
  const [activeCategory, setActiveCategory] = useState('productType');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await settingService.getSettings(activeCategory);
      setData(settings);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load settings');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const currentItem = data.find(i => i._id === id);
    if (currentItem?.isDefault) {
      setErrorMessage('Cannot delete default item. Set another item as default first.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await settingService.deleteSetting(id);
      showSuccess('Item deleted successfully!');
      fetchSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete item');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleSave = async (payload: any) => {
    setSaving(true);
    try {
      if (editingItem) {
        await settingService.updateSetting(editingItem._id, payload);
      } else {
        await settingService.createSetting(payload);
      }
      setShowForm(false);
      setEditingItem(null);
      showSuccess('Item saved successfully!');
      fetchSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save item');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const allCategories = [...productSettingCategories, ...orderSettingCategories];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/warehouse/products" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#7c4dff]" />
            Settings
          </h2>
        </div>
        <span className="text-sm text-gray-400">Manage dropdown values</span>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* ─── PRODUCT SETTINGS SECTION ───────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#7c4dff]" />
            <h3 className="text-lg font-bold text-gray-800">Product Settings</h3>
            <span className="text-xs text-gray-400 ml-2">Manage product dropdown values</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex overflow-x-auto gap-1">
            {productSettingCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${isActive ? 'bg-[#7c4dff] text-white shadow-lg shadow-purple-500/25' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ORDER SETTINGS SECTION ─────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#7c4dff]" />
            <h3 className="text-lg font-bold text-gray-800">Order Settings</h3>
            <span className="text-xs text-gray-400 ml-2">Manage order dropdown values</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex overflow-x-auto gap-1">
            {orderSettingCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${isActive ? 'bg-[#7c4dff] text-white shadow-lg shadow-purple-500/25' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── SETTINGS LIST ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <SettingsList
          category={activeCategory}
          data={data}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      {/* ─── MODAL ────────────────────────────────────────────── */}
      {showForm && (
        <SettingsFormModal
          category={activeCategory}
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}