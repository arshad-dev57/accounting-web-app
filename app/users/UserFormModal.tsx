'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X, Shield } from 'lucide-react';
import { rolesForPosMode } from '@/lib/pos-roles';
import { loadUserFromLocal } from '@/lib/permission-service';
import { usersService, SubscriptionUpgradeError } from './service';
import { roleService, RoleRecord } from './role-service';
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
  const [roleId, setRoleId] = useState<string | null>(null);
  const [dbRoles, setDbRoles] = useState<RoleRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [posMode, setPosMode] = useState('retail');

  const defaultPosOptions = useMemo(() => rolesForPosMode(posMode), [posMode]);

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
    setRoleId(user?.roleId || user?.userRole?.id || null);

    // Fetch dynamic roles
    roleService.getRoles().then((res) => {
      if (res.success && res.data) {
        setDbRoles(res.data);
      }
    }).catch(() => {});
  }, [open, user]);

  if (!open) return null;

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
    try {
      setSaving(true);
      setError('');
      // Company-scoped users — no warehouse/location assignment on create/edit
      if (editing && user) {
        await usersService.updateUser(user.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          roleId: roleId || undefined,
          locationIds: [],
        });
      } else {
        await usersService.createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role,
          roleId: roleId || undefined,
          locationIds: [],
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
              value={roleId || role}
              onChange={(e) => {
                const val = e.target.value;
                const matchedDb = dbRoles.find((r) => r.id === val || r.name.toLowerCase() === val.toLowerCase());
                if (matchedDb) {
                  setRole(matchedDb.name);
                  setRoleId(matchedDb.id);
                } else {
                  setRole(val);
                  setRoleId(null);
                }
              }}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#014582]"
            >
              {dbRoles.length > 0 && (
                <optgroup label="Enterprise Roles">
                  {dbRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? '(System)' : '(Custom)'}
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="Standard / POS Roles">
                {defaultPosOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </optgroup>
            </select>
            {dbRoles.find((r) => r.id === roleId || r.name === role)?.description ? (
              <p className="mt-1.5 text-xs text-gray-500">
                {dbRoles.find((r) => r.id === roleId || r.name === role)?.description}
              </p>
            ) : defaultPosOptions.find((r) => r.value === role)?.description ? (
              <p className="mt-1.5 text-xs text-gray-500">
                {defaultPosOptions.find((r) => r.value === role)?.description}
              </p>
            ) : null}
            {posMode === 'retail' && (
              <p className="mt-1 text-xs text-gray-400">
                Restaurant roles (waiter, kitchen) appear after you set POS type to Restaurant on the POS page.
              </p>
            )}
          </label>
          <p className="text-xs text-gray-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            Users are created for the whole company. Assign a POS terminal from POS → Management → Terminals if needed.
          </p>
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
