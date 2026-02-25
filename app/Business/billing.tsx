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
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

type InvoiceStatus = 'Pending' | 'Approved' | 'Overdue' | 'Draft';

const INVOICES = [
  { id: 'inv-4015', customer: 'Sandton City',     amount: 'R 24,500', rawAmount: 24500, status: 'Overdue'  as InvoiceStatus, date: '15 Jan 2026', due: '29 Jan 2026', items: ['Mixed recycling: 120 kg · R 18,000', 'Glass: 40 kg · R 6,500'], overdue: true  },
  { id: 'inv-4012', customer: 'Rosebank Mall',     amount: 'R 18,400', rawAmount: 18400, status: 'Pending'  as InvoiceStatus, date: '22 Jan 2026', due: '5 Feb 2026',  items: ['PET Plastic: 80 kg · R 12,000', 'Cardboard: 61 kg · R 6,400'],  overdue: false },
  { id: 'inv-4013', customer: 'Parkhurst HOA',     amount: 'R 9,900',  rawAmount: 9900,  status: 'Approved' as InvoiceStatus, date: '18 Jan 2026', due: '1 Feb 2026',  items: ['Mixed recycling: 84 kg · R 9,900'],                               overdue: false },
  { id: 'inv-4014', customer: 'Melville Campus',   amount: 'R 12,100', rawAmount: 12100, status: 'Draft'    as InvoiceStatus, date: '20 Jan 2026', due: '—',           items: ['Cardboard: 45 kg · R 5,100', 'Mixed: 30 kg · R 7,000'],          overdue: false },
  { id: 'inv-4016', customer: 'Parkhurst Hub',     amount: 'R 7,200',  rawAmount: 7200,  status: 'Approved' as InvoiceStatus, date: '10 Jan 2026', due: '24 Jan 2026', items: ['PET Plastic: 60 kg · R 7,200'],                                   overdue: false },
];

const FILTERS = ['All', 'Pending', 'Approved', 'Overdue', 'Draft'] as const;
type Filter = typeof FILTERS[number];

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

    /* Balance hero card */
    balanceCard: {
      borderRadius: 20, overflow: 'hidden', padding: 20, gap: 6,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    balanceBlobTL: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(78,200,49,0.10)', top: -50, left: -40 },
    balanceBlobBR: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, right: -20 },
    balanceLabel: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    balanceAmount: { fontFamily: F.display, fontSize: 32, color: '#FFFFFF', letterSpacing: -0.5 },
    balanceMeta: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    balanceOverduePill: {
      alignSelf: 'flex-start', marginTop: 6,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(198,40,40,0.30)',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: 'rgba(198,40,40,0.50)',
    },
    balanceOverdueText: { fontFamily: F.semibold, fontSize: 12, color: '#FF8A80' },

    /* Filter row */
    filterScroll: { paddingRight: 16 },
    filterRow: { flexDirection: 'row', gap: 8 },
    filterChip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: isDark ? C.neutral100 : '#EBEBEB',
      borderWidth: 1, borderColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: C.navy,
      borderColor: 'rgba(78,200,49,0.35)',
    },
    filterText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
    filterTextActive: { color: C.brand },

    /* Card list */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },
    listRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    listIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    listIconRed: { backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : '#FFEBEE' },
    listInfo: { flex: 1, gap: 2 },
    listPrimary: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    listMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    listRight: { alignItems: 'flex-end', gap: 4 },
    listAmount: { fontFamily: F.bold, fontSize: 14, color: C.ink },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    statusPending:  { backgroundColor: isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.10)' },
    statusApproved: { backgroundColor: isDark ? 'rgba(46,125,50,0.18)' : '#E8F5E9' },
    statusOverdue:  { backgroundColor: isDark ? 'rgba(198,40,40,0.18)' : '#FFEBEE' },
    statusDraft:    { backgroundColor: isDark ? C.neutral100 : '#F5F5F5' },
    statusText: { fontFamily: F.semibold, fontSize: 11 },
    statusTextPending:  { color: '#4EC831' },
    statusTextApproved: { color: '#2E7D32' },
    statusTextOverdue:  { color: '#C62828' },
    statusTextDraft:    { color: C.muted },

    /* Modal */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: isDark ? 'rgba(20,26,44,0.97)' : 'rgba(255,255,255,0.97)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, gap: 16,
      borderWidth: 1, borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', alignSelf: 'center' },
    modalTitle: { fontFamily: F.display, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
    modalId: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: -10 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
    modalLabel: { fontFamily: F.body, fontSize: 13, color: C.muted },
    modalValue: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    lineItemsHeader: { fontFamily: F.bold, fontSize: 15, color: C.ink },
    lineItem: { fontFamily: F.body, fontSize: 13, color: C.muted, paddingVertical: 2 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 28, backgroundColor: C.navy, alignItems: 'center' },
    primaryBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand, letterSpacing: 0.5 },
    secondaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0', alignItems: 'center' },
    secondaryBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessBilling() {
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<typeof INVOICES[0] | null>(null);
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
    setTimeout(() => { setRefreshing(false); animateIn(); toast_('Billing refreshed', 'success'); }, 1200);
  }, [animateIn, toast_]);

  const filtered = filter === 'All' ? INVOICES : INVOICES.filter((i) => i.status === filter);

  const outstanding = INVOICES.filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.rawAmount, 0);
  const overdueCount = INVOICES.filter((i) => i.overdue).length;

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case 'Pending':  return { pill: styles.statusPending,  text: styles.statusTextPending  };
      case 'Approved': return { pill: styles.statusApproved, text: styles.statusTextApproved };
      case 'Overdue':  return { pill: styles.statusOverdue,  text: styles.statusTextOverdue  };
      case 'Draft':    return { pill: styles.statusDraft,    text: styles.statusTextDraft    };
    }
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
              <Text style={styles.headerSub}>Invoices &amp; payments</Text>
              <Text style={styles.headerTitle}>Billing</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => { haptic(); toast_('Export coming soon', 'info'); }}>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        >
          {/* ── Balance hero card ── */}
          <Animated.View style={animatedSection(0)}>
            <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
              <View style={styles.balanceBlobTL} />
              <View style={styles.balanceBlobBR} />
              <Text style={styles.balanceLabel}>Outstanding balance</Text>
              <Text style={styles.balanceAmount}>R {outstanding.toLocaleString('en-ZA')}</Text>
              <Text style={styles.balanceMeta}>{INVOICES.filter((i) => i.status === 'Pending' || i.status === 'Overdue').length} invoices pending</Text>
              {overdueCount > 0 && (
                <View style={styles.balanceOverduePill}>
                  <Ionicons name="alert-circle-outline" size={14} color="#FF8A80" />
                  <Text style={styles.balanceOverdueText}>{overdueCount} overdue</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Filter chips ── */}
          <Animated.View style={animatedSection(1)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  onPress={() => { haptic(); setFilter(f); }}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── Invoice list ── */}
          <Animated.View style={animatedSection(2)}>
            <View style={styles.card}>
              {filtered.map((inv, idx) => {
                const s = getStatusStyle(inv.status);
                return (
                  <View key={inv.id}>
                    <Pressable
                      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
                      onPress={() => { haptic(); setSelected(inv); }}
                    >
                      <View style={[styles.listIcon, inv.overdue && styles.listIconRed]}>
                        <Ionicons name="receipt-outline" size={18} color={inv.overdue ? '#C62828' : C.brand} />
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listPrimary}>{inv.customer}</Text>
                        <Text style={styles.listMeta}>{inv.id} · Due {inv.due}</Text>
                      </View>
                      <View style={styles.listRight}>
                        <Text style={styles.listAmount}>{inv.amount}</Text>
                        <View style={[styles.statusPill, s.pill]}>
                          <Text style={[styles.statusText, s.text]}>{inv.status}</Text>
                        </View>
                      </View>
                    </Pressable>
                    {idx < filtered.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Invoice detail modal ── */}
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{selected?.customer}</Text>
              <Text style={styles.modalId}>{selected?.id}</Text>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Invoice date</Text>
                <Text style={styles.modalValue}>{selected?.date}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Due date</Text>
                <Text style={styles.modalValue}>{selected?.due}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Status</Text>
                <Text style={styles.modalValue}>{selected?.status}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Total</Text>
                <Text style={styles.modalValue}>{selected?.amount}</Text>
              </View>

              <Text style={styles.lineItemsHeader}>Line Items</Text>
              {selected?.items.map((item) => (
                <Text key={item} style={styles.lineItem}>· {item}</Text>
              ))}

              <View style={styles.modalActions}>
                <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setSelected(null)}>
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
                {(selected?.status === 'Pending' || selected?.status === 'Overdue') && (
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => { setSelected(null); toast_('Payment coming soon', 'info'); }}
                  >
                    <Text style={styles.primaryBtnText}>PAY NOW</Text>
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
