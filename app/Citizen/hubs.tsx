/**
 * hubs.tsx  —  Unified route for ALL platforms
 * The real map rendering lives in @/components/maps/HubMap:
 *   • HubMap.native.tsx → MapView (react-native-maps, never bundled for web)
 *   • HubMap.web.tsx    → Google Maps iframe
 * This keeps react-native-maps out of the web bundle entirely.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Linking, Platform, Pressable, ScrollView,
  StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { PressableScale } from '@/components/ui/PressableScale';
import HubMap, { type Hub } from '@/components/maps/HubMap';

// ─── Hub data ─────────────────────────────────────────────────────────────────
const HUBS: Hub[] = [
  { id: '1', name: 'Parkhurst Hub', address: '127 4th Ave, Parkhurst',           lat: -26.1449, lng: 28.0311, hours: 'Mon–Sat  8am–5pm', phone: '+27 11 442 0000', materials: ['Plastics', 'Glass', 'Paper', 'Metal'],                   isOpen: true  },
  { id: '2', name: 'Greenside Hub', address: '12 Barry Hertzog Ave, Greenside',   lat: -26.1517, lng: 28.0165, hours: 'Mon–Fri  7am–4pm', phone: '+27 11 646 1100', materials: ['Plastics', 'Glass', 'E-Waste'],                        isOpen: true  },
  { id: '3', name: 'Melville Hub',  address: '7 7th St, Melville',                lat: -26.1689, lng: 28.0148, hours: 'Mon–Sat  9am–6pm', phone: '+27 11 726 3300', materials: ['Paper', 'Cardboard', 'Plastics'],                      isOpen: false },
  { id: '4', name: 'Hyde Park Hub', address: 'Jan Smuts Ave, Hyde Park',          lat: -26.1265, lng: 28.0487, hours: 'Mon–Sun  8am–6pm', phone: '+27 11 325 4400', materials: ['Plastics', 'Glass', 'Metal', 'Paper', 'E-Waste'],      isOpen: true  },
  { id: '5', name: 'Rosebank Hub',  address: '14 Tyrwhitt Ave, Rosebank',         lat: -26.1463, lng: 28.0431, hours: 'Mon–Fri  8am–5pm', phone: '+27 11 788 5500', materials: ['Plastics', 'Glass'],                                   isOpen: false },
];

const ALL_MATERIALS = ['Plastics', 'Glass', 'Paper', 'Metal', 'E-Waste', 'Cardboard'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function directionsUrl(hub: Hub) {
  return `https://www.google.com/maps/dir/?api=1&destination=${hub.lat},${hub.lng}&travelmode=driving`;
}

// ─── Styles factory ────────────────────────────────────────────────────────
function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const headerBg = Platform.OS === 'android'
    ? (isDark ? C.card : '#FFFFFF')
    : (isDark ? 'rgba(28,30,33,0.95)' : 'rgba(255,255,255,0.88)');

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.neutral200 },

    header: {
      position: 'absolute', top: 0, left: 0, right: 0,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 12, gap: 12,
      backgroundColor: headerBg,
      borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
      shadowColor: isDark ? '#000' : '#0C120D', shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1 },
    headerTitle: { fontFamily: F.display, fontSize: 17, color: C.ink, letterSpacing: -0.3 },
    headerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    headerPillDot: { width: 6, height: 6, borderRadius: 3 },
    headerPillText: { fontFamily: F.body, fontSize: 11, color: C.muted },

    recenterWrap: { position: 'absolute', right: 16 },
    recenterBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: C.card,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: isDark ? '#000' : '#0C120D', shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },

    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 16, paddingTop: 8,
      shadowColor: isDark ? '#000' : '#0C120D', shadowOpacity: isDark ? 0.35 : 0.14,
      shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 4,
    },
    handle: { alignItems: 'center', paddingVertical: 6 },
    handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border },

    sheetSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    sheetTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
    sheetSub: { fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 2 },
    summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    expandBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.wash, alignItems: 'center', justifyContent: 'center' },
    filterBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.brand, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
    filterBadgeText: { fontFamily: F.bold, fontSize: 11, color: '#FFFFFF' },

    filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 12, paddingHorizontal: 2 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
    filterChipText: { fontFamily: F.semibold, fontSize: 12, color: C.muted },
    filterChipTextActive: { color: '#FFFFFF' },

    detailCard: { backgroundColor: C.surface, borderRadius: 24, padding: 14, gap: 10 },
    detailTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    detailInfo: { flex: 1 },
    detailName: { fontFamily: F.bold, fontSize: 14, color: C.ink },
    detailAddr: { fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 1 },
    openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexShrink: 0 },
    openDot: { width: 6, height: 6, borderRadius: 3 },
    openText: { fontFamily: F.display, fontSize: 11 },
    detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailMetaText: { fontFamily: F.body, fontSize: 12, color: C.muted },
    chipRow: { gap: 6, paddingBottom: 2 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    chipText: { fontFamily: F.semibold, fontSize: 11, color: C.ink },
    detailActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dirBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 11, backgroundColor: C.brand, borderRadius: 18,
      shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    dirBtnText: { fontFamily: F.display, fontSize: 13, color: C.navy },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.wash, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

    hubList: { marginTop: 8 },
    hubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 18, marginBottom: 2, backgroundColor: 'transparent' },
    hubRowSelected: { backgroundColor: C.brandLight },
    hubRowStatusDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
    hubRowInfo: { flex: 1 },
    hubRowName: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    hubRowNameSelected: { fontFamily: F.bold },
    hubRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    hubRowStatus: { fontFamily: F.semibold, fontSize: 11 },
    hubRowDot: { fontFamily: F.body, fontSize: 11, color: C.border },
    hubRowHours: { fontFamily: F.body, fontSize: 11, color: C.muted },
    hubRowDist: { fontFamily: F.display, fontSize: 12, color: C.muted, flexShrink: 0 },
    hubRowDistSelected: { color: C.greenDark },

    emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
    emptyText: { fontFamily: F.semibold, fontSize: 14, color: C.muted },
    emptyAction: { fontFamily: F.bold, fontSize: 13, color: C.brand },
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────
const MaterialChip: React.FC<{ label: string }> = ({ label }) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
};

const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void; icon?: string }> = ({
  label, active, onPress, icon,
}) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress} hitSlop={4}>
      {icon && <Ionicons name={icon as any} size={12} color={active ? '#FFFFFF' : C.muted} />}
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
};

const HubRow: React.FC<{ hub: Hub; distance: string; selected: boolean; onPress: () => void }> = ({
  hub, distance, selected, onPress,
}) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  return (
    <Pressable style={[styles.hubRow, selected && styles.hubRowSelected]} onPress={onPress}>
      <View style={[styles.hubRowStatusDot, { backgroundColor: hub.isOpen ? C.brand : C.border }]} />
      <View style={styles.hubRowInfo}>
        <Text style={[styles.hubRowName, selected && styles.hubRowNameSelected]}>{hub.name}</Text>
        <View style={styles.hubRowMeta}>
          <Text style={[styles.hubRowStatus, { color: hub.isOpen ? C.greenDark : C.muted }]}>
            {hub.isOpen ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.hubRowDot}>·</Text>
          <Text style={styles.hubRowHours}>{hub.hours}</Text>
        </View>
      </View>
      <Text style={[styles.hubRowDist, selected && styles.hubRowDistSelected]}>{distance}</Text>
    </Pressable>
  );
};

// ─── Sheet heights ─────────────────────────────────────────────────────────────
const SHEET_PEEK   = 292;
const SHEET_EXPAND = 0.78;

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function HubsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const mapRef     = useRef<any>(null);
  const sheetAnim  = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [selectedId, setSelectedId] = useState(HUBS[0].id);

  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterMats, setFilterMats] = useState<string[]>([]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(sheetAnim, { toValue: SHEET_PEEK, useNativeDriver: false, friction: 12, tension: 50 }),
    ]).start();
  }, []);

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

  const hubsWithDist = HUBS.map((h) => ({
    ...h,
    distKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, h.lat, h.lng) : null,
  })).sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));

  const visibleHubs = hubsWithDist.filter((h) => {
    if (filterOpenOnly && !h.isOpen) return false;
    if (filterMats.length > 0 && !filterMats.every((m) => h.materials.includes(m))) return false;
    return true;
  });

  const selectedHub = hubsWithDist.find((h) => h.id === selectedId) ?? hubsWithDist[0];
  const openCount   = HUBS.filter((h) => h.isOpen).length;
  const hasFilters  = filterOpenOnly || filterMats.length > 0;
  const activeFilterCount = (filterOpenOnly ? 1 : 0) + filterMats.length;

  const toggleSheet = () => {
    const toValue = expanded ? SHEET_PEEK : screenH * SHEET_EXPAND;
    Animated.spring(sheetAnim, { toValue, useNativeDriver: false, friction: 14, tension: 60 }).start();
    setExpanded(!expanded);
  };

  const selectHub = (hub: Hub) => {
    setSelectedId(hub.id);
    if (Platform.OS !== 'web' && mapRef.current) {
      (mapRef.current as any).animateToRegion(
        { latitude: hub.lat, longitude: hub.lng, latitudeDelta: 0.018, longitudeDelta: 0.014 }, 400,
      );
    }
    if (expanded) {
      Animated.spring(sheetAnim, { toValue: SHEET_PEEK, useNativeDriver: false, friction: 14, tension: 60 }).start();
      setExpanded(false);
    }
  };

  const toggleMatFilter = (mat: string) =>
    setFilterMats((prev) => prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]);

  const distLabel = (h: typeof hubsWithDist[0]) =>
    h.distKm !== null ? `${h.distKm.toFixed(1)} km` : `${(hubsWithDist.indexOf(h) * 1.2 + 0.8).toFixed(1)} km`;

  const recenterBottom = Animated.add(sheetAnim, new Animated.Value(16));

  return (
    <View style={styles.root}>

      {/* Map */}
      <HubMap hubs={hubsWithDist} selectedId={selectedId} onSelectHub={selectHub} mapRef={mapRef} />

      {/* Floating header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: headerAnim }]}>
        <PressableScale style={styles.headerBtn} onPress={() => router.back()} scaleTo={0.9}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Hubs</Text>
          <View style={styles.headerPill}>
            <View style={[styles.headerPillDot, { backgroundColor: locationStatus === 'granted' ? C.brand : C.border }]} />
            <Text style={styles.headerPillText}>
              {locationStatus === 'requesting' ? 'Locating…' : locationStatus === 'denied' ? 'Location off' : 'Location on'}
            </Text>
          </View>
        </View>
        <PressableScale
          style={styles.headerBtn}
          onPress={() => WebBrowser.openBrowserAsync('https://www.google.com/maps/search/recycling+hub+near+me')}
          scaleTo={0.9}
        >
          <Ionicons name="navigate-outline" size={20} color={C.ink} />
        </PressableScale>
      </Animated.View>

      {/* Recenter button */}
      {Platform.OS !== 'web' && (
        <Animated.View style={[styles.recenterWrap, { bottom: recenterBottom }]}>
          <PressableScale
            style={styles.recenterBtn}
            scaleTo={0.88}
            onPress={() => {
              const ref = mapRef.current as any;
              if (!ref) return;
              const region = userCoords
                ? { latitude: userCoords.lat, longitude: userCoords.lng, latitudeDelta: 0.03, longitudeDelta: 0.025 }
                : { latitude: -26.1449, longitude: 28.0311, latitudeDelta: 0.06, longitudeDelta: 0.04 };
              ref.animateToRegion(region, 400);
            }}
          >
            <Ionicons name="locate-outline" size={20} color={C.ink} />
          </PressableScale>
        </Animated.View>
      )}

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { height: sheetAnim, paddingBottom: insets.bottom + 8 }]}>

        <Pressable style={styles.handle} onPress={toggleSheet} hitSlop={12}>
          <View style={styles.handleBar} />
        </Pressable>

        {/* Summary row */}
        <View style={styles.sheetSummary}>
          <View>
            <Text style={styles.sheetTitle}>
              {hasFilters ? `${visibleHubs.length} of ${hubsWithDist.length} hubs` : `${hubsWithDist.length} hubs near you`}
            </Text>
            <Text style={styles.sheetSub}>
              {openCount} open now{locationStatus === 'denied' ? '  ·  Enable location for distances' : ''}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            {hasFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
            <Pressable style={styles.expandBtn} onPress={toggleSheet}>
              <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={16} color={C.muted} />
            </Pressable>
          </View>
        </View>

        {/* Filter chips */}
        {expanded && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="Open now" active={filterOpenOnly} icon={filterOpenOnly ? 'checkmark-circle' : 'time-outline'} onPress={() => setFilterOpenOnly((v) => !v)} />
            {ALL_MATERIALS.map((mat) => (
              <FilterChip key={mat} label={mat} active={filterMats.includes(mat)} onPress={() => toggleMatFilter(mat)} />
            ))}
          </ScrollView>
        )}

        {/* Detail card */}
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="storefront-outline" size={20} color={C.ink} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selectedHub.name}</Text>
              <Text style={styles.detailAddr}>{selectedHub.address}</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: selectedHub.isOpen ? C.brandLight : C.surface }]}>
              <View style={[styles.openDot, { backgroundColor: selectedHub.isOpen ? C.brand : C.muted }]} />
              <Text style={[styles.openText, { color: selectedHub.isOpen ? C.greenDark : C.muted }]}>
                {selectedHub.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <View style={styles.detailMeta}>
            <Ionicons name="time-outline" size={12} color={C.muted} />
            <Text style={styles.detailMetaText}>{selectedHub.hours}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {selectedHub.materials.map((m) => <MaterialChip key={m} label={m} />)}
          </ScrollView>
          <View style={styles.detailActions}>
            <PressableScale style={styles.dirBtn} scaleTo={0.97} onPress={() => WebBrowser.openBrowserAsync(directionsUrl(selectedHub))}>
              <Ionicons name="navigate" size={16} color={C.navy} />
              <Text style={styles.dirBtnText}>Get Directions</Text>
            </PressableScale>
            <PressableScale style={styles.callBtn} scaleTo={0.9} onPress={() => Linking.openURL(`tel:${selectedHub.phone}`)}>
              <Ionicons name="call-outline" size={18} color={C.muted} />
            </PressableScale>
          </View>
        </View>

        {/* Hub list */}
        {expanded && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.hubList}>
            {visibleHubs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color={C.border} />
                <Text style={styles.emptyText}>No hubs match your filters</Text>
                <Pressable onPress={() => { setFilterOpenOnly(false); setFilterMats([]); }}>
                  <Text style={styles.emptyAction}>Clear filters</Text>
                </Pressable>
              </View>
            ) : (
              visibleHubs.map((hub) => (
                <HubRow key={hub.id} hub={hub} distance={distLabel(hub)} selected={hub.id === selectedId} onPress={() => selectHub(hub)} />
              ))
            )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}
