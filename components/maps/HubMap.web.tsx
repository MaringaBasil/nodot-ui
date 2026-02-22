/**
 * HubMap.web.tsx  —  Web only
 * Full-screen Google Maps iframe.
 * Metro resolves this file for web builds; HubMap.native.tsx is used on iOS/Android.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type Hub = {
  id: string; name: string; address: string;
  lat: number; lng: number;
  hours: string; phone: string;
  materials: string[]; isOpen: boolean;
};

type HubMapProps = {
  hubs: Hub[];
  selectedId: string;
  onSelectHub: (hub: Hub) => void;
  mapRef?: React.RefObject<any>; // unused on web
};

export default function HubMap({ hubs, selectedId }: HubMapProps) {
  const selected = hubs.find((h) => h.id === selectedId) ?? hubs[0];
  const src = `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&output=embed&z=16`;

  return (
    <View style={StyleSheet.absoluteFill}>
      {React.createElement('iframe', {
        key: selectedId, // forces reload when selection changes
        src,
        style: { border: 'none', width: '100%', height: '100%' },
        loading: 'lazy',
        allowFullScreen: true,
        title: 'Hub location',
      })}
    </View>
  );
}
