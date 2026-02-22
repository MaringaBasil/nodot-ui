/**
 * HubMap.native.tsx  —  iOS & Android only
 * Full-screen MapView with custom markers.
 * Metro resolves this file for native builds; HubMap.web.tsx is used on web.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Theme } from '@/constants/Colors';

const NAVY  = Theme.colors.navy;
const BRAND = Theme.colors.brand;

const MAP_CENTER = {
  latitude: -26.1449, longitude: 28.0311,
  latitudeDelta: 0.06, longitudeDelta: 0.04,
};

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
  mapRef: React.RefObject<MapView>;
};

// ─── Custom marker pin ────────────────────────────────────────────────────────
const HubPin: React.FC<{ isOpen: boolean; selected: boolean }> = ({ isOpen, selected }) => (
  <View style={[
    styles.pin,
    { backgroundColor: selected ? NAVY : isOpen ? BRAND : Theme.colors.muted },
    selected && styles.pinSelected,
  ]}>
    <Ionicons name="storefront-outline" size={selected ? 16 : 13} color="#FFFFFF" />
    {selected && <View style={styles.pinTail} />}
  </View>
);

export default function HubMap({ hubs, selectedId, onSelectHub, mapRef }: HubMapProps) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={MAP_CENTER}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {hubs.map((hub) => (
        <Marker
          key={hub.id}
          coordinate={{ latitude: hub.lat, longitude: hub.lng }}
          onPress={() => onSelectHub(hub)}
          anchor={{ x: 0.5, y: 1 }}
        >
          <HubPin isOpen={hub.isOpen} selected={hub.id === selectedId} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Theme.shadow.soft,
  },
  pinSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
  },
  pinTail: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: NAVY,
  },
});
