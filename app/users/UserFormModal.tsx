'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { locationService, type Location } from '@/lib/location-service';
import { rolesForPosMode } from '@/lib/pos-roles';
import { loadUserFromLocal } from '@/lib/permission-service';
import { usersService, SubscriptionUpgradeError } from './service';
import type { User } from './types';
import type { SubscriptionCapacity, UpgradeQuote } from '@/lib/subscription-pricing';

type Props = {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onUpgradeRequired?: (payload: {
    reason: 'user_seat';
    capacity: SubscriptionCapacity;
    upgrade: UpgradeQuote;
  }) => void;
};


function resolvePosMode(): string {
  const user = loadUserFromLocal();
  const company = user?.company as { posMode?: string } | undefined;
  return company?.posMode || (user?.posMode as string | undefined) || 'retail';
}

export default function UserFormModal({ open, user, onClose, onSaved, onUpgradeRequired }: Props) {
  const editing = Boolean(user?.id);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [posMode, setPosMode] = useState('retail');

  const roleOptions = useMemo(() => rolesForPosMode(posMode), [posMode]);

  useEffect(() => {
    if (!open) return;
    setPosMode(resolvePosMode());
    setError('');
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setPassword('');
    setPhone(user?.phone || '');
    setRole(user?.role || 'user');
    setLocationIds(user?.locationIds || user?.locations?.map((l) => l.id) || []);
    void locationService
      .list()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [open, user]);

  useEffect(() => {
    if (!roleOptions.some((r) => r.value === role)) {
      setRole(roleOptions[0]?.value || 'user');
    }
  }, [posMode, roleOptions, role]);

  if (!open) return null;

  const isAdminRole =
    role === 'admin' ||
    role === 'owner' ||
    role === 'superadmin' ||
    role === 'manager';

  const toggleLocation = (id: string) => {
    setLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name and email are required');
      return;
    }
    if (!editing && password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!isAdminRole && locationIds.length === 0) {
      setError('Assign at least one store / location');
      return;
    }
    try {
      setSaving(true);
      setError('');
      if (editing && user) {
        await usersService.updateUser(user.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          locationIds: isAdminRole ? locationIds : locationIds,
        });
      } else {
        await usersService.createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role,
          locationIds,
        });
      }
      await onSaved();
      onClose();
    } catch (err: any) {
      if (err instanceof SubscriptionUpgradeError && onUpgradeRequired) {
        onUpgradeRequired({
          reason: 'user_seat',
          capacity: err.capacity,
          upgrade: err.upgrade,
        });
        onClose();
        return;
      }
      setError(err?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {editing ? 'Edit user' : 'Add user'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </label>
            <label className="text-sm text-gray-700">
              Last name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </label>
          </div>
          <label className="block text-sm text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </label>
          {!editing && (
            <label className="block text-sm text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
              />
            </label>
          )}
          <label className="block text-sm text-gray-700">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
            />
          </label>
          <label className="block text-sm text-gray-700">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {roleOptions.find((r) => r.value === role)?.description && (
              <p className="mt-1.5 text-xs text-gray-500">
                {roleOptions.find((r) => r.value === role)?.description}
              </p>
            )}
            {posMode === 'retail' && (
              <p className="mt-1 text-xs text-gray-400">
                Restaurant roles (waiter, kitchen) appear after you set POS type to Restaurant on the POS page.
              </p>
            )}
          </label>
          <div>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#014582]" />
              Store access
            </p>
            {isAdminRole ? (
              <p className="text-xs text-gray-500">
                Admin can see every location. Optional checkboxes below are stored for later if you change the role.
              </p>
            ) : null}
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500">No locations found. Create stores in Warehouse → Locations first.</p>
              ) : (
                locations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={locationIds.includes(loc.id)}
                      onChange={() => toggleLocation(loc.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <span>
                      {loc.name}
                      <span className="text-gray-400"> · {loc.code}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6c3ae8] disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Save' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
