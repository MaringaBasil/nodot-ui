import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Animated, Platform, RefreshControl } from 'react-native';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { MapView, MapMarker } from '@/components/maps/MapView';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const useNativeDriver = Platform.OS !== 'web';

const filters = {
  ranges: ['7d', '30d', 'Quarter'],
  materials: ['All', 'Plastic', 'Paper', 'Glass'],
  regions: ['All regions', 'North', 'CBD', 'South'],
};

const kpis = [
  { label: 'On-time SLA', value: '98%', delta: '+2%', positive: true, icon: 'schedule', color: '#4CAF50' },
  { label: 'Revenue', value: 'R 142k', delta: '+6%', positive: true, icon: 'payments', color: '#2196F3' },
  { label: 'Diversion', value: '1.4t', delta: '+3%', positive: true, icon: 'recycling', color: '#FF9800' },
  { label: 'Contamination', value: '3.2%', delta: '-1.1%', positive: true, icon: 'warning', color: '#9C27B0' },
];

const pickups = [
  { id: 'p1', when: 'Today 11:00', site: 'Parkhurst Hub', status: 'Scheduled', kg: 240, driver: 'Thabo M.', eta: '45 min' },
  { id: 'p2', when: 'Tomorrow 09:00', site: 'Rosebank Dock', status: 'Awaiting', kg: 180, driver: 'Pending', eta: null },
  { id: 'p3', when: 'Fri 14:30', site: 'Melville Campus', status: 'Scheduled', kg: 120, driver: 'Sarah K.', eta: '2 days' },
];

const invoices = [
  { id: 'inv-4012', customer: 'Rosebank Mall', amount: 'R 18,400', status: 'Pending', due: 'Feb 08', overdue: false },
  { id: 'inv-4013', customer: 'Parkhurst HOA', amount: 'R 9,900', status: 'Approved', due: 'Feb 04', overdue: false },
  { id: 'inv-4014', customer: 'Melville Campus', amount: 'R 12,100', status: 'Draft', due: 'Feb 12', overdue: false },
  { id: 'inv-4015', customer: 'Sandton City', amount: 'R 24,500', status: 'Overdue', due: 'Feb 01', overdue: true },
];

const approvals = [
  { id: 'ap-1', title: 'Approve payout', detail: 'Invoice inv-4012 • 18,400 ZAR', cta: 'Approve', priority: 'high' },
  { id: 'ap-2', title: 'Weight dispute', detail: 'Pickup p2 • +12kg adjustment', cta: 'Review', priority: 'medium' },
  { id: 'ap-3', title: 'New hub onboarding', detail: 'Bryanston location verification', cta: 'Verify', priority: 'low' },
];

const alerts = [
  { id: 'al-1', title: 'Capacity warning', detail: 'CBD dock at 82% capacity', icon: 'warning-amber', severity: 'medium' },
  { id: 'al-2', title: 'Late pickup risk', detail: 'Melville Campus delayed 15m', icon: 'watch-later', severity: 'high' },
  { id: 'al-3', title: 'Document expiring', detail: 'Waste permit expires in 12 days', icon: 'description', severity: 'low' },
];

// Sustainability metrics
const sustainabilityMetrics = [
  { label: 'CO₂ Offset', value: '2.4 tonnes', icon: 'eco', color: '#4CAF50' },
  { label: 'Landfill Diversion', value: '94%', icon: 'delete-outline', color: '#2196F3' },
  { label: 'Water Saved', value: '12,400L', icon: 'water-drop', color: '#00BCD4' },
];

const hubMarkers: MapMarker[] = [
  { id: 'hub-1', label: 'Parkhurst', lat: -26.135, lng: 28.016, type: 'hub' },
  { id: 'hub-2', label: 'Rosebank', lat: -26.146, lng: 28.041, type: 'hub' },
  { id: 'hub-3', label: 'Melville', lat: -26.177, lng: 28.011, type: 'hub' },
];

const pickupMarkers: MapMarker[] = [
  { id: 'pick-1', label: 'Pickup today', lat: -26.1405, lng: 28.03, type: 'pickup' },
  { id: 'pick-2', label: 'Pickup tomorrow', lat: -26.142, lng: 28.045, type: 'pickup' },
];

export default function BusinessDashboard() {
  const [range, setRange] = useState('30d');
  const [material, setMaterial] = useState('All');
  const [region, setRegion] = useState('All regions');
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(7)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver }).start();

    Animated.stagger(80, cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver, friction: 6 })
    )).start();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handlePress = useCallback((action: () => void) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Dashboard refreshed', 'success');
    }, 1200);
  }, [showToast]);

  const markers = useMemo(() => [...hubMarkers, ...pickupMarkers], []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Business dashboard</Text>
              <Text style={styles.subtitle}>Compliance, pickups, and impact reporting</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {filters.ranges.map((f) => (
              <Pressable key={f} style={[styles.chip, range === f && styles.chipActive]} onPress={() => setRange(f)}>
                <Text style={[styles.chipText, range === f && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            ))}
            {filters.materials.map((f) => (
              <Pressable key={f} style={[styles.chip, material === f && styles.chipActive]} onPress={() => setMaterial(f)}>
                <Text style={[styles.chipText, material === f && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.chip, styles.chipGhost]} onPress={() => setRegion('CBD')}>
              <MaterialIcons name="place" size={14} color={Theme.colors.muted} />
              <Text style={styles.chipText}>{region}</Text>
            </Pressable>
          </View>

          <View style={styles.kpiRow}>
            {kpis.map((kpi) => (
              <View key={kpi.label} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <Text style={[styles.kpiDelta, kpi.positive ? styles.deltaUp : styles.deltaDown]}>{kpi.delta}</Text>
              </View>
            ))}
          </View>

          <View style={styles.mapCard}>
            <SectionHeader title="Network" meta={`${hubMarkers.length} hubs • ${pickupMarkers.length} pickups`} />
            <View style={styles.mapWrap}>
              <MapView markers={markers} focusId={focusId} onMarkerPress={setFocusId} />
            </View>
            <View style={styles.mapLegendRow}>
              <Text style={styles.mapLegendText}>Tap markers to focus and view details.</Text>
              <Pressable style={styles.mapChip} onPress={() => setToast({ visible: true, message: 'Layers coming soon', type: 'info' })}>
                <MaterialIcons name="layers" size={14} color={Theme.colors.ink} />
                <Text style={styles.mapChipText}>Layers</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Upcoming pickups" meta="Next 7 days" />
            {pickups.length === 0 ? (
              <EmptyState icon="schedule" title="No pickups scheduled" message="When new pickups sync, they will show here." />
            ) : (
              pickups.map((row, idx) => (
                <View key={row.id}>
                  <View style={styles.listRow}>
                    <MaterialIcons name="local-shipping" size={18} color={Theme.colors.greenDark} />
                    <View style={styles.listCol}>
                      <Text style={styles.listText}>{row.when}</Text>
                      <Text style={styles.listMeta}>{row.site}</Text>
                    </View>
                    <Text style={styles.status}>{row.status}</Text>
                  </View>
                  {idx < pickups.length - 1 && <Divider inset={28} />}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Invoices" meta="Pending and approved" />
            {invoices.length === 0 ? (
              <EmptyState icon="payments" title="No invoices" message="Create invoices from pickups to see them here." />
            ) : (
              invoices.map((inv, idx) => (
                <View key={inv.id}>
                  <View style={styles.listRow}>
                    <MaterialIcons name="receipt" size={18} color={Theme.colors.greenDark} />
                    <View style={styles.listCol}>
                      <Text style={styles.listText}>{inv.customer}</Text>
                      <Text style={styles.listMeta}>{inv.due}</Text>
                    </View>
                    <View style={styles.invoiceCol}>
                      <Text style={styles.listText}>{inv.amount}</Text>
                      <Text style={styles.invoiceStatus}>{inv.status}</Text>
                    </View>
                  </View>
                  {idx < invoices.length - 1 && <Divider inset={28} />}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Approvals" meta="Actions waiting" />
            {approvals.length === 0 ? (
              <EmptyState icon="task" title="All caught up" message="Approvals will land here when needed." />
            ) : (
              approvals.map((ap, idx) => (
                <View key={ap.id}>
                  <View style={styles.listRow}>
                    <MaterialIcons name="verified" size={18} color={Theme.colors.greenDark} />
                    <View style={styles.listCol}>
                      <Text style={styles.listText}>{ap.title}</Text>
                      <Text style={styles.listMeta}>{ap.detail}</Text>
                    </View>
                    <Pressable style={styles.chipAction} onPress={() => setToast({ visible: true, message: `${ap.cta} actioned`, type: 'success' })}>
                      <Text style={styles.chipActionText}>{ap.cta}</Text>
                    </Pressable>
                  </View>
                  {idx < approvals.length - 1 && <Divider inset={28} />}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader title="Alerts" meta="Operational" />
            {alerts.length === 0 ? (
              <EmptyState icon="check-circle" title="No alerts" message="Operational alerts will appear when there is something to fix." />
            ) : (
              alerts.map((alert, idx) => (
                <View key={alert.id}>
                  <View style={styles.listRow}>
                    <MaterialIcons name={alert.icon as any} size={18} color={Theme.colors.greenDark} />
                    <View style={styles.listCol}>
                      <Text style={styles.listText}>{alert.title}</Text>
                      <Text style={styles.listMeta}>{alert.detail}</Text>
                    </View>
                    <Pressable onPress={() => setToast({ visible: true, message: `Alert ${alert.title} acknowledged`, type: 'success' })}>
                      <MaterialIcons name="check" size={18} color={Theme.colors.muted} />
                    </Pressable>
                  </View>
                  {idx < alerts.length - 1 && <Divider inset={28} />}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.paper },
  content: { padding: 20, paddingBottom: 100, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 28, fontFamily: Theme.fonts.display, color: Theme.colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 6 },
  headerBadge: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E8F5E9', borderRadius: Theme.radius.m, borderWidth: 1, borderColor: '#C8E6C9', flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 12, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Theme.radius.m, backgroundColor: Theme.colors.wash, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipActive: { backgroundColor: Theme.colors.greenDark, borderColor: Theme.colors.greenDark },
  chipGhost: { backgroundColor: Theme.colors.card },
  chipText: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  chipTextActive: { color: '#FFFFFF', fontFamily: Theme.fonts.display },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { flex: 1, minWidth: 150, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.m, padding: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.subtle },
  kpiLabel: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  kpiValue: { fontSize: 20, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  kpiDelta: { fontSize: 13, fontFamily: Theme.fonts.display },
  deltaUp: { color: Theme.colors.greenDark },
  deltaDown: { color: '#B3261E' },
  mapCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 18, gap: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  mapWrap: { height: 240, borderRadius: Theme.radius.m, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border },
  mapLegendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapLegendText: { fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.muted },
  mapActions: { flexDirection: 'row', gap: 10 },
  mapChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.m, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  mapChipText: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  summaryRow: { flexDirection: 'row', gap: 14 },
  summaryCard: { flex: 1, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.m, padding: 16, gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.subtle },
  summaryLabel: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  summaryValue: { fontSize: 20, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  summaryMeta: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  statsRow: { flexDirection: 'row', gap: 14 },
  statCard: { flex: 1, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.m, padding: 16, gap: 10, alignItems: 'flex-start', ...Theme.shadow.soft },
  statValue: { fontSize: 20, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  statLabel: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  card: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 20, gap: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  listCol: { flex: 1 },
  listText: { fontSize: 15, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  listMeta: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 4 },
  status: { fontSize: 13, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  primaryButton: { marginTop: 6, backgroundColor: Theme.colors.green, borderRadius: Theme.radius.m, paddingVertical: 14, alignItems: 'center', ...Theme.shadow.subtle },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 14 },
  secondaryButton: { marginTop: 6, backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.m, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  secondaryButtonText: { color: Theme.colors.ink, fontFamily: Theme.fonts.body, fontSize: 14 },
  invoiceCol: { alignItems: 'flex-end', gap: 6 },
  invoiceStatus: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  chipAction: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E8F5E9', borderRadius: Theme.radius.m, borderWidth: 1, borderColor: '#C8E6C9' },
  chipActionText: { fontFamily: Theme.fonts.display, fontSize: 13, color: Theme.colors.greenDark },
});
