import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { MapView, MapMarker } from '@/components/maps/MapView';
import { Theme } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const hubFilters = ['All', 'Closest', 'Favorites'];

const hubLocations: { name: string; distance: string; hours: string; tag: string; favorite: boolean; lat: number; lng: number }[] = [
  { name: 'Parkhurst', distance: '1.2 km', hours: '08:00 - 18:00', tag: 'Community', favorite: true, lat: -26.135, lng: 28.016 },
  { name: 'Rosebank', distance: '1.8 km', hours: '07:00 - 19:00', tag: 'Mall', favorite: false, lat: -26.146, lng: 28.041 },
  { name: 'Melville', distance: '2.0 km', hours: '09:00 - 17:00', tag: 'Campus', favorite: true, lat: -26.177, lng: 28.011 },
];

const tips = [
  { title: 'Rinse bottles', detail: 'Clean items boost your grade', icon: 'opacity', color: '#2196F3' },
  { title: 'Sort materials', detail: 'Separate plastic, glass, and paper', icon: 'layers', color: '#4CAF50' },
  { title: 'Use drop-off hubs', detail: 'Faster payout on same day', icon: 'store', color: '#FF9800' },
  { title: 'Crush containers', detail: 'More items in less space', icon: 'compress', color: '#9C27B0' },
  { title: 'Check expiry dates', detail: 'Avoid contaminated materials', icon: 'event', color: '#F44336' },
];

// Weekly challenges data
const weeklyChallenges = [
  { id: '1', title: 'Plastic Champion', target: '10 kg plastic', progress: 7.2, total: 10, reward: 'R 25 bonus', icon: 'local-drink', color: '#2196F3' },
  { id: '2', title: 'Hub Explorer', target: 'Visit 3 hubs', progress: 2, total: 3, reward: '50 XP', icon: 'store', color: '#4CAF50' },
  { id: '3', title: 'Streak Master', target: '7 day streak', progress: 8, total: 7, reward: 'Gold badge', icon: 'local-fire-department', color: '#FF6B35', completed: true },
];

// Leaderboard data
const leaderboard = [
  { rank: 1, name: 'Thabo M.', kg: 45.2, avatar: 'T' },
  { rank: 2, name: 'Sarah K.', kg: 38.9, avatar: 'S' },
  { rank: 3, name: 'You', kg: 21.6, avatar: 'J', isYou: true },
  { rank: 4, name: 'Mpho N.', kg: 19.4, avatar: 'M' },
];

const shouldUseNativeDriver = Platform.OS !== 'web';

// Eco tip carousel component
const EcoTipCarousel: React.FC<{ tips: typeof tips; onTipPress: (tip: typeof tips[0]) => void }> = ({ tips, onTipPress }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % tips.length;
      scrollRef.current?.scrollTo({ x: nextIndex * (SCREEN_WIDTH - 64), animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, tips.length]);

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 64));
          setCurrentIndex(index);
        }}
      >
        {tips.map((tip, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [styles.tipSlide, pressed && styles.tipSlidePressed]}
            onPress={() => onTipPress(tip)}
          >
            <LinearGradient
              colors={[`${tip.color}15`, 'transparent']}
              style={styles.tipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.tipIconCircle, { backgroundColor: `${tip.color}20` }]}>
              <MaterialIcons name={tip.icon as any} size={20} color={tip.color} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDetail}>{tip.detail}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={16} color={Theme.colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.carouselDots}>
        {tips.map((_, index) => {
          const inputRange = [(index - 1) * (SCREEN_WIDTH - 64), index * (SCREEN_WIDTH - 64), (index + 1) * (SCREEN_WIDTH - 64)];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [6, 16, 6],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={index} style={[styles.carouselDot, { width: dotWidth, opacity }]} />
          );
        })}
      </View>
    </View>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const userName = 'John';

export default function CitizenHome() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const sections = useMemo(() => Array.from({ length: 5 }, () => new Animated.Value(0)), []);
  const router = useRouter();
  const [mapExpanded, setMapExpanded] = useState(false);
  const userLocation = { lat: -26.1405, lng: 28.0305 };
  const scanPulse = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  const mapMarkers: MapMarker[] = useMemo(() => {
    const hubs = hubLocations.map((hub) => ({ 
      id: hub.name, 
      label: `${hub.name} Hub`, 
      lat: hub.lat, 
      lng: hub.lng, 
      type: 'hub' as const,
      address: `${hub.tag} • ${hub.hours}`,
      distance: hub.distance,
      duration: `${parseInt(hub.distance) * 3} min walk`,
      rating: 4.5 + Math.random() * 0.4,
      isOpen: true,
    }));
    return [{ id: 'you', label: 'You', lat: userLocation.lat, lng: userLocation.lng, type: 'you' as const }, ...hubs];
  }, [userLocation.lat, userLocation.lng]);

  const monthlyGoal = 30;
  const monthlyRecycled = 21.6;
  const monthlyProgress = Math.min(monthlyRecycled / monthlyGoal, 1);

  const animateIn = () => {
    Animated.stagger(
      120,
      sections.map((section) => Animated.timing(section, { toValue: 1, duration: 420, useNativeDriver: shouldUseNativeDriver }))
    ).start();
  };

  useEffect(() => {
    animateIn();
  }, [sections]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1, duration: 1400, useNativeDriver: shouldUseNativeDriver }),
        Animated.delay(300),
        Animated.timing(scanPulse, { toValue: 0, duration: 0, useNativeDriver: shouldUseNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanPulse]);

  useEffect(() => {
    const liveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1, duration: 650, useNativeDriver: shouldUseNativeDriver }),
        Animated.timing(livePulse, { toValue: 0, duration: 650, useNativeDriver: shouldUseNativeDriver }),
      ])
    );
    liveLoop.start();
    return () => liveLoop.stop();
  }, [livePulse]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
      animateIn();
    }, 1200);
  }, [sections]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handlePress = useCallback((action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const visibleHubs = hubLocations.filter((hub) => {
    if (activeFilter === 'Favorites') return hub.favorite;
    if (activeFilter === 'Closest') return hub.distance.startsWith('1.');
    return true;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F1F8F1', Theme.colors.paper]} style={styles.gradient} />
        <ScrollView contentContainerStyle={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      </View>
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
        <LinearGradient colors={['#F1F8F1', Theme.colors.paper]} style={styles.gradient} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.greenDark} />}
        >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()}, {userName}</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconPressed]}
              onPress={() => handlePress(() => showToast('Search hubs and items', 'info'))}
              accessibilityLabel="Search"
              accessibilityRole="button"
            >
              <MaterialIcons name="search" size={18} color={Theme.colors.ink} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconPressed]}
              onPress={() => handlePress(() => showToast('2 new notifications', 'info'))}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <MaterialIcons name="notifications-none" size={18} color={Theme.colors.ink} />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>2</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.avatarCircle, pressed && styles.iconPressed]}
              onPress={() => handlePress(() => router.push('/Citizen/profile'))}
              accessibilityLabel="Profile"
              accessibilityRole="button"
            >
              <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.card, { opacity: sections[0], transform: [{ translateY: sections[0].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Quick actions</Text>
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, { opacity: livePulse }]} />
                <Text style={styles.liveText}>Ready</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Scan items to earn rewards instantly</Text>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() => handlePress(() => router.push('/Citizen/scan'))}
              accessibilityLabel="Scan item"
              accessibilityRole="button"
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.actionPulse,
                  {
                    opacity: scanPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
                    transform: [{ scale: scanPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
                  },
                ]}
              />
              <MaterialIcons name="qr-code-scanner" size={22} color="#FFFFFF" />
              <Text style={styles.actionText}>Scan</Text>
            </Pressable>
            <View style={styles.actionGrid}>
              <Pressable
                style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
                onPress={() => handlePress(() => router.push('/Citizen/pickup'))}
                accessibilityLabel="Schedule pickup"
                accessibilityRole="button"
              >
                <View style={styles.actionTileIcon}>
                  <MaterialIcons name="local-shipping" size={16} color={Theme.colors.greenDark} />
                </View>
                <View style={styles.actionTileText}>
                  <Text style={styles.actionTileTitle}>Pickup</Text>
                  <Text style={styles.actionTileMeta}>Schedule</Text>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
                onPress={() => handlePress(() => router.push('/Citizen/profile'))}
                accessibilityLabel="View wallet"
                accessibilityRole="button"
              >
                <View style={styles.actionTileIcon}>
                  <MaterialIcons name="account-balance-wallet" size={16} color={Theme.colors.greenDark} />
                </View>
                <View style={styles.actionTileText}>
                  <Text style={styles.actionTileTitle}>Wallet</Text>
                  <Text style={styles.actionTileMeta}>R 150.50</Text>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionTile, styles.actionTileHighlight, pressed && styles.actionTilePressed]}
                onPress={() => handlePress(() => showToast('8 day streak! Keep going!', 'success'))}
                accessibilityLabel="View streak"
                accessibilityRole="button"
              >
                <View style={[styles.actionTileIcon, styles.actionTileIconHighlight]}>
                  <MaterialIcons name="local-fire-department" size={16} color="#F57C00" />
                </View>
                <View style={styles.actionTileText}>
                  <Text style={[styles.actionTileTitle, styles.actionTileTitleHighlight]}>Streak</Text>
                  <Text style={[styles.actionTileMeta, styles.actionTileMetaHighlight]}>8 days 🔥</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: sections[1], transform: [{ translateY: sections[1].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Monthly impact</Text>
              <Text style={styles.cardMeta}>{monthlyRecycled.toFixed(1)} kg recycled</Text>
            </View>
            <View style={styles.badgeNeutral}>
              <Text style={styles.badgeNeutralText}>Goal {monthlyGoal} kg</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${monthlyProgress * 100}%` }]} />
          </View>
          <View style={styles.impactRow}>
            <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.impactCardPressed]} onPress={() => handlePress(() => showToast('12 trees saved this month!', 'success'))}>
              <View style={styles.impactIconWrap}>
                <MaterialIcons name="park" size={14} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.impactValue}>12</Text>
              <Text style={styles.impactLabel}>Trees saved</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.impactCardPressed]} onPress={() => handlePress(() => showToast('24 kg CO2 emissions avoided!', 'success'))}>
              <View style={styles.impactIconWrap}>
                <MaterialIcons name="eco" size={14} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.impactValue}>24 kg</Text>
              <Text style={styles.impactLabel}>CO2 avoided</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.impactCardPressed]} onPress={() => handlePress(() => showToast('6.2 kg recycled this week!', 'success'))}>
              <View style={styles.impactIconWrap}>
                <MaterialIcons name="recycling" size={14} color={Theme.colors.greenDark} />
              </View>
              <Text style={styles.impactValue}>6.2 kg</Text>
              <Text style={styles.impactLabel}>This week</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: sections[2], transform: [{ translateY: sections[2].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.mapFooter}>
            <View>
              <Text style={styles.cardTitle}>Nearby hubs</Text>
              <Text style={styles.cardMeta}>3 active hubs within 2 km</Text>
            </View>
            <Pressable style={styles.mapButton} onPress={() => handlePress(() => setMapExpanded(true))}>
              <Text style={styles.mapButtonText}>Open map</Text>
            </Pressable>
          </View>
          <View style={styles.mapWrap}>
            <MapView markers={mapMarkers} showControls={true} compact={true} showTraffic={true} />
          </View>
          <View style={styles.filterRow}>
            {hubFilters.map((filter) => (
              <Pressable key={filter} style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]} onPress={() => handlePress(() => setActiveFilter(filter))}>
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubRow}>
            {visibleHubs.map((hub) => (
              <Pressable key={hub.name} style={({ pressed }) => [styles.hubCard, pressed && styles.hubCardPressed]} onPress={() => handlePress(() => showToast(`${hub.name} Hub selected - ${hub.hours}`, 'info'))}>
                <View style={styles.hubCardHeader}>
                  <View style={styles.hubIcon}>
                    <MaterialIcons name="store" size={14} color={Theme.colors.greenDark} />
                  </View>
                  {hub.favorite && (
                    <View style={styles.favoriteBadge}>
                      <MaterialIcons name="star" size={10} color="#F9A825" />
                    </View>
                  )}
                </View>
                <Text style={styles.hubName}>{hub.name}</Text>
                <View style={styles.hubTagRow}>
                  <View style={styles.hubTag}>
                    <Text style={styles.hubTagText}>{hub.tag}</Text>
                  </View>
                </View>
                <View style={styles.hubMetaRow}>
                  <MaterialIcons name="directions-walk" size={10} color={Theme.colors.muted} />
                  <Text style={styles.hubMeta}>{hub.distance}</Text>
                </View>
                <View style={styles.hubMetaRow}>
                  <MaterialIcons name="schedule" size={10} color={Theme.colors.muted} />
                  <Text style={styles.hubMeta}>{hub.hours}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: sections[3], transform: [{ translateY: sections[3].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.nextPickupHeader}>
            <View>
              <Text style={styles.cardTitle}>Next pickup</Text>
              <Text style={styles.cardMeta}>Tuesday, 10:30 AM</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Confirmed</Text>
            </View>
          </View>
          <View style={styles.pickupRow}>
            <View style={styles.pickupDetail}>
              <View style={styles.pickupIconWrap}>
                <MaterialIcons name="local-shipping" size={14} color={Theme.colors.greenDark} />
              </View>
              <View style={styles.pickupDetailText}>
                <Text style={styles.pickupLabel}>Driver</Text>
                <Text style={styles.pickupText}>Lindiwe M.</Text>
              </View>
            </View>
            <View style={styles.pickupDetail}>
              <View style={styles.pickupIconWrap}>
                <MaterialIcons name="schedule" size={14} color={Theme.colors.greenDark} />
              </View>
              <View style={styles.pickupDetailText}>
                <Text style={styles.pickupLabel}>Window</Text>
                <Text style={styles.pickupText}>45 min arrival</Text>
              </View>
            </View>
            <View style={styles.pickupDetail}>
              <View style={styles.pickupIconWrap}>
                <MaterialIcons name="pin" size={14} color={Theme.colors.greenDark} />
              </View>
              <View style={styles.pickupDetailText}>
                <Text style={styles.pickupLabel}>Code</Text>
                <Text style={styles.pickupText}>4021</Text>
              </View>
            </View>
            <View style={styles.pickupActions}>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.btnPressed]} onPress={() => handlePress(() => showToast('Contacting driver...', 'info'))}>
                <MaterialIcons name="phone" size={14} color={Theme.colors.ink} />
                <Text style={styles.secondaryButtonText}>Contact</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryBtnPressed]} onPress={() => handlePress(() => router.push('/Citizen/pickup'))}>
                <MaterialIcons name="edit-calendar" size={14} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Reschedule</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: sections[4], transform: [{ translateY: sections[4].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Smart coaching</Text>
              <Text style={styles.cardMeta}>Tips to maximize payouts</Text>
            </View>
            <MaterialIcons name="auto-awesome" size={16} color={Theme.colors.greenDark} />
          </View>
          <EcoTipCarousel tips={tips} onTipPress={(tip) => showToast(tip.detail, 'info')} />
        </Animated.View>

        <Modal visible={mapExpanded} animationType="slide" transparent>
          <View style={styles.fullMapModal}>
            <View style={styles.fullMapContainer}>
              <View style={styles.fullMapHeader}>
                <View>
                  <Text style={styles.fullMapTitle}>Nearby hubs</Text>
                  <Text style={styles.fullMapSubtitle}>{hubLocations.length} locations within 2 km</Text>
                </View>
                <Pressable onPress={() => setMapExpanded(false)} style={styles.fullMapClose}>
                  <MaterialIcons name="close" size={20} color={Theme.colors.ink} />
                </Pressable>
              </View>
              <View style={styles.fullMapBody}>
                <MapView 
                  markers={mapMarkers} 
                  showControls={true} 
                  compact={false} 
                  showTraffic={true}
                  showSearch={true}
                  showDirections={true}
                  onSearchPress={() => showToast('Search coming soon!', 'info')}
                  onDirectionsPress={(id) => showToast(`Getting directions to ${id}...`, 'info')}
                />
              </View>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.paper,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  content: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 80,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  title: {
    fontSize: 22,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Theme.shadow.subtle,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.glow,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
  iconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    fontSize: 9,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.m,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  cardHeader: {
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    lineHeight: 15,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.green,
  },
  liveText: {
    fontSize: 10,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    ...Theme.shadow.glow,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  actionPulse: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Theme.colors.green,
  },
  actionText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  actionGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionTileHighlight: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  actionTilePressed: {
    opacity: 0.8,
  },
  actionTileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  actionTileIconHighlight: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  actionTileText: {
    flex: 1,
  },
  actionTileTitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
  actionTileTitleHighlight: {
    color: '#E65100',
  },
  actionTileMeta: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginTop: 1,
  },
  actionTileMetaHighlight: {
    color: '#F57C00',
  },
  actionInfo: {
    flex: 1,
    padding: 10,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    gap: 6,
  },
  actionInlineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 4,
  },
  actionChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Theme.radius.s,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.subtle,
    gap: 2,
  },
  actionStat: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  actionInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 12,
    color: Theme.colors.ink,
  },
  chipSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.muted,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
  },
  streakText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.greenDark,
  },
  badgeNeutral: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.s,
  },
  badgeNeutralText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E8EDE6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Theme.colors.green,
    borderRadius: 3,
  },
  impactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  impactCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Theme.radius.s,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  impactCardPressed: {
    opacity: 0.8,
  },
  impactIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  impactValue: {
    fontSize: 15,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
  impactLabel: {
    fontSize: 9,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    textAlign: 'center',
  },
  mapWrap: {
    marginTop: 8,
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Theme.colors.greenDark,
    borderRadius: Theme.radius.s,
    ...Theme.shadow.subtle,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Theme.colors.greenDark,
    borderColor: Theme.colors.greenDark,
  },
  filterText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
  },
  hubRow: {
    paddingTop: 6,
    gap: 8,
  },
  hubCard: {
    width: 115,
    padding: 10,
    borderRadius: Theme.radius.s,
    backgroundColor: Theme.colors.wash,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 3,
  },
  hubCardPressed: {
    opacity: 0.8,
    backgroundColor: '#E8F5E9',
  },
  hubCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  hubIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  favoriteBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: {
    fontFamily: Theme.fonts.display,
    fontSize: 12,
    color: Theme.colors.ink,
  },
  hubTagRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  hubTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 3,
  },
  hubTagText: {
    fontSize: 8,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  hubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  hubMeta: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.muted,
  },
  nextPickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EAF2E4',
    borderRadius: Theme.radius.s,
    borderWidth: 1,
    borderColor: '#D4E8C8',
  },
  badgeText: {
    fontFamily: Theme.fonts.display,
    fontSize: 10,
    color: Theme.colors.greenDark,
  },
  pickupRow: {
    gap: 8,
  },
  pickupDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDetailText: {
    flex: 1,
  },
  pickupLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.muted,
  },
  pickupText: {
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    fontSize: 12,
  },
  pickupActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Theme.colors.green,
    borderRadius: Theme.radius.s,
    paddingVertical: 10,
    ...Theme.shadow.glow,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.display,
    fontSize: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.s,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  secondaryButtonText: {
    color: Theme.colors.ink,
    fontFamily: Theme.fonts.body,
    fontSize: 12,
  },
  btnPressed: {
    opacity: 0.7,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  tipRowPressed: {
    opacity: 0.7,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.s,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 12,
    color: Theme.colors.ink,
  },
  tipDetail: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.muted,
    marginTop: 1,
    lineHeight: 13,
  },
  tipDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginLeft: 40,
  },
  fullMapModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  fullMapContainer: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  fullMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
  },
  fullMapTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 17,
    color: Theme.colors.ink,
    letterSpacing: -0.3,
  },
  fullMapSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.muted,
    marginTop: 2,
  },
  fullMapClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMapCloseText: {
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    fontSize: 11,
  },
  fullMapBody: {
    flex: 1,
  },
  carouselContainer: {
    marginTop: 8,
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
  },
  tipSlide: {
    width: SCREEN_WIDTH - 64,
    padding: 16,
    borderRadius: Theme.radius.m,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    ...Theme.shadow.soft,
  },
  tipSlidePressed: {
    opacity: 0.9,
  },
  tipGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tipContent: {
    flex: 1,
    marginRight: 16,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BDBDBD',
    marginHorizontal: 4,
  },
  challengeCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.m,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  challengeCardPressed: {
    opacity: 0.9,
  },
  challengeCompleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.subtle,
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
  challengeTarget: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginTop: 2,
  },
  challengeProgressTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  challengeProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  challengeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  challengeReward: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.greenDark,
  },
});
