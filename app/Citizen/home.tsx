import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PressableScale } from '@/components/ui/PressableScale';
import * as Haptics from 'expo-haptics';

// ─── Static data (color-neutral) ──────────────────────────────────────────
const PROMO_SLIDES = [
  { id: '1', title: 'Earn 2× Points',  sub: 'On all plastic this weekend',     bg: '#1B2C3A', accent: '#4EC831' },
  { id: '2', title: 'New Hub Open',    sub: 'Sandton City — Mon to Sat',        bg: '#1E5A25', accent: '#4EC831' },
  { id: '3', title: 'Refer & Earn',   sub: 'Get 100 pts per friend referred',  bg: '#101D28', accent: '#4EC831' },
];

const RECENT_SCANS = [
  { id: '1', material: 'PET Plastic',   weight: '0.8 kg', points: 40, date: 'Today, 14:23', icon: 'water',            color: '#2C6E91' },
  { id: '2', material: 'Cardboard',     weight: '1.2 kg', points: 24, date: 'Yesterday',    icon: 'document-outline', color: '#C6A35C' },
  { id: '3', material: 'Glass Bottle',  weight: '2.0 kg', points: 60, date: 'Mon',          icon: 'wine-outline',     color: '#3F8B7B' },
];

const BADGES = [
  { id: '1', name: 'Hustler',       icon: 'leaf-outline',   color: '#4EC831', locked: false },
  { id: '2', name: 'Go-Getter',     icon: 'sync-outline',   color: '#2E7D32', locked: false },
  { id: '3', name: 'Top Recycler',  icon: 'trophy-outline', color: '#C6A35C', locked: false },
  { id: '4', name: 'No-Doti Chief', icon: 'shield-outline', color: '#E28F3C', locked: true  },
  { id: '5', name: 'Eco Boss',      icon: 'earth-outline',  color: '#2C6E91', locked: true  },
];

const HUBS = [
  { name: 'Parkhurst Hub', distance: '1.2 km', hours: '08:00 – 18:00', tag: 'Community', open: true  },
  { name: 'Rosebank Hub',  distance: '1.8 km', hours: '07:00 – 19:00', tag: 'Mall',      open: true  },
  { name: 'Melville Hub',  distance: '2.0 km', hours: '09:00 – 17:00', tag: 'Campus',    open: false },
];

const ECO_TIPS = [
  { title: 'Rinse bottles first',  detail: 'Clean items earn a higher material grade', icon: 'water-outline',  color: '#2C6E91' },
  { title: 'Crush containers',     detail: 'Fit more recyclables in each drop-off',    icon: 'layers-outline', color: '#3F8B7B' },
  { title: 'Sort before scanning', detail: 'Sorting saves time and boosts payout',     icon: 'list-outline',   color: '#E28F3C' },
];

const shouldUseNativeDriver = Platform.OS !== 'web';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Styles factory ────────────────────────────────────────────────────────
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
    headerLeft: { gap: 1 },
    greeting: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    userName:  { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      // Glass circle — fill + specular 1px rim
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },
    notifDot: {
      position: 'absolute', top: 7, right: 7, width: 8, height: 8,
      borderRadius: 4, backgroundColor: C.brand, borderWidth: 1.5, borderColor: C.navy,
    },
    avatarBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: F.bold, fontSize: 15, color: C.navy },

    /* Scroll content */
    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },

    /* Promo Banner */
    bannerContainer: { height: 130, borderRadius: 18, overflow: 'hidden' },
    bannerScrollView: { borderRadius: 18 },
    bannerDotsOverlay: {
      position: 'absolute', bottom: 12, right: 14, flexDirection: 'row', gap: 5,
    },
    bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    bannerDotActive: { width: 14, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.92)' },
    bannerCard: { borderRadius: 18, padding: 20, height: 130, overflow: 'hidden', justifyContent: 'flex-end' },
    bannerContent: { gap: 4, zIndex: 1 },
    bannerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4 },
    bannerSub: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
    bannerCTA: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    bannerCTAText: { fontFamily: F.bold, fontSize: 12, color: C.navy, letterSpacing: 0.2 },
    bannerBlob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -40 },
    bannerBlobSm: { position: 'absolute', width: 100, height: 100, borderRadius: 50, bottom: -30, right: 60 },

    /* Search Row */
    searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    searchPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      // Glass pill: semi-transparent fill + specular rim
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.82)',
      borderRadius: 28, paddingHorizontal: 16, paddingVertical: 13,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.80)',
    },
    searchPlaceholder: { fontFamily: F.body, fontSize: 14, color: C.muted },

    /* Stats Row */
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 5, paddingVertical: 14, paddingHorizontal: 6,
      borderRadius: 16, overflow: 'hidden',
      backgroundColor: C.wash,
      // Glass rim — more pronounced on dark for the specular effect
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : cardBorder,
    },
    statCardPrimary: {
      backgroundColor: C.brandLight,
      borderColor: isDark ? 'rgba(78,200,49,0.28)' : 'rgba(78,200,49,0.25)',
    },
    statIconWrap: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center',
    },
    statIconWrapPrimary: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' },
    statValue: { fontFamily: F.bold, fontSize: 14, color: C.ink, textAlign: 'center' },
    statLabel: { fontFamily: F.body, fontSize: 10, color: C.muted, textAlign: 'center' },

    /* Sections */
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    sectionLink: { fontFamily: F.semibold, fontSize: 13, color: C.brand },
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* Recent Scans */
    scanRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    scanIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    scanInfo: { flex: 1, gap: 2 },
    scanMaterial: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    scanMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    scanPts: { fontFamily: F.bold, fontSize: 14, color: C.brand, flexShrink: 0 },

    /* Badges */
    badgeScroll: { gap: 12, paddingVertical: 4, paddingRight: 16 },
    badgeItem: { alignItems: 'center', gap: 6, width: 76 },
    badgeCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
    badgeLockDot: {
      position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: C.border,
    },
    badgeName: { fontFamily: F.semibold, fontSize: 10, color: C.ink, textAlign: 'center' },
    badgeNameLocked: { color: C.muted },

    /* Nearby Hubs */
    hubRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    hubIcon: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: isDark ? C.neutral100 : '#F0F0F0',
      alignItems: 'center', justifyContent: 'center',
    },
    hubIconOpen: { backgroundColor: C.brandLight },
    hubInfo: { flex: 1, gap: 2 },
    hubName: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    hubMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    hubRight: { alignItems: 'flex-end', gap: 4 },
    hubDist: { fontFamily: F.bold, fontSize: 13, color: C.ink },
    hubStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    hubOpen: { backgroundColor: C.brandLight },
    hubClosed: { backgroundColor: isDark ? C.neutral100 : '#F5F5F5' },
    hubStatusText: { fontFamily: F.semibold, fontSize: 10 },
    hubOpenText: { color: '#2E7D32' },
    hubClosedText: { color: C.muted },

    /* Eco Tips */
    tipCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: cardBorder,
    },
    tipIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    tipText: { flex: 1, gap: 3 },
    tipTitle: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    tipDetail: { fontFamily: F.body, fontSize: 12, color: C.muted, lineHeight: 17 },

    /* Dots */
    dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? C.border : '#D0D0D0' },
    dotActive: { width: 18, backgroundColor: C.brand },

    /* Scan FAB */
    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
      overflow: 'hidden',
      zIndex: 100,
      // Glass aura — brand glow shadow
      shadowColor: C.brand, shadowOpacity: 0.45, shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 }, elevation: 12,
      borderWidth: 1, borderColor: 'rgba(78,200,49,0.50)',
    },
    fabBlur: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(27,44,58,0.72)' : 'rgba(27,44,58,0.85)',
    },

    /* Quick Actions */
    quickRow: { flexDirection: 'row', gap: 10 },
    quickItemOuter: {
      flex: 1, borderRadius: 16, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
    },
    quickItem: {
      alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14,
    },
    quickLabel: { fontFamily: F.semibold, fontSize: 11, textAlign: 'center' },
  });
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function CitizenHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors: C, gradients: G, isDark } = useTheme();
  const BANNER_W = width - 32;

  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  // Quick actions built inside render so dark-mode bg colors are correct
  const QUICK_ACTIONS = useMemo(() => [
    { label: 'Scan',    icon: 'qr-code-outline', route: '/Citizen/scan',    bg: C.navy,                              color: C.brand   },
    { label: 'History', icon: 'time-outline',    route: '/Citizen/history', bg: isDark ? '#0F2236' : '#EBF4FD',     color: '#2C6E91' },
    { label: 'Rewards', icon: 'trophy-outline',  route: '/Citizen/rewards', bg: isDark ? '#2D1F08' : '#FFF6EC',     color: '#E28F3C' },
    { label: 'Profile', icon: 'person-outline',  route: '/Citizen/profile', bg: isDark ? '#1E1238' : '#F0ECFA',     color: '#7B52AB' },
  ], [C.navy, C.brand, isDark]);

  const [refreshing, setRefreshing] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const promoRef = useRef<ScrollView>(null);
  const tipRef = useRef<ScrollView>(null);

  const sectionAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const animateIn = useCallback(() => {
    Animated.stagger(
      100,
      sectionAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 380, useNativeDriver: shouldUseNativeDriver })
      )
    ).start();
  }, [sectionAnims]);

  useEffect(() => { animateIn(); }, [animateIn]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (promoIndex + 1) % PROMO_SLIDES.length;
      promoRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
      setPromoIndex(next);
    }, 3800);
    return () => clearInterval(timer);
  }, [promoIndex, BANNER_W]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (tipIndex + 1) % ECO_TIPS.length;
      tipRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
      setTipIndex(next);
    }, 4500);
    return () => clearInterval(timer);
  }, [tipIndex, BANNER_W]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); animateIn(); }, 1000);
  }, [animateIn]);

  const animatedSection = (index: number) => ({
    opacity: sectionAnims[index],
    transform: [{ translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <View style={styles.root}>
      {/* ── Sticky header ── */}
      <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerBlobTL} />
        <View style={styles.headerBlobBR} />
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>John 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/Citizen/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={styles.notifDot} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/Citizen/profile')}
            >
              <Text style={styles.avatarText}>J</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
      >
        {/* ── Promo Banner ── */}
        <Animated.View style={[styles.bannerContainer, animatedSection(0)]}>
          <ScrollView
            ref={promoRef}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
            style={styles.bannerScrollView}
            onMomentumScrollEnd={(e) => setPromoIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_W))}
          >
            {PROMO_SLIDES.map((slide) => {
              const dest = slide.id === '2' ? '/Citizen/hubs' : '/Citizen/rewards';
              return (
                <Pressable
                  key={slide.id}
                  style={[styles.bannerCard, { width: BANNER_W, backgroundColor: slide.bg }]}
                  onPress={() => router.push(dest as any)}
                >
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{slide.title}</Text>
                    <Text style={styles.bannerSub}>{slide.sub}</Text>
                    <View style={[styles.bannerCTA, { backgroundColor: slide.accent }]}>
                      <Text style={styles.bannerCTAText}>Learn more</Text>
                    </View>
                  </View>
                  <View style={[styles.bannerBlob, { backgroundColor: `${slide.accent}18` }]} />
                  <View style={[styles.bannerBlobSm, { backgroundColor: `${slide.accent}10` }]} />
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.bannerDotsOverlay}>
            {PROMO_SLIDES.map((_, i) => (
              <View key={i} style={[styles.bannerDot, i === promoIndex && styles.bannerDotActive]} />
            ))}
          </View>
        </Animated.View>

        {/* ── Search Row ── */}
        <Animated.View style={[styles.searchRow, animatedSection(1)]}>
          <Pressable style={styles.searchPill} onPress={() => router.push('/Citizen/hubs')}>
            <Ionicons name="map-outline" size={18} color={C.muted} />
            <Text style={styles.searchPlaceholder}>Find a hub near you</Text>
          </Pressable>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View style={[styles.statsRow, animatedSection(2)]}>
          <Pressable
            style={({ pressed }) => [styles.statCard, styles.statCardPrimary, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/Citizen/rewards')}
          >
            <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
              <Ionicons name="trophy" size={16} color={C.brand} />
            </View>
            <Text style={styles.statValue}>1,240</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/Citizen/history')}
          >
            <View style={styles.statIconWrap}>
              <Ionicons name="cash-outline" size={16} color={C.brand} />
            </View>
            <Text style={styles.statValue}>R 150.50</Text>
            <Text style={styles.statLabel}>Value Earned</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/Citizen/history')}
          >
            <View style={styles.statIconWrap}>
              <Ionicons name="sync-outline" size={16} color={C.brand} />
            </View>
            <Text style={styles.statValue}>21.6 kg</Text>
            <Text style={styles.statLabel}>Recycled</Text>
          </Pressable>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View style={[styles.quickRow, animatedSection(3)]}>
          {QUICK_ACTIONS.map((action) => (
            <PressableScale
              key={action.label}
              style={styles.quickItemOuter}
              onPress={() => router.push(action.route as any)}
              scaleTo={0.93}
              haptic={Haptics.ImpactFeedbackStyle.Light}
            >
              <View style={[styles.quickItem, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
                <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
              </View>
            </PressableScale>
          ))}
        </Animated.View>

        {/* ── Recent Scans ── */}
        <Animated.View style={[styles.section, animatedSection(4)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
          </View>
          <View style={styles.card}>
            {RECENT_SCANS.map((scan, idx) => (
              <View key={scan.id}>
                <Pressable
                  style={({ pressed }) => [styles.scanRow, pressed && { opacity: 0.75 }]}
                  onPress={() => router.push('/Citizen/history')}
                >
                  <View style={[styles.scanIcon, { backgroundColor: `${scan.color}18` }]}>
                    <Ionicons name={scan.icon as any} size={18} color={scan.color} />
                  </View>
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanMaterial}>{scan.material}</Text>
                    <Text style={styles.scanMeta}>{scan.weight} · {scan.date}</Text>
                  </View>
                  <Text style={styles.scanPts}>+{scan.points} pts</Text>
                </Pressable>
                {idx < RECENT_SCANS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Badges ── */}
        <Animated.View style={[styles.section, animatedSection(5)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Badges</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {BADGES.map((badge) => (
              <Pressable
                key={badge.id}
                style={styles.badgeItem}
                onPress={() => !badge.locked && router.push('/Citizen/rewards')}
              >
                <View style={[styles.badgeCircle, { backgroundColor: badge.locked ? (isDark ? C.neutral100 : '#F0F0F0') : `${badge.color}20` }]}>
                  <Ionicons name={badge.icon as any} size={22} color={badge.locked ? C.muted : badge.color} />
                  {badge.locked && (
                    <View style={styles.badgeLockDot}>
                      <Ionicons name="lock-closed" size={11} color={C.muted} />
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeName, badge.locked && styles.badgeNameLocked]}>{badge.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Nearby Hubs ── */}
        <Animated.View style={[styles.section, animatedSection(6)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hubs</Text>
            <Pressable onPress={() => router.push('/Citizen/hubs')}>
              <Text style={styles.sectionLink}>View map →</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {HUBS.map((hub, idx) => (
              <View key={hub.name}>
                <View style={styles.hubRow}>
                  <View style={[styles.hubIcon, hub.open && styles.hubIconOpen]}>
                    <Ionicons name="storefront-outline" size={16} color={hub.open ? C.brand : C.muted} />
                  </View>
                  <View style={styles.hubInfo}>
                    <Text style={styles.hubName}>{hub.name}</Text>
                    <Text style={styles.hubMeta}>{hub.tag} · {hub.hours}</Text>
                  </View>
                  <View style={styles.hubRight}>
                    <Text style={styles.hubDist}>{hub.distance}</Text>
                    <View style={[styles.hubStatus, hub.open ? styles.hubOpen : styles.hubClosed]}>
                      <Text style={[styles.hubStatusText, hub.open ? styles.hubOpenText : styles.hubClosedText]}>
                        {hub.open ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < HUBS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Eco Tips ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eco Tips</Text>
            <Pressable onPress={() => router.push('/Citizen/tips' as any)}>
              <Text style={styles.sectionLink}>See all →</Text>
            </Pressable>
          </View>
          <ScrollView
            ref={tipRef}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => setTipIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_W))}
          >
            {ECO_TIPS.map((tip) => (
              <Pressable
                key={tip.title}
                style={({ pressed }) => [styles.tipCard, { width: BANNER_W }, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/Citizen/tips' as any)}
              >
                <View style={[styles.tipIconWrap, { backgroundColor: `${tip.color}18` }]}>
                  <Ionicons name={tip.icon as any} size={22} color={tip.color} />
                </View>
                <View style={styles.tipText}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDetail}>{tip.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.dotRow}>
            {ECO_TIPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === tipIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Scan FAB — glass circle with brand glow ── */}
      <Pressable
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 90 }, pressed && { opacity: 0.85, transform: [{ scale: 0.93 }] }]}
        onPress={() => router.push('/Citizen/scan')}
        accessibilityLabel="Scan item"
        accessibilityRole="button"
      >
        <BlurView intensity={70} tint="dark" style={styles.fabBlur}>
          <Ionicons name="qr-code-outline" size={26} color={C.brand} />
        </BlurView>
      </Pressable>
    </View>
  );
}
