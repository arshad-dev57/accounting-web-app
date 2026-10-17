'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  X,
  Save,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { normalizeCustomer, type Customer } from '../../app/api/customer/route';

/** Same Add/Edit Customer form used on the Customers page. */
export function CustomerFormModal({
  initialData,
  onSave,
  onCancel,
  saving,
}: {
  initialData?: Partial<Customer>;
  onSave: (data: Partial<Customer>) => void | Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const seeded = initialData ? normalizeCustomer(initialData) : undefined;
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'Individual',
    taxId: '',
    address: { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
    status: 'Active',
    notes: '',
    tags: [],
    ...seeded,
    company: seeded?.company || seeded?.companyName || '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      ...(seeded?.address || {}),
    },
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Customer name is required');
      return;
    }
    setError('');
    onSave(formData);
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev: Partial<Customer>) => ({ ...prev, [field]: value }));
  };

  const title = initialData?._id || initialData?.id ? 'Edit Customer' : 'Add Customer';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#014582]/10 rounded-lg">
              <User className="w-5 h-5 text-[#014582]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="+92-300-1234567"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Company name"
                    value={formData.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Type</label>
                <select
                  value={formData.customerType || 'Individual'}
                  onChange={(e) => handleChange('customerType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax ID</label>
                <input
                  type="text"
                  placeholder="Tax ID / GST Number"
                  value={formData.taxId || ''}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={formData.address?.street || ''}
                    onChange={(e) =>
                      setFormData((prev: Partial<Customer>) => ({
                        ...prev,
                        address: { ...(prev.address || {}), street: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address?.city || ''}
                    onChange={(e) =>
                      setFormData((prev: Partial<Customer>) => ({
                        ...prev,
                        address: { ...(prev.address || {}), city: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address?.state || ''}
                    onChange={(e) =>
                      setFormData((prev: Partial<Customer>) => ({
                        ...prev,
                        address: { ...(prev.address || {}), state: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={formData.address?.postalCode || ''}
                    onChange={(e) =>
                      setFormData((prev: Partial<Customer>) => ({
                        ...prev,
                        address: { ...(prev.address || {}), postalCode: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.address?.country || 'Pakistan'}
                    onChange={(e) =>
                      setFormData((prev: Partial<Customer>) => ({
                        ...prev,
                        address: { ...(prev.address || {}), country: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
              <textarea
                rows={2}
                placeholder="Additional notes..."
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
              <input
                type="text"
                placeholder="e.g., VIP, Wholesale, International"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    'tags',
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Comma separated values</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {initialData?._id || initialData?.id ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
