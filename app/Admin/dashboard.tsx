import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const useNativeDriver = Platform.OS !== 'web';

const regions = ['Region 1', 'Region 2', 'Region 3', 'All'];
const timeRanges = ['Today', '7d', '30d'];

const kpis = [
  { label: 'Active users', value: '12.4k', icon: 'people', delta: '+8%', positive: true, color: '#4CAF50' },
  { label: 'Pickups', value: '847', icon: 'local-shipping', delta: '+12%', positive: true, color: '#2196F3' },
  { label: 'Tonnage', value: '24.8t', icon: 'scale', delta: '-3%', positive: false, color: '#FF9800' },
  { label: 'Revenue', value: 'R 124k', icon: 'payments', delta: '+15%', positive: true, color: '#9C27B0' },
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

// Real-time activity data
const realtimeActivity = [
  { id: '1', action: 'Pickup completed', location: 'Rosebank', value: '12.5 kg', time: 'Just now' },
  { id: '2', action: 'New user registered', location: 'Sandton', value: '+1', time: '2 min ago' },
  { id: '3', action: 'Hub verified', location: 'Parkhurst', value: '45 kg', time: '5 min ago' },
];

// Regional breakdown
const regionalData = [
  { region: 'Region 1', users: 4200, tonnage: 8.2, revenue: 42000, change: '+5%' },
  { region: 'Region 2', users: 3800, tonnage: 7.1, revenue: 38000, change: '+8%' },
  { region: 'Region 3', users: 4400, tonnage: 9.5, revenue: 44000, change: '+12%' },
];

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Region 3');
  const [selectedTime, setSelectedTime] = useState('Today');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const [showActivityFeed, setShowActivityFeed] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in header
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver }).start();

    // Stagger card animations
    Animated.stagger(100, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver, friction: 6 })
    )).start();

    // Pulse animation for live indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver }),
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
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.greenDark}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Admin control</Text>
              <Text style={styles.subtitle}>City scale insights and operations</Text>
            </View>
            <View style={styles.headerBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>Live</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {timeRanges.map((t) => (
              <Pressable
                key={t}
                style={({ pressed }) => [styles.filterChip, selectedTime === t && styles.filterChipActive, pressed && styles.filterChipPressed]}
                onPress={() => handlePress(() => setSelectedTime(t))}
              >
                <Text style={[styles.filterChipText, selectedTime === t && styles.filterChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.filterChipGhost, pressed && styles.filterChipPressed]}
              onPress={() => handlePress(() => {
                const idx = regions.indexOf(selectedRegion);
                setSelectedRegion(regions[(idx + 1) % regions.length]);
                showToast(`Switched to ${regions[(idx + 1) % regions.length]}`, 'info');
              })}
            >
              <MaterialIcons name="place" size={14} color={Theme.colors.muted} />
              <Text style={styles.filterChipTextGhost}>{selectedRegion}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.filterChipGhost, pressed && styles.filterChipPressed]}
              onPress={() => handlePress(() => showToast('Export feature coming soon', 'info'))}
            >
              <MaterialIcons name="download" size={14} color={Theme.colors.muted} />
              <Text style={styles.filterChipTextGhost}>Export</Text>
            </Pressable>
          </View>

          <View style={styles.kpiRow}>
            {kpis.map((kpi) => (
              <Pressable
                key={kpi.label}
                style={({ pressed }) => [styles.kpiCard, pressed && styles.kpiCardPressed]}
                onPress={() => handlePress(() => showToast(`${kpi.label}: ${kpi.value} (${kpi.delta})`, 'info'))}
              >
                <View style={styles.kpiIcon}>
                  <MaterialIcons name={kpi.icon as any} size={16} color={Theme.colors.greenDark} />
                </View>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <View style={styles.kpiDeltaRow}>
                  <MaterialIcons name={kpi.positive ? 'trending-up' : 'trending-down'} size={12} color={kpi.positive ? Theme.colors.greenDark : '#B3261E'} />
                  <Text style={[styles.kpiDelta, kpi.positive ? styles.deltaUp : styles.deltaDown]}>{kpi.delta}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <SectionHeader title="Activity heatmap" meta="Johannesburg central zone" />
            </View>
            <View style={styles.mapOverlay}>
              <Text style={styles.mapTitle}>Live signals</Text>
              <Text style={styles.mapMeta}>Updated 2m ago • {selectedRegion}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Alerts" meta={`${alerts.length} active`} />
            {alerts.map((alert, idx) => (
              <View key={alert.id}>
                <Pressable
                  style={({ pressed }) => [styles.alertRow, pressed && styles.rowPressed]}
                  onPress={() => handlePress(() => showToast(`Viewing: ${alert.title}`, 'info'))}
                >
                  <View style={[styles.alertIcon, alert.severity === 'high' && styles.alertIconHigh, alert.severity === 'medium' && styles.alertIconMedium]}>
                    <MaterialIcons name={alert.icon as any} size={16} color={alert.severity === 'high' ? '#C62828' : alert.severity === 'medium' ? '#F57C00' : Theme.colors.muted} />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>{alert.title}</Text>
                    <Text style={styles.alertMeta}>{alert.location}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={16} color={Theme.colors.muted} />
                </Pressable>
                {idx < alerts.length - 1 && <Divider inset={44} />}
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => handlePress(() => showToast('Incident log opened', 'success'))}
            >
              <MaterialIcons name="list-alt" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View incident log</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Policy insights" meta="City scorecard" />
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
                        color={item.trend === 'up' ? Theme.colors.greenDark : '#B3261E'} 
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.paper },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontFamily: Theme.fonts.display, color: Theme.colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 4 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFF8E1', borderRadius: Theme.radius.s, borderWidth: 1, borderColor: '#FFE082' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F57C00' },
  badgeText: { fontSize: 11, fontFamily: Theme.fonts.display, color: '#F57C00' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.s, borderWidth: 1, borderColor: 'transparent' },
  filterChipActive: { backgroundColor: Theme.colors.greenDark, borderColor: Theme.colors.greenDark },
  filterChipPressed: { opacity: 0.8 },
  filterChipText: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  filterChipTextActive: { color: '#FFFFFF', fontFamily: Theme.fonts.display },
  filterChipGhost: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.s, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  filterChipTextGhost: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: { flex: 1, minWidth: 150, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.m, padding: 12, gap: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.subtle },
  kpiCardPressed: { opacity: 0.9 },
  kpiIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  kpiLabel: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  kpiDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  kpiDelta: { fontSize: 11, fontFamily: Theme.fonts.display },
  deltaUp: { color: Theme.colors.greenDark },
  deltaDown: { color: '#B3261E' },
  mapCard: { height: 200, borderRadius: Theme.radius.l, backgroundColor: '#DDE6E0', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft, padding: 14 },
  mapHeader: { position: 'absolute', top: 14, left: 14, right: 14 },
  mapOverlay: { position: 'absolute', left: 14, bottom: 14, backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: Theme.radius.s, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  mapTitle: { fontSize: 14, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  mapMeta: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  card: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  alertIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.colors.wash, alignItems: 'center', justifyContent: 'center' },
  alertIconHigh: { backgroundColor: '#FFEBEE' },
  alertIconMedium: { backgroundColor: '#FFF3E0' },
  alertContent: { flex: 1 },
  alertText: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  alertMeta: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  rowPressed: { opacity: 0.7, backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.s },
  primaryButton: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Theme.colors.green, borderRadius: Theme.radius.m, paddingVertical: 12, ...Theme.shadow.subtle },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 13 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  listText: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  listValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listValue: { fontSize: 13, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
});
