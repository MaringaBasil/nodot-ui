import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import { MapView } from '@/components/maps/MapView';
import type { MapMarker } from '@/components/maps/MapView';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

// ─── Types ───────────────────────────────────────────────────────────────────

type Job = {
  id: string; address: string; weight: number;
  material: string; distance: string; eta: string; payout: number;
  status: 'pending' | 'accepted' | 'completed';
  coordinates: { lat: number; lng: number };
};

type RouteStop = {
  id: string; address: string; weight: number;
  material: string; distance: string; payout: number;
};

type Hotspot = {
  id: string; name: string; address: string;
  material?: string; coordinates: { lat: number; lng: number };
};

// ─── Mock data ───────────────────────────────────────────────────────────────

// Pre-assigned stops for today — batched by the system from citizen requests.
// In production these come from the dispatcher API.
const TODAY_ROUTE: RouteStop[] = [
  { id: 's1', address: '321 Oak Drive, Melville',      weight: 8.7, material: 'Glass bottles',    distance: '4.2 km', payout: 35 },
  { id: 's2', address: '45 7th Avenue, Parktown',      weight: 6.2, material: 'PET Plastic',       distance: '2.1 km', payout: 31 },
  { id: 's3', address: '78 Long St, Braamfontein',     weight: 9.4, material: 'Cardboard',         distance: '1.3 km', payout: 28 },
];

const ROUTE_TOTAL_PAYOUT = TODAY_ROUTE.reduce((s, r) => s + r.payout, 0);
const ROUTE_TOTAL_KG     = TODAY_ROUTE.reduce((s, r) => s + r.weight, 0);

const MOCK_JOBS: Job[] = [
  { id: '1', address: '123 Main St, Rosebank',       weight: 5.2,  status: 'pending', coordinates: { lat: -26.2041, lng: 28.0473 }, material: 'PET Plastic',       distance: '1.2 km', eta: '5 min',  payout: 26 },
  { id: '2', address: '456 Market Rd, Sandton',      weight: 12.0, status: 'pending', coordinates: { lat: -26.205,  lng: 28.048  }, material: 'Mixed recyclables', distance: '2.4 km', eta: '12 min', payout: 60 },
  { id: '3', address: '789 Township Ave, Alexandra', weight: 3.5,  status: 'pending', coordinates: { lat: -26.206,  lng: 28.049  }, material: 'Cardboard',        distance: '3.1 km', eta: '18 min', payout: 14 },
];

const MOCK_HOTSPOTS: Hotspot[] = [
  { id: 'hs-1', name: 'CBD Hotspot',    address: 'Scout zone A', material: 'Mixed plastic', coordinates: { lat: -26.2045, lng: 28.0482 } },
  { id: 'hs-2', name: 'Station Point', address: 'Scout zone B', material: 'Glass',          coordinates: { lat: -26.2055, lng: 28.0503 } },
];

const DRIVER_LOC = { lat: -26.2048, lng: 28.0479 };

const FILTERS = ['All', 'Nearby', 'High Value'] as const;
type Filter = typeof FILTERS[number];

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    header: {
      paddingHorizontal: 20, paddingBottom: 22,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    headerBlobTL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
    headerBlobBR: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
    headerInner: { flexDirection: 'row', alignItems: 'center' },
    headerLeft: { gap: 1 },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionLink: { fontFamily: F.semibold, fontSize: 13, color: C.brand },
    sectionMeta: { fontFamily: F.body, fontSize: 13, color: C.muted },

    /* Filter chips */
    filterRow: { flexDirection: 'row', gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: C.card, borderWidth: 1, borderColor: cardBorder,
    },
    filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
    filterChipText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
    filterChipTextActive: { color: C.brand },

    /* Map */
    mapWrap: { height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: cardBorder },

    /* Generic card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* Today's Route card */
    routeCard: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1.5, borderColor: isDark ? 'rgba(78,200,49,0.3)' : 'rgba(78,200,49,0.25)',
      shadowColor: '#4EC831', shadowOpacity: isDark ? 0.08 : 0.06,
      shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    routeCardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 11,
      backgroundColor: isDark ? 'rgba(78,200,49,0.1)' : '#EBF8E5',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(78,200,49,0.18)' : 'rgba(78,200,49,0.15)',
    },
    routeCardTitle: { fontFamily: F.bold, fontSize: 14, color: C.brand },
    routeCardMeta:  { fontFamily: F.body, fontSize: 12, color: C.muted },
    routeDivider:   { height: 1, backgroundColor: cardBorder, marginLeft: 54 },

    /* Route stop row */
    routeStopRow:  { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 12 },
    routeStopNum:  {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    routeStopNumText: { fontFamily: F.bold, fontSize: 12, color: C.brand },
    routeStopInfo:    { flex: 1, gap: 2 },
    routeStopAddress: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    routeStopMeta:    { fontFamily: F.body, fontSize: 12, color: C.muted },
    routeStopPayout:  { fontFamily: F.bold, fontSize: 13, color: C.brand, flexShrink: 0 },

    /* Start Route button */
    startRouteBtn: {
      margin: 12,
      paddingVertical: 13, borderRadius: 22,
      backgroundColor: C.brand,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 }, elevation: 3,
    },
    startRouteBtnText: { fontFamily: F.bold, fontSize: 14, color: C.navy },

    /* Job row */
    jobRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    jobIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    jobInfo: { flex: 1, gap: 2 },
    jobAddress: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    jobMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    jobRight: { alignItems: 'flex-end', gap: 6 },
    jobPayout: { fontFamily: F.bold, fontSize: 14, color: C.brand },
    acceptBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.navy, borderRadius: 10 },
    acceptBtnText: { fontFamily: F.semibold, fontSize: 12, color: C.brand },

    /* Hotspot row */
    hotspotRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    hotspotIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
    hotspotInfo: { flex: 1, gap: 2 },
    hotspotName: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    hotspotMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    hotspotNav:  { width: 30, height: 30, borderRadius: 15, backgroundColor: C.wash, alignItems: 'center', justifyContent: 'center' },

    /* Empty state */
    emptyBox:  { padding: 28, alignItems: 'center', gap: 8 },
    emptyText: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center' },

    /* Modal */
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: isDark ? 'rgba(20,26,44,0.97)' : 'rgba(255,255,255,0.97)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, gap: 12,
      borderWidth: 1, borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    },
    modalHandle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', alignSelf: 'center' },
    modalTitle:      { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
    modalHint:       { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: -4 },
    input: {
      borderWidth: 1, borderColor: cardBorder, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      fontFamily: F.body, fontSize: 14, color: C.ink, backgroundColor: C.surface,
    },
    modalSubmit: {
      backgroundColor: C.brand, borderRadius: 28, paddingVertical: 14,
      alignItems: 'center', marginTop: 4,
      shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    modalSubmitText: { fontFamily: F.bold, fontSize: 14, color: C.navy },

    pressed: { opacity: 0.7 },
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PickerJobs() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles  = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [jobs, setJobs]           = useState<Job[]>(MOCK_JOBS);
  const [hotspots, setHotspots]   = useState<Hotspot[]>(MOCK_HOTSPOTS);
  const [filter, setFilter]       = useState<Filter>('All');
  const [focusId, setFocusId]     = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [hsName, setHsName] = useState('');
  const [hsAddr, setHsAddr] = useState('');
  const [hsMat, setHsMat]   = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') =>
    setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  const filteredJobs = useMemo(() => {
    if (filter === 'Nearby')     return [...jobs].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    if (filter === 'High Value') return [...jobs].sort((a, b) => b.payout - a.payout);
    return jobs;
  }, [jobs, filter]);

  const markers: MapMarker[] = useMemo(() => [
    { id: 'you', label: 'You', lat: DRIVER_LOC.lat, lng: DRIVER_LOC.lng, type: 'you' },
    ...jobs.map(j => ({ id: j.id, label: j.address, lat: j.coordinates.lat, lng: j.coordinates.lng, type: 'pickup' as const })),
    ...hotspots.map(h => ({ id: h.id, label: h.name, lat: h.coordinates.lat, lng: h.coordinates.lng, type: 'hotspot' as const })),
  ], [jobs, hotspots]);

  const handleStartRoute = useCallback(() => {
    haptic();
    router.push('/Picker/navigate' as any);
  }, [haptic, router]);

  const acceptJob = useCallback((job: Job) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'accepted' } : j));
    setFocusId(job.id);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast_(`Added to queue: ${job.address}`, 'success');
  }, [toast_]);

  const addHotspot = useCallback(() => {
    const jitter = () => (Math.random() - 0.5) * 0.006;
    const newH: Hotspot = {
      id: `hs-${Date.now()}`,
      name: hsName.trim() || `Hotspot ${hotspots.length + 1}`,
      address: hsAddr.trim() || 'Scout zone',
      material: hsMat.trim() || 'Mixed recyclables',
      coordinates: { lat: DRIVER_LOC.lat + jitter(), lng: DRIVER_LOC.lng + jitter() },
    };
    setHotspots(prev => [...prev, newH]);
    setFocusId(newH.id);
    setModalVisible(false);
    setHsName(''); setHsAddr(''); setHsMat('');
    toast_('Hotspot added', 'success');
  }, [hotspots.length, hsName, hsAddr, hsMat, toast_]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setRefreshing(false); toast_('Jobs refreshed', 'success'); }, 1200);
  }, [toast_]);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, {
        opacity: enterAnim,
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }]}>
        <View style={styles.root}>
          <Toast
            visible={toast.visible} message={toast.message} type={toast.type}
            onHide={() => setToast(t => ({ ...t, visible: false }))}
          />

          {/* ── Header ── */}
          <LinearGradient
            colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 12 }]}
          >
            <View style={styles.headerBlobTL} />
            <View style={styles.headerBlobBR} />
            <View style={styles.headerInner}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>Your work for today</Text>
                <Text style={styles.headerTitle}>Jobs</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
          >

            {/* ── Today's Route ── */}
            <View style={styles.section}>
              <View style={styles.routeCard}>
                {/* Header */}
                <View style={styles.routeCardHeader}>
                  <Text style={styles.routeCardTitle}>Today's Route</Text>
                  <Text style={styles.routeCardMeta}>
                    {TODAY_ROUTE.length} stops · {ROUTE_TOTAL_KG.toFixed(1)} kg · R {ROUTE_TOTAL_PAYOUT}
                  </Text>
                </View>

                {/* Stops list */}
                {TODAY_ROUTE.map((stop, idx) => (
                  <View key={stop.id}>
                    <View style={styles.routeStopRow}>
                      <View style={styles.routeStopNum}>
                        <Text style={styles.routeStopNumText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.routeStopInfo}>
                        <Text style={styles.routeStopAddress} numberOfLines={1}>{stop.address}</Text>
                        <Text style={styles.routeStopMeta}>
                          {stop.material} · {stop.weight} kg · {stop.distance}
                        </Text>
                      </View>
                      <Text style={styles.routeStopPayout}>R {stop.payout}</Text>
                    </View>
                    {idx < TODAY_ROUTE.length - 1 && <View style={styles.routeDivider} />}
                  </View>
                ))}

                {/* Start Route CTA */}
                <Pressable
                  style={({ pressed }) => [styles.startRouteBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
                  onPress={handleStartRoute}
                >
                  <Ionicons name="navigate" size={18} color={C.navy} />
                  <Text style={styles.startRouteBtnText}>Start Route</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Filters ── */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <Pressable
                  key={f}
                  style={({ pressed }) => [styles.filterChip, filter === f && styles.filterChipActive, pressed && styles.pressed]}
                  onPress={() => { haptic(); setFilter(f); }}
                >
                  <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Route Overview map ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Area Overview</Text>
                <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => { haptic(); setFocusId(null); }}>
                  <Text style={styles.sectionLink}>Re-center</Text>
                </Pressable>
              </View>
              <View style={styles.mapWrap}>
                <MapView
                  markers={markers}
                  focusId={focusId ?? undefined}
                  onMarkerPress={id => { if (id !== 'you') setFocusId(id); }}
                />
              </View>
            </View>

            {/* ── Additional pickups ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>More Pickups Nearby</Text>
                <Text style={styles.sectionMeta}>{filteredJobs.length} available</Text>
              </View>
              {filteredJobs.length === 0 ? (
                <View style={[styles.card, styles.emptyBox]}>
                  <Ionicons name="archive-outline" size={28} color={C.muted} />
                  <Text style={styles.emptyText}>No extra pickups nearby.{'\n'}Pull down to refresh.</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {filteredJobs.map((job, idx) => (
                    <View key={job.id}>
                      <Pressable
                        style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}
                        onPress={() => { haptic(); setFocusId(job.id); }}
                      >
                        <View style={styles.jobIcon}>
                          <Ionicons name="cube-outline" size={18} color={C.brand} />
                        </View>
                        <View style={styles.jobInfo}>
                          <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
                          <Text style={styles.jobMeta}>{job.weight} kg · {job.material} · {job.distance}</Text>
                        </View>
                        <View style={styles.jobRight}>
                          <Text style={styles.jobPayout}>R {job.payout}</Text>
                          <Pressable
                            style={({ pressed }) => [
                              styles.acceptBtn,
                              job.status === 'accepted' && { backgroundColor: C.surface },
                              pressed && job.status !== 'accepted' && styles.pressed,
                            ]}
                            onPress={() => { haptic(); if (job.status !== 'accepted') acceptJob(job); }}
                          >
                            <Text style={[styles.acceptBtnText, job.status === 'accepted' && { color: C.brand }]}>
                              {job.status === 'accepted' ? 'Queued' : 'Add'}
                            </Text>
                          </Pressable>
                        </View>
                      </Pressable>
                      {idx < filteredJobs.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Hotspots ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hotspots</Text>
                <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => { haptic(); setModalVisible(true); }}>
                  <Text style={styles.sectionLink}>+ Add</Text>
                </Pressable>
              </View>
              {hotspots.length === 0 ? (
                <View style={[styles.card, styles.emptyBox]}>
                  <Ionicons name="location-outline" size={28} color={C.muted} />
                  <Text style={styles.emptyText}>No hotspots yet. Tap + Add to flag a pickup area.</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {hotspots.map((hs, idx) => (
                    <View key={hs.id}>
                      <Pressable style={({ pressed }) => [styles.hotspotRow, pressed && styles.pressed]} onPress={() => { haptic(); setFocusId(hs.id); }}>
                        <View style={styles.hotspotIcon}>
                          <Ionicons name="location" size={18} color="#F57C00" />
                        </View>
                        <View style={styles.hotspotInfo}>
                          <Text style={styles.hotspotName}>{hs.name}</Text>
                          <Text style={styles.hotspotMeta}>{hs.address}{hs.material ? ` · ${hs.material}` : ''}</Text>
                        </View>
                        <View style={styles.hotspotNav}>
                          <Ionicons name="navigate-circle-outline" size={18} color={C.brand} />
                        </View>
                      </Pressable>
                      {idx < hotspots.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              )}
            </View>

          </ScrollView>

          {/* ── Add Hotspot Modal ── */}
          <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
            <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
              <Pressable style={styles.modalCard} onPress={() => {}}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>New Hotspot</Text>
                <Text style={styles.modalHint}>Location will be pinned near your current position.</Text>
                <TextInput style={styles.input} placeholder="Name (e.g. CBD Alley)" placeholderTextColor={C.muted} value={hsName} onChangeText={setHsName} />
                <TextInput style={styles.input} placeholder="Address or description (optional)" placeholderTextColor={C.muted} value={hsAddr} onChangeText={setHsAddr} />
                <TextInput style={styles.input} placeholder="Material (e.g. PET plastic)" placeholderTextColor={C.muted} value={hsMat} onChangeText={setHsMat} />
                <Pressable style={({ pressed }) => [styles.modalSubmit, pressed && styles.pressed]} onPress={addHotspot}>
                  <Text style={styles.modalSubmitText}>Save Hotspot</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>

        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
