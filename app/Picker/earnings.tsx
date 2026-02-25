import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const RANGES = ['This Week', 'This Month', 'All Time'] as const;
type Range = typeof RANGES[number];

type Payout = { id: string; label: string; amount: number; date: string; status: 'paid' | 'pending' };

const DATA: Record<Range, { balance: number; total: number; payouts: Payout[] }> = {
  'This Week': {
    balance: 184,
    total: 86,
    payouts: [
      { id: 'p1', label: '3 pickups today',      amount: 86, date: 'Today',     status: 'paid' },
      { id: 'p2', label: 'Yesterday\'s pickups',  amount: 78, date: 'Yesterday', status: 'paid' },
    ],
  },
  'This Month': {
    balance: 184,
    total: 213,
    payouts: [
      { id: 'p1', label: '3 pickups today',         amount: 86,  date: 'Today',      status: 'paid'    },
      { id: 'p2', label: 'Yesterday\'s pickups',     amount: 78,  date: 'Yesterday',  status: 'paid'    },
      { id: 'p3', label: 'Mon 20 Feb · 2 pickups',   amount: 74,  date: '20 Feb',     status: 'paid'    },
      { id: 'p4', label: 'Pending withdrawal',       amount: 184, date: 'Pending',    status: 'pending' },
    ],
  },
  'All Time': {
    balance: 184,
    total: 1240,
    payouts: [
      { id: 'p1', label: 'February 2026',   amount: 213,  date: 'Feb 2026',  status: 'paid'    },
      { id: 'p2', label: 'January 2026',    amount: 410,  date: 'Jan 2026',  status: 'paid'    },
      { id: 'p3', label: 'December 2025',   amount: 390,  date: 'Dec 2025',  status: 'paid'    },
      { id: 'p4', label: 'November 2025',   amount: 227,  date: 'Nov 2025',  status: 'paid'    },
    ],
  },
};

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },

    /* Balance hero card */
    heroCard: {
      borderRadius: 22, overflow: 'hidden', padding: 24,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    heroBlobTL: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, left: -40 },
    heroBlobBR: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(78,200,49,0.08)', bottom: -30, right: -20 },
    heroLabel: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
    heroAmount: { fontFamily: F.display, fontSize: 40, color: '#FFFFFF', letterSpacing: -1 },
    heroCurrency: { fontFamily: F.semibold, fontSize: 22, color: 'rgba(255,255,255,0.8)' },
    heroSub: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    heroStat: { gap: 2 },
    heroStatLabel: { fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.55)' },
    heroStatValue: { fontFamily: F.bold, fontSize: 15, color: '#FFFFFF' },
    withdrawBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 18, paddingVertical: 10,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)',
    },
    withdrawBtnText: { fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' },

    /* Range toggle */
    rangeRow: { flexDirection: 'row', gap: 8 },
    rangeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: cardBorder },
    rangeChipActive: { backgroundColor: C.navy, borderColor: C.navy },
    rangeChipText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
    rangeChipTextActive: { color: C.brand },

    /* Card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* Payout row */
    payoutRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    payoutIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    payoutIconPending: { backgroundColor: isDark ? 'rgba(245,124,0,0.15)' : '#FFF3E0' },
    payoutInfo: { flex: 1, gap: 2 },
    payoutLabel: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    payoutDate: { fontFamily: F.body, fontSize: 12, color: C.muted },
    payoutRight: { alignItems: 'flex-end', gap: 3 },
    payoutAmount: { fontFamily: F.bold, fontSize: 14, color: C.brand },
    payoutAmountPending: { color: '#F57C00' },
    payoutStatus: { fontFamily: F.body, fontSize: 11, color: C.muted },

    pressed: { opacity: 0.7 },
  });
}

export default function PickerEarnings() {
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [range, setRange] = useState<Range>('This Month');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  const d = DATA[range];

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.root}>
          <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
          >
            {/* ── Balance hero card ── */}
            <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <View style={styles.heroBlobTL} />
              <View style={styles.heroBlobBR} />
              <Text style={styles.heroLabel}>Available balance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.heroCurrency}>R</Text>
                <Text style={styles.heroAmount}>{d.balance}</Text>
              </View>
              <Text style={styles.heroSub}>Ready to withdraw</Text>
              <View style={styles.heroFooter}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{range}</Text>
                  <Text style={styles.heroStatValue}>R {d.total} earned</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.withdrawBtn, pressed && styles.pressed]}
                  onPress={() => { haptic(); toast_('Withdrawal coming soon', 'info'); }}
                >
                  <Ionicons name="arrow-up-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.withdrawBtnText}>Withdraw</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* ── Range toggle ── */}
            <View style={styles.rangeRow}>
              {RANGES.map(r => (
                <Pressable
                  key={r}
                  style={({ pressed }) => [styles.rangeChip, range === r && styles.rangeChipActive, pressed && styles.pressed]}
                  onPress={() => { haptic(); setRange(r); }}
                >
                  <Text style={[styles.rangeChipText, range === r && styles.rangeChipTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Payout history ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payout History</Text>
              <View style={styles.card}>
                {d.payouts.map((p, idx) => (
                  <View key={p.id}>
                    <Pressable style={({ pressed }) => [styles.payoutRow, pressed && styles.pressed]}>
                      <View style={[styles.payoutIcon, p.status === 'pending' && styles.payoutIconPending]}>
                        <Ionicons
                          name={p.status === 'pending' ? 'time-outline' : 'wallet-outline'}
                          size={18}
                          color={p.status === 'pending' ? '#F57C00' : C.brand}
                        />
                      </View>
                      <View style={styles.payoutInfo}>
                        <Text style={styles.payoutLabel}>{p.label}</Text>
                        <Text style={styles.payoutDate}>{p.date}</Text>
                      </View>
                      <View style={styles.payoutRight}>
                        <Text style={[styles.payoutAmount, p.status === 'pending' && styles.payoutAmountPending]}>
                          R {p.amount}
                        </Text>
                        <Text style={styles.payoutStatus}>{p.status === 'paid' ? 'Paid' : 'Pending'}</Text>
                      </View>
                    </Pressable>
                    {idx < d.payouts.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
