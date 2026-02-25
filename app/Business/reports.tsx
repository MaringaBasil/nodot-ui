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
  useWindowDimensions,
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

const RANGES = ['This Month', '3 Months', 'This Year'] as const;
type Range = typeof RANGES[number];

const DATA: Record<Range, {
  diverted: string;
  sla: string;
  co2: string;
  bars: { month: string; value: number }[];
  materials: { label: string; pct: number; color: string }[];
}> = {
  'This Month': {
    diverted: '1.4t', sla: '98%', co2: '3.2t',
    bars: [
      { month: 'Sep', value: 68 }, { month: 'Oct', value: 74 }, { month: 'Nov', value: 55 },
      { month: 'Dec', value: 80 }, { month: 'Jan', value: 91 }, { month: 'Feb', value: 100 },
    ],
    materials: [
      { label: 'PET Plastic', pct: 38, color: '#2C6E91' },
      { label: 'Cardboard',   pct: 31, color: '#C6A35C' },
      { label: 'Glass',       pct: 19, color: '#3F8B7B' },
      { label: 'Mixed',       pct: 12, color: '#7B52AB' },
    ],
  },
  '3 Months': {
    diverted: '3.8t', sla: '96%', co2: '8.7t',
    bars: [
      { month: 'Sep', value: 58 }, { month: 'Oct', value: 65 }, { month: 'Nov', value: 48 },
      { month: 'Dec', value: 72 }, { month: 'Jan', value: 84 }, { month: 'Feb', value: 100 },
    ],
    materials: [
      { label: 'PET Plastic', pct: 41, color: '#2C6E91' },
      { label: 'Cardboard',   pct: 29, color: '#C6A35C' },
      { label: 'Glass',       pct: 18, color: '#3F8B7B' },
      { label: 'Mixed',       pct: 12, color: '#7B52AB' },
    ],
  },
  'This Year': {
    diverted: '14.2t', sla: '97%', co2: '32.6t',
    bars: [
      { month: 'Sep', value: 55 }, { month: 'Oct', value: 62 }, { month: 'Nov', value: 50 },
      { month: 'Dec', value: 70 }, { month: 'Jan', value: 88 }, { month: 'Feb', value: 100 },
    ],
    materials: [
      { label: 'PET Plastic', pct: 39, color: '#2C6E91' },
      { label: 'Cardboard',   pct: 30, color: '#C6A35C' },
      { label: 'Glass',       pct: 20, color: '#3F8B7B' },
      { label: 'Mixed',       pct: 11, color: '#7B52AB' },
    ],
  },
};

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
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },

    /* Range toggle */
    rangeRow: { flexDirection: 'row', backgroundColor: isDark ? C.neutral100 : '#EBEBEB', borderRadius: 22, padding: 3, gap: 3 },
    rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    rangeBtnActive: { backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    rangeText: { fontFamily: F.semibold, fontSize: 12, color: C.muted },
    rangeTextActive: { color: C.ink },

    /* Stat tiles */
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

    /* Card */
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
      padding: 16, gap: 14,
    },

    /* Bar chart */
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
    barWrap: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
    bar: { width: '100%', borderRadius: 6, backgroundColor: C.brand },
    barLabel: { fontFamily: F.body, fontSize: 10, color: C.muted },

    /* Materials */
    materialRow: { gap: 10 },
    materialItem: { gap: 6 },
    materialHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    materialLabel: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    materialPct: { fontFamily: F.bold, fontSize: 13, color: C.ink },
    materialTrack: { height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB' },
    materialFill: { height: 8, borderRadius: 4 },

    /* Export */
    exportBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 14, borderRadius: 28,
      backgroundColor: C.navy,
    },
    exportBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand, letterSpacing: 0.5 },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessReports() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [range, setRange] = useState<Range>('This Month');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const sectionAnims = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;

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
    setTimeout(() => { setRefreshing(false); animateIn(); toast_('Reports updated', 'success'); }, 1200);
  }, [animateIn, toast_]);

  const d = DATA[range];

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
              <Text style={styles.headerSub}>Waste diversion</Text>
              <Text style={styles.headerTitle}>Reports</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => { haptic(); toast_('Export coming soon', 'info'); }}>
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        >
          {/* ── Range toggle ── */}
          <Animated.View style={animatedSection(0)}>
            <View style={styles.rangeRow}>
              {RANGES.map((r) => (
                <Pressable key={r} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]} onPress={() => { haptic(); setRange(r); }}>
                  <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── Summary stats ── */}
          <Animated.View style={[styles.statsRow, animatedSection(1)]}>
            <Pressable style={[styles.statCard, styles.statCardPrimary]} onPress={() => toast_(`Waste diverted: ${d.diverted}`, 'info')}>
              <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
                <Ionicons name="leaf-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>{d.diverted}</Text>
              <Text style={styles.statLabel}>Diverted</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => toast_(`SLA achieved: ${d.sla}`, 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>{d.sla}</Text>
              <Text style={styles.statLabel}>SLA</Text>
            </Pressable>
            <Pressable style={styles.statCard} onPress={() => toast_(`CO₂ saved: ${d.co2}`, 'info')}>
              <View style={styles.statIconWrap}>
                <Ionicons name="cloud-outline" size={16} color={C.brand} />
              </View>
              <Text style={styles.statValue}>{d.co2}</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </Pressable>
          </Animated.View>

          {/* ── Monthly trend chart ── */}
          <Animated.View style={[styles.section, animatedSection(2)]}>
            <Text style={styles.sectionTitle}>Monthly Trend</Text>
            <View style={styles.card}>
              <View style={styles.chartRow}>
                {d.bars.map((b) => (
                  <View key={b.month} style={styles.barWrap}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: `${b.value}%` as any }]} />
                    </View>
                    <Text style={styles.barLabel}>{b.month}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── Materials breakdown ── */}
          <Animated.View style={[styles.section, animatedSection(3)]}>
            <Text style={styles.sectionTitle}>Material Breakdown</Text>
            <View style={styles.card}>
              <View style={styles.materialRow}>
                {d.materials.map((m) => (
                  <View key={m.label} style={styles.materialItem}>
                    <View style={styles.materialHeader}>
                      <Text style={styles.materialLabel}>{m.label}</Text>
                      <Text style={styles.materialPct}>{m.pct}%</Text>
                    </View>
                    <View style={styles.materialTrack}>
                      <View style={[styles.materialFill, { width: `${m.pct}%` as any, backgroundColor: m.color }]} />
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
                onPress={() => { haptic(); toast_('Export coming soon', 'info'); }}
              >
                <Ionicons name="download-outline" size={18} color={C.brand} />
                <Text style={styles.exportBtnText}>EXPORT REPORT</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
