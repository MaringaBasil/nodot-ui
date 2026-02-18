import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, TextInput, Modal, Platform } from 'react-native';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { MapView, MapMarker } from '@/components/maps/MapView';
import { Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/ui/EmptyState';

const useNativeDriver = Platform.OS !== 'web';

type Job = {
  id: string;
  address: string;
  weight: number;
  status: 'pending' | 'accepted' | 'completed';
  coordinates: { lat: number; lng: number };
  material: string;
  distance: string;
  eta: string;
  payout: number;
  priority?: 'high' | 'normal' | 'low';
  customerName?: string;
  customerRating?: number;
  notes?: string;
};

type Hotspot = {
  id: string;
  name: string;
  address: string;
  material?: string;
  imageUri?: string;
  coordinates: { lat: number; lng: number };
};

const MOCK_JOBS: Job[] = [
  { id: '1', address: '123 Main St, Rosebank', weight: 5.2, status: 'pending', coordinates: { lat: -26.2041, lng: 28.0473 }, material: 'PET Plastic', distance: '1.2 km', eta: '5 min', payout: 26, priority: 'high', customerName: 'John D.', customerRating: 4.8, notes: 'Ring the bell twice' },
  { id: '2', address: '456 Market Rd, Sandton', weight: 12.0, status: 'pending', coordinates: { lat: -26.205, lng: 28.048 }, material: 'Mixed recyclables', distance: '2.4 km', eta: '12 min', payout: 60, priority: 'normal', customerName: 'Sarah M.', customerRating: 4.5 },
  { id: '3', address: '789 Township Ave, Alexandra', weight: 3.5, status: 'pending', coordinates: { lat: -26.206, lng: 28.049 }, material: 'Cardboard', distance: '3.1 km', eta: '18 min', payout: 14, priority: 'low', customerName: 'Thabo K.', customerRating: 5.0 },
  { id: '4', address: '321 Oak Drive, Melville', weight: 8.7, status: 'pending', coordinates: { lat: -26.177, lng: 28.011 }, material: 'Glass bottles', distance: '4.2 km', eta: '22 min', payout: 35, priority: 'normal', customerName: 'Lisa N.', customerRating: 4.9 },
];

// Driver performance stats
const driverStats = {
  rating: 4.9,
  totalPickups: 342,
  onTimeRate: '98%',
  weeklyEarnings: 2450,
  streakDays: 12,
};

const MOCK_HOTSPOTS: Hotspot[] = [
  { id: 'hs-1', name: 'CBD hotspot', address: 'Scout zone A', coordinates: { lat: -26.2045, lng: 28.0482 } },
  { id: 'hs-2', name: 'Station hotspot', address: 'Scout zone B', coordinates: { lat: -26.2055, lng: 28.0503 } },
];

export default function PickerHome() {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [hotspots, setHotspots] = useState<Hotspot[]>(MOCK_HOTSPOTS);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [online, setOnline] = useState(true);
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);
  const [hotspotModalVisible, setHotspotModalVisible] = useState(false);
  const [hotspotName, setHotspotName] = useState('');
  const [hotspotAddress, setHotspotAddress] = useState('');
  const [hotspotMaterial, setHotspotMaterial] = useState('');
  const [hotspotLat, setHotspotLat] = useState('');
  const [hotspotLng, setHotspotLng] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedToday, setCompletedToday] = useState(3);
  const [earningsToday, setEarningsToday] = useState(184);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const driverLocation = { lat: -26.2048, lng: 28.0479 };

  // Animations
  const sections = useMemo(() => Array.from({ length: 5 }, () => new Animated.Value(0)), []);
  const onlinePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, sections.map((s) => Animated.timing(s, { toValue: 1, duration: 400, useNativeDriver }))).start();
  }, [sections]);

  useEffect(() => {
    if (online) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(onlinePulse, { toValue: 1, duration: 1000, useNativeDriver }),
          Animated.timing(onlinePulse, { toValue: 0.3, duration: 1000, useNativeDriver }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      onlinePulse.setValue(0);
    }
  }, [online, onlinePulse]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Jobs refreshed', 'success');
    }, 1500);
  }, [showToast]);

  const handlePress = useCallback((action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const mapMarkers: MapMarker[] = useMemo(() => {
    const pickupMarkers = jobs.map((job) => ({
      id: job.id,
      label: job.address,
      lat: job.coordinates.lat,
      lng: job.coordinates.lng,
      type: 'pickup' as const,
    }));
    const hotspotMarkers = hotspots.map((hs) => ({
      id: hs.id,
      label: hs.name,
      lat: hs.coordinates.lat,
      lng: hs.coordinates.lng,
      type: 'hotspot' as const,
    }));
    return [{ id: 'you', label: 'You', lat: driverLocation.lat, lng: driverLocation.lng, type: 'you' as const }, ...pickupMarkers, ...hotspotMarkers];
  }, [driverLocation.lat, driverLocation.lng, hotspots, jobs]);

  const focusJob = useMemo(() => {
    const jobByFocus = focusMarkerId ? jobs.find((j) => j.id === focusMarkerId) : null;
    return jobByFocus ?? activeJob ?? jobs[0];
  }, [focusMarkerId, jobs, activeJob]);

  const focusedHotspot = useMemo(() => (focusMarkerId ? hotspots.find((h) => h.id === focusMarkerId) : null), [focusMarkerId, hotspots]);

  const handleMarkerPress = (id: string) => {
    if (id === 'you') return;
    setFocusMarkerId(id);
  };

  const addHotspot = () => {
    const name = hotspotName.trim() || `Hotspot ${hotspots.length + 1}`;
    const address = hotspotAddress.trim() || 'New scout zone';
    const parsedLat = parseFloat(hotspotLat);
    const parsedLng = parseFloat(hotspotLng);
    const hasCoords = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);
    const jitterLat = (Math.random() - 0.5) * 0.006;
    const jitterLng = (Math.random() - 0.5) * 0.006;
    const newHotspot: Hotspot = {
      id: `hs-${Date.now()}`,
      name,
      address,
      material: hotspotMaterial.trim() || 'Mixed recyclables',
      coordinates: hasCoords
        ? { lat: parsedLat, lng: parsedLng }
        : { lat: driverLocation.lat + jitterLat, lng: driverLocation.lng + jitterLng },
    };
    setHotspots((prev) => [...prev, newHotspot]);
    setFocusMarkerId(newHotspot.id);
    setHotspotModalVisible(false);
    setHotspotName('');
    setHotspotAddress('');
    setHotspotMaterial('');
    setHotspotLat('');
    setHotspotLng('');
  };

  const assignHotspotToJob = (hotspot: Hotspot) => {
    const newJob: Job = {
      id: `job-${Date.now()}`,
      address: hotspot.address,
      weight: 6,
      status: 'pending',
      coordinates: { ...hotspot.coordinates },
      material: hotspot.material || 'Mixed recyclables',
      distance: '1.0 km',
      eta: '8 min',
      payout: 30,
      priority: 'normal',
    };
    setJobs((prev) => [...prev, newJob]);
    setFocusMarkerId(newJob.id);
    Alert.alert('Hotspot added to queue', `${hotspot.name} queued as pickup.`);
  };

  const acceptJob = (jobId: string) => {
    if (!online) {
      showToast('Go online to accept jobs', 'warning');
      return;
    }
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setActiveJob({ ...job, status: 'accepted' });
      setFocusMarkerId(job.id);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: 'accepted' } : j)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Job accepted: ${job.address}`, 'success');
    }
  };

  const completeJob = () => {
    if (!online) {
      showToast('Go online to complete jobs', 'warning');
      return;
    }
    if (activeJob) {
      setJobs(jobs.filter((j) => j.id !== activeJob.id));
      setEarningsToday((prev) => prev + activeJob.payout);
      setCompletedToday((prev) => prev + 1);
      setActiveJob(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Job completed! +R ${activeJob.payout} added to wallet.`, 'success');
    }
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

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
          <Text style={styles.title}>Picker mode</Text>
          <Text style={styles.subtitle}>Route view and pickup queue</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.statusChip, !online && styles.statusChipOffline, pressed && styles.btnPressed]}
          onPress={() => handlePress(() => {
            setOnline((v) => !v);
            Haptics.notificationAsync(online ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
            showToast(online ? 'You are now offline' : 'You are now online', online ? 'warning' : 'success');
          })}
          accessibilityRole="button"
          accessibilityLabel={online ? 'Go offline' : 'Go online'}
        >
          {online && <Animated.View style={[styles.onlineDot, { opacity: onlinePulse }]} />}
          <MaterialIcons name={online ? 'wifi-tethering' : 'wifi-off'} size={16} color={online ? Theme.colors.greenDark : Theme.colors.muted} />
          <Text style={[styles.statusText, !online && styles.statusTextOffline]}>{online ? 'Online' : 'Offline'}</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.btnPressed]} onPress={() => handlePress(() => showToast(`Today's earnings: R ${earningsToday}`, 'info'))}>
          <View style={styles.statIconWrap}>
            <MaterialIcons name="account-balance-wallet" size={18} color={Theme.colors.greenDark} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>R {earningsToday}</Text>
            <Text style={styles.statLabel}>Today's earnings</Text>
          </View>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.btnPressed]} onPress={() => handlePress(() => showToast(`${completedToday} pickups completed today`, 'info'))}>
          <View style={styles.statIconWrap}>
            <MaterialIcons name="check-circle" size={18} color={Theme.colors.greenDark} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.statCard, pressed && styles.btnPressed]} onPress={() => handlePress(() => showToast('12.4 km projected route distance', 'info'))}>
          <View style={styles.statIconWrap}>
            <MaterialIcons name="route" size={18} color={Theme.colors.greenDark} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>12.4</Text>
            <Text style={styles.statLabel}>km route</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <MapView markers={mapMarkers} focusId={focusMarkerId ?? focusJob?.id} onMarkerPress={handleMarkerPress} />
        <View style={styles.mapOverlayTop}>
          <View style={styles.mapTitleRow}>
            <MaterialIcons name="map" size={16} color={Theme.colors.greenDark} />
            <View>
              <Text style={styles.mapTitle}>Route overview</Text>
              <Text style={styles.mapMeta}>{jobs.length} pickups • {hotspots.length} hotspots</Text>
            </View>
          </View>
          <View style={styles.mapActions}>
            <Pressable style={({ pressed }) => [styles.mapBtn, pressed && styles.btnPressed]} onPress={() => handlePress(() => { setFocusMarkerId(null); showToast('Map recentered', 'info'); })}>
              <MaterialIcons name="my-location" size={16} color={Theme.colors.ink} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.mapBtn, pressed && styles.btnPressed]} onPress={() => handlePress(() => showToast('Layers coming soon', 'info'))}>
              <MaterialIcons name="layers" size={16} color={Theme.colors.ink} />
            </Pressable>
          </View>
        </View>
        <View style={styles.mapOverlayBottom}>
          <View style={styles.mapFooterRow}>
            <View style={styles.mapFooterInfo}>
              <View style={[styles.mapFooterIcon, focusedHotspot && styles.mapFooterIconHotspot]}>
                <MaterialIcons name={focusedHotspot ? 'location-searching' : 'local-shipping'} size={16} color={focusedHotspot ? '#F57C00' : Theme.colors.greenDark} />
              </View>
              <View style={styles.mapFooterText}>
                <Text style={styles.mapFooterLabel}>{focusedHotspot ? 'Hotspot' : focusJob ? 'Focused pickup' : 'Nearest pickup'}</Text>
                <Text style={styles.mapFooterTitle} numberOfLines={1}>{focusedHotspot ? focusedHotspot.name : focusJob ? focusJob.address : 'No pickup selected'}</Text>
                <Text style={styles.mapFooterMeta}>
                  {focusedHotspot
                    ? focusedHotspot.address
                    : focusJob
                    ? `${focusJob.weight} kg • ${focusJob.material} • ${focusJob.distance}`
                    : 'Tap a pin or list item'}
                </Text>
              </View>
            </View>
            {focusedHotspot ? (
              <Pressable style={({ pressed }) => [styles.mapFooterAction, pressed && styles.primaryBtnPressed]} onPress={() => handlePress(() => assignHotspotToJob(focusedHotspot))}>
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.mapFooterActionText}>Queue</Text>
              </Pressable>
            ) : focusJob ? (
              <Pressable
                style={({ pressed }) => [styles.mapFooterAction, !online && styles.mapFooterActionDisabled, pressed && online && styles.primaryBtnPressed]}
                onPress={() => handlePress(() => focusJob && acceptJob(focusJob.id))}
                disabled={!online}
              >
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.mapFooterActionText}>Accept</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.hotspotCard}>
        <View style={styles.hotspotHeader}>
          <View style={styles.hotspotHeaderLeft}>
            <MaterialIcons name="location-searching" size={16} color="#F57C00" />
            <Text style={styles.sectionLabel}>Hotspots</Text>
            <View style={styles.hotspotCountBadge}>
              <Text style={styles.hotspotCountText}>{hotspots.length}</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.addHotspotBtn, pressed && styles.btnPressed]} onPress={() => handlePress(() => setHotspotModalVisible(true))}>
            <MaterialIcons name="add" size={16} color={Theme.colors.greenDark} />
            <Text style={styles.addHotspotText}>Add</Text>
          </Pressable>
        </View>
        {hotspots.length === 0 ? (
          <View style={styles.emptyHotspot}>
            <MaterialIcons name="add-location-alt" size={24} color={Theme.colors.muted} />
            <Text style={styles.emptyText}>No hotspots yet. Add one to guide pickers.</Text>
          </View>
        ) : (
          hotspots.map((hs, idx) => (
            <View key={hs.id}>
              <Pressable style={({ pressed }) => [styles.hotspotRow, pressed && styles.rowPressed]} onPress={() => handlePress(() => setFocusMarkerId(hs.id))}>
                <View style={styles.hotspotIcon}>
                  <MaterialIcons name="place" size={16} color="#F57C00" />
                </View>
                <View style={styles.hotspotInfo}>
                  <Text style={styles.hotspotName}>{hs.name}</Text>
                  <Text style={styles.hotspotMeta}>{hs.address} {hs.material ? `• ${hs.material}` : ''}</Text>
                </View>
                <View style={styles.hotspotActions}>
                  <Pressable style={({ pressed }) => [styles.hotspotAction, pressed && styles.btnPressed]} onPress={() => handlePress(() => setFocusMarkerId(hs.id))}>
                    <MaterialIcons name="gps-fixed" size={14} color={Theme.colors.greenDark} />
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.hotspotAction, pressed && styles.btnPressed]} onPress={() => handlePress(() => assignHotspotToJob(hs))}>
                    <MaterialIcons name="add-circle-outline" size={14} color={Theme.colors.greenDark} />
                  </Pressable>
                </View>
              </Pressable>
              {idx < hotspots.length - 1 && <Divider inset={44} />}
            </View>
          ))
        )}
      </View>

      {activeJob ? (
        <View style={styles.activeCard}>
          <SectionHeader title="Current job" meta="Navigation and proof of pickup" action={<View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Accepted</Text></View>} />
          <Text style={styles.activeText}>Address: {activeJob.address}</Text>
          <Text style={styles.activeText}>Estimated weight: {activeJob.weight} kg</Text>
          <View style={styles.activeActions}>
            <Pressable style={styles.primaryButton} onPress={() => Alert.alert('Navigate', `Routing to ${activeJob.address}`)}>
              <Text style={styles.primaryButtonText}>Navigate</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={completeJob}>
              <Text style={styles.primaryButtonText}>Complete pickup</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Contact hub</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.queueCard}>
          <SectionHeader title="Pending pickups" meta={`${jobs.length} available`} />
          {jobs.length === 0 ? (
            <EmptyState
              icon="assignment"
              title="No pickups nearby"
              message={hotspots.length ? 'Map a hotspot to queue a pickup and share with dispatch.' : 'Add a hotspot to start scouting pickups.'}
              actionLabel="Add hotspot"
              onAction={() => setHotspotModalVisible(true)}
            />
          ) : (
            jobs.map((job, index) => (
              <View key={job.id}>
                <Pressable style={({ pressed }) => [styles.jobCard, pressed && styles.rowPressed]} onPress={() => handlePress(() => setFocusMarkerId(job.id))}>
                  <View style={styles.jobIcon}>
                    <MaterialIcons name="inventory-2" size={18} color={Theme.colors.greenDark} />
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
                    <View style={styles.jobMetaRow}>
                      <View style={styles.jobMetaItem}>
                        <MaterialIcons name="scale" size={12} color={Theme.colors.muted} />
                        <Text style={styles.jobDetail}>{job.weight} kg</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <MaterialIcons name="navigation" size={12} color={Theme.colors.muted} />
                        <Text style={styles.jobDetail}>{job.distance}</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <MaterialIcons name="schedule" size={12} color={Theme.colors.muted} />
                        <Text style={styles.jobDetail}>{job.eta}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.jobRight}>
                    <Text style={styles.jobPayout}>R {job.payout}</Text>
                    <Pressable
                      style={({ pressed }) => [styles.acceptButton, !online && styles.acceptButtonDisabled, pressed && online && styles.primaryBtnPressed]}
                      onPress={() => handlePress(() => acceptJob(job.id))}
                      disabled={!online}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                  </View>
                </Pressable>
                {index < jobs.length - 1 && <Divider inset={52} />}
              </View>
            ))
          )}
          </View>
        )}
      <Modal visible={hotspotModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New hotspot</Text>
              <Pressable onPress={() => setHotspotModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
            <Text style={styles.modalHint}>Add a hotspot so pickers can see what to collect there.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Hotspot name"
              placeholderTextColor={Theme.colors.muted}
              value={hotspotName}
              onChangeText={setHotspotName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Address or description"
              placeholderTextColor={Theme.colors.muted}
              value={hotspotAddress}
              onChangeText={setHotspotAddress}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="What to pick (e.g. PET plastic, cardboard)"
              placeholderTextColor={Theme.colors.muted}
              value={hotspotMaterial}
              onChangeText={setHotspotMaterial}
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Lat (optional)"
                placeholderTextColor={Theme.colors.muted}
                value={hotspotLat}
                onChangeText={setHotspotLat}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.modalInputHalf]}
                placeholder="Lng (optional)"
                placeholderTextColor={Theme.colors.muted}
                value={hotspotLng}
                onChangeText={setHotspotLng}
                keyboardType="numeric"
              />
            </View>
            <Pressable style={styles.modalUpload} onPress={() => Alert.alert('Upload', 'Image upload not wired yet.')}>
              <MaterialIcons name="image" size={16} color={Theme.colors.ink} />
              <Text style={styles.modalUploadText}>Attach image (optional)</Text>
            </Pressable>
            <Pressable style={styles.modalSubmit} onPress={addHotspot}>
              <Text style={styles.modalSubmitText}>Save hotspot</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.paper },
  content: { padding: 16, paddingBottom: 100, gap: 14 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontFamily: Theme.fonts.display, color: Theme.colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E8F5E9', borderRadius: Theme.radius.s, borderWidth: 1, borderColor: '#C8E6C9' },
  statusChipOffline: { backgroundColor: Theme.colors.wash, borderColor: 'rgba(0,0,0,0.06)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.green },
  statusText: { fontSize: 12, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  statusTextOffline: { color: Theme.colors.muted, fontFamily: Theme.fonts.body },
  btnPressed: { opacity: 0.7 },
  
  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: Theme.radius.m, backgroundColor: Theme.colors.card, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.subtle },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statValue: { fontSize: 16, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  statLabel: { fontSize: 10, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  
  // Map
  mapCard: { height: 260, borderRadius: Theme.radius.l, overflow: 'hidden', backgroundColor: Theme.colors.card, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  mapOverlayTop: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: Theme.radius.m, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  mapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapTitle: { fontSize: 13, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  mapMeta: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  mapActions: { flexDirection: 'row', gap: 6 },
  mapBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.colors.wash, alignItems: 'center', justifyContent: 'center' },
  mapOverlayBottom: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: Theme.radius.m, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', padding: 12, ...Theme.shadow.subtle },
  mapFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  mapFooterInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapFooterIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  mapFooterIconHotspot: { backgroundColor: '#FFF3E0' },
  mapFooterText: { flex: 1 },
  mapFooterLabel: { fontSize: 10, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  mapFooterTitle: { fontSize: 14, fontFamily: Theme.fonts.display, color: Theme.colors.ink, marginTop: 2 },
  mapFooterMeta: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted, marginTop: 2 },
  mapFooterAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Theme.colors.green, borderRadius: Theme.radius.s, ...Theme.shadow.glow },
  mapFooterActionDisabled: { backgroundColor: Theme.colors.muted, opacity: 0.5 },
  mapFooterActionText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 12 },
  primaryBtnPressed: { opacity: 0.85 },
  
  // Hotspots
  hotspotCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  hotspotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotspotHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 15, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  hotspotCountBadge: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#FFF3E0', borderRadius: 10 },
  hotspotCountText: { fontSize: 11, fontFamily: Theme.fonts.display, color: '#F57C00' },
  addHotspotBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#E8F5E9', borderRadius: Theme.radius.s, borderWidth: 1, borderColor: '#C8E6C9' },
  addHotspotText: { fontSize: 12, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  emptyHotspot: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  hotspotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  hotspotIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  hotspotInfo: { flex: 1 },
  hotspotName: { fontFamily: Theme.fonts.display, fontSize: 13, color: Theme.colors.ink },
  hotspotMeta: { fontFamily: Theme.fonts.body, fontSize: 11, color: Theme.colors.muted, marginTop: 2 },
  hotspotActions: { flexDirection: 'row', gap: 6 },
  hotspotAction: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  rowPressed: { opacity: 0.7, backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.s },
  emptyText: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted, textAlign: 'center' },
  
  // Active Job
  activeCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#E8F5E9', borderRadius: Theme.radius.s, borderWidth: 1, borderColor: '#C8E6C9' },
  activeBadgeText: { fontSize: 11, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  activeText: { fontSize: 13, fontFamily: Theme.fonts.body, color: Theme.colors.ink },
  activeActions: { marginTop: 6, gap: 8 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Theme.colors.green, borderRadius: Theme.radius.m, paddingVertical: 12, ...Theme.shadow.glow },
  primaryButtonText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 13 },
  secondaryButton: { backgroundColor: Theme.colors.wash, borderRadius: Theme.radius.m, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  secondaryButtonText: { color: Theme.colors.ink, fontFamily: Theme.fonts.body, fontSize: 13 },
  
  // Queue Card
  queueCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontSize: 15, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  queueMeta: { fontSize: 12, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  
  // Job Cards
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  jobIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  jobInfo: { flex: 1 },
  jobAddress: { fontSize: 13, fontFamily: Theme.fonts.display, color: Theme.colors.ink },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobDetail: { fontSize: 11, fontFamily: Theme.fonts.body, color: Theme.colors.muted },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobPayout: { fontSize: 14, fontFamily: Theme.fonts.display, color: Theme.colors.greenDark },
  acceptButton: { backgroundColor: Theme.colors.greenDark, borderRadius: Theme.radius.s, paddingVertical: 8, paddingHorizontal: 14 },
  acceptButtonDisabled: { opacity: 0.4 },
  acceptText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 12 },
  
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.l, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Theme.shadow.soft },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: Theme.fonts.display, fontSize: 16, color: Theme.colors.ink },
  modalClose: { fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.muted },
  modalHint: { fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.muted },
  modalInput: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.s, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Theme.fonts.body, fontSize: 13, color: Theme.colors.ink, backgroundColor: Theme.colors.paper },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalInputHalf: { flex: 1 },
  modalUpload: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  modalUploadText: { fontFamily: Theme.fonts.body, fontSize: 12, color: Theme.colors.ink },
  modalSubmit: { marginTop: 4, backgroundColor: Theme.colors.greenDark, borderRadius: Theme.radius.m, paddingVertical: 12, alignItems: 'center', ...Theme.shadow.glow },
  modalSubmitText: { color: '#FFFFFF', fontFamily: Theme.fonts.display, fontSize: 13 },
});
