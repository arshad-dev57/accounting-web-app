'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export type OfficeGeofenceChange = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
};

const OfficeGeofenceMap = dynamic(
  () => import('./office-geofence-map').then((m) => m.OfficeGeofenceMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8] flex items-center justify-center gap-2 text-xs font-semibold text-[#7A8FA6]">
        <Loader2 className="w-4 h-4 animate-spin text-[#014582]" /> Loading map…
      </div>
    ),
  }
);

export function OfficeGeofencePicker(props: {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onChange: (next: OfficeGeofenceChange) => void;
  disabled?: boolean;
}) {
  return <OfficeGeofenceMap {...props} />;
}
