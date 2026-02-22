/**
 * hubs.tsx  —  Unified route for ALL platforms
 * The real map rendering lives in @/components/maps/HubMap:
 *   • HubMap.native.tsx → MapView (react-native-maps, never bundled for web)
 *   • HubMap.web.tsx    → Google Maps iframe
 * This keeps react-native-maps out of the web bundle entirely.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, Pressable, ScrollView,
  StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { F, Theme } from '@/constants/Colors';
import HubMap, { type Hub } from '@/components/maps/HubMap';

const NAVY  = Theme.colors.navy;
const BRAND = Theme.colors.brand;

// ─── Hub data ─────────────────────────────────────────────────────────────────
const HUBS: Hub[] = [
  {
    id: '1', name: 'Parkhurst Hub',
    address: '127 4th Ave, Parkhurst',
    lat: -26.1449, lng: 28.0311,
    hours: 'Mon–Sat  8am–5pm', phone: '+27 11 442 0000',
    materials: ['Plastics', 'Glass', 'Paper', 'Metal'],
    isOpen: true,
  },
  {
    id: '2', name: 'Greenside Hub',
    address: '12 Barry Hertzog Ave, Greenside',
    lat: -26.1517, lng: 28.0165,
    hours: 'Mon–Fri  7am–4pm', phone: '+27 11 646 1100',
    materials: ['Plastics', 'Glass', 'E-Waste'],
    isOpen: true,
  },
  {
    id: '3', name: 'Melville Hub',
    address: '7 7th St, Melville',
    lat: -26.1689, lng: 28.0148,
    hours: 'Mon–Sat  9am–6pm', phone: '+27 11 726 3300',
    materials: ['Paper', 'Cardboard', 'Plastics'],
    isOpen: false,
  },
  {
    id: '4', name: 'Hyde Park Hub',
    address: 'Jan Smuts Ave, Hyde Park',
    lat: -26.1265, lng: 28.0487,
    hours: 'Mon–Sun  8am–6pm', phone: '+27 11 325 4400',
    materials: ['Plastics', 'Glass', 'Metal', 'Paper', 'E-Waste'],
    isOpen: true,
  },
  {
    id: '5', name: 'Rosebank Hub',
    address: '14 Tyrwhitt Ave, Rosebank',
    lat: -26.1463, lng: 28.0431,
    hours: 'Mon–Fri  8am–5pm', phone: '+27 11 788 5500',
    materials: ['Plastics', 'Glass'],
    isOpen: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function directionsUrl(hub: Hub) {
  return `https://www.google.com/maps/dir/?api=1&destination=${hub.lat},${hub.lng}&travelmode=driving`;
}

// ─── Material chip ─────────────────────────────────────────────────────────────
const Chip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

// ─── Hub row (bottom sheet list) ──────────────────────────────────────────────
const HubRow: React.FC<{
  hub: Hub; distance: string; selected: boolean; onPress: () => void;
}> = ({ hub, distance, selected, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.hubRow,
      selected && styles.hubRowSelected,
      pressed && { opacity: 0.85 },
    ]}
    onPress={onPress}
  >
    <View style={[styles.hubRowDot, { backgroundColor: hub.isOpen ? BRAND : Theme.colors.border }]} />
    <View style={styles.hubRowInfo}>
      <Text style={[styles.hubRowName, selected && styles.hubRowNameSelected]}>{hub.name}</Text>
      <Text style={styles.hubRowAddr}>{hub.address}</Text>
    </View>
    <Text style={[styles.hubRowDist, selected && styles.hubRowDistSelected]}>{distance}</Text>
  </Pressable>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const SHEET_PEEK   = 200;
const SHEET_EXPAND = 0.62;

export default function HubsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const mapRef    = useRef<any>(null);
  const sheetAnim = useRef(new Animated.Value(SHEET_PEEK)).current;
  const [expanded, setExpanded] = useState(false);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [selectedId, setSelectedId] = useState(HUBS[0].id);

  // Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationStatus('denied'); return; }
      setLocationStatus('granted');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  // Sort hubs by distance
  const hubsWithDist = HUBS.map((h) => ({
    ...h,
    distKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, h.lat, h.lng) : null,
  })).sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));

  const selectedHub = hubsWithDist.find((h) => h.id === selectedId) ?? hubsWithDist[0];
  const openCount   = HUBS.filter((h) => h.isOpen).length;

  const toggleSheet = () => {
    const toValue = expanded ? SHEET_PEEK : screenH * SHEET_EXPAND;
    Animated.spring(sheetAnim, { toValue, useNativeDriver: false, friction: 14, tension: 60 }).start();
    setExpanded(!expanded);
  };

  const selectHub = (hub: Hub) => {
    setSelectedId(hub.id);
    // On native, fly camera to selected hub
    if (Platform.OS !== 'web' && mapRef.current) {
      (mapRef.current as any).animateToRegion(
        { latitude: hub.lat, longitude: hub.lng, latitudeDelta: 0.018, longitudeDelta: 0.014 },
        400,
      );
    }
    if (expanded) {
      Animated.spring(sheetAnim, { toValue: SHEET_PEEK, useNativeDriver: false, friction: 14, tension: 60 }).start();
      setExpanded(false);
    }
  };

  const distLabel = (h: typeof hubsWithDist[0]) =>
    h.distKm !== null ? `${h.distKm.toFixed(1)} km` : `${(hubsWithDist.indexOf(h) * 1.2 + 0.8).toFixed(1)} km`;

  return (
    <View style={styles.root}>

      {/* ── Platform-resolved map (native = MapView, web = iframe) ── */}
      <HubMap
        hubs={hubsWithDist}
        selectedId={selectedId}
        onSelectHub={selectHub}
        mapRef={mapRef}
      />

      {/* ── Floating header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Hubs</Text>
          <View style={styles.headerPill}>
            <View style={[
              styles.headerPillDot,
              { backgroundColor: locationStatus === 'granted' ? BRAND : Theme.colors.border },
            ]} />
            <Text style={styles.headerPillText}>
              {locationStatus === 'requesting' ? 'Locating…'
                : locationStatus === 'denied'    ? 'Location off'
                : 'Location on'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.75 }]}
          onPress={() => WebBrowser.openBrowserAsync(
            'https://www.google.com/maps/search/recycling+hub+near+me'
          )}
        >
          <Ionicons name="navigate-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      {/* ── Recenter button (native only) ── */}
      {Platform.OS !== 'web' && (
        <Pressable
          style={[styles.recenterBtn, { bottom: SHEET_PEEK + 16 }]}
          onPress={() => {
            const ref = mapRef.current as any;
            if (!ref) return;
            if (userCoords) {
              ref.animateToRegion(
                { latitude: userCoords.lat, longitude: userCoords.lng, latitudeDelta: 0.03, longitudeDelta: 0.025 },
                400,
              );
            } else {
              ref.animateToRegion(
                { latitude: -26.1449, longitude: 28.0311, latitudeDelta: 0.06, longitudeDelta: 0.04 },
                400,
              );
            }
          }}
        >
          <Ionicons name="locate-outline" size={20} color={NAVY} />
        </Pressable>
      )}

      {/* ── Bottom sheet ── */}
      <Animated.View style={[styles.sheet, { height: sheetAnim, paddingBottom: insets.bottom + 8 }]}>

        <Pressable style={styles.handle} onPress={toggleSheet} hitSlop={12}>
          <View style={styles.handleBar} />
        </Pressable>

        <View style={styles.sheetSummary}>
          <View>
            <Text style={styles.sheetTitle}>{hubsWithDist.length} hubs near you</Text>
            <Text style={styles.sheetSub}>
              {openCount} open now
              {locationStatus === 'denied' ? '  ·  Enable location for distances' : ''}
            </Text>
          </View>
          <Pressable style={styles.expandBtn} onPress={toggleSheet}>
            <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={16} color={Theme.colors.muted} />
          </Pressable>
        </View>

        {/* Selected hub detail card */}
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="storefront-outline" size={20} color={NAVY} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selectedHub.name}</Text>
              <Text style={styles.detailAddr}>{selectedHub.address}</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: selectedHub.isOpen ? Theme.colors.brandLight : Theme.colors.surface }]}>
              <View style={[styles.openDot, { backgroundColor: selectedHub.isOpen ? BRAND : Theme.colors.muted }]} />
              <Text style={[styles.openText, { color: selectedHub.isOpen ? Theme.colors.greenDark : Theme.colors.muted }]}>
                {selectedHub.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={styles.detailMeta}>
            <Ionicons name="time-outline" size={12} color={Theme.colors.muted} />
            <Text style={styles.detailMetaText}>{selectedHub.hours}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {selectedHub.materials.map((m) => <Chip key={m} label={m} />)}
          </ScrollView>

          <View style={styles.detailActions}>
            <Pressable
              style={({ pressed }) => [styles.dirBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => WebBrowser.openBrowserAsync(directionsUrl(selectedHub))}
            >
              <Ionicons name="navigate" size={16} color={NAVY} />
              <Text style={styles.dirBtnText}>Get Directions</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
              onPress={() => WebBrowser.openBrowserAsync(`tel:${selectedHub.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={Theme.colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Expanded hub list */}
        {expanded && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.hubList}>
            {hubsWithDist.map((hub) => (
              <HubRow
                key={hub.id}
                hub={hub}
                distance={distLabel(hub)}
                selected={hub.id === selectedId}
                onPress={() => selectHub(hub)}
              />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.neutral200 },

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255,255,255,0.88)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Theme.shadow.soft,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Theme.colors.brandLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: F.display, fontSize: 17, color: NAVY, letterSpacing: -0.3 },
  headerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  headerPillDot: { width: 6, height: 6, borderRadius: 3 },
  headerPillText: { fontFamily: F.body, fontSize: 11, color: Theme.colors.muted },

  recenterBtn: {
    position: 'absolute', right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Theme.colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...Theme.shadow.soft,
  },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 8,
    ...Theme.shadow.lift,
  },
  handle: { alignItems: 'center', paddingVertical: 6 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Theme.colors.border },
  sheetSummary: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10,
  },
  sheetTitle: { fontFamily: F.bold, fontSize: 15, color: NAVY },
  sheetSub: { fontFamily: F.body, fontSize: 12, color: Theme.colors.muted, marginTop: 2 },
  expandBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center', justifyContent: 'center',
  },

  detailCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.l, padding: 14, gap: 10,
  },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Theme.colors.brandLight,
    alignItems: 'center', justifyContent: 'center',
  },
  detailInfo: { flex: 1 },
  detailName: { fontFamily: F.bold, fontSize: 14, color: NAVY },
  detailAddr: { fontFamily: F.body, fontSize: 11, color: Theme.colors.muted, marginTop: 1 },
  openBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontFamily: F.display, fontSize: 11 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailMetaText: { fontFamily: F.body, fontSize: 12, color: Theme.colors.muted },
  chipRow: { gap: 6, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Theme.colors.card,
    borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border,
  },
  chipText: { fontFamily: F.semibold, fontSize: 11, color: Theme.colors.ink },
  detailActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dirBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 11,
    backgroundColor: BRAND, borderRadius: Theme.radius.m, ...Theme.shadow.glow,
  },
  dirBtnText: { fontFamily: F.display, fontSize: 13, color: NAVY },
  callBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Theme.colors.border,
  },

  hubList: { marginTop: 10 },
  hubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: Theme.radius.m, marginBottom: 4,
    backgroundColor: 'transparent',
  },
  hubRowSelected: { backgroundColor: Theme.colors.brandLight },
  hubRowDot: { width: 8, height: 8, borderRadius: 4 },
  hubRowInfo: { flex: 1 },
  hubRowName: { fontFamily: F.semibold, fontSize: 13, color: NAVY },
  hubRowNameSelected: { fontFamily: F.bold },
  hubRowAddr: { fontFamily: F.body, fontSize: 11, color: Theme.colors.muted, marginTop: 1 },
  hubRowDist: { fontFamily: F.display, fontSize: 12, color: Theme.colors.muted },
  hubRowDistSelected: { color: Theme.colors.greenDark },
});
