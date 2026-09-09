'use client';

import React from 'react';
import {
  MapPin,
  Navigation,
  BatteryMedium,
  Gauge,
  Crosshair,
  KeyRound,
  Clock,
  Building2,
} from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRStatusBadge } from '../ui';
import { TRACKING, OFFICE_COORDS } from '../data';

const COLORS = { success: '#2ECC71', primary: '#014582', warning: '#F39C12', danger: '#E74C3C' };

type Tracked = (typeof TRACKING)[number] & {
  lat: number;
  lng: number;
  moving: boolean;
  speed: number;
  battery: number;
};

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

declare global {
  interface Window {
    google?: any;
    __hrGmapsLoading?: Promise<void>;
  }
}

// ─────────────────────────────────────────────────────────────
// GPS SIMULATION — field employees drift every ping like real
// device GPS updates. Office staff stay put.
// ─────────────────────────────────────────────────────────────
function useSimulatedTracking(): { employees: Tracked[]; lastPing: Date; source: 'live' | 'demo' } {
  const [employees, setEmployees] = React.useState<Tracked[]>(() =>
    TRACKING.map((t) => ({ ...t }))
  );
  const [lastPing, setLastPing] = React.useState(() => new Date());
  const [source, setSource] = React.useState<'live' | 'demo'>('demo');

  React.useEffect(() => {
    let cancelled = false;

    const loadLive = async () => {
      try {
        const res = await fetch('/api/hr/tracking', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'fail');
        const live = (json.data?.live || []) as Array<{
          employeeId: string;
          employeeName: string;
          officeName?: string;
          locationLabel: string;
          status: string;
          latitude: number;
          longitude: number;
          moving: boolean;
          speed?: number;
          battery?: number;
          lastPingAt: string;
        }>;

        if (cancelled) return;
        if (live.length === 0) {
          setSource('demo');
          return;
        }

        setSource('live');
        setEmployees(
          live.map((e) => ({
            employee: e.employeeName,
            office: e.officeName || '—',
            location: e.locationLabel,
            since: new Date(e.lastPingAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: e.status === 'CheckedIn' ? 'CheckedIn' : 'Present',
            lat: e.latitude,
            lng: e.longitude,
            moving: !!e.moving,
            speed: Math.round(Number(e.speed) || 0),
            battery: Math.round(Number(e.battery) || 0),
          }))
        );
        setLastPing(new Date());
      } catch {
        if (!cancelled) setSource('demo');
      }
    };

    loadLive();
    const liveTimer = setInterval(loadLive, 5000);

    const simTimer = setInterval(() => {
      setEmployees((prev) => {
        // Only simulate when no live pings yet
        if (source === 'live') return prev;
        return prev.map((emp) => {
          if (!emp.moving) return emp;
          const step = 0.0006 + Math.random() * 0.0009;
          const angle = Math.random() * Math.PI * 2;
          return {
            ...emp,
            lat: emp.lat + Math.sin(angle) * step,
            lng: emp.lng + Math.cos(angle) * step,
            speed: Math.max(4, Math.round(emp.speed + (Math.random() * 10 - 5))),
            battery: Math.max(5, emp.battery - (Math.random() < 0.2 ? 1 : 0)),
          };
        });
      });
      setLastPing(new Date());
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(liveTimer);
      clearInterval(simTimer);
    };
  }, [source]);

  return { employees, lastPing, source };
}

// ─────────────────────────────────────────────────────────────
// FALLBACK MAP (no API key) — interactive demo map with the
// same interactions: markers, selection, live movement.
// ─────────────────────────────────────────────────────────────
const BOUNDS = { minLat: 23.5, maxLat: 34.8, minLng: 66.5, maxLng: 75.5 };

function toPct(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(94, Math.max(6, y)) };
}

function FallbackMap({
  employees,
  selectedId,
  onSelect,
}: {
  employees: Tracked[];
  selectedId: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="relative w-full h-full bg-[#E8EEF4] overflow-hidden rounded-xl">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(#cfd9e4 1px, transparent 1px), linear-gradient(90deg, #cfd9e4 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      {Object.entries(OFFICE_COORDS).map(([name, c]) => {
        const p = toPct(c.lat, c.lng);
        return (
          <div
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="w-4 h-4 rounded-md bg-[#014582] border-2 border-white shadow" />
            <span className="mt-0.5 text-[8px] font-bold text-[#5a6d82] bg-white/80 px-1 rounded whitespace-nowrap">
              {name}
            </span>
          </div>
        );
      })}
      {employees.map((emp) => {
        const p = toPct(emp.lat, emp.lng);
        const selected = selectedId === emp.employee;
        const color = emp.moving ? COLORS.warning : COLORS.success;
        return (
          <button
            key={emp.employee}
            type="button"
            onClick={() => onSelect(emp.employee)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transition: 'left 1.5s linear, top 1.5s linear' }}
          >
            <span
              className={`absolute w-8 h-8 rounded-full ${selected ? 'opacity-40' : 'opacity-25'}`}
              style={{ backgroundColor: color, animation: 'hrping 1.8s ease-out infinite' }}
            />
            <span
              className={`relative w-4 h-4 rounded-full border-2 border-white shadow ${selected ? 'ring-2 ring-[#014582]' : ''}`}
              style={{ backgroundColor: color }}
            />
            <span
              className={`mt-0.5 text-[8px] font-bold px-1 rounded whitespace-nowrap ${
                selected ? 'bg-[#014582] text-white' : 'bg-white/90 text-[#1A1A2E]'
              }`}
            >
              {emp.employee.split(' ')[0]}
            </span>
          </button>
        );
      })}
      <div className="absolute bottom-2 left-2 bg-white/85 rounded-md px-2 py-1 text-[8px] font-semibold text-[#5a6d82] flex items-center gap-1">
        <KeyRound className="w-3 h-3" />
        Demo map — add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local for live Google Maps
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GOOGLE MAPS — loads the JS API once, renders live markers,
// info windows and a movement trail for the selected employee.
// ─────────────────────────────────────────────────────────────
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__hrGmapsLoading) return window.__hrGmapsLoading;

  window.__hrGmapsLoading = new Promise<void>((resolve, reject) => {
    const cbName = '__hrGmapsReady';
    (window as any)[cbName] = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=${cbName}&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return window.__hrGmapsLoading;
}

function GoogleMap({
  employees,
  selectedId,
  onSelect,
}: {
  employees: Tracked[];
  selectedId: string | null;
  onSelect: (name: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const infoRef = React.useRef<any>(null);
  const trailRef = React.useRef<any>(null);
  const trailsRef = React.useRef<Record<string, any[]>>({});
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // init map + markers once
  React.useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        const g = window.google.maps;
        const map = new g.Map(containerRef.current, {
          center: { lat: 30.5, lng: 71.5 },
          zoom: 6,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        infoRef.current = new g.InfoWindow();

        employees.forEach((emp) => {
          const marker = new g.Marker({
            position: { lat: emp.lat, lng: emp.lng },
            map,
            title: emp.employee,
            icon: markerIcon(emp.moving),
          });
          marker.addListener('click', () => onSelect(emp.employee));
          markersRef.current[emp.employee] = marker;
          trailsRef.current[emp.employee] = [{ lat: emp.lat, lng: emp.lng }];
        });

        const bounds = new g.LatLngBounds();
        employees.forEach((emp) => bounds.extend({ lat: emp.lat, lng: emp.lng }));
        map.fitBounds(bounds, 60);
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live position updates + trail + info window
  React.useEffect(() => {
    if (!ready || !window.google) return;
    const g = window.google.maps;
    employees.forEach((emp) => {
      const marker = markersRef.current[emp.employee];
      if (!marker) return;
      marker.setPosition({ lat: emp.lat, lng: emp.lng });
      marker.setIcon(markerIcon(emp.moving));
      const trail = trailsRef.current[emp.employee] || [];
      trail.push({ lat: emp.lat, lng: emp.lng });
      trailsRef.current[emp.employee] = trail.slice(-30);
    });

    if (trailRef.current) {
      trailRef.current.setMap(null);
      trailRef.current = null;
    }
    const sel = employees.find((e) => e.employee === selectedId);
    if (sel && (trailsRef.current[sel.employee]?.length ?? 0) > 1) {
      trailRef.current = new g.Polyline({
        path: trailsRef.current[sel.employee],
        map: mapRef.current,
        strokeColor: COLORS.primary,
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });
    }
    if (sel && markersRef.current[sel.employee]) {
      infoRef.current?.setContent(infoHtml(sel));
      infoRef.current?.open({
        map: mapRef.current,
        anchor: markersRef.current[sel.employee],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, ready, selectedId]);

  // recenter + zoom on selection
  React.useEffect(() => {
    if (!ready || !selectedId) return;
    const sel = employees.find((e) => e.employee === selectedId);
    if (sel && mapRef.current) {
      mapRef.current.panTo({ lat: sel.lat, lng: sel.lng });
      mapRef.current.setZoom(15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready]);

  if (failed) {
    return <FallbackMap employees={employees} selectedId={selectedId} onSelect={onSelect} />;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F0F4F8] rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A8FA6]">
            <Navigation className="w-4 h-4 animate-pulse text-[#014582]" />
            Loading Google Maps…
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow px-3 py-2 flex flex-col gap-1 text-[10px] font-semibold text-[#1A1A2E]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.success }} /> At office
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.warning }} /> Moving in field
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5" style={{ background: COLORS.primary }} /> Movement trail (selected)
        </span>
      </div>
    </div>
  );
}

function markerIcon(moving: boolean) {
  const g = window.google.maps;
  return {
    path: g.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: moving ? COLORS.warning : COLORS.success,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  };
}

function infoHtml(sel: Tracked) {
  return `<div style="font-family:sans-serif;min-width:170px">
    <div style="font-weight:800;font-size:13px;color:#1A1A2E">${sel.employee}</div>
    <div style="font-size:11px;color:#7A8FA6;margin-top:2px">${sel.location}</div>
    <div style="font-size:11px;margin-top:4px;font-weight:700;color:${sel.moving ? '#F39C12' : '#2ECC71'}">
      ${sel.moving ? `Moving · ${sel.speed} km/h` : 'At office'}
    </div>
    <div style="font-size:10px;color:#7A8FA6;margin-top:2px">Office: ${sel.office} · Since ${sel.since}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// LIVE TRACKING PAGE
// ─────────────────────────────────────────────────────────────
export default function LiveTrackingPage() {
  const { employees, lastPing, source } = useSimulatedTracking();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [fitKey, setFitKey] = React.useState(0);

  const select = React.useCallback((name: string) => {
    setSelectedId((prev) => (prev === name ? null : name));
  }, []);

  const activeCount = employees.filter((e) => e.status === 'CheckedIn' || e.status === 'Present').length;
  const movingCount = employees.filter((e) => e.moving).length;
  const avgBattery = Math.round(
    employees.reduce((s, e) => s + e.battery, 0) / (employees.length || 1)
  );

  return (
    <HRPage>
      <HRPageHeader
        title="Live Employee Tracking"
        subtitle={
          source === 'live'
            ? 'Live GPS from mobile app · auto attendance via office geofence'
            : 'Demo mode — open Employee dashboard on mobile to start live pings'
        }
        backHref="/hr/dashboard"
        actions={
          <span className="flex items-center gap-2 bg-white/15 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 bg-[#2ECC71] rounded-full animate-pulse" />
            {source === 'live' ? 'Live GPS' : 'Demo'} · last ping{' '}
            {lastPing.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Active Now" value={activeCount} icon={Navigation} color={COLORS.success} />
        <HRStatCard label="Moving in Field" value={movingCount} icon={Gauge} color={COLORS.warning} />
        <HRStatCard label="At Office" value={employees.length - movingCount} icon={Building2} color={COLORS.primary} />
        <HRStatCard label="Avg Device Battery" value={`${avgBattery}%`} icon={BatteryMedium} color={avgBattery > 50 ? COLORS.success : COLORS.danger} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP — takes 2 cols */}
        <HRCard className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="h-[520px]">
            {GOOGLE_MAPS_KEY ? (
              <GoogleMap
                key={fitKey}
                employees={employees}
                selectedId={selectedId}
                onSelect={select}
              />
            ) : (
              <FallbackMap employees={employees} selectedId={selectedId} onSelect={select} />
            )}
          </div>
        </HRCard>

        {/* SIDEBAR — employee list */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setFitKey((k) => k + 1); // remount map → refit bounds
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#014582] hover:bg-[#014582]/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <Crosshair className="w-4 h-4" />
            Show All Employees
          </button>

          {employees.map((emp) => {
            const selected = selectedId === emp.employee;
            return (
              <button
                key={emp.employee}
                type="button"
                onClick={() => select(emp.employee)}
                className={`w-full text-left bg-white rounded-2xl shadow-sm border p-4 transition-all hover:shadow-md ${
                  selected ? 'border-[#014582] ring-2 ring-[#014582]/20' : 'border-[#DDE4EE]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: emp.moving ? `${COLORS.warning}1A` : `${COLORS.success}1A` }}
                  >
                    <MapPin
                      className="w-5 h-5"
                      style={{ color: emp.moving ? COLORS.warning : COLORS.success }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-[#1A1A2E] truncate">{emp.employee}</p>
                      <HRStatusBadge status={emp.status} />
                    </div>
                    <p className="text-[11px] text-[#7A8FA6] font-medium mt-0.5 truncate">{emp.location}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] font-semibold text-[#7A8FA6]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Since {emp.since}
                      </span>
                      {emp.moving ? (
                        <span className="flex items-center gap-1 text-[#F39C12]">
                          <Gauge className="w-3 h-3" /> {emp.speed} km/h
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#2ECC71]">● Stationary</span>
                      )}
                      <span className={`flex items-center gap-1 ${emp.battery > 30 ? '' : 'text-[#E74C3C]'}`}>
                        <BatteryMedium className="w-3.5 h-3.5" /> {emp.battery}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ping animation keyframes */}
      <style jsx global>{`
        @keyframes hrping {
          0% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </HRPage>
  );
}

