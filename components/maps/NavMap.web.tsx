/**
 * NavMap.web.tsx — Web only
 * Google Maps iframe in Directions mode.
 * The saddr/daddr embed shows a real driving route with no API key required.
 * Metro resolves this file for web; NavMap.native.tsx is used on iOS/Android.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

type NavMapProps = {
  from: { lat: number; lng: number };
  to:   { lat: number; lng: number };
  toLabel?: string;
  address?: string;
  duration?: string;
  distance?: string;
};

export default function NavMap({ from, to }: NavMapProps) {
  const src =
    `https://maps.google.com/maps` +
    `?saddr=${from.lat},${from.lng}` +
    `&daddr=${to.lat},${to.lng}` +
    `&output=embed&layer=t`;        // layer=t adds traffic overlay

  return (
    <View style={StyleSheet.absoluteFill}>
      {React.createElement('iframe', {
        src,
        style: { border: 'none', width: '100%', height: '100%' },
        loading: 'lazy',
        allowFullScreen: true,
        title: 'Navigation',
      })}
    </View>
  );
}
