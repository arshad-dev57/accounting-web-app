export type PhotonPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const PHOTON = 'https://photon.komoot.io';

function formatFeature(feature: {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, string | number | undefined>;
}): PhotonPlace | null {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const p = feature.properties || {};
  const name = String(p.name || p.street || p.city || 'Selected location');
  const parts = [p.housenumber, p.street, p.district, p.city, p.state, p.country]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean);
  const address = [...new Set([name, ...parts])].join(', ');
  return { name, address, latitude: Number(coords[1]), longitude: Number(coords[0]) };
}

export async function searchPhotonPlaces(
  query: string,
  opts?: { limit?: number; latitude?: number; longitude?: number }
): Promise<PhotonPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({ q, limit: String(opts?.limit ?? 8) });
  if (Number.isFinite(opts?.latitude) && Number.isFinite(opts?.longitude)) {
    params.set('lat', String(opts!.latitude));
    params.set('lon', String(opts!.longitude));
  }
  const res = await fetch(`${PHOTON}/api/?${params.toString()}`);
  if (!res.ok) throw new Error('Place search failed');
  const data = await res.json();
  return ((data.features || []) as Parameters<typeof formatFeature>[0][])
    .map(formatFeature)
    .filter((place): place is PhotonPlace => Boolean(place));
}

export async function reverseGeocodePhoton(lat: number, lng: number): Promise<PhotonPlace | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng) });
  const res = await fetch(`${PHOTON}/reverse?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const first = data.features?.[0];
  return first ? formatFeature(first) : null;
}
