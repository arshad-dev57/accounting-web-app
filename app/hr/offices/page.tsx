'use client';

import React from 'react';
import { Building2, MapPin, Users, Plus, Loader2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { hrOfficesService, type HROffice } from '@/lib/hr-offices-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all disabled:opacity-60';

type FormState = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  geofenceRadius: string;
  status: 'Active' | 'Inactive';
};

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  geofenceRadius: '150',
  status: 'Active',
};

export default function OfficesPage() {
  const [offices, setOffices] = React.useState<HROffice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<HROffice | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const loadOffices = React.useCallback(async () => {
    try {
      const data = await hrOfficesService.list();
      setOffices(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load offices');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOffices();
  }, [loadOffices]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (office: HROffice) => {
    setEditing(office);
    setForm({
      name: office.name,
      address: office.address,
      latitude: String(office.latitude || ''),
      longitude: String(office.longitude || ''),
      geofenceRadius: String(office.geofenceRadius),
      status: office.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Office name is required';
    if (!form.address.trim()) next.address = 'Address is required';
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const radius = Number(form.geofenceRadius);
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) next.latitude = 'Enter a valid latitude';
    if (!Number.isFinite(lng) || Math.abs(lng) > 180) next.longitude = 'Enter a valid longitude';
    if (!Number.isFinite(radius) || radius <= 0) {
      next.geofenceRadius = 'Enter a valid radius in meters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        geofenceRadius: Number(form.geofenceRadius),
        status: form.status,
      };
      if (editing) {
        await hrOfficesService.update(editing.id, payload);
        toast.success(`Office "${payload.name}" updated`);
      } else {
        await hrOfficesService.create(payload);
        toast.success(`Office "${payload.name}" created`);
      }
      setShowModal(false);
      await loadOffices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save office');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Office Management"
        subtitle={`${offices.length} offices with geofence configs`}
        backHref="/hr/dashboard"
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Office
          </button>
        }
      />

      <HRWorkflowNotice title="Work locations and attendance policy" detail="Each office will anchor a geofence, workweek, holiday calendar, and eligible attendance policy. Employees inherit their primary work location from their profile." />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#014582] animate-spin" />
        </div>
      ) : offices.length === 0 ? (
        <HRCard>
          <div className="py-10 text-center">
            <Building2 className="w-10 h-10 text-[#DDE4EE] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1A1A2E]">No offices yet</p>
            <p className="text-xs text-[#7A8FA6] mt-1">
              Add your first office to start assigning employees and geofences.
            </p>
            <button
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 bg-[#014582] hover:bg-[#013a6b] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Office
            </button>
          </div>
        </HRCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offices.map((o) => (
            <HRCard key={o.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#014582]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#014582]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1A1A2E]">{o.name}</h3>
                    <p className="text-[10px] font-mono font-semibold text-[#7A8FA6]">
                      {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(o)}
                    className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#014582] hover:bg-[#014582]/10 transition-all"
                    title="Edit office"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-[#7A8FA6]">
                  <MapPin className="w-3.5 h-3.5" />
                  {o.address}
                </div>
                <div className="flex items-center gap-2 text-[#7A8FA6]">
                  <Users className="w-3.5 h-3.5" />
                  {o.employees} employees
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#DDE4EE]">
                  <span className="text-[#7A8FA6]">
                    Geofence{o.status === 'Inactive' ? ' · Inactive' : ''}
                  </span>
                  <span
                    className={`font-bold ${
                      o.status === 'Inactive' ? 'text-[#7A8FA6]' : 'text-[#2ECC71]'
                    }`}
                  >
                    {o.geofenceRadius}m radius
                  </span>
                </div>
              </div>
            </HRCard>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE4EE]">
              <h2 className="text-sm font-bold text-[#1A1A2E]">
                {editing ? 'Edit Office' : 'Add Office'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-all"
                disabled={saving}
              >
                <X className="w-4 h-4 text-[#7A8FA6]" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                    Office Name <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., East Branch"
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                    Address <span className="text-[#E74C3C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Gulberg III, Lahore"
                    className={inputCls}
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    disabled={saving}
                  />
                  {errors.address && (
                    <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.address}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      Latitude <span className="text-[#E74C3C]">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="24.8607"
                      className={inputCls}
                      value={form.latitude}
                      onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      disabled={saving}
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.latitude}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      Longitude <span className="text-[#E74C3C]">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="67.0011"
                      className={inputCls}
                      value={form.longitude}
                      onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      disabled={saving}
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{errors.longitude}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
                      Geofence Radius (m) <span className="text-[#E74C3C]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={form.geofenceRadius}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, geofenceRadius: e.target.value }))
                      }
                      disabled={saving}
                    />
                    {errors.geofenceRadius && (
                      <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">
                        {errors.geofenceRadius}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Status</label>
                    <select
                      className={inputCls}
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as FormState['status'],
                        }))
                      }
                      disabled={saving}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-gray-100 transition-all"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#014582] hover:bg-[#013a6b] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HRPage>
  );
}

