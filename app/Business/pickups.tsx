import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  Animated,
  Modal,
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

const UPCOMING = [
  { id: 'p1', when: 'Today, 11:00',    site: 'Parkhurst Hub',    status: 'Scheduled', materials: 'Mixed recycling · ~80 kg', icon: 'checkmark-circle-outline' as const, iconColor: '#2E7D32', priority: 'green' },
  { id: 'p2', when: 'Tomorrow, 09:00', site: 'Rosebank Dock',    status: 'Awaiting',  materials: 'PET + Cardboard · ~60 kg', icon: 'time-outline' as const,             iconColor: '#F57C00', priority: 'amber' },
  { id: 'p3', when: 'Fri, 14:30',      site: 'Melville Campus',  status: 'Scheduled', materials: 'Cardboard only · ~45 kg',   icon: 'checkmark-circle-outline' as const, iconColor: '#2E7D32', priority: 'green' },
  { id: 'p4', when: 'Sat, 08:00',      site: 'Sandton City Hub', status: 'Scheduled', materials: 'Glass + Mixed · ~120 kg',   icon: 'checkmark-circle-outline' as const, iconColor: '#2E7D32', priority: 'green' },
];

const HISTORY = [
  { id: 'h1', when: 'Mon, 22 Jan',  site: 'Parkhurst Hub',   status: 'Completed', materials: 'Mixed recycling', weight: '84 kg',  icon: 'checkmark-done-outline' as const, iconColor: '#2E7D32', priority: 'green' },
  { id: 'h2', when: 'Fri, 19 Jan',  site: 'Rosebank Dock',   status: 'Completed', materials: 'PET + Cardboard', weight: '61 kg',  icon: 'checkmark-done-outline' as const, iconColor: '#2E7D32', priority: 'green' },
  { id: 'h3', when: 'Tue, 16 Jan',  site: 'Melville Campus', status: 'Cancelled', materials: 'Cardboard only',  weight: '—',      icon: 'close-circle-outline' as const,   iconColor: '#C62828', priority: 'red'   },
  { id: 'h4', when: 'Fri, 12 Jan',  site: 'Parkhurst Hub',   status: 'Completed', materials: 'Glass + Mixed',   weight: '118 kg', icon: 'checkmark-done-outline' as const, iconColor: '#2E7D32', priority: 'green' },
  { id: 'h5', when: 'Mon, 8 Jan',   site: 'Rosebank Dock',   status: 'Completed', materials: 'PET + Cardboard', weight: '74 kg',  icon: 'checkmark-done-outline' as const, iconColor: '#2E7D32', priority: 'green' },
];

type PickupItem = typeof UPCOMING[0] & { weight?: string };

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
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 5,
      paddingVertical: 14, paddingHorizontal: 6,
      borderRadius: 16, backgroundColor: C.wash,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.10)' : cardBorder,
    },
    statCardPrimary: { backgroundColor: C.brandLight, borderColor: isDark ? 'rgba(78,200,49,0.28)' : 'rgba(78,200,49,0.25)' },
    statIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    statIconWrapPrimary: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' },
    statValue: { fontFamily: F.bold, fontSize: 14, color: C.ink, textAlign: 'center' },
    statLabel: { fontFamily: F.body, fontSize: 10, color: C.muted, textAlign: 'center' },

    /* Toggle */
    toggleRow: { flexDirection: 'row', backgroundColor: isDark ? C.neutral100 : '#EBEBEB', borderRadius: 22, padding: 3, gap: 3 },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    toggleText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
    toggleTextActive: { color: C.ink },

    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    listRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    listIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    listIconAmber: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    listIconRed: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },
    listInfo: { flex: 1, gap: 2 },
    listPrimary: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    listMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusScheduled: { backgroundColor: isDark ? 'rgba(78,200,49,0.15)' : 'rgba(78,200,49,0.12)' },
    statusAwaiting: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    statusCompleted: { backgroundColor: isDark ? C.neutral100 : '#F5F5F5' },
    statusCancelled: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },
    statusText: { fontFamily: F.semibold, fontSize: 11 },
    statusTextScheduled: { color: '#2E7D32' },
    statusTextAwaiting: { color: '#F57C00' },
    statusTextCompleted: { color: C.muted },
    statusTextCancelled: { color: '#C62828' },

    /* FAB */
    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center',
      shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }, elevation: 10,
      borderWidth: 1, borderColor: 'rgba(78,200,49,0.40)',
    },

    /* Modal */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: isDark ? 'rgba(20,26,44,0.97)' : 'rgba(255,255,255,0.97)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, gap: 18,
      borderWidth: 1, borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', alignSelf: 'center' },
    modalTitle: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
    modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    modalLabel: { fontFamily: F.body, fontSize: 13, color: C.muted },
    modalValue: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    modalInfo: { gap: 2 },
    modalActions: { flexDirection: 'row', gap: 10 },
    primaryBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 28,
      backgroundColor: C.navy, alignItems: 'center',
    },
    primaryBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand, letterSpacing: 0.5 },
    secondaryBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 28,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0', alignItems: 'center',
    },
    secondaryBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessPickups() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedPickup, setSelectedPickup] = useState<PickupItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const sectionAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  const animateIn = useCallback(() => {
    Animated.stagger(100, sectionAnims.map((anim) =>
      Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: UND })
    )).start();
  }, [sectionAnims]);

  useEffect(() => { animateIn(); }, [animateIn]);

  const animatedSection = (index: number) => ({
    opacity: sectionAnims[index],
    transform: [{ translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setRefreshing(false); animateIn(); toast_('Pickups refreshed', 'success'); }, 1200);
  }, [animateIn, toast_]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Scheduled':  return { chip: styles.statusScheduled,  text: styles.statusTextScheduled  };
      case 'Awaiting':   return { chip: styles.statusAwaiting,   text: styles.statusTextAwaiting   };
      case 'Completed':  return { chip: styles.statusCompleted,  text: styles.statusTextCompleted  };
      case 'Cancelled':  return { chip: styles.statusCancelled,  text: styles.statusTextCancelled  };
      default:           return { chip: styles.statusCompleted,  text: styles.statusTextCompleted  };
    }
  };

  const getIconStyle = (priority: string) => {
    if (priority === 'amber') return styles.listIconAmber;
    if (priority === 'red')   return styles.listIconRed;
    return undefined;
  };

  const list = tab === 'upcoming' ? UPCOMING : HISTORY as PickupItem[];

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
              <Text style={styles.headerSub}>Manage your</Text>
              <Text style={styles.headerTitle}>Pickups</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => router.push('/Business/notifications' as any)}>
              <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        >
          {/* ── Stats row ── */}
          <Animated.View style={[styles.statsRow, animatedSection(0)]}>
            <Pressable style={[styles.statCard, styles.statCardPrimary]} onPress={() => toast_('2 pickups this week', 'info')}>
              <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
                <Ionicons name="calendar-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => toast_('8 pickups completed this month', 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="checkmark-done-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => toast_('1 pickup awaiting confirmation', 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="time-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Awaiting</Text>
            </Pressable>
          </Animated.View>

          {/* ── Toggle ── */}
          <Animated.View style={animatedSection(1)}>
            <View style={styles.toggleRow}>
              {(['upcoming', 'history'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}
                  onPress={() => { haptic(); setTab(t); }}
                >
                  <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
                    {t === 'upcoming' ? 'Upcoming' : 'History'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── List ── */}
          <Animated.View style={animatedSection(2)}>
            <View style={styles.card}>
              {list.map((row, idx) => {
                const statusStyle = getStatusStyle(row.status);
                return (
                  <View key={row.id}>
                    <Pressable
                      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
                      onPress={() => { haptic(); setSelectedPickup(row); }}
                    >
                      <View style={[styles.listIcon, getIconStyle(row.priority)]}>
                        <Ionicons name={row.icon} size={18} color={row.iconColor} />
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listPrimary}>{row.when}</Text>
                        <Text style={styles.listMeta}>{row.site}</Text>
                      </View>
                      <View style={[styles.statusChip, statusStyle.chip]}>
                        <Text style={[styles.statusText, statusStyle.text]}>{row.status}</Text>
                      </View>
                    </Pressable>
                    {idx < list.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Request Pickup FAB ── */}
        <Pressable
          style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 90 }, pressed && { opacity: 0.85, transform: [{ scale: 0.93 }] }]}
          onPress={() => { haptic(); toast_('Request pickup — coming soon', 'info'); }}
          accessibilityLabel="Request pickup"
        >
          <Ionicons name="add" size={28} color={C.brand} />
        </Pressable>

        {/* ── Pickup detail modal ── */}
        <Modal visible={!!selectedPickup} transparent animationType="slide" onRequestClose={() => setSelectedPickup(null)}>
          <Pressable style={styles.overlay} onPress={() => setSelectedPickup(null)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{selectedPickup?.site}</Text>

              <View style={styles.modalRow}>
                <View style={styles.modalIcon}><Ionicons name="calendar-outline" size={18} color={C.brand} /></View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Date & time</Text>
                  <Text style={styles.modalValue}>{selectedPickup?.when}</Text>
                </View>
              </View>
              <View style={styles.modalRow}>
                <View style={styles.modalIcon}><Ionicons name="cube-outline" size={18} color={C.brand} /></View>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Materials</Text>
                  <Text style={styles.modalValue}>{selectedPickup?.materials}</Text>
                </View>
              </View>
              {selectedPickup?.weight && (
                <View style={styles.modalRow}>
                  <View style={styles.modalIcon}><Ionicons name="scale-outline" size={18} color={C.brand} /></View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalLabel}>Recorded weight</Text>
                    <Text style={styles.modalValue}>{selectedPickup.weight}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setSelectedPickup(null)}>
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
                {selectedPickup?.status !== 'Completed' && selectedPickup?.status !== 'Cancelled' && (
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => { setSelectedPickup(null); toast_('Pickup action coming soon', 'info'); }}
                  >
                    <Text style={styles.primaryBtnText}>MANAGE</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ErrorBoundary>
  );
}
