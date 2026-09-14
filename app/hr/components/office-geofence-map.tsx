'use client';

import React from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { reverseGeocodePhoton, searchPhotonPlaces, type PhotonPlace } from '@/lib/photon-places';

const PRIMARY = '#014582';
const PAKISTAN: [number, number] = [30.3753, 69.3451];

declare global {
  interface Window {
    L?: any;
    __hrLeafletLoading?: Promise<any>;
  }
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

function PlaceSearch({
  disabled,
  latitude,
  longitude,
  onSelect,
}: {
  disabled?: boolean;
  latitude: number | null;
  longitude: number | null;
  onSelect: (place: PhotonPlace) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<PhotonPlace[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchPhotonPlaces(q, {
        limit: 8,
        latitude: Number.isFinite(latitude) ? (latitude as number) : PAKISTAN[0],
        longitude: Number.isFinite(longitude) ? (longitude as number) : PAKISTAN[1],
      })
        .then((places) => {
          setResults(places);
          setActive(0);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, latitude, longitude]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (place: PhotonPlace) => {
    setQuery(place.address);
    setOpen(false);
    onSelect(place);
  };

  return (
    <div ref={wrapRef} className="relative z-20">
      <div className="flex items-center gap-2 bg-white rounded-xl border border-[#DDE4EE] px-3 py-2 focus-within:ring-2 focus-within:ring-[#014582]/20 focus-within:border-[#014582]/50">
        <Search className="w-4 h-4 text-[#7A8FA6] shrink-0" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder="Search office location (area, landmark, address)…"
          className="flex-1 min-w-0 bg-transparent text-sm text-[#1A1A2E] outline-none disabled:opacity-60"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (results[active]) pick(results[active]);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-[#014582] shrink-0" />}
        {!loading && query && (
          <button
            type="button"
            className="text-[#7A8FA6] hover:text-[#014582]"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && query.trim().length >= 2 && (
        <ul className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-[#DDE4EE] rounded-xl shadow-lg z-30">
          {loading && results.length === 0 && (
            <li className="px-3 py-3 text-xs text-[#7A8FA6]">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-3 text-xs text-[#7A8FA6]">No places found</li>
          )}
          {results.map((place, i) => (
            <li key={`${place.latitude}-${place.longitude}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(place)}
                className={`w-full text-left px-3 py-2.5 ${i === active ? 'bg-[#F0F4F8]' : 'bg-white hover:bg-[#F7FAFC]'}`}
              >
                <p className="text-sm font-semibold text-[#014582] truncate">{place.name}</p>
                <p className="text-[11px] text-[#7A8FA6] truncate">{place.address}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OfficeGeofenceMap({
  latitude,
  longitude,
  radiusMeters,
  onChange,
  disabled,
}: {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onChange: (next: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address?: string;
  }) => void;
  disabled?: boolean;
}) {
  const mapEl = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);
  const radius = radiusMeters || 150;
  const onChangeRef = React.useRef(onChange);
  const radiusRef = React.useRef(radius);
  const placePinRef = React.useRef<(lat: number, lng: number, nextRadius?: number, fly?: boolean) => void>(() => {});
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [hint, setHint] = React.useState('Search a place, then adjust the office radius');

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  React.useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  const placePin = React.useCallback((lat: number, lng: number, nextRadius = radius, fly = true) => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    const here = L.latLng(lat, lng);
    if (!markerRef.current) {
      markerRef.current = L.marker(here, { draggable: !disabled }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        circleRef.current?.setLatLng(pos);
        onChangeRef.current({
          latitude: pos.lat,
          longitude: pos.lng,
          radiusMeters: Math.round(circleRef.current?.getRadius?.() || nextRadius),
        });
        reverseGeocodePhoton(pos.lat, pos.lng)
          .then((result) => {
            if (!result) return;
            onChangeRef.current({
              latitude: pos.lat,
              longitude: pos.lng,
              radiusMeters: Math.round(circleRef.current?.getRadius?.() || nextRadius),
              address: result.address || result.name,
            });
          })
          .catch(() => {});
      });
    } else {
      markerRef.current.setLatLng(here);
    }
    if (!circleRef.current) {
      circleRef.current = L.circle(here, {
        radius: nextRadius,
        color: PRIMARY,
        fillColor: PRIMARY,
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(here);
      circleRef.current.setRadius(nextRadius);
    }
    if (fly) {
      map.fitBounds(circleRef.current.getBounds(), { padding: [28, 28], maxZoom: 17 });
    }
  }, [disabled, radius]);

  React.useEffect(() => {
    placePinRef.current = placePin;
  }, [placePin]);

  React.useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);
        const map = L.map(mapEl.current, { zoomControl: true }).setView(
          hasPin ? [latitude, longitude] : PAKISTAN,
          hasPin ? 16 : 5
        );
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
        map.on('click', (e: any) => {
          if (disabled) return;
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          const r = radiusRef.current;
          placePinRef.current(lat, lng, r, true);
          onChangeRef.current({ latitude: lat, longitude: lng, radiusMeters: r });
          setHint('Pin set — use the slider to change radius');
          reverseGeocodePhoton(lat, lng)
            .then((result) => {
              if (!result) return;
              onChangeRef.current({
                latitude: lat,
                longitude: lng,
                radiusMeters: radiusRef.current,
                address: result.address || result.name,
              });
            })
            .catch(() => {});
        });
        mapRef.current = map;
        if (hasPin) placePin(latitude as number, longitude as number, radius, true);
        setReady(true);
        window.setTimeout(() => map.invalidateSize(), 80);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!ready || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    placePin(latitude as number, longitude as number, radius, false);
  }, [latitude, longitude, placePin, radius, ready]);

  React.useEffect(() => {
    if (!circleRef.current || !Number.isFinite(radius)) return;
    const current = Math.round(circleRef.current.getRadius());
    if (Math.abs(current - radius) > 1) {
      circleRef.current.setRadius(radius);
      if (Math.abs(current - radius) > 80 && mapRef.current) {
        mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [28, 28], maxZoom: 17 });
      }
    }
  }, [radius]);

  const applyPlace = (place: PhotonPlace) => {
    placePin(place.latitude, place.longitude, radius, true);
    onChangeRef.current({
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMeters: radius,
      address: place.address || place.name,
    });
    setHint('Location set — use the slider or meter box for radius');
  };

  const emitRadius = (nextRadius: number) => {
    onChange({
      latitude: Number.isFinite(latitude) ? (latitude as number) : 0,
      longitude: Number.isFinite(longitude) ? (longitude as number) : 0,
      radiusMeters: nextRadius,
    });
  };

  return (
    <div
      className="space-y-2"
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
    >
      <PlaceSearch
        disabled={disabled}
        latitude={latitude}
        longitude={longitude}
        onSelect={applyPlace}
      />

      {failed ? (
        <p className="text-xs text-[#7A8FA6]">
          Map tiles failed to load. Search a place above to set coordinates, then set the radius.
        </p>
      ) : (
      <div className="relative w-full h-72 rounded-xl overflow-hidden border border-[#DDE4EE] bg-[#F0F4F8]">
        <div ref={mapEl} className="absolute inset-0 z-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-[#7A8FA6]">
            <Loader2 className="w-4 h-4 animate-spin text-[#014582]" /> Loading map…
          </div>
        )}
      </div>
      )}

      <p className="text-[10px] font-semibold text-[#7A8FA6] flex items-center gap-1">
        <MapPin className="w-3 h-3 text-[#014582]" />
        {hint}
        {Number.isFinite(latitude) && Number.isFinite(longitude) && (
          <span className="ml-auto font-mono text-[9px] opacity-70">
            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </span>
        )}
      </p>

      <label className="block text-xs font-bold text-[#7A8FA6]">
        Geofence radius (meters)
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range"
            min={30}
            max={2000}
            step={10}
            value={radius}
            disabled={disabled}
            onChange={(e) => emitRadius(Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min={20}
            max={5000}
            step={10}
            value={radius}
            disabled={disabled}
            onChange={(e) => emitRadius(Math.max(20, Number(e.target.value) || 0))}
            className="w-20 bg-white rounded-lg px-2 py-1.5 text-xs font-bold text-[#014582] border border-[#DDE4EE]"
          />
        </div>
        <span className="text-[11px] font-bold text-[#014582]">{radius}m around the pin</span>
      </label>
    </div>
  );
}
