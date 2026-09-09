// lib/hr-holidays-store.ts
// Server-side store for HR holidays. Stored locally as JSON so the HR module
// stays self-contained and does not touch any existing backend endpoints.

import fs from 'fs';
import path from 'path';

export type HRHolidayType = 'National' | 'Religious' | 'Company';

export interface HRHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: HRHolidayType;
  createdAt: string;
  updatedAt: string;
}

export type CreateHolidayInput = Omit<
  HRHoliday,
  'id' | 'createdAt' | 'updatedAt'
>;

const DATA_DIR = path.join(process.cwd(), '.hr-data');
const DATA_FILE = path.join(DATA_DIR, 'hr-holidays.json');

// Day name lookup for a YYYY-MM-DD date
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function holidayDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? '' : WEEKDAYS[dt.getDay()];
}

const DEFAULT_HOLIDAYS: HRHoliday[] = [
  {
    id: 'holiday_seed_independence',
    name: 'Independence Day',
    date: '2026-08-14',
    type: 'National',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'holiday_seed_eidulfitr',
    name: 'Eid ul Fitr',
    date: '2026-03-20',
    type: 'Religious',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'holiday_seed_eiduladha',
    name: 'Eid ul Adha',
    date: '2026-05-27',
    type: 'Religious',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'holiday_seed_quaideazam',
    name: 'Quaid-e-Azam Day',
    date: '2026-12-25',
    type: 'National',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'holiday_seed_foundation',
    name: 'Company Foundation Day',
    date: '2026-10-10',
    type: 'Company',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
];

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_HOLIDAYS, null, 2), 'utf-8');
  }
}

function readAll(): HRHoliday[] {
  ensureStore();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HRHoliday[];
    return raw.map((h, i) => ({
      ...h,
      id: h.id || `holiday_seed_${String(h.name || i).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      createdAt: h.createdAt || '2026-09-07T00:00:00.000Z',
      updatedAt: h.updatedAt || '2026-09-07T00:00:00.000Z',
    }));
  } catch {
    return [];
  }
}

function writeAll(holidays: HRHoliday[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(holidays, null, 2), 'utf-8');
}

export function listHolidays(): HRHoliday[] {
  return readAll().sort((a, b) => a.date.localeCompare(b.date));
}

export function getHoliday(id: string): HRHoliday | null {
  return readAll().find((h) => h.id === id) || null;
}

export function createHoliday(input: CreateHolidayInput): HRHoliday {
  const holidays = readAll();
  const now = new Date().toISOString();
  const holiday: HRHoliday = {
    id: `holiday_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    date: input.date,
    type: input.type,
    createdAt: now,
    updatedAt: now,
  };
  holidays.push(holiday);
  writeAll(holidays);
  return holiday;
}

export function updateHoliday(
  id: string,
  patch: Partial<CreateHolidayInput>
): HRHoliday | null {
  const holidays = readAll();
  const idx = holidays.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  const updated: HRHoliday = {
    ...holidays[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  holidays[idx] = updated;
  writeAll(holidays);
  return updated;
}

export function deleteHoliday(id: string): boolean {
  const holidays = readAll();
  const filtered = holidays.filter((h) => h.id !== id);
  if (filtered.length === holidays.length) return false;
  writeAll(filtered);
  return true;
}

// ─── validation ──────────────────────────────────────────────
export function validateHolidayInput(body: any): {
  valid: boolean;
  errors: string[];
  data: CreateHolidayInput;
} {
  const errors: string[] = [];
  const name = String(body?.name || '').trim();
  const date = String(body?.date || '').trim();
  const type: HRHolidayType = ['National', 'Religious', 'Company'].includes(body?.type)
    ? (body.type as HRHolidayType)
    : 'National';

  if (!name) errors.push('Holiday name is required');
  if (!date) {
    errors.push('Date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  } else if (!holidayDay(date)) {
    errors.push('Invalid date');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      date,
      type,
    },
  };
}