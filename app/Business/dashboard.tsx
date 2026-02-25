import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
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

// ─── Static data ─────────────────────────────────────────────────────────────
const NEXT_PICKUP = {
  when: 'Today, 11:00',
  site: 'Parkhurst Hub',
  status: 'Scheduled',
  icon: 'checkmark-circle-outline' as const,
  iconColor: '#2E7D32',
};

const PENDING_APPROVALS = [
  { id: 'ap-1', title: 'Approve payout',     meta: 'inv-4012 · R 18,400',          cta: 'Approve', priority: 'high'   },
  { id: 'ap-2', title: 'Weight dispute',      meta: 'Pickup p2 · +12 kg adjust',    cta: 'Review',  priority: 'medium' },
];

// ─── Styles factory ──────────────────────────────────────────────────────────
function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    /* Header */
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
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },
    verifiedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 7,
      backgroundColor: 'rgba(78,200,49,0.18)',
      borderRadius: 20, borderWidth: 1, borderColor: 'rgba(78,200,49,0.40)',
    },
    verifiedText: { fontFamily: F.semibold, fontSize: 12, color: '#4EC831' },

    /* Content */
    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },

    /* Stats row */
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 5,
      paddingVertical: 14, paddingHorizontal: 6,
      borderRadius: 16, overflow: 'hidden',
      backgroundColor: C.wash,
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

    /* Status banner */
    statusBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 16,
      padding: 16,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    statusInfo: { flex: 1, gap: 2 },
    statusTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink },
    statusSub: { fontFamily: F.body, fontSize: 12, color: C.muted },

    /* Quick actions */
    quickRow: { flexDirection: 'row', gap: 10 },
    quickItemOuter: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden' },
    quickItem: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    quickLabel: { fontFamily: F.semibold, fontSize: 11, textAlign: 'center' },

    /* Section */
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionLink: { fontFamily: F.semibold, fontSize: 13, color: C.brand },

    /* Cards */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* List rows */
    listRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    listIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    listIconOrange: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    listIconRed: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },
    listInfo: { flex: 1, gap: 2 },
    listPrimary: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    listMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    listStatus: { fontFamily: F.semibold, fontSize: 11, color: C.brand },

    /* Action chip */
    actionChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.navy, borderRadius: 20 },
    actionChipText: { fontFamily: F.semibold, fontSize: 12, color: C.brand },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const QUICK_ACTIONS = useMemo(() => [
    { label: 'Pickups', icon: 'cube-outline',        route: '/Business/pickups', bg: C.navy,                           color: C.brand   },
    { label: 'Reports', icon: 'bar-chart-outline',   route: '/Business/reports', bg: isDark ? '#0F2236' : '#EBF4FD',  color: '#2C6E91' },
    { label: 'Billing', icon: 'cash-outline',        route: '/Business/billing', bg: isDark ? '#2D1F08' : '#FFF6EC',  color: '#E28F3C' },
    { label: 'Sites',   icon: 'location-outline',    route: '/Business/sites',   bg: isDark ? '#1E1238' : '#F0ECFA',  color: '#7B52AB' },
  ], [C.navy, C.brand, isDark]);

  const sectionAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  const animateIn = useCallback(() => {
    Animated.stagger(
      100,
      sectionAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: UND })
      )
    ).start();
  }, [sectionAnims]);

  useEffect(() => { animateIn(); }, [animateIn]);

  const animatedSection = (index: number) => ({
    opacity: sectionAnims[index],
    transform: [{ translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setRefreshing(false); animateIn(); toast_('Dashboard refreshed', 'success'); }, 1200);
  }, [animateIn, toast_]);

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

        {/* ── Gradient Header ── */}
        <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerBlobTL} />
          <View style={styles.headerBlobBR} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerTitle}>Business Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => router.push('/Business/notifications' as any)}>
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#4EC831" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        >
          {/* ── Stats row ── */}
          <Animated.View style={[styles.statsRow, animatedSection(0)]}>
            <Pressable style={({ pressed }) => [styles.statCard, styles.statCardPrimary, pressed && styles.pressed]} onPress={() => toast_('On-time SLA: 98%', 'info')}>
              <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>SLA</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.pressed]} onPress={() => toast_('Revenue this month: R 142k', 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="cash-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>R 142k</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.pressed]} onPress={() => toast_('1.4 tonnes diverted this month', 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="leaf-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>1.4t</Text>
              <Text style={styles.statLabel}>Diverted</Text>
            </Pressable>
          </Animated.View>

          {/* ── Operational status banner ── */}
          <Animated.View style={animatedSection(1)}>
            <View style={styles.statusBanner}>
              <Ionicons name="checkmark-circle" size={24} color={C.brand} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>All systems on track</Text>
                <Text style={styles.statusSub}>2 pickups this week · all SLAs met · 1 invoice pending</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Quick actions ── */}
          <Animated.View style={[styles.quickRow, animatedSection(2)]}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.quickItemOuter, pressed && styles.pressed]}
                onPress={() => { haptic(); router.push(action.route as any); }}
              >
                <View style={[styles.quickItem, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                  <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* ── Next Pickup ── */}
          <Animated.View style={[styles.section, animatedSection(3)]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Next Pickup</Text>
              <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => router.push('/Business/pickups' as any)}>
                <Text style={styles.sectionLink}>All pickups →</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <View style={styles.listRow}>
                <View style={styles.listIcon}>
                  <Ionicons name={NEXT_PICKUP.icon} size={18} color={NEXT_PICKUP.iconColor} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listPrimary}>{NEXT_PICKUP.when}</Text>
                  <Text style={styles.listMeta}>{NEXT_PICKUP.site}</Text>
                </View>
                <Text style={styles.listStatus}>{NEXT_PICKUP.status}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Pending Actions ── */}
          <Animated.View style={[styles.section, animatedSection(4)]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Actions</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{PENDING_APPROVALS.length} waiting</Text>
            </View>
            <View style={styles.card}>
              {PENDING_APPROVALS.map((ap, idx) => (
                <View key={ap.id}>
                  <View style={styles.listRow}>
                    <View style={[styles.listIcon, ap.priority === 'high' && styles.listIconRed, ap.priority === 'medium' && styles.listIconOrange]}>
                      <Ionicons
                        name={ap.priority === 'high' ? 'alert-circle-outline' : 'warning-outline'}
                        size={18}
                        color={ap.priority === 'high' ? '#C62828' : '#F57C00'}
                      />
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listPrimary}>{ap.title}</Text>
                      <Text style={styles.listMeta}>{ap.meta}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
                      onPress={() => { haptic(); toast_(`${ap.cta} actioned`, 'success'); }}
                    >
                      <Text style={styles.actionChipText}>{ap.cta}</Text>
                    </Pressable>
                  </View>
                  {idx < PENDING_APPROVALS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
