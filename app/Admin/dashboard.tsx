import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { Divider } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const useNativeDriver = Platform.OS !== 'web';

const regions = ['Region 1', 'Region 2', 'Region 3', 'All'];
const timeRanges = ['Today', '7d', '30d'];

const kpis = [
  { label: 'Active users', value: '12.4k', icon: 'people', delta: '+8%', positive: true },
  { label: 'Pickups', value: '847', icon: 'local-shipping', delta: '+12%', positive: true },
  { label: 'Tonnage', value: '24.8t', icon: 'scale', delta: '-3%', positive: false },
  { label: 'Revenue', value: 'R 124k', icon: 'payments', delta: '+15%', positive: true },
];

const realtimeActivity = [
  { id: '1', action: 'Pickup completed', location: 'Rosebank', value: '12.5 kg', time: 'Just now', icon: 'check-circle', positive: true },
  { id: '2', action: 'New user registered', location: 'Sandton', value: '+1', time: '2 min ago', icon: 'person-add', positive: true },
  { id: '3', action: 'Hub verified', location: 'Parkhurst', value: '45 kg', time: '5 min ago', icon: 'verified', positive: true },
  { id: '4', action: 'Fraud flag raised', location: 'Region 2', value: 'Gate 3', time: '8 min ago', icon: 'security', positive: false },
  { id: '5', action: 'Payout processed', location: 'PKR-0042', value: 'R 86', time: '11 min ago', icon: 'payments', positive: true },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    headerLeft: { gap: 2 },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    liveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4EC831' },
    liveBadgeText: { fontFamily: F.semibold, fontSize: 12, color: '#FFFFFF' },

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 14 },

    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.wash,
      borderRadius: 12, borderWidth: 1, borderColor: cardBorder,
    },
    filterChipActive: { backgroundColor: C.brand, borderColor: C.brand },
    filterChipText: { fontFamily: F.body, fontSize: 12, color: C.muted },
    filterChipTextActive: { color: C.navy, fontFamily: F.semibold },
    filterChipGhost: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: cardBorder,
    },

    kpiRow: { flexDirection: 'row', gap: 10 },
    kpiCard: {
      flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 4,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    kpiIcon: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    kpiValue: { fontFamily: F.bold, fontSize: 18, color: C.ink },
    kpiLabel: { fontFamily: F.body, fontSize: 11, color: C.muted },
    kpiDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    kpiDelta: { fontFamily: F.semibold, fontSize: 11 },
    deltaUp: { color: '#2E7D32' },
    deltaDown: { color: '#B3261E' },

    signalCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: cardBorder },
    signalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: cardBorder,
    },
    signalHeaderLeft: { gap: 2 },
    signalTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
    signalMeta: { fontFamily: F.body, fontSize: 11, color: C.muted },
    signalLivePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.10)',
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
    },
    signalLiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.brand },
    signalLiveText: { fontFamily: F.bold, fontSize: 11, color: C.greenDark },
    signalGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    signalTile: { width: '50%', padding: 14, gap: 4, borderBottomWidth: 1, borderRightWidth: 1, borderColor: cardBorder },
    signalTileValue: { fontFamily: F.bold, fontSize: 22, color: C.ink, letterSpacing: -0.5 },
    signalTileLabel: { fontFamily: F.body, fontSize: 12, color: C.muted },
    signalTileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    signalTileBadgeText: { fontFamily: F.semibold, fontSize: 11 },

    card: {
      backgroundColor: C.card, borderRadius: 18, padding: 14, gap: 10,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },

    activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    activityIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    activityContent: { flex: 1 },
    activityAction: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    activityLocation: { fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 1 },
    activityRight: { alignItems: 'flex-end', gap: 2 },
    activityValue: { fontFamily: F.bold, fontSize: 13, color: C.brand },
    activityTime: { fontFamily: F.body, fontSize: 10, color: C.muted },

    rowPressed: { opacity: 0.7 },
  });
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Region 3');
  const [selectedTime, setSelectedTime] = useState('Today');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Dashboard refreshed', 'success');
    }, 1200);
  }, [showToast]);

  const handlePress = useCallback((action: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* ── Gradient header ── */}
        <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerBlobTL} />
          <View style={styles.headerBlobBR} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Admin Control</Text>
              <Text style={styles.headerSub}>City-scale insights & ops</Text>
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        >
          {/* Filter row */}
          <View style={styles.filterRow}>
            {timeRanges.map((t) => (
              <Pressable
                key={t}
                style={({ pressed }) => [styles.filterChip, selectedTime === t && styles.filterChipActive, pressed && styles.rowPressed]}
                onPress={() => handlePress(() => setSelectedTime(t))}
              >
                <Text style={[styles.filterChipText, selectedTime === t && styles.filterChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.filterChipGhost, pressed && styles.rowPressed]}
              onPress={() => handlePress(() => {
                const idx = regions.indexOf(selectedRegion);
                setSelectedRegion(regions[(idx + 1) % regions.length]);
                showToast(`Switched to ${regions[(idx + 1) % regions.length]}`, 'info');
              })}
            >
              <MaterialIcons name="place" size={14} color={C.muted} />
              <Text style={styles.filterChipText}>{selectedRegion}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.filterChipGhost, pressed && styles.rowPressed]}
              onPress={() => handlePress(() => showToast('Export coming soon', 'info'))}
            >
              <MaterialIcons name="download" size={14} color={C.muted} />
              <Text style={styles.filterChipText}>Export</Text>
            </Pressable>
          </View>

          {/* KPI cards — 2×2 grid */}
          <View style={{ gap: 10 }}>
            {[kpis.slice(0, 2), kpis.slice(2, 4)].map((row, ri) => (
              <View key={ri} style={styles.kpiRow}>
                {row.map((kpi) => (
                  <Pressable
                    key={kpi.label}
                    style={({ pressed }) => [styles.kpiCard, pressed && styles.rowPressed]}
                    onPress={() => handlePress(() => showToast(`${kpi.label}: ${kpi.value} (${kpi.delta})`, 'info'))}
                  >
                    <View style={styles.kpiIcon}>
                      <MaterialIcons name={kpi.icon as any} size={16} color={C.brand} />
                    </View>
                    <Text style={styles.kpiValue}>{kpi.value}</Text>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                    <View style={styles.kpiDeltaRow}>
                      <MaterialIcons name={kpi.positive ? 'trending-up' : 'trending-down'} size={12} color={kpi.positive ? '#2E7D32' : '#B3261E'} />
                      <Text style={[styles.kpiDelta, kpi.positive ? styles.deltaUp : styles.deltaDown]}>{kpi.delta}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {/* Live Signals Card */}
          <View style={[styles.signalCard, { backgroundColor: C.card }]}>
            <View style={styles.signalHeader}>
              <View style={styles.signalHeaderLeft}>
                <Text style={styles.signalTitle}>Live Signals</Text>
                <Text style={styles.signalMeta}>Updated 2m ago · {selectedRegion}</Text>
              </View>
              <View style={styles.signalLivePill}>
                <View style={styles.signalLiveDot} />
                <Text style={styles.signalLiveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.signalGrid}>
              {[
                { val: '12', label: 'Active Sites', badge: '+1 online', badgeColor: '#2E7D32' },
                { val: '28', label: 'Pickers Online', badge: '4 on job', badgeColor: C.muted },
                { val: '3', label: 'Open Alerts', badge: '1 critical', badgeColor: '#C62828' },
                { val: '84%', label: 'Coverage', badge: 'Region 3', badgeColor: C.muted },
              ].map((tile, i) => (
                <Pressable
                  key={tile.label}
                  style={({ pressed }) => [styles.signalTile, pressed && styles.rowPressed,
                  i % 2 === 1 && { borderRightWidth: 0 },
                  i >= 2 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handlePress(() => showToast(tile.label, 'info'))}
                >
                  <Text style={styles.signalTileValue}>{tile.val}</Text>
                  <Text style={styles.signalTileLabel}>{tile.label}</Text>
                  <View style={styles.signalTileBadge}>
                    <Text style={[styles.signalTileBadgeText, { color: tile.badgeColor }]}>{tile.badge}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Live Activity feed */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Activity</Text>
              <Text style={styles.sectionMeta}>{selectedRegion}</Text>
            </View>
            {realtimeActivity.map((item, idx) => (
              <View key={item.id}>
                <Pressable
                  style={({ pressed }) => [styles.activityRow, pressed && styles.rowPressed]}
                  onPress={() => handlePress(() => showToast(item.action, 'info'))}
                >
                  <View style={[styles.activityIcon, {
                    backgroundColor: item.positive
                      ? (isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.10)')
                      : (isDark ? 'rgba(229,57,53,0.12)' : '#FFEBEE'),
                  }]}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.positive ? C.brand : '#E53935'} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityAction}>{item.action}</Text>
                    <Text style={styles.activityLocation}>{item.location}</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={[styles.activityValue, !item.positive && { color: '#E53935' }]}>{item.value}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                </Pressable>
                {idx < realtimeActivity.length - 1 && <Divider inset={46} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
