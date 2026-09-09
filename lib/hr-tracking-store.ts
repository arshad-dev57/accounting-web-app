import fs from 'fs';
import path from 'path';
import { listOffices, type HROffice } from './hr-offices-store';

export interface LiveLocationPing {
  employeeId: string;
  employeeName: string;
  officeId?: string;
  officeName?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  battery?: number;
  heading?: number;
  isBackground?: boolean;
  recordedAt: string;
}

export interface LiveTrackedEmployee extends LiveLocationPing {
  status: 'CheckedIn' | 'Outside' | 'InsideGeofence' | 'Offline';
  locationLabel: string;
  moving: boolean;
  insideGeofence: boolean;
  matchedOffice?: string;
  distanceMeters?: number;
  lastPingAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Late' | 'Absent' | 'Auto';
  method: 'manual' | 'geofence_auto';
  officeName?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

interface DwellState {
  employeeId: string;
  officeId: string;
  officeName: string;
  firstInsideAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.hr-data');
const LIVE_FILE = path.join(DATA_DIR, 'hr-live-tracking.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'hr-attendance.json');
const DWELL_FILE = path.join(DATA_DIR, 'hr-geofence-dwell.json');

const DWELL_MS = 2 * 60 * 1000; // 2 minutes inside geofence → auto check-in
const LATE_AFTER_HOUR = 9;
const LATE_AFTER_MINUTE = 15;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function officeCoords(office: HROffice): { lat: number; lng: number } | null {
  const lat = Number((office as any).latitude);
  const lng = Number((office as any).longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Default coords when office lat/lng not set yet */
const OFFICE_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  'Head Office': { lat: 31.5204, lng: 74.3587 },
  'North Branch': { lat: 33.6844, lng: 73.0479 },
  'South Branch': { lat: 24.8607, lng: 67.0011 },
};

function resolveOfficePoint(office: HROffice) {
  return officeCoords(office) || OFFICE_FALLBACK_COORDS[office.name] || null;
}

export function findNearestOffice(
  latitude: number,
  longitude: number,
  preferredOfficeName?: string
): { office: HROffice; distance: number; inside: boolean } | null {
  const offices = listOffices().filter((o) => o.status === 'Active');
  let best: { office: HROffice; distance: number; inside: boolean } | null = null;

  for (const office of offices) {
    const point = resolveOfficePoint(office);
    if (!point) continue;
    const distance = haversineMeters(latitude, longitude, point.lat, point.lng);
    const radius = office.geofenceRadius || 150;
    const inside = distance <= radius;
    const preferred =
      preferredOfficeName &&
      office.name.toLowerCase() === preferredOfficeName.toLowerCase();

    if (!best || (preferred && inside) || distance < best.distance) {
      best = { office, distance, inside };
      if (preferred && inside) break;
    }
  }

  return best;
}

export function listLiveTracking(): LiveTrackedEmployee[] {
  const map = readJson<Record<string, LiveTrackedEmployee>>(LIVE_FILE, {});
  return Object.values(map).sort(
    (a, b) => new Date(b.lastPingAt).getTime() - new Date(a.lastPingAt).getTime()
  );
}

export function listAttendance(date?: string): AttendanceRecord[] {
  const all = readJson<AttendanceRecord[]>(ATTENDANCE_FILE, []);
  const key = date || todayKey();
  return all.filter((r) => r.date === key);
}

function upsertAttendance(record: AttendanceRecord) {
  const all = readJson<AttendanceRecord[]>(ATTENDANCE_FILE, []);
  const idx = all.findIndex(
    (r) => r.employeeId === record.employeeId && r.date === record.date
  );
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  writeJson(ATTENDANCE_FILE, all);
  return record;
}

function getTodayAttendance(employeeId: string): AttendanceRecord | null {
  return (
    listAttendance().find((r) => r.employeeId === employeeId) || null
  );
}

export function processLocationPing(input: {
  employeeId: string;
  employeeName: string;
  officeId?: string;
  officeName?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  battery?: number;
  heading?: number;
  isBackground?: boolean;
}): {
  tracked: LiveTrackedEmployee;
  attendance: AttendanceRecord | null;
  autoCheckedIn: boolean;
  message: string;
} {
  const now = new Date();
  const nearest = findNearestOffice(
    input.latitude,
    input.longitude,
    input.officeName
  );

  const inside = !!nearest?.inside;
  const dwell = readJson<Record<string, DwellState>>(DWELL_FILE, {});
  let autoCheckedIn = false;
  let attendance = getTodayAttendance(input.employeeId);
  let message = inside
    ? `Inside ${nearest!.office.name} geofence (${Math.round(nearest!.distance)}m)`
    : nearest
      ? `Outside geofence — ${Math.round(nearest.distance)}m from ${nearest.office.name}`
      : 'No office geofence matched';

  if (inside && nearest) {
    const existing = dwell[input.employeeId];
    if (!existing || existing.officeId !== nearest.office.id) {
      dwell[input.employeeId] = {
        employeeId: input.employeeId,
        officeId: nearest.office.id,
        officeName: nearest.office.name,
        firstInsideAt: now.toISOString(),
      };
    } else {
      const first = new Date(existing.firstInsideAt).getTime();
      if (now.getTime() - first >= DWELL_MS) {
        if (!attendance?.checkIn) {
          const late =
            now.getHours() > LATE_AFTER_HOUR ||
            (now.getHours() === LATE_AFTER_HOUR &&
              now.getMinutes() > LATE_AFTER_MINUTE);
          attendance = upsertAttendance({
            id: `att_${input.employeeId}_${todayKey()}`,
            employeeId: input.employeeId,
            employeeName: input.employeeName,
            date: todayKey(),
            checkIn: formatTime(now),
            status: late ? 'Late' : 'Auto',
            method: 'geofence_auto',
            officeName: nearest.office.name,
            latitude: input.latitude,
            longitude: input.longitude,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          autoCheckedIn = true;
          message = `Auto attendance marked at ${nearest.office.name}`;
        }
      } else {
        const secs = Math.ceil((DWELL_MS - (now.getTime() - first)) / 1000);
        message = `Inside geofence — auto check-in in ~${secs}s`;
      }
    }
  } else {
    delete dwell[input.employeeId];
  }
  writeJson(DWELL_FILE, dwell);

  // Auto check-out when leaving after being checked in (optional soft rule)
  if (!inside && attendance?.checkIn && !attendance.checkOut) {
    // keep checked-in for the day; only mark location outside
  }

  const speed = Number(input.speed) || 0;
  const tracked: LiveTrackedEmployee = {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    officeId: nearest?.office.id || input.officeId,
    officeName: nearest?.office.name || input.officeName,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    speed,
    battery: input.battery,
    heading: input.heading,
    isBackground: input.isBackground,
    recordedAt: now.toISOString(),
    lastPingAt: now.toISOString(),
    status: attendance?.checkIn
      ? 'CheckedIn'
      : inside
        ? 'InsideGeofence'
        : 'Outside',
    locationLabel: inside
      ? `${nearest!.office.name} — inside fence`
      : nearest
        ? `${Math.round(nearest.distance)}m from ${nearest.office.name}`
        : `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    moving: speed > 1.5,
    insideGeofence: inside,
    matchedOffice: nearest?.office.name,
    distanceMeters: nearest ? Math.round(nearest.distance) : undefined,
  };

  const live = readJson<Record<string, LiveTrackedEmployee>>(LIVE_FILE, {});
  live[input.employeeId] = tracked;
  writeJson(LIVE_FILE, live);

  return { tracked, attendance, autoCheckedIn, message };
}
