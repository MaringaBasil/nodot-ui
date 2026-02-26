import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
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

const alerts = [
  { id: '1', title: 'Illegal dumping reported', location: 'Region 3, Sector B', severity: 'high', icon: 'warning', time: '5 min ago' },
  { id: '2', title: 'Pickup delays above 15 min', location: '3 hubs affected', severity: 'medium', icon: 'schedule', time: '12 min ago' },
  { id: '3', title: 'Hub capacity at 80%', location: 'Rosebank Hub', severity: 'low', icon: 'inventory', time: '1 hour ago' },
  { id: '4', title: 'Driver shortage detected', location: 'Region 2, North', severity: 'medium', icon: 'person-off', time: '2 hours ago' },
];

const insights = [
  { label: 'Participation rate', value: '68%', trend: 'up', target: '75%' },
  { label: 'Top material', value: 'PET plastic', trend: 'stable', target: null },
  { label: 'CO2 saved', value: '2.4t', trend: 'up', target: '3t' },
  { label: 'Avg response time', value: '8 min', trend: 'down', target: '5 min' },
];

const realtimeActivity = [
  { id: '1', action: 'Pickup completed', location: 'Rosebank', value: '12.5 kg', time: 'Just now' },
  { id: '2', action: 'New user registered', location: 'Sandton', value: '+1', time: '2 min ago' },
  { id: '3', action: 'Hub verified', location: 'Parkhurst', value: '45 kg', time: '5 min ago' },
];

// ─── Fraud Review Queue data (5-Gate system) ───────────────────────────────
type FraudSeverity = 'critical' | 'high' | 'medium';
type FraudGate = 1 | 2 | 3 | 4 | 5;
const GATE_LABELS: Record<FraudGate, string> = {
  1: 'Geo-Lock Fail',
  2: 'HMAC / QR Invalid',
  3: 'Photo AI Fail',
  4: 'Depot Weight Block',
  5: 'Weight Discrepancy',
};
const GATE_ICONS: Record<FraudGate, string> = {
  1: 'location-off', 2: 'qr-code-2', 3: 'camera-alt', 4: 'scale', 5: 'sync-problem',
};

const FRAUD_FLAGS: {
  id: string;
  gate: FraudGate;
  severity: FraudSeverity;
  pickerId: string;
  citizenId: string;
  jobId: string;
  detail: string;
  time: string;
  dismissed?: boolean;
}[] = [
    {
      id: 'f1', gate: 2, severity: 'critical',
      pickerId: 'PKR-0042', citizenId: 'CIT-1182', jobId: 'JOB-8812',
      detail: 'QR scanned 3.2 km from citizen address. Geo-lock rejected, bag locked.',
      time: '8 min ago',
    },
    {
      id: 'f2', gate: 3, severity: 'high',
      pickerId: 'PKR-0091', citizenId: 'CIT-0234', jobId: 'JOB-8814',
      detail: 'Photo perceptual hash matches previous submission (duplicate photo detected).',
      time: '22 min ago',
    },
    {
      id: 'f3', gate: 5, severity: 'high',
      pickerId: 'PKR-0057', citizenId: 'CIT-3301', jobId: 'JOB-8798',
      detail: 'Picker declared 12.4 kg; depot confirmed 6.1 kg (51% discrepancy). Payout blocked.',
      time: '1h ago',
    },
    {
      id: 'f4', gate: 1, severity: 'medium',
      pickerId: 'PKR-0033', citizenId: 'CIT-2244', jobId: 'JOB-8801',
      detail: 'Same citizen-picker pair on 7 of last 8 jobs. Possible collusion signal.',
      time: '3h ago',
    },
  ];

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },

    /* Header */
    header: {
      paddingHorizontal: 20,
      paddingBottom: 22,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    headerBlobTL: {
      position: 'absolute', width: 180, height: 180, borderRadius: 90,
      backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50,
    },
    headerBlobBR: {
      position: 'absolute', width: 140, height: 140, borderRadius: 70,
      backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30,
    },
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

    /* Content */
    content: { paddingTop: 16, paddingHorizontal: 16, gap: 14 },

    /* Filter row */
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: C.wash, borderRadius: 12,
      borderWidth: 1, borderColor: cardBorder,
    },
    filterChipActive: { backgroundColor: C.brand, borderColor: C.brand },
    filterChipText: { fontFamily: F.body, fontSize: 12, color: C.muted },
    filterChipTextActive: { color: C.navy, fontFamily: F.semibold },
    filterChipGhost: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: C.card, borderRadius: 12,
      borderWidth: 1, borderColor: cardBorder,
    },

    /* KPI grid */
    kpiRow: { flexDirection: 'row', gap: 10 },
    kpiCard: {
      flex: 1,
      backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 4,
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

    /* Signals card */
    signalCard: {
      borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
    },
    signalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: cardBorder,
    },
    signalHeaderLeft: { gap: 2 },
    signalTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
    signalMeta: { fontFamily: F.body, fontSize: 11, color: C.muted },
    signalLivePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.10)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    signalLiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.brand },
    signalLiveText: { fontFamily: F.bold, fontSize: 11, color: C.greenDark },
    signalGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    signalTile: { width: '50%', padding: 14, gap: 4, borderBottomWidth: 1, borderRightWidth: 1, borderColor: cardBorder },
    signalTileValue: { fontFamily: F.bold, fontSize: 22, color: C.ink, letterSpacing: -0.5 },
    signalTileLabel: { fontFamily: F.body, fontSize: 12, color: C.muted },
    signalTileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    signalTileBadgeText: { fontFamily: F.semibold, fontSize: 11 },

    /* Section card */
    card: {
      backgroundColor: C.card, borderRadius: 18, padding: 14, gap: 10,
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

    /* Alert row */
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    alertIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.wash, alignItems: 'center', justifyContent: 'center' },
    alertIconHigh: { backgroundColor: '#FFEBEE' },
    alertIconMedium: { backgroundColor: '#FFF3E0' },
    alertContent: { flex: 1 },
    alertText: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
    alertMeta: { fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 2 },
    alertTime: { fontFamily: F.body, fontSize: 10, color: C.muted },

    /* Primary button */
    primaryButton: {
      marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: C.brand, borderRadius: 14, paddingVertical: 13,
      shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    primaryButtonText: { color: C.navy, fontFamily: F.bold, fontSize: 13 },

    /* Insight row */
    listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    listText: { fontFamily: F.body, fontSize: 13, color: C.ink },
    listValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    listValue: { fontFamily: F.semibold, fontSize: 13, color: C.brand },

    /* Fraud Queue */
    fraudCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 10,
      borderWidth: 1, borderColor: cardBorder, marginBottom: 12,
    },
    fraudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fraudGateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    fraudGateBadgeCritical: { backgroundColor: isDark ? 'rgba(198,40,40,0.2)' : '#FFEBEE' },
    fraudGateBadgeHigh: { backgroundColor: isDark ? 'rgba(230,81,0,0.2)' : '#FFF3E0' },
    fraudGateBadgeMedium: { backgroundColor: isDark ? 'rgba(21,101,192,0.2)' : '#E3F2FD' },
    fraudGateText: { fontFamily: F.bold, fontSize: 11 },
    fraudGateTextCritical: { color: isDark ? '#EF9A9A' : '#C62828' },
    fraudGateTextHigh: { color: isDark ? '#FFCC80' : '#E65100' },
    fraudGateTextMedium: { color: isDark ? '#90CAF9' : '#1565C0' },
    fraudTime: { fontFamily: F.body, fontSize: 11, color: C.muted },
    fraudIds: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    fraudIdChip: { backgroundColor: C.wash, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: cardBorder },
    fraudIdText: { fontFamily: F.semibold, fontSize: 10, color: C.muted },
    fraudDetail: { fontFamily: F.body, fontSize: 13, color: C.ink, marginTop: 4, lineHeight: 18 },
    fraudActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    fraudBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: cardBorder },
    fraudBtnPrimary: { backgroundColor: isDark ? '#B71C1C' : '#C62828', borderColor: isDark ? '#B71C1C' : '#C62828' },
    fraudBtnPrimaryText: { fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' },
    fraudBtnSecondaryText: { fontFamily: F.bold, fontSize: 13, color: C.ink },

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
  const [flags, setFlags] = useState(FRAUD_FLAGS);
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
      showToast('Dashboard data refreshed', 'success');
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
        <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerBlobTL} />
          <View style={styles.headerBlobBR} />
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Admin Control</Text>
              <Text style={styles.headerSub}>City-scale insights &amp; ops</Text>
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
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

          {/* Alerts */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alerts</Text>
              <Text style={styles.sectionMeta}>{alerts.length} active</Text>
            </View>
            {alerts.map((alert, idx) => (
              <View key={alert.id}>
                <Pressable
                  style={({ pressed }) => [styles.alertRow, pressed && styles.rowPressed]}
                  onPress={() => handlePress(() => showToast(`Viewing: ${alert.title}`, 'info'))}
                >
                  <View style={[styles.alertIcon, alert.severity === 'high' && styles.alertIconHigh, alert.severity === 'medium' && styles.alertIconMedium]}>
                    <MaterialIcons name={alert.icon as any} size={16} color={alert.severity === 'high' ? '#C62828' : alert.severity === 'medium' ? '#F57C00' : C.muted} />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>{alert.title}</Text>
                    <Text style={styles.alertMeta}>{alert.location}</Text>
                  </View>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </Pressable>
                {idx < alerts.length - 1 && <Divider inset={44} />}
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.rowPressed]}
              onPress={() => handlePress(() => showToast('Incident log opened', 'success'))}
            >
              <MaterialIcons name="list-alt" size={16} color={C.navy} />
              <Text style={styles.primaryButtonText}>View incident log</Text>
            </Pressable>
          </View>

          {/* Fraud Review Queue */}
          <View style={[styles.card, { borderColor: isDark ? 'rgba(239,83,80,0.4)' : '#EF5350' }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Fraud Review Queue</Text>
                <Text style={styles.sectionMeta}>Multi-gate automated flags</Text>
              </View>
              <Text style={styles.sectionMeta}>{flags.filter(f => !f.dismissed).length} pending</Text>
            </View>

            {flags.filter(f => !f.dismissed).map((flag) => (
              <View key={flag.id} style={styles.fraudCard}>
                <View style={styles.fraudHeader}>
                  <View style={[
                    styles.fraudGateBadge,
                    flag.severity === 'critical' ? styles.fraudGateBadgeCritical :
                      flag.severity === 'high' ? styles.fraudGateBadgeHigh :
                        styles.fraudGateBadgeMedium
                  ]}>
                    <MaterialIcons name={GATE_ICONS[flag.gate] as any} size={14} color={
                      flag.severity === 'critical' ? (isDark ? '#EF9A9A' : '#C62828') :
                        flag.severity === 'high' ? (isDark ? '#FFCC80' : '#E65100') :
                          (isDark ? '#90CAF9' : '#1565C0')
                    } />
                    <Text style={[
                      styles.fraudGateText,
                      flag.severity === 'critical' ? styles.fraudGateTextCritical :
                        flag.severity === 'high' ? styles.fraudGateTextHigh :
                          styles.fraudGateTextMedium
                    ]}>{GATE_LABELS[flag.gate]}</Text>
                  </View>
                  <Text style={styles.fraudTime}>{flag.time}</Text>
                </View>

                <View style={styles.fraudIds}>
                  <View style={styles.fraudIdChip}><Text style={styles.fraudIdText}>{flag.jobId}</Text></View>
                  <View style={styles.fraudIdChip}><Text style={styles.fraudIdText}>{flag.pickerId}</Text></View>
                  <View style={styles.fraudIdChip}><Text style={styles.fraudIdText}>{flag.citizenId}</Text></View>
                </View>

                <Text style={styles.fraudDetail}>{flag.detail}</Text>

                <View style={styles.fraudActions}>
                  <Pressable
                    style={({ pressed }) => [styles.fraudBtn, pressed && styles.rowPressed]}
                    onPress={() => handlePress(() => {
                      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, dismissed: true } : f));
                      showToast('Flag dismissed. Users noted.', 'info');
                    })}
                  >
                    <Text style={styles.fraudBtnSecondaryText}>Dismiss</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.fraudBtn, styles.fraudBtnPrimary, pressed && styles.rowPressed]}
                    onPress={() => handlePress(() => {
                      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, dismissed: true } : f));
                      showToast('Users suspended pending review', 'error');
                    })}
                  >
                    <Text style={styles.fraudBtnPrimaryText}>Take Action</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {flags.filter(f => !f.dismissed).length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <MaterialIcons name="check-circle" size={40} color={C.brand} />
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink, marginTop: 10 }}>Queue Empty</Text>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 4 }}>No active fraud flags.</Text>
              </View>
            )}
          </View>

          {/* Policy insights */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Policy Insights</Text>
              <Text style={styles.sectionMeta}>City scorecard</Text>
            </View>
            {insights.map((item, idx) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed]}
                  onPress={() => handlePress(() => showToast(`${item.label}: ${item.value}`, 'info'))}
                >
                  <Text style={styles.listText}>{item.label}</Text>
                  <View style={styles.listValueRow}>
                    <Text style={styles.listValue}>{item.value}</Text>
                    {item.trend !== 'stable' && (
                      <MaterialIcons
                        name={item.trend === 'up' ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={item.trend === 'up' ? '#2E7D32' : '#B3261E'}
                      />
                    )}
                  </View>
                </Pressable>
                {idx < insights.length - 1 && <Divider inset={0} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
