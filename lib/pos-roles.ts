export type PosMode = 'retail' | 'restaurant';

export type PosRoleOption = {
  value: string;
  label: string;
  description?: string;
};

export const RETAIL_POS_ROLES: PosRoleOption[] = [
  { value: 'user', label: 'User', description: 'General ERP access, no POS register' },
  { value: 'cashier', label: 'Cashier', description: 'Desktop POS register — checkout & shifts' },
  { value: 'manager', label: 'Manager', description: 'Supervise staff and review reports' },
  { value: 'admin', label: 'Admin', description: 'Full access including all locations' },
];

export const RESTAURANT_POS_ROLES: PosRoleOption[] = [
  { value: 'waiter', label: 'Waiter', description: 'Order Pick mobile app — take table orders' },
  { value: 'kitchen', label: 'Kitchen staff', description: 'Kitchen display on desktop POS' },
  { value: 'cashier', label: 'Cashier', description: 'Desktop POS — pay ready orders & checkout' },
  { value: 'user', label: 'User', description: 'General ERP access, no POS register' },
  { value: 'manager', label: 'Manager', description: 'Supervise staff and review reports' },
  { value: 'admin', label: 'Admin', description: 'Full access including all locations' },
];

export function rolesForPosMode(posMode?: string | null): PosRoleOption[] {
  return posMode === 'restaurant' ? RESTAURANT_POS_ROLES : RETAIL_POS_ROLES;
}

export function posModeLabel(posMode?: string | null): string {
  return posMode === 'restaurant' ? 'Restaurant / Cafe' : 'Retail / Shop';
}
