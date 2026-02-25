/**
 * NavMap.native.tsx — iOS / Android only
 * Wraps the cross-platform custom MapView with showDirections enabled.
 * Metro resolves this file for native builds; NavMap.web.tsx is used on web.
 */
import React from 'react';
import { MapView } from '@/components/maps/MapView';
import type { MapMarker } from '@/components/maps/MapView';

type NavMapProps = {
  from:      { lat: number; lng: number };
  to:        { lat: number; lng: number };
  toLabel?:  string;
  address?:  string;
  duration?: string;
  distance?: string;
};

export default function NavMap({
  from, to,
  toLabel  = 'Destination',
  address,
  duration,
  distance,
}: NavMapProps) {
  const markers: MapMarker[] = [
    { id: 'you',  label: 'You',    lat: from.lat, lng: from.lng, type: 'you' },
    { id: 'dest', label: toLabel,  lat: to.lat,   lng: to.lng,   type: 'pickup',
      address, duration, distance },
  ];

  return (
    <MapView
      markers={markers}
      focusId="dest"
      showDirections
      showSearch={false}
      showControls
      showTraffic
    />
  );
}
