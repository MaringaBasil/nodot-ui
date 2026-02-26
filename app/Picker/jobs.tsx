import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';

const UND = Platform.OS !== 'web';
const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

// ─── Types ───────────────────────────────────────────────────────────────────

type MaterialType = 'PET Plastic' | 'Cardboard' | 'Glass' | 'Metal' | 'Paper' | 'Mixed';

type BagSummary = {
  materialType: MaterialType;
  estimatedWeightKg: number;
};

type PickupJob = {
  id: string;
  citizenName: string;
  address: string;
  suburb: string;
  distanceKm: number;
  etaMin: number;
  bags: BagSummary[];
  estimatedPayoutZAR: number;
  scheduledWindow: string;
  status: 'open' | 'accepted';
  coordinates: { lat: number; lng: number };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MATERIAL_CONFIG: Record<MaterialType, { icon: string; color: string; ratePerKg: number }> = {
  'PET Plastic': { icon: 'water-outline', color: '#2C6E91', ratePerKg: 8 },
  'Cardboard': { icon: 'cube-outline', color: '#A0522D', ratePerKg: 3 },
  'Glass': { icon: 'wine-outline', color: '#5BA392', ratePerKg: 2 },
  'Metal': { icon: 'hardware-chip-outline', color: '#757575', ratePerKg: 6 },
  'Paper': { icon: 'newspaper-outline', color: '#7B68AA', ratePerKg: 2.5 },
  'Mixed': { icon: 'layers-outline', color: '#E28F3C', ratePerKg: 3 },
};

function bagCount(job: PickupJob): number { return job.bags.length; }
function totalKg(job: PickupJob): number { return job.bags.reduce((s, b) => s + b.estimatedWeightKg, 0); }
function uniqueMaterials(job: PickupJob): MaterialType[] {
  return [...new Set(job.bags.map(b => b.materialType))];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: PickupJob[] = [
  {
    id: 'JOB-001', citizenName: 'Thabo M.', address: '321 Oak Drive', suburb: 'Melville',
    distanceKm: 1.2, etaMin: 5,
    bags: [
      { materialType: 'PET Plastic', estimatedWeightKg: 2.5 },
      { materialType: 'Cardboard', estimatedWeightKg: 3.2 },
      { materialType: 'PET Plastic', estimatedWeightKg: 1.8 },
    ],
    estimatedPayoutZAR: 47, scheduledWindow: 'Now – 16:00',
    status: 'open', coordinates: { lat: -26.2041, lng: 28.0473 },
  },
  {
    id: 'JOB-002', citizenName: 'Zanele K.', address: '45 7th Avenue', suburb: 'Parktown',
    distanceKm: 2.4, etaMin: 12,
    bags: [
      { materialType: 'Glass', estimatedWeightKg: 5.0 },
      { materialType: 'Metal', estimatedWeightKg: 4.5 },
    ],
    estimatedPayoutZAR: 37, scheduledWindow: '14:00 – 17:00',
    status: 'open', coordinates: { lat: -26.205, lng: 28.048 },
  },
  {
    id: 'JOB-003', citizenName: 'Sipho D.', address: '78 Long Street', suburb: 'Braamfontein',
    distanceKm: 3.7, etaMin: 18,
    bags: [
      { materialType: 'Mixed', estimatedWeightKg: 4.0 },
      { materialType: 'Paper', estimatedWeightKg: 6.5 },
      { materialType: 'Mixed', estimatedWeightKg: 3.5 },
      { materialType: 'Cardboard', estimatedWeightKg: 2.0 },
    ],
    estimatedPayoutZAR: 63, scheduledWindow: '15:30 – 18:30',
    status: 'open', coordinates: { lat: -26.206, lng: 28.049 },
  },
];

const ACTIVE_JOB: PickupJob = {
  id: 'JOB-000', citizenName: 'John D.', address: '12 Summit Rd', suburb: 'Sandton',
  distanceKm: 0.4, etaMin: 2,
  bags: [
    { materialType: 'PET Plastic', estimatedWeightKg: 3.0 },
    { materialType: 'Cardboard', estimatedWeightKg: 2.5 },
  ],
  estimatedPayoutZAR: 32, scheduledWindow: 'Now',
  status: 'accepted', coordinates: { lat: -26.2055, lng: 28.0503 },
};

const FILTERS = ['All', 'Nearby (<2km)', 'High Value (>R50)'] as const;
type Filter = typeof FILTERS[number];

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    // Header
    header: {
      paddingHorizontal: 20, paddingBottom: 20,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 }, elevation: 5,
    },
    headerBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
    headerBlob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { gap: 2 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    headerTitle: { fontFamily: F.display, fontSize: 22, color: '#FFF', letterSpacing: -0.4 },
    notifBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },

    // Stats strip
    statsStrip: {
      flexDirection: 'row', marginTop: 14, gap: 8,
    },
    statPill: {
      flex: 1, alignItems: 'center', paddingVertical: 8,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 12, borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    statPillVal: { fontFamily: F.bold, fontSize: 16, color: '#FFF' },
    statPillLbl: { fontFamily: F.body, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

    // Search
    searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
    searchWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: C.card, borderRadius: 14,
      borderWidth: 1, borderColor: cardBorder,
    },
    searchInput: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink },
    filterIconBtn: {
      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card, borderWidth: 1, borderColor: cardBorder,
    },

    // Filter chips
    filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1,
      backgroundColor: C.card, borderColor: cardBorder,
    },
    filterChipActive: { backgroundColor: C.brandLight, borderColor: C.brand },
    filterChipText: { fontFamily: F.semibold, fontSize: 12, color: C.muted },
    filterChipTextActive: { color: C.brand },

    // Content
    content: { gap: 12, paddingHorizontal: 16, paddingTop: 4 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionCount: { fontFamily: F.semibold, fontSize: 13, color: C.muted },

    // Active job card
    activeCard: {
      borderRadius: 20, overflow: 'hidden',
      shadowColor: C.brand, shadowOpacity: 0.2, shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }, elevation: 4,
    },
    activeCardInner: { padding: 16, gap: 12 },
    activeCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    activeCardBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 9, paddingVertical: 4,
      backgroundColor: 'rgba(78,200,49,0.18)', borderRadius: 10,
    },
    activeCardBadgeText: { fontFamily: F.semibold, fontSize: 11, color: '#4EC831' },
    activeCardEta: { fontFamily: F.bold, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    activeCardAddress: { fontFamily: F.display, fontSize: 17, color: '#FFF', letterSpacing: -0.2 },
    activeCardSuburb: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    activeCardMeta: { flexDirection: 'row', gap: 16 },
    activeCardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    activeCardMetaText: { fontFamily: F.semibold, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
    activeCardActions: { flexDirection: 'row', gap: 10 },
    navigateBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 11, borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    },
    navigateBtnText: { fontFamily: F.bold, fontSize: 13, color: '#FFF' },
    scanBagsBtn: {
      flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 11, borderRadius: 16, backgroundColor: '#4EC831',
      shadowColor: '#4EC831', shadowOpacity: 0.4, shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    scanBagsBtnText: { fontFamily: F.bold, fontSize: 13, color: '#1B2C3A' },

    // Material chips strip in active job
    bagChipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    bagChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    bagChipText: { fontFamily: F.semibold, fontSize: 11, color: '#FFF' },

    // Job card
    jobCard: {
      backgroundColor: C.card, borderRadius: 18,
      borderWidth: 1, borderColor: cardBorder,
      overflow: 'hidden',
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
    },
    jobCardMain: { padding: 14, gap: 10 },
    jobCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    jobCardLeft: { flex: 1, gap: 2 },
    jobAddress: { fontFamily: F.bold, fontSize: 15, color: C.ink, lineHeight: 20 },
    jobSuburb: { fontFamily: F.body, fontSize: 12, color: C.muted },
    jobPayoutBadge: {
      paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: C.brandLight, borderRadius: 10,
      borderWidth: 1, borderColor: isDark ? 'rgba(78,200,49,0.25)' : 'rgba(78,200,49,0.20)',
    },
    jobPayoutText: { fontFamily: F.bold, fontSize: 14, color: C.brand },

    // Material chips on job card
    jobMaterialRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    jobMaterialChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 9, borderWidth: 1,
    },
    jobMaterialText: { fontFamily: F.semibold, fontSize: 11 },

    // Job card meta row
    jobMetaRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 8, borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    jobMetaGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    jobMetaText: { fontFamily: F.semibold, fontSize: 11, color: C.muted },

    // Job card action footer
    jobCardFooter: {
      flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : C.wash,
      borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center', justifyContent: 'space-between',
    },
    acceptBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
      backgroundColor: C.brand,
      shadowColor: C.brand, shadowOpacity: 0.28, shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    acceptBtnText: { fontFamily: F.bold, fontSize: 13, color: C.navy },
    detailsHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailsHintText: { fontFamily: F.semibold, fontSize: 12, color: C.muted },

    // Empty state
    emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyIcon: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
    emptyBody: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center' },

    pressed: { opacity: 0.75 },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JobCard({
  job, styles, C, isDark, onAccept, onScan,
}: {
  job: PickupJob;
  styles: ReturnType<typeof createStyles>;
  C: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  onAccept: (job: PickupJob) => void;
  onScan: (job: PickupJob) => void;
}) {
  const materials = uniqueMaterials(job);
  const kg = totalKg(job);
  const count = bagCount(job);
  const isAccepted = job.status === 'accepted';

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: UND, friction: 8 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: UND, friction: 8 }).start();

  if (isAccepted) {
    // Active job uses gradient card
    return (
      <Animated.View style={[styles.activeCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={['#253E55', '#1B2C3A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.activeCardInner}>
          {/* Status + ETA */}
          <View style={styles.activeCardTopRow}>
            <View style={styles.activeCardBadge}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4EC831' }} />
              <Text style={styles.activeCardBadgeText}>Active Job</Text>
            </View>
            <Text style={styles.activeCardEta}>~{job.etaMin} min away</Text>
          </View>

          {/* Address */}
          <View>
            <Text style={styles.activeCardAddress}>{job.address}</Text>
            <Text style={styles.activeCardSuburb}>{job.suburb} · {job.citizenName}</Text>
          </View>

          {/* Bag chips */}
          <View style={styles.bagChipsRow}>
            {materials.map(m => {
              const cfg = MATERIAL_CONFIG[m];
              const bagCount = job.bags.filter(b => b.materialType === m).length;
              return (
                <View key={m} style={styles.bagChip}>
                  <Ionicons name={cfg.icon as any} size={12} color="#FFF" />
                  <Text style={styles.bagChipText}>{bagCount}× {m}</Text>
                </View>
              );
            })}
            {/* Inline weight + payout summary — no duplicate row */}
            <View style={[styles.bagChip, { backgroundColor: 'rgba(78,200,49,0.22)', borderColor: 'rgba(78,200,49,0.4)' }]}>
              <Ionicons name="scale-outline" size={12} color="#4EC831" />
              <Text style={[styles.bagChipText, { color: '#4EC831' }]}>~{kg.toFixed(1)} kg · ~R{job.estimatedPayoutZAR}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.activeCardActions}>
            <Pressable
              style={({ pressed }) => [styles.navigateBtn, pressed && styles.pressed]}
              onPress={() => { haptic(); }}
            >
              <Ionicons name="navigate-outline" size={16} color="#FFF" />
              <Text style={styles.navigateBtnText}>Navigate</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.scanBagsBtn, pressed && styles.pressed]}
              onPress={() => { haptic(); onScan(job); }}
            >
              <Ionicons name="qr-code" size={16} color="#1B2C3A" />
              <Text style={styles.scanBagsBtnText}>Scan {count} Bag{count !== 1 ? 's' : ''}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.jobCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPressIn={onIn} onPressOut={onOut} onPress={() => { haptic(); }}>
        <View style={styles.jobCardMain}>
          {/* Top row: address + payout */}
          <View style={styles.jobCardTopRow}>
            <View style={styles.jobCardLeft}>
              <Text style={styles.jobAddress}>{job.address}</Text>
              <Text style={styles.jobSuburb}>{job.suburb} · {job.citizenName}</Text>
            </View>
            <View style={styles.jobPayoutBadge}>
              <Text style={styles.jobPayoutText}>~R{job.estimatedPayoutZAR}</Text>
            </View>
          </View>

          {/* Material chips */}
          <View style={styles.jobMaterialRow}>
            {materials.map(m => {
              const cfg = MATERIAL_CONFIG[m];
              const cnt = job.bags.filter(b => b.materialType === m).length;
              return (
                <View key={m} style={[styles.jobMaterialChip, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
                  <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[styles.jobMaterialText, { color: cfg.color }]}>{cnt}× {m}</Text>
                </View>
              );
            })}
          </View>

          {/* Meta row */}
          <View style={styles.jobMetaRow}>
            <View style={styles.jobMetaGroup}>
              <View style={styles.jobMetaItem}>
                <Ionicons name="cube-outline" size={13} color={C.muted} />
                <Text style={styles.jobMetaText}>{count} bags ({kg.toFixed(0)} kg)</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <Ionicons name="navigate-outline" size={13} color={C.muted} />
                <Text style={styles.jobMetaText}>{job.distanceKm} km ({job.etaMin} min)</Text>
              </View>
            </View>
            <View style={styles.jobMetaItem}>
              <Ionicons name="time-outline" size={13} color={C.brand} />
              <Text style={[styles.jobMetaText, { color: C.brand }]}>{job.scheduledWindow}</Text>
            </View>
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.jobCardFooter}>
          <View style={styles.detailsHintRow}>
            <Text style={styles.detailsHintText}>Tap for details</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
            onPress={() => { haptic(); onAccept(job); }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={C.navy} />
            <Text style={styles.acceptBtnText}>Accept Job</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PickerJobs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [jobs, setJobs] = useState<PickupJob[]>(MOCK_JOBS);
  const [activeJob, setActiveJob] = useState<PickupJob | null>(ACTIVE_JOB);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'error' | 'warning' }>({
    visible: false, message: '', type: 'info',
  });

  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') =>
    setToast({ visible: true, message: msg, type }), []);

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 360, useNativeDriver: UND }).start();
  }, []);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    let list = jobs.filter(j => j.status === 'open');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        j.suburb.toLowerCase().includes(q) ||
        j.address.toLowerCase().includes(q) ||
        uniqueMaterials(j).some(m => m.toLowerCase().includes(q))
      );
    }
    if (filter === 'Nearby (<2km)') list = list.filter(j => j.distanceKm < 2);
    if (filter === 'High Value (>R50)') list = list.filter(j => j.estimatedPayoutZAR > 50);
    return list;
  }, [jobs, filter, search]);

  // Stats
  const totalAvailableJobs = jobs.filter(j => j.status === 'open').length;
  const totalAvailableEarnings = jobs.filter(j => j.status === 'open').reduce((s, j) => s + j.estimatedPayoutZAR, 0);

  const handleAccept = useCallback((job: PickupJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'accepted' } : j));
    setActiveJob({ ...job, status: 'accepted' });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast_(`Job accepted — navigate to ${job.address}`, 'success');
  }, [toast_]);

  const handleScan = useCallback((job: PickupJob) => {
    router.push('/Picker/scan' as any);
  }, [router]);

  const animStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, animStyle]}>
        <View style={styles.root}>
          <Toast
            visible={toast.visible} message={toast.message} type={toast.type}
            onHide={() => setToast(t => ({ ...t, visible: false }))}
          />

          {/* ── Header ── */}
          <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerBlob1} />
            <View style={styles.headerBlob2} />
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>Available near you</Text>
                <Text style={styles.headerTitle}>Pickup Jobs</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.notifBtn, pressed && styles.pressed]}
                onPress={() => { haptic(); router.push('/Picker/notifications' as any); }}
              >
                <Ionicons name="notifications-outline" size={20} color="#FFF" />
              </Pressable>
            </View>

            {/* Stats strip */}
            <View style={styles.statsStrip}>
              <View style={styles.statPill}>
                <Text style={styles.statPillVal}>{totalAvailableJobs}</Text>
                <Text style={styles.statPillLbl}>Available</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statPillVal}>R{totalAvailableEarnings}</Text>
                <Text style={styles.statPillLbl}>Est. Earnings</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statPillVal}>{activeJob ? '1' : '0'}</Text>
                <Text style={styles.statPillLbl}>Active Job</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Search + Filters ── */}
          <View style={{ gap: 10, paddingTop: 14 }}>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={C.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search suburb, material…"
                  placeholderTextColor={C.muted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={C.muted} />
                  </Pressable>
                )}
              </View>
              <Pressable style={styles.filterIconBtn} onPress={() => haptic()}>
                <Ionicons name="options-outline" size={20} color={C.ink} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { paddingRight: 16 }]}>
              {FILTERS.map(f => (
                <Pressable
                  key={f}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  onPress={() => { haptic(); setFilter(f); }}
                >
                  <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          >
            {/* Active job */}
            {activeJob && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Active Job</Text>
                  <Text style={[styles.sectionCount, { color: C.brand }]}>In Progress</Text>
                </View>
                <JobCard
                  job={activeJob} styles={styles} C={C} isDark={isDark}
                  onAccept={handleAccept} onScan={handleScan}
                />
              </>
            )}

            {/* Available jobs */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Available Jobs</Text>
              <Text style={styles.sectionCount}>{filteredJobs.length} nearby</Text>
            </View>

            {filteredJobs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search-outline" size={26} color={C.brand} />
                </View>
                <Text style={styles.emptyTitle}>No jobs match your filters</Text>
                <Text style={styles.emptyBody}>Try adjusting the filter or check back soon</Text>
              </View>
            ) : (
              filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job} styles={styles} C={C} isDark={isDark}
                  onAccept={handleAccept} onScan={handleScan}
                />
              ))
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
