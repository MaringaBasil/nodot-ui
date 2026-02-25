import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const ACTIVE_JOB = {
  id: 'aj1', address: '321 Oak Drive, Melville',
  weight: 8.7, material: 'Glass bottles', payout: 35, eta: '4 min',
};

const PREVIEW_JOBS = [
  { id: 'j1', address: '123 Main St, Rosebank',  weight: 5.2,  material: 'PET Plastic',       distance: '1.2 km', payout: 26 },
  { id: 'j2', address: '456 Market Rd, Sandton', weight: 12.0, material: 'Mixed recyclables', distance: '2.4 km', payout: 60 },
];

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
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { gap: 1 },
    greeting: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    onlineChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 7,
      backgroundColor: 'rgba(78,200,49,0.20)',
      borderRadius: 20, borderWidth: 1, borderColor: 'rgba(78,200,49,0.42)',
    },
    offlineChip: { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4EC831' },
    onlineText: { fontFamily: F.semibold, fontSize: 12, color: '#4EC831' },
    offlineText: { color: 'rgba(255,255,255,0.65)' },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionLink: { fontFamily: F.semibold, fontSize: 13, color: C.brand },

    /* Stats row */
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 5,
      paddingVertical: 14, paddingHorizontal: 6,
      borderRadius: 16, backgroundColor: C.wash,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.10)' : cardBorder,
    },
    statCardPrimary: {
      backgroundColor: C.brandLight,
      borderColor: isDark ? 'rgba(78,200,49,0.28)' : 'rgba(78,200,49,0.25)',
    },
    statIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    statIconWrapPrimary: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' },
    statValue: { fontFamily: F.bold, fontSize: 14, color: C.ink, textAlign: 'center' },
    statLabel: { fontFamily: F.body, fontSize: 10, color: C.muted, textAlign: 'center' },

    /* Card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* Active job card */
    activeCard: {
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1.5, borderColor: isDark ? 'rgba(78,200,49,0.35)' : 'rgba(78,200,49,0.30)',
      overflow: 'hidden',
      shadowColor: C.brand, shadowOpacity: isDark ? 0.18 : 0.12,
      shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    activeAccent: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
      backgroundColor: C.brand,
    },
    activeHeader: { paddingLeft: 18, paddingRight: 14, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.brandLight, borderRadius: 10 },
    activeBadgeText: { fontFamily: F.semibold, fontSize: 11, color: C.greenDark },
    activeAddress: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
    activeMeta: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },
    activeActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 14, paddingTop: 14 },
    primaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: C.brand, borderRadius: 14, paddingVertical: 13,
      shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    primaryBtnText: { fontFamily: F.bold, fontSize: 13, color: C.navy },
    secondaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: C.wash, borderRadius: 14, paddingVertical: 13,
      borderWidth: 1, borderColor: cardBorder,
    },
    secondaryBtnText: { fontFamily: F.bold, fontSize: 13, color: C.ink },

    /* Job preview row */
    jobRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    jobIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    jobInfo: { flex: 1, gap: 2 },
    jobAddress: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    jobMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    jobPayout: { fontFamily: F.bold, fontSize: 14, color: C.brand },

    pressed: { opacity: 0.7 },
  });
}

export default function PickerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  // Staggered section animations (3 sections: stats, active job, nearby jobs)
  const sectionAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(100, sectionAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 340, useNativeDriver: UND })
    )).start();
  }, []);
  const animatedSection = (i: number) => ({
    opacity: sectionAnims[i],
    transform: [{ translateY: sectionAnims[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  // Online pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!online) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: UND }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: UND }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [online]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

        {/* ── Header ── */}
        <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerBlobTL} />
          <View style={styles.headerBlobBR} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerTitle}>Themba Nkosi</Text>
            </View>
            <Pressable
              style={({ pressed }) => [[styles.onlineChip, !online && styles.offlineChip], pressed && styles.pressed]}
              onPress={() => {
                haptic();
                setOnline(v => !v);
                if (Platform.OS !== 'web') Haptics.notificationAsync(online ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
                toast_(online ? 'You are offline' : 'You are online', online ? 'warning' : 'success');
              }}
            >
              <Animated.View style={[styles.onlineDot, !online && { backgroundColor: 'rgba(255,255,255,0.45)' }, online && { opacity: pulseAnim }]} />
              <Text style={[styles.onlineText, !online && styles.offlineText]}>{online ? 'Online' : 'Offline'}</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* ── Stats ── */}
          <Animated.View style={[styles.statsRow, animatedSection(0)]}>
            <Pressable style={({ pressed }) => [[styles.statCard, styles.statCardPrimary], pressed && styles.pressed]} onPress={() => toast_('R 184 earned today', 'info')}>
              <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
                <Ionicons name="wallet-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>R 184</Text>
              <Text style={styles.statLabel}>Earned today</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.pressed]} onPress={() => toast_('3 pickups completed', 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.pressed]} onPress={() => router.navigate('/Picker/jobs' as any)}>
              <View style={styles.statIconWrap}>
                <Ionicons name="location-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Nearby jobs</Text>
            </Pressable>
          </Animated.View>

          {/* ── Active Job ── */}
          <Animated.View style={[styles.section, animatedSection(1)]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Job</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>In progress</Text>
              </View>
            </View>
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeAddress}>{ACTIVE_JOB.address}</Text>
                  <Text style={styles.activeMeta}>{ACTIVE_JOB.weight} kg · {ACTIVE_JOB.material} · R {ACTIVE_JOB.payout}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.activeMeta}>ETA</Text>
                  <Text style={[styles.activeAddress, { fontSize: 13, color: C.brand }]}>{ACTIVE_JOB.eta}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.activeActions}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  onPress={() => { haptic(); router.push('/Picker/navigate' as any); }}
                >
                  <Ionicons name="navigate-outline" size={16} color={C.navy} />
                  <Text style={styles.primaryBtnText}>Navigate</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={() => { haptic(); toast_('Mark complete in the Jobs tab', 'info'); }}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={C.brand} />
                  <Text style={styles.secondaryBtnText}>Complete</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* ── Nearby Jobs Preview ── */}
          <Animated.View style={[styles.section, animatedSection(2)]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Jobs</Text>
              <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => { haptic(); router.navigate('/Picker/jobs' as any); }}>
                <Text style={styles.sectionLink}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              {PREVIEW_JOBS.map((job, idx) => (
                <View key={job.id}>
                  <Pressable
                    style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}
                    onPress={() => { haptic(); router.navigate('/Picker/jobs' as any); }}
                  >
                    <View style={styles.jobIcon}>
                      <Ionicons name="cube-outline" size={18} color={C.brand} />
                    </View>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
                      <Text style={styles.jobMeta}>{job.weight} kg · {job.material} · {job.distance}</Text>
                    </View>
                    <Text style={styles.jobPayout}>R {job.payout}</Text>
                  </Pressable>
                  {idx < PREVIEW_JOBS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
