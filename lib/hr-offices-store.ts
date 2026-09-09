
import fs from 'fs';
import path from 'path';

export interface HROffice {
  id: string;
  name: string;
  code: string;
  address: string;
  geofenceRadius: number; // meters
  latitude?: number;
  longitude?: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export type CreateOfficeInput = Omit<
  HROffice,
  'id' | 'createdAt' | 'updatedAt'
>;

const DATA_DIR = path.join(process.cwd(), '.hr-data');
const DATA_FILE = path.join(DATA_DIR, 'hr-offices.json');

const DEFAULT_OFFICES: HROffice[] = [
  {
    id: 'office_seed_ho01',
    name: 'Head Office',
    code: 'HO-01',
    address: 'Gulberg III, Lahore',
    geofenceRadius: 150,
    latitude: 31.5204,
    longitude: 74.3587,
    status: 'Active',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'office_seed_nb02',
    name: 'North Branch',
    code: 'NB-02',
    address: 'Blue Area, Islamabad',
    geofenceRadius: 200,
    latitude: 33.6844,
    longitude: 73.0479,
    status: 'Active',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
  {
    id: 'office_seed_sb03',
    name: 'South Branch',
    code: 'SB-03',
    address: 'Clifton, Karachi',
    geofenceRadius: 150,
    latitude: 24.8607,
    longitude: 67.0011,
    status: 'Active',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
  },
];

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_OFFICES, null, 2), 'utf-8');
  }
}

function readAll(): HROffice[] {
  ensureStore();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HROffice[];
    // Normalize records created before ids/timestamps were introduced
    return raw.map((o, i) => ({
      ...o,
      id: o.id || `office_seed_${String(o.code || o.name || i).toLowerCase()}`,
      createdAt: o.createdAt || '2026-09-07T00:00:00.000Z',
      updatedAt: o.updatedAt || '2026-09-07T00:00:00.000Z',
    }));
  } catch {
    return [];
  }
}

function writeAll(offices: HROffice[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(offices, null, 2), 'utf-8');
}

function nextCode(offices: HROffice[], name: string): string {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  const prefix = initials || 'OF';
  const max = offices.reduce((acc, o) => {
    const m = o.code.match(/-(\d+)$/);
    return m && o.code.startsWith(prefix) ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(2, '0')}`;
}

export function listOffices(): HROffice[] {
  return readAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function getOffice(id: string): HROffice | null {
  return readAll().find((o) => o.id === id) || null;
}

export function createOffice(input: CreateOfficeInput): HROffice {
  const offices = readAll();
  const now = new Date().toISOString();
  const office: HROffice = {
    id: `office_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    code: (input.code || '').trim() || nextCode(offices, input.name),
    address: (input.address || '').trim(),
    geofenceRadius: input.geofenceRadius || 150,
    latitude: input.latitude,
    longitude: input.longitude,
    status: input.status || 'Active',
    createdAt: now,
    updatedAt: now,
  };
  offices.push(office);
  writeAll(offices);
  return office;
}

export function updateOffice(
  id: string,
  patch: Partial<CreateOfficeInput>
): HROffice | null {
  const offices = readAll();
  const idx = offices.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const safePatch = { ...patch };
  if (safePatch.code === '') delete safePatch.code;
  const updated: HROffice = {
    ...offices[idx],
    ...safePatch,
    updatedAt: new Date().toISOString(),
  };
  offices[idx] = updated;
  writeAll(offices);
  return updated;
}

export function deleteOffice(id: string): boolean {
  const offices = readAll();
  const filtered = offices.filter((o) => o.id !== id);
  if (filtered.length === offices.length) return false;
  writeAll(filtered);
  return true;
}

export function validateOfficeInput(body: any): {
  valid: boolean;
  errors: string[];
  data: CreateOfficeInput;
} {
  const errors: string[] = [];
  const name = String(body?.name || '').trim();

  if (!name) errors.push('Office name is required');
  if (name.length > 100) errors.push('Office name is too long');

  const address = String(body?.address || '').trim();
  if (!address) errors.push('Address is required');

  let geofenceRadius = Number(body?.geofenceRadius);
  if (!Number.isFinite(geofenceRadius) || geofenceRadius <= 0) {
    geofenceRadius = 150;
  } else {
    geofenceRadius = Math.round(geofenceRadius);
  }

  const status = ['Active', 'Inactive'].includes(body?.status)
    ? (body.status as HROffice['status'])
    : 'Active';

  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      code: String(body?.code || '').trim().toUpperCase(),
      address,
      geofenceRadius,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      status,
    },
  };
}
