// lib/hr-employees-store.ts
// Server-side store for HR employees. Employees are distinct from ERP users:
// users have ERP access; employees are staff records (they may optionally be
// linked to a user). Stored locally as JSON so the HR module is self-contained
// and does not touch any existing backend endpoints.

import fs from 'fs';
import path from 'path';

export interface HREmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office: string;
  shift: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEmployeeInput = Omit<
  HREmployee,
  'id' | 'employeeCode' | 'createdAt' | 'updatedAt' | 'linkedUserId'
> & { linkedUserId?: string | null };

const DATA_DIR = path.join(process.cwd(), '.hr-data');
const DATA_FILE = path.join(DATA_DIR, 'hr-employees.json');

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
  }
}

function readAll(): HREmployee[] {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HREmployee[];
  } catch {
    return [];
  }
}

function writeAll(employees: HREmployee[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2), 'utf-8');
}

function nextCode(employees: HREmployee[]): string {
  const max = employees.reduce((acc, e) => {
    const n = parseInt(e.employeeCode.replace('EMP-', ''), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `EMP-${String(max + 1).padStart(3, '0')}`;
}

export function listEmployees(): HREmployee[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getEmployee(id: string): HREmployee | null {
  return readAll().find((e) => e.id === id) || null;
}

export function createEmployee(input: CreateEmployeeInput): HREmployee {
  const employees = readAll();
  const now = new Date().toISOString();
  const employee: HREmployee = {
    id: `hr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    employeeCode: nextCode(employees),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: (input.email || '').trim(),
    phone: (input.phone || '').trim(),
    designation: (input.designation || '').trim(),
    department: (input.department || '').trim(),
    office: (input.office || '').trim(),
    shift: (input.shift || '').trim(),
    joiningDate: input.joiningDate || '',
    status: input.status || 'Active',
    linkedUserId: input.linkedUserId || null,
    createdAt: now,
    updatedAt: now,
  };
  employees.push(employee);
  writeAll(employees);
  return employee;
}

export function updateEmployee(
  id: string,
  patch: Partial<CreateEmployeeInput>
): HREmployee | null {
  const employees = readAll();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated: HREmployee = {
    ...employees[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  employees[idx] = updated;
  writeAll(employees);
  return updated;
}

export function deleteEmployee(id: string): boolean {
  const employees = readAll();
  const filtered = employees.filter((e) => e.id !== id);
  if (filtered.length === employees.length) return false;
  writeAll(filtered);
  return true;
}

// ─── validation ──────────────────────────────────────────────
export function validateEmployeeInput(body: any): {
  valid: boolean;
  errors: string[];
  data: CreateEmployeeInput;
} {
  const errors: string[] = [];
  const firstName = String(body?.firstName || '').trim();
  const lastName = String(body?.lastName || '').trim();

  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');

  const email = String(body?.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email address');
  }

  const status = ['Active', 'Inactive', 'On Leave'].includes(body?.status)
    ? (body.status as HREmployee['status'])
    : 'Active';

  return {
    valid: errors.length === 0,
    errors,
    data: {
      firstName,
      lastName,
      email,
      phone: String(body?.phone || '').trim(),
      designation: String(body?.designation || '').trim(),
      department: String(body?.department || '').trim(),
      office: String(body?.office || '').trim(),
      shift: String(body?.shift || '').trim(),
      joiningDate: String(body?.joiningDate || '').trim(),
      status,
      linkedUserId: body?.linkedUserId || null,
    },
  };
}
