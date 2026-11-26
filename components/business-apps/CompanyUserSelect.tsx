'use client';

import { useEffect, useMemo, useState } from 'react';
import { usersService } from '../../app/users/service';
import { bizSelect } from './bizUi';

export type CompanyUserOption = {
  id: string;
  label: string;
  email?: string;
};

type Props = {
  value: string;
  onChange: (userId: string, option?: CompanyUserOption | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeIds?: string[];
  /** Optional externally supplied options (skips fetch). */
  options?: CompanyUserOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
};

let cachedUsers: CompanyUserOption[] | null = null;
let inflight: Promise<CompanyUserOption[]> | null = null;

async function loadCompanyUsers(): Promise<CompanyUserOption[]> {
  if (cachedUsers) return cachedUsers;
  if (inflight) return inflight;
  inflight = usersService
    .getUsers()
    .then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      cachedUsers = rows
        .filter((u) => u?.id && u.isActive !== false)
        .map((u) => ({
          id: u.id,
          label: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || u.id,
          email: u.email,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      return cachedUsers;
    })
    .catch(() => {
      cachedUsers = [];
      return cachedUsers;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidateCompanyUserCache() {
  cachedUsers = null;
}

export default function CompanyUserSelect({
  value,
  onChange,
  placeholder = 'Select employee…',
  className = '',
  disabled,
  excludeIds = [],
  options,
  allowEmpty = true,
  emptyLabel = 'Select employee…',
}: Props) {
  const [loaded, setLoaded] = useState<CompanyUserOption[]>(options || cachedUsers || []);
  const [loading, setLoading] = useState(!options && !cachedUsers);

  useEffect(() => {
    if (options) {
      setLoaded(options);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadCompanyUsers().then((rows) => {
      if (!cancelled) {
        setLoaded(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [options]);

  const filtered = useMemo(() => {
    const exclude = new Set(excludeIds.filter(Boolean));
    return loaded.filter((u) => !exclude.has(u.id) || u.id === value);
  }, [loaded, excludeIds, value]);

  return (
    <select
      value={value}
      disabled={disabled || loading}
      onChange={(e) => {
        const id = e.target.value;
        const opt = filtered.find((u) => u.id === id) || null;
        onChange(id, opt);
      }}
      className={`${bizSelect} w-full ${className}`}
    >
      {allowEmpty ? <option value="">{loading ? 'Loading…' : emptyLabel || placeholder}</option> : null}
      {filtered.map((u) => (
        <option key={u.id} value={u.id}>
          {u.label}
          {u.email ? ` (${u.email})` : ''}
        </option>
      ))}
    </select>
  );
}
