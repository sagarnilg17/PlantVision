'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LMap, Marker as LMarker } from 'leaflet';
import { MapPin } from 'lucide-react';
import { T } from '@/lib/theme';

export type PickedLocation = { lat: number; lng: number; place: string };

// Build a compact "City, Country" label from a Nominatim address object
type NominatimAddress = {
  city?: string; town?: string; village?: string; hamlet?: string;
  suburb?: string; municipality?: string; county?: string;
  state?: string; country?: string;
};
function shortPlace(addr: NominatimAddress | undefined, fallback: string): string {
  if (!addr) return fallback;
  const local = addr.city || addr.town || addr.village || addr.hamlet
    || addr.suburb || addr.municipality || addr.county || addr.state;
  return [local, addr.country].filter(Boolean).join(', ') || fallback;
}

export function LocationPicker({
  value, onChange,
}: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}) {
  const mapEl     = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  // Leaflet is loaded dynamically (it touches window), so keep a live handle
  const LRef      = useRef<typeof import('leaflet') | null>(null);

  const [query,    setQuery]    = useState('');
  const [place,    setPlace]    = useState(value?.place ?? '');
  const [status,   setStatus]   = useState<'idle' | 'searching' | 'locating' | 'notfound'>('idle');

  const pinIcon = () => LRef.current!.divIcon({
    className: '',
    html: `<div style="transform:translate(-50%,-100%)">
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="#2E7D32"/>
        <circle cx="15" cy="15" r="6" fill="#fff"/>
      </svg></div>`,
    iconSize: [0, 0],
  });

  const placePin = (lat: number, lng: number, reverse: boolean) => {
    const L = LRef.current; const map = mapRef.current;
    if (!L || !map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon(), keyboard: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        placePin(p.lat, p.lng, true);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (reverse) reverseGeocode(lat, lng);
    else onChange({ lat, lng, place });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    onChange({ lat, lng, place }); // provisional — keep coords even if lookup fails
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = await res.json();
      const p = shortPlace(data.address, place || 'Selected location');
      setPlace(p);
      onChange({ lat, lng, place: p });
    } catch { /* keep provisional coords */ }
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('searching');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`,
        { headers: { Accept: 'application/json' } },
      );
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const la = parseFloat(lat); const ln = parseFloat(lon);
        mapRef.current?.setView([la, ln], 11);
        const p = display_name?.split(',').slice(0, 2).map((s: string) => s.trim()).join(', ') || query.trim();
        setPlace(p);
        placePin(la, ln, false);
        onChange({ lat: la, lng: ln, place: p });
        setStatus('idle');
      } else {
        setStatus('notfound');
      }
    } catch { setStatus('notfound'); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 12);
        placePin(latitude, longitude, true);
        setStatus('idle');
      },
      () => setStatus('idle'),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L as unknown as typeof import('leaflet');

      const start: [number, number] = value ? [value.lat, value.lng] : [20, 10];
      const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true })
        .setView(start, value ? 11 : 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      map.on('click', (e: { latlng: { lat: number; lng: number } }) =>
        placePin(e.latlng.lat, e.latlng.lng, true));
      mapRef.current = map;
      // The picker mounts inside a sliding step; re-measure once laid out
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 400);
      if (value) placePin(value.lat, value.lng, false);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Search + geolocate */}
      <form onSubmit={runSearch} style={{ display: 'flex', gap: 8 }}>
        <label htmlFor="loc-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Search for a city or region
        </label>
        <input
          id="loc-search"
          type="text"
          inputMode="search"
          placeholder="Search a city…"
          value={query}
          onChange={e => { setQuery(e.target.value); if (status === 'notfound') setStatus('idle'); }}
          style={{
            flex: 1, minWidth: 0, boxSizing: 'border-box',
            padding: '12px 14px', fontSize: 15,
            background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
            borderRadius: T.rSm, color: T.text, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'searching'}
          style={{
            flexShrink: 0, padding: '0 16px',
            background: T.green, color: '#fff', border: 'none',
            borderRadius: T.rSm, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          {status === 'searching' ? '…' : 'Find'}
        </button>
      </form>

      {status === 'notfound' && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: T.danger }}>
          No match — try a broader place name, or tap the map directly.
        </p>
      )}

      {/* Map */}
      <div
        ref={mapEl}
        role="application"
        aria-label="Map — tap to drop a pin on your location, or drag the pin to adjust"
        tabIndex={0}
        style={{
          height: 240, width: '100%',
          borderRadius: T.rSm, overflow: 'hidden',
          border: T.glassCardBd, boxShadow: T.glassCardSh,
        }}
      />

      {/* Controls + readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={status === 'locating'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: T.glassCard, border: T.glassCardBd, boxShadow: T.glassCardSh,
            borderRadius: T.rPill, fontSize: 13, fontWeight: 600, color: T.green, cursor: 'pointer',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {status === 'locating' ? 'Locating…' : 'Use my location'}
        </button>

        <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: place ? T.text : T.muted, fontWeight: place ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
          {place ? <><MapPin size={14} strokeWidth={2} color={T.green} aria-hidden="true" /> {place}</> : 'Tap the map to choose your area'}
        </p>
      </div>
    </div>
  );
}
