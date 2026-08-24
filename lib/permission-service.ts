import {
  saveCurrencyLocal as persistCurrencyKeys,
  updateCurrencyFromUserData,
} from './currency-service';

export interface UserPermission {
  id: string;
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: UserPermission[];
  organizationName?: string;
  address?: string;
  country?: string;
  phone?: string;
  businessDetails?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  [key: string]: unknown;
}

export const USER_STORAGE_KEY = 'user';

export function isAdminRole(role?: string | null): boolean {
  const r = (role || '').toLowerCase().trim();
  return (
    r === 'admin' ||
    r === 'owner' ||
    r === 'superadmin' ||
    r === 'company_admin'
  );
}

function normalizePermissions(raw: unknown): UserPermission[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    if (p && typeof p === 'object') {
      const item = p as Record<string, unknown>;
      return {
        id: String(item.id ?? ''),
        page: String(item.page ?? ''),
        canView: item.canView !== false,
        canCreate: Boolean(item.canCreate),
        canEdit: Boolean(item.canEdit),
        canDelete: Boolean(item.canDelete),
      };
    }
    return {
      id: '',
      page: String(p ?? ''),
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  });
}

/** Normalize API user payload for localStorage + usePermissions */
export function normalizeUserForStorage(raw: Record<string, unknown> | null | undefined): StoredUser | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.id ?? raw._id ?? '');
  return {
    ...raw,
    id,
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    email: String(raw.email ?? ''),
    role: String(raw.role ?? 'user'),
    permissions: normalizePermissions(raw.permissions),
    organizationName: raw.organizationName ? String(raw.organizationName) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    country: raw.country ? String(raw.country) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    businessDetails:
      raw.businessDetails && typeof raw.businessDetails === 'object'
        ? (raw.businessDetails as Record<string, unknown>)
        : undefined,
    subscription:
      raw.subscription && typeof raw.subscription === 'object'
        ? (raw.subscription as Record<string, unknown>)
        : undefined,
  };
}

export function saveUserToLocal(raw: Record<string, unknown>): StoredUser | null {
  if (typeof window === 'undefined') return null;

  const user = normalizeUserForStorage(raw);
  if (!user) return null;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  if (user.organizationName) {
    localStorage.setItem('company_name', user.organizationName);
  }
  if (user.address) {
    localStorage.setItem('company_address', user.address);
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  if (fullName) localStorage.setItem('user_name', fullName);
  if (user.email) localStorage.setItem('user_email', user.email);

  // Restore currency from DB payload into local storage (Flutter updateFromUserData)
  updateCurrencyFromUserData(user as Record<string, unknown>);

  return user;
}

export function loadUserFromLocal(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return normalizeUserForStorage(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearUserFromLocal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('userProfile');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  localStorage.removeItem('company_name');
  localStorage.removeItem('company_address');
  localStorage.removeItem('bisonstechs_company_branding');
}

export function saveCurrencyLocal(code: string, symbol: string, name?: string): void {
  persistCurrencyKeys({ code, symbol, name });
}
