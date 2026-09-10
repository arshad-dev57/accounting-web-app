'use client';

import React from 'react';
import {
  MapPin,
  Navigation,
  Gauge,
  Crosshair,
  Clock,
  Building2,
} from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatCard, HRStatusBadge } from '../ui';
import { hrDashboardService } from '@/lib/hr-employees-service';

const COLORS = { success: '#2ECC71', primary: '#014582', warning: '#F39C12' };

type Tracked = {
  id: string;
  employee: string;
  office: string;
  location: string;
  since: string;
  status: string;
  lat: number;
  lng: number;
  moving: boolean;
};

declare global {
  interface Window {
    L?: any;
    google?: any;
    gm_authFailure?: () => void;
    hrGoogleMapsInit?: () => void;
    __hrLeafletLoading?: Promise<any>;
    __hrGoogleMapsLoading?: Promise<any>;
  }
}

function useLiveTracking(): { employees: Tracked[]; lastPing: Date; source: 'live' | 'empty' } {
  const [employees, setEmployees] = React.useState<Tracked[]>([]);
  const [lastPing, setLastPing] = React.useState(() => new Date());
  const [source, setSource] = React.useState<'live' | 'empty'>('empty');

  React.useEffect(() => {
    let cancelled = false;

    const loadLive = async () => {
      try {
        const live = await hrDashboardService.liveTracking();
        if (cancelled) return;
        const mapped: Tracked[] = live
          .filter((e: any) => {
            const statusKey = String(e.status || '').toLowerCase();
            return Number(e.latitude) && Number(e.longitude) && statusKey !== 'offline';
          })
          .map((e: any) => {
            const statusKey = String(e.status || '').toLowerCase();
            const inside = e.insideGeofence === true;
            return {
              id: e.employeeId || e.employeeCode || e.employeeName,
              employee: e.employeeName || 'Employee',
              office: e.officeName || '—',
              location: inside
                ? e.officeName || e.locationLabel || 'Office'
                : e.locationLabel || 'In the field',
              since: e.lastPingAt
                ? new Date(e.lastPingAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
              status:
                statusKey === 'working' || statusKey === 'inside'
                  ? 'Present'
                  : statusKey === 'field' || statusKey === 'outside'
                    ? 'CheckedIn'
                    : e.attendanceStatus || statusKey || 'offline',
              lat: Number(e.latitude),
              lng: Number(e.longitude),
              moving: !inside,
            };
          });
        setEmployees(mapped);
        setSource(mapped.length ? 'live' : 'empty');
        setLastPing(new Date());
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setSource('empty');
        }
      }
    };

    loadLive();
    const liveTimer = setInterval(loadLive, 15000);
    return () => {
      cancelled = true;
      clearInterval(liveTimer);
    };
  }, []);

  return { employees, lastPing, source };
}

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
  onSelect: (id: string) => void;
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
      {employees.map((emp) => {
        const p = toPct(emp.lat, emp.lng);
        const selected = selectedId === emp.id;
        const color = emp.moving ? COLORS.warning : COLORS.success;
        return (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect(emp.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
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
      <div className="absolute bottom-2 left-2 max-w-[90%] bg-white/90 rounded-md px-2 py-1 text-[8px] font-semibold text-[#5a6d82]">
        Last-known GPS (map tiles unavailable)
      </div>
    </div>
  );
}

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__hrGoogleMapsLoading) return window.__hrGoogleMapsLoading;

  window.__hrGoogleMapsLoading = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Google Maps timed out')), 12000);
    window.hrGoogleMapsInit = () => {
      window.clearTimeout(timeout);
      resolve(window.google.maps);
    };
    window.gm_authFailure = () => {
      window.clearTimeout(timeout);
      reject(new Error('Google Maps API key rejected'));
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=hrGoogleMapsInit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return window.__hrGoogleMapsLoading;
}

function markerColor(moving: boolean) {
  return moving ? COLORS.warning : COLORS.success;
}

function GoogleMapView({
  employees,
  selectedId,
  onSelect,
  onFail,
  apiKey,
}: {
  employees: Tracked[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFail: () => void;
  apiKey: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const fittedKeyRef = React.useRef('');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!apiKey) {
      onFail();
      return () => {
        cancelled = true;
      };
    }
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: { lat: 30.3753, lng: 69.3451 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        });
        mapRef.current = map;
        maps.event.addListenerOnce(map, 'idle', () => {
          if (!cancelled) setReady(true);
        });
        window.setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 400);
      })
      .catch(() => {
        if (!cancelled) onFail();
      });
    return () => {
      cancelled = true;
    };
  }, [onFail, apiKey]);

  React.useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;

    const ids = new Set(employees.map((e) => e.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    employees.forEach((emp) => {
      const color = markerColor(emp.moving);
      const position = { lat: emp.lat, lng: emp.lng };
      let marker = markersRef.current[emp.id];
      if (!marker) {
        marker = new maps.Marker({
          map,
          position,
          title: emp.employee,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
        marker.addListener('click', () => onSelect(emp.id));
        markersRef.current[emp.id] = marker;
      } else {
        marker.setPosition(position);
        marker.setIcon({
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        });
      }
      marker.setTitle(`${emp.employee} · ${emp.location}`);
    });

    if (selectedId && markersRef.current[selectedId]) {
      const emp = employees.find((e) => e.id === selectedId);
      if (emp) {
        map.panTo({ lat: emp.lat, lng: emp.lng });
        if (map.getZoom() < 14) map.setZoom(15);
      }
    } else if (employees.length > 0) {
      const idKey = employees.map((e) => e.id).sort().join(',');
      if (idKey !== fittedKeyRef.current) {
        fittedKeyRef.current = idKey;
        const bounds = new maps.LatLngBounds();
        employees.forEach((e) => bounds.extend({ lat: e.lat, lng: e.lng }));
        map.fitBounds(bounds, 48);
      }
    }
  }, [employees, ready, selectedId, onSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F0F4F8] rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A8FA6]">
            <Navigation className="w-4 h-4 animate-pulse text-[#014582]" />
            Loading Google Map…
          </div>
        </div>
      )}
    </div>
  );
}

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  if (window.__hrLeafletLoading) return window.__hrLeafletLoading;

  window.__hrLeafletLoading = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-hr-leaflet]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.setAttribute('data-hr-leaflet', '1');
      document.head.appendChild(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load map library'));
    document.head.appendChild(script);
  });
  return window.__hrLeafletLoading;
}

function LeafletMap({
  employees,
  selectedId,
  onSelect,
}: {
  employees: Tracked[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const fittedKeyRef = React.useRef('');
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { zoomControl: true }).setView([30.5, 71.5], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setTimeout(() => {
          map.invalidateSize();
          setReady(true);
        }, 50);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const ids = new Set(employees.map((e) => e.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) {
        mapRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    employees.forEach((emp) => {
      const color = emp.moving ? COLORS.warning : COLORS.success;
      const html = `<div style="width:14px;height:14px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color}55"></div>`;
      const icon = L.divIcon({ className: '', html, iconSize: [14, 14], iconAnchor: [7, 7] });
      let marker = markersRef.current[emp.id];
      if (!marker) {
        marker = L.marker([emp.lat, emp.lng], { icon }).addTo(mapRef.current);
        marker.on('click', () => onSelect(emp.id));
        markersRef.current[emp.id] = marker;
      } else {
        marker.setLatLng([emp.lat, emp.lng]);
        marker.setIcon(icon);
      }
      marker.bindPopup(
        `<strong>${emp.employee}</strong><br/>${emp.location}<br/>${emp.moving ? 'In the field' : 'At office'}`
      );
    });

    if (selectedId && markersRef.current[selectedId]) {
      const emp = employees.find((e) => e.id === selectedId);
      if (emp) {
        mapRef.current.setView([emp.lat, emp.lng], 15);
        markersRef.current[selectedId].openPopup();
      }
    } else if (employees.length > 0) {
      const idKey = employees.map((e) => e.id).sort().join(',');
      if (idKey !== fittedKeyRef.current) {
        fittedKeyRef.current = idKey;
        const bounds = L.latLngBounds(employees.map((e) => [e.lat, e.lng]));
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [employees, ready, selectedId, onSelect]);

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
            Loading map…
          </div>
        </div>
      )}
    </div>
  );
}

function LiveMap({
  employees,
  selectedId,
  onSelect,
}: {
  employees: Tracked[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [mapsKey, setMapsKey] = React.useState<string | null>(null);
  const [engine, setEngine] = React.useState<'pending' | 'google' | 'leaflet'>('pending');
  const failGoogle = React.useCallback(() => setEngine('leaflet'), []);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/maps-config')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        const key = String(body?.googleMapsApiKey || '').trim();
        setMapsKey(key);
        setEngine(key ? 'google' : 'leaflet');
      })
      .catch(() => {
        if (!cancelled) setEngine('leaflet');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (engine === 'pending') {
    return (
      <div className="w-full h-full rounded-xl bg-[#F0F4F8] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A8FA6]">
          <Navigation className="w-4 h-4 animate-pulse text-[#014582]" />
          Loading map…
        </div>
      </div>
    );
  }

  if (engine === 'google' && mapsKey) {
    return (
      <GoogleMapView
        employees={employees}
        selectedId={selectedId}
        onSelect={onSelect}
        onFail={failGoogle}
        apiKey={mapsKey}
      />
    );
  }

  return <LeafletMap employees={employees} selectedId={selectedId} onSelect={onSelect} />;
}

export default function LiveTrackingPage() {
  const { employees, lastPing, source } = useLiveTracking();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [fitKey, setFitKey] = React.useState(0);

  const select = React.useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const activeCount = employees.filter((e) => e.status === 'CheckedIn' || e.status === 'Present').length;
  const movingCount = employees.filter((e) => e.moving).length;

  return (
    <HRPage>
      <HRPageHeader
        title="Live Employee Tracking"
        subtitle={
          source === 'live'
            ? 'Google Map · last-known GPS while the employee app is sharing location (15s refresh)'
            : 'No live pings yet — employees appear after they turn on location tracking in the mobile app'
        }
        backHref="/hr/dashboard"
        actions={
          <span className="flex items-center gap-2 bg-white/15 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 bg-[#2ECC71] rounded-full animate-pulse" />
            {source === 'live' ? 'Live GPS' : 'Waiting'} · last refresh{' '}
            {lastPing.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="On map" value={employees.length} icon={MapPin} color={COLORS.primary} />
        <HRStatCard label="Active Now" value={activeCount} icon={Navigation} color={COLORS.success} />
        <HRStatCard label="In the field" value={movingCount} icon={Gauge} color={COLORS.warning} />
        <HRStatCard label="At Office" value={employees.length - movingCount} icon={Building2} color={COLORS.primary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP — takes 2 cols */}
        <HRCard className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="h-[520px]">
            <LiveMap
              key={fitKey}
              employees={employees}
              selectedId={selectedId}
              onSelect={select}
            />
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

          {employees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DDE4EE] p-6 text-center">
              <MapPin className="w-8 h-8 text-[#DDE4EE] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1A1A2E]">No live locations</p>
              <p className="text-xs text-[#7A8FA6] mt-1">
                Employees show here after they turn on location tracking in the mobile app.
              </p>
            </div>
          ) : (
            employees.map((emp) => {
            const selected = selectedId === emp.id;
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => select(emp.id)}
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
                          <Gauge className="w-3 h-3" /> In the field
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#2ECC71]">● At office</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
          )}
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

