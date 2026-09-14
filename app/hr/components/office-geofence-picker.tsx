'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
    hrOfficeMapsInit?: () => void;
    gm_authFailure?: () => void;
    __hrOfficeMapsLoading?: Promise<any>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__hrOfficeMapsLoading) return window.__hrOfficeMapsLoading;

  window.__hrOfficeMapsLoading = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Google Maps timed out')), 12000);
    window.hrOfficeMapsInit = () => {
      window.clearTimeout(timeout);
      resolve(window.google.maps);
    };
    window.gm_authFailure = () => {
      window.clearTimeout(timeout);
      reject(new Error('Google Maps API key rejected'));
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=hrOfficeMapsInit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return window.__hrOfficeMapsLoading;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onChange: (next: { latitude: number; longitude: number; radiusMeters: number }) => void;
  disabled?: boolean;
};

/**
 * Click map to drop office pin + drag radius. Lat/lng filled automatically.
 */
export function OfficeGeofencePicker({
  latitude,
  longitude,
  radiusMeters,
  onChange,
  disabled,
}: Props) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapObj = React.useRef<any>(null);
  const markerObj = React.useRef<any>(null);
  const circleObj = React.useRef<any>(null);
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [hint, setHint] = React.useState('Click the map to place the office pin');

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/maps-config')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        const key = String(body?.googleMapsApiKey || '').trim();
        if (!key) setFailed(true);
        else setApiKey(key);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!apiKey || !mapRef.current || mapObj.current) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const center =
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { lat: latitude as number, lng: longitude as number }
            : { lat: 30.3753, lng: 69.3451 };
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: Number.isFinite(latitude) ? 16 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapObj.current = map;

        const place = (lat: number, lng: number, radius: number) => {
          if (!markerObj.current) {
            markerObj.current = new maps.Marker({
              map,
              position: { lat, lng },
              draggable: !disabled,
              title: 'Office',
            });
            markerObj.current.addListener('dragend', () => {
              const pos = markerObj.current.getPosition();
              if (!pos) return;
              onChange({
                latitude: pos.lat(),
                longitude: pos.lng(),
                radiusMeters: circleObj.current?.getRadius?.() || radius,
              });
              setHint('Pin moved — you can adjust the radius');
            });
          } else {
            markerObj.current.setPosition({ lat, lng });
          }
          if (!circleObj.current) {
            circleObj.current = new maps.Circle({
              map,
              center: { lat, lng },
              radius,
              fillColor: '#014582',
              fillOpacity: 0.18,
              strokeColor: '#014582',
              strokeOpacity: 0.9,
              strokeWeight: 2,
              editable: !disabled,
              draggable: false,
            });
            circleObj.current.addListener('radius_changed', () => {
              const r = Math.round(circleObj.current.getRadius());
              const c = circleObj.current.getCenter();
              onChange({
                latitude: c.lat(),
                longitude: c.lng(),
                radiusMeters: Math.max(20, r),
              });
            });
            circleObj.current.addListener('center_changed', () => {
              const c = circleObj.current.getCenter();
              markerObj.current?.setPosition(c);
              onChange({
                latitude: c.lat(),
                longitude: c.lng(),
                radiusMeters: Math.round(circleObj.current.getRadius()),
              });
            });
          } else {
            circleObj.current.setCenter({ lat, lng });
            circleObj.current.setRadius(radius);
          }
          map.panTo({ lat, lng });
          if (map.getZoom() < 15) map.setZoom(16);
        };

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          place(latitude as number, longitude as number, radiusMeters || 150);
          setHint('Drag the pin or use the circle edge to change radius');
        }

        map.addListener('click', (e: any) => {
          if (disabled) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const r = circleObj.current?.getRadius?.() || radiusMeters || 150;
          place(lat, lng, r);
          onChange({ latitude: lat, longitude: lng, radiusMeters: Math.round(r) });
          setHint('Office pin set — adjust radius with the circle edge');
        });

        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
    // init once when key ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  React.useEffect(() => {
    if (!circleObj.current || !Number.isFinite(radiusMeters)) return;
    const current = Math.round(circleObj.current.getRadius());
    if (Math.abs(current - radiusMeters) > 1) {
      circleObj.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  if (failed) {
    return (
      <div className="rounded-xl border border-dashed border-[#DDE4EE] bg-[#F8FAFC] p-4 text-xs text-[#7A8FA6]">
        Map failed to load (check GOOGLE_MAPS_API_KEY). You can still set radius below, or try your current location for the pin.
        <button
          type="button"
          className="mt-2 block text-[#014582] font-bold"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              onChange({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                radiusMeters: radiusMeters || 150,
              });
            });
          }}
        >
          Use my current location
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-[#DDE4EE] bg-[#F0F4F8]">
        <div ref={mapRef} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-[#7A8FA6]">
            <Loader2 className="w-4 h-4 animate-spin text-[#014582]" /> Loading map…
          </div>
        )}
      </div>
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
        <input
          type="range"
          min={30}
          max={500}
          step={10}
          value={radiusMeters || 150}
          disabled={disabled}
          onChange={(e) => {
            const r = Number(e.target.value);
            onChange({
              latitude: Number.isFinite(latitude) ? (latitude as number) : 0,
              longitude: Number.isFinite(longitude) ? (longitude as number) : 0,
              radiusMeters: r,
            });
          }}
          className="mt-2 w-full"
        />
        <span className="text-[11px] font-bold text-[#014582]">{radiusMeters || 150}m</span>
      </label>
    </div>
  );
}
