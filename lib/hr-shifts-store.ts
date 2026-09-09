// lib/hr-shifts-store.ts
// Server-side store for HR shifts. Stored locally as JSON so the HR module
// stays self-contained and does not touch any existing backend endpoints.

import fs from 'fs';
import path from 'path';

export type HRShiftStatus = 'Active' | 'Scheduled' | 'Draft' | 'Inactive';

export interface HRShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  status: HRShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateShiftInput = Omit<
  HRShift,
  'id' | 'createdAt' | 'updatedAt'
>;

const DATA_DIR = path.join(process.cwd(), '.hr-data');
const DATA_FILE = path.join(DATA_DIR, 'hr-shifts.json');

const DEFAULT_SHIFTS: HRShift[] = [
  {
    id: 'shift_seed_morning',
    name: 'Morning Shift',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    graceMinutes: 15,
    status: 'Active',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'shift_seed_evening',
    name: 'Evening Shift',
    startTime: '02:00 PM',
    endTime: '11:00 PM',
    graceMinutes: 10,
    status: 'Active',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'shift_seed_night',
    name: 'Night Shift',
    startTime: '10:00 PM',
    endTime: '07:00 AM',
    graceMinutes: 10,
    status: 'Scheduled',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'shift_seed_halfday',
    name: 'Half Day Shift',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    graceMinutes: 5,
    status: 'Draft',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
];

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SHIFTS, null, 2), 'utf-8');
  }
}

function readAll(): HRShift[] {
  ensureStore();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HRShift[];
    return raw.map((s, i) => ({
      ...s,
      id: s.id || `shift_seed_${String(s.name || i).toLowerCase().replace(/\s+/g, '-')}`,
      createdAt: s.createdAt || '2026-09-07T00:00:00.000Z',
      updatedAt: s.updatedAt || '2026-09-07T00:00:00.000Z',
    }));
  } catch {
    return [];
  }
}

function writeAll(shifts: HRShift[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(shifts, null, 2), 'utf-8');
}

export function listShifts(): HRShift[] {
  return readAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function getShift(id: string): HRShift | null {
  return readAll().find((s) => s.id === id) || null;
}

export function createShift(input: CreateShiftInput): HRShift {
  const shifts = readAll();
  const now = new Date().toISOString();
  const shift: HRShift = {
    id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    startTime: (input.startTime || '').trim(),
    endTime: (input.endTime || '').trim(),
    graceMinutes: input.graceMinutes || 15,
    status: input.status || 'Active',
    createdAt: now,
    updatedAt: now,
  };
  shifts.push(shift);
  writeAll(shifts);
  return shift;
}

export function updateShift(
  id: string,
  patch: Partial<CreateShiftInput>
): HRShift | null {
  const shifts = readAll();
  const idx = shifts.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: HRShift = {
    ...shifts[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  shifts[idx] = updated;
  writeAll(shifts);
  return updated;
}

export function deleteShift(id: string): boolean {
  const shifts = readAll();
  const filtered = shifts.filter((s) => s.id !== id);
  if (filtered.length === shifts.length) return false;
  writeAll(filtered);
  return true;
}

// ─── validation ──────────────────────────────────────────────
export function validateShiftInput(body: any): {
  valid: boolean;
  errors: string[];
  data: CreateShiftInput;
} {
  const errors: string[] = [];
  const name = String(body?.name || '').trim();
  const startTime = String(body?.startTime || '').trim();
  const endTime = String(body?.endTime || '').trim();

  if (!name) errors.push('Shift name is required');
  if (!startTime) errors.push('Start time is required');
  if (!endTime) errors.push('End time is required');

  let graceMinutes = Number(body?.graceMinutes);
  if (!Number.isFinite(graceMinutes) || graceMinutes < 0) {
    graceMinutes = 15;
  } else {
    graceMinutes = Math.round(graceMinutes);
  }

  const status: HRShiftStatus = ['Active', 'Scheduled', 'Draft', 'Inactive'].includes(body?.status)
    ? (body.status as HRShiftStatus)
    : 'Active';

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      startTime,
      endTime,
      graceMinutes,
      status,
    },
  };
}