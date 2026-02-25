import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import NavMap from '@/components/maps/NavMap';

const UND = Platform.OS !== 'web';

// ─── Route data ───────────────────────────────────────────────────────────────
// Pre-assigned stops batched by the system from citizen requests.
// In production these are passed in via route params or a shared store.

type RouteStop = {
  id: string;
  address: string;
  weight: number;
  material: string;
  payout: number;
  eta: string;
  distance: string;
  phone: string;
  from: { lat: number; lng: number };
  to:   { lat: number; lng: number };
};

const TODAY_ROUTE: RouteStop[] = [
  {
    id: 's1', address: '321 Oak Drive, Melville',
    weight: 8.7, material: 'Glass bottles', payout: 35,
    eta: '4 min', distance: '4.2 km', phone: '+27 11 555 0123',
    from: { lat: -26.2048, lng: 28.0479 },
    to:   { lat: -26.177,  lng: 28.011  },
  },
  {
    id: 's2', address: '45 7th Avenue, Parktown',
    weight: 6.2, material: 'PET Plastic', payout: 31,
    eta: '5 min', distance: '2.1 km', phone: '+27 83 444 7722',
    from: { lat: -26.177,  lng: 28.011  },
    to:   { lat: -26.1905, lng: 28.0385 },
  },
  {
    id: 's3', address: '78 Long St, Braamfontein',
    weight: 9.4, material: 'Cardboard', payout: 28,
    eta: '6 min', distance: '1.3 km', phone: '+27 71 333 9988',
    from: { lat: -26.1905, lng: 28.0385 },
    to:   { lat: -26.196,  lng: 28.043  },
  },
];

const ROUTE_TOTAL = TODAY_ROUTE.reduce(
  (acc, s) => ({ payout: acc.payout + s.payout, kg: acc.kg + s.weight }),
  { payout: 0, kg: 0 },
);

// ─── Constants ────────────────────────────────────────────────────────────────

type NavState = 'navigating' | 'arrived' | 'stop_done' | 'route_done';

const NAVY  = '#1B2C3A';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.58)';
const DIV   = 'rgba(255,255,255,0.09)';
const BRAND = '#4EC831';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PickerNavigate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();

  const [stopIdx, setStopIdx]           = useState(0);
  const [state, setState]               = useState<NavState>('navigating');
  const [earnedTotal, setEarnedTotal]   = useState(0);
  const [kgTotal, setKgTotal]           = useState(0);

  const stop       = TODAY_ROUTE[stopIdx];
  const isLastStop = stopIdx === TODAY_ROUTE.length - 1;
  const nextStop   = isLastStop ? null : TODAY_ROUTE[stopIdx + 1];

  const panelAnim    = useRef(new Animated.Value(340)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleArrived = useCallback(() => {
    haptic();
    setState('arrived');
    Animated.spring(panelAnim, {
      toValue: 0, friction: 10, tension: 55, useNativeDriver: UND,
    }).start();
  }, [haptic, panelAnim]);

  // Confirm collection: accumulate earnings, transition to stop_done or route_done
  const handleConfirm = useCallback(() => {
    haptic();
    const newEarned = earnedTotal + stop.payout;
    const newKg     = parseFloat((kgTotal + stop.weight).toFixed(1));
    setEarnedTotal(newEarned);
    setKgTotal(newKg);
    setState(isLastStop ? 'route_done' : 'stop_done');
    Animated.spring(successScale, {
      toValue: 1, friction: 7, tension: 50, useNativeDriver: true,
    }).start();
  }, [haptic, earnedTotal, kgTotal, stop, isLastStop, successScale]);

  // Advance to the next stop in the route
  const handleContinue = useCallback(() => {
    haptic();
    successScale.setValue(0);
    panelAnim.setValue(340);
    setState('navigating');
    setStopIdx(i => i + 1);
  }, [haptic, successScale, panelAnim]);

  const handleViewEarnings = useCallback(() => {
    haptic();
    router.navigate('/Picker/earnings' as any);
  }, [haptic, router]);

  const handleGoHome = useCallback(() => {
    haptic();
    router.back();
  }, [haptic, router]);

  const handleCall = useCallback(() => {
    Linking.openURL(`tel:${stop.phone}`);
  }, [stop.phone]);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>

        {/* ── Full-screen map — updates automatically as stopIdx changes ── */}
        <View style={StyleSheet.absoluteFill}>
          <NavMap
            from={stop.from}
            to={stop.to}
            toLabel={stop.address}
            address={stop.address}
            duration={stop.eta}
            distance={stop.distance}
          />
        </View>

        {/* ── Back button (hidden when route is done) ── */}
        {state !== 'route_done' && (
          <Pressable
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => { haptic(); router.back(); }}
          >
            <Ionicons name="chevron-back" size={22} color={WHITE} />
          </Pressable>
        )}

        {/* ── Progress chip (top-right) — visible during all states except route_done ── */}
        {state !== 'route_done' && (
          <View style={[styles.progressChip, { top: insets.top + 12 }]}>
            <Text style={styles.progressStop}>
              Stop {stopIdx + 1}/{TODAY_ROUTE.length}
            </Text>
            {earnedTotal > 0 && (
              <>
                <View style={styles.progressSep} />
                <Text style={styles.progressEarned}>R {earnedTotal}</Text>
              </>
            )}
          </View>
        )}

        {/* ── STATE: navigating — map fills screen, slim pill at bottom ── */}
        {state === 'navigating' && (
          <Pressable
            style={[styles.pill, { bottom: insets.bottom + 20 }]}
            onPress={handleArrived}
          >
            <View style={styles.pillLeft}>
              <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
              <Text style={styles.pillText}>I've Arrived</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>R {stop.payout}</Text>
            </View>
          </Pressable>
        )}

        {/* ── STATES: arrived / stop_done / route_done — panel slides up ── */}
        {state !== 'navigating' && (
          <Animated.View
            style={[
              styles.panel,
              { paddingBottom: insets.bottom + 24, transform: [{ translateY: panelAnim }] },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: DIV }]} />

            {/* ────────── Arrived ────────── */}
            {state === 'arrived' && (
              <>
                <View style={styles.arrivedBanner}>
                  <View style={[styles.arrivedCheck, { backgroundColor: C.brand }]}>
                    <Ionicons name="checkmark" size={16} color={NAVY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.arrivedTitle}>You've arrived!</Text>
                    <Text style={styles.arrivedSub}>Confirm recyclables collected below.</Text>
                  </View>
                  <View style={styles.stopBadge}>
                    <Text style={styles.stopBadgeText}>
                      {stopIdx + 1} / {TODAY_ROUTE.length}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: DIV }]} />

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="cube-outline" size={18} color={C.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailAddress}>{stop.address}</Text>
                    <Text style={styles.detailMeta}>
                      Expected: {stop.weight} kg · {stop.material}
                    </Text>
                  </View>
                  <View style={styles.payoutBadge}>
                    <Text style={[styles.payoutText, { color: C.brand }]}>R {stop.payout}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: DIV }]} />

                <Pressable
                  style={({ pressed }) => [styles.callRow, pressed && styles.pressed]}
                  onPress={handleCall}
                >
                  <Ionicons name="call-outline" size={16} color={C.brand} />
                  <Text style={[styles.callText, { color: C.brand }]}>
                    Call Citizen · {stop.phone}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn, { backgroundColor: C.brand },
                    pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handleConfirm}
                >
                  <Ionicons name="cube" size={20} color={NAVY} />
                  <Text style={[styles.primaryBtnText, { color: NAVY }]}>Confirm Collection</Text>
                </Pressable>
              </>
            )}

            {/* ────────── Stop done ────────── */}
            {state === 'stop_done' && (
              <>
                {/* Compact stop complete header */}
                <View style={styles.stopDoneHeader}>
                  <Animated.View style={{ transform: [{ scale: successScale }] }}>
                    <View style={[styles.stopDoneCheck, { backgroundColor: C.brand }]}>
                      <Ionicons name="checkmark" size={18} color={NAVY} />
                    </View>
                  </Animated.View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopDoneTitle}>
                      Stop {stopIdx} of {TODAY_ROUTE.length} complete
                    </Text>
                    <Text style={styles.stopDoneSub}>
                      {TODAY_ROUTE.length - stopIdx} {TODAY_ROUTE.length - stopIdx === 1 ? 'stop' : 'stops'} remaining
                    </Text>
                  </View>
                </View>

                {/* This stop's earnings */}
                <View style={styles.stopEarningsRow}>
                  <View style={[styles.earningCard, {
                    backgroundColor: 'rgba(78,200,49,0.12)', borderColor: 'rgba(78,200,49,0.28)',
                  }]}>
                    <Ionicons name="wallet-outline" size={16} color={C.brand} />
                    <Text style={[styles.earningValue, { color: C.brand }]}>R {stop.payout}</Text>
                    <Text style={styles.earningLabel}>This stop</Text>
                  </View>
                  <View style={[styles.earningCard, { backgroundColor: DIV, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <Ionicons name="scale-outline" size={16} color={WHITE} />
                    <Text style={[styles.earningValue, { color: WHITE }]}>{stop.weight} kg</Text>
                    <Text style={styles.earningLabel}>Collected</Text>
                  </View>
                  <View style={[styles.earningCard, { backgroundColor: DIV, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <Ionicons name="trending-up-outline" size={16} color={WHITE} />
                    <Text style={[styles.earningValue, { color: WHITE }]}>R {earnedTotal}</Text>
                    <Text style={styles.earningLabel}>Today total</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: DIV }]} />

                {/* Next stop preview */}
                {nextStop && (
                  <>
                    <View style={styles.nextStopLabel}>
                      <View style={styles.nextStopDot} />
                      <Text style={styles.nextStopLabelText}>Next stop</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="navigate-outline" size={16} color={C.brand} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailAddress} numberOfLines={1}>{nextStop.address}</Text>
                        <Text style={styles.detailMeta}>
                          {nextStop.material} · {nextStop.weight} kg · {nextStop.distance}
                        </Text>
                      </View>
                      <View style={styles.payoutBadge}>
                        <Text style={[styles.payoutText, { color: C.brand }]}>R {nextStop.payout}</Text>
                      </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: DIV }]} />
                  </>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn, { backgroundColor: C.brand },
                    pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handleContinue}
                >
                  <Ionicons name="navigate-outline" size={20} color={NAVY} />
                  <Text style={[styles.primaryBtnText, { color: NAVY }]}>
                    Continue to Stop {stopIdx + 1}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                  onPress={handleGoHome}
                >
                  <Ionicons name="home-outline" size={18} color={MUTED} />
                  <Text style={styles.ghostBtnText}>Back to Home</Text>
                </Pressable>
              </>
            )}

            {/* ────────── Route done ────────── */}
            {state === 'route_done' && (
              <>
                {/* Celebration icon */}
                <Animated.View style={[styles.successWrap, { transform: [{ scale: successScale }] }]}>
                  <View style={[styles.successCircle, { backgroundColor: C.brand }]}>
                    <Ionicons name="trophy" size={34} color={NAVY} />
                  </View>
                </Animated.View>

                <View style={styles.completedTextBlock}>
                  <Text style={styles.completedTitle}>Route Complete!</Text>
                  <Text style={styles.completedSub}>
                    All {TODAY_ROUTE.length} pickups done. Great work today!
                  </Text>
                </View>

                {/* Full route summary */}
                <View style={styles.stopEarningsRow}>
                  <View style={[styles.earningCard, {
                    backgroundColor: 'rgba(78,200,49,0.12)', borderColor: 'rgba(78,200,49,0.28)',
                  }]}>
                    <Ionicons name="wallet-outline" size={16} color={C.brand} />
                    <Text style={[styles.earningValue, { color: C.brand }]}>R {earnedTotal}</Text>
                    <Text style={styles.earningLabel}>Earned</Text>
                  </View>
                  <View style={[styles.earningCard, { backgroundColor: DIV, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <Ionicons name="scale-outline" size={16} color={WHITE} />
                    <Text style={[styles.earningValue, { color: WHITE }]}>{kgTotal} kg</Text>
                    <Text style={styles.earningLabel}>Collected</Text>
                  </View>
                  <View style={[styles.earningCard, { backgroundColor: DIV, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={WHITE} />
                    <Text style={[styles.earningValue, { color: WHITE }]}>{TODAY_ROUTE.length}</Text>
                    <Text style={styles.earningLabel}>Stops</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: DIV }]} />

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn, { backgroundColor: C.brand },
                    pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handleViewEarnings}
                >
                  <Ionicons name="wallet-outline" size={20} color={NAVY} />
                  <Text style={[styles.primaryBtnText, { color: NAVY }]}>View Earnings</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                  onPress={handleGoHome}
                >
                  <Ionicons name="home-outline" size={18} color={MUTED} />
                  <Text style={styles.ghostBtnText}>Back to Home</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        )}

      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Back button */
  backBtn: {
    position: 'absolute', left: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(27,44,58,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 8,
  },

  /* Progress chip (top-right) */
  progressChip: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 36, paddingHorizontal: 14, borderRadius: 18,
    backgroundColor: 'rgba(27,44,58,0.9)',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  progressStop:    { fontFamily: F.semibold, fontSize: 13, color: WHITE },
  progressSep:     { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressEarned:  { fontFamily: F.bold, fontSize: 13, color: BRAND },

  /* Navigating: slim pill */
  pill: {
    position: 'absolute', left: 20, right: 20,
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    borderRadius: 28, backgroundColor: NAVY,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  pillLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pillText:      { fontFamily: F.bold, fontSize: 15, color: WHITE },
  pillBadge:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(78,200,49,0.18)' },
  pillBadgeText: { fontFamily: F.bold, fontSize: 14, color: BRAND },

  /* Panel */
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: NAVY,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 }, elevation: 16,
  },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  divider: { height: 1 },

  /* Arrived state */
  arrivedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(78,200,49,0.12)', borderWidth: 1, borderColor: 'rgba(78,200,49,0.28)',
  },
  arrivedCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  arrivedTitle: { fontFamily: F.bold, fontSize: 15, color: BRAND },
  arrivedSub:   { fontFamily: F.body, fontSize: 12, color: MUTED, marginTop: 2 },
  stopBadge:    { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(78,200,49,0.2)' },
  stopBadgeText: { fontFamily: F.bold, fontSize: 12, color: BRAND },

  detailRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(78,200,49,0.12)', alignItems: 'center', justifyContent: 'center' },
  detailAddress: { fontFamily: F.semibold, fontSize: 14, color: WHITE },
  detailMeta:   { fontFamily: F.body, fontSize: 12, color: MUTED, marginTop: 2 },
  payoutBadge:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(78,200,49,0.15)', flexShrink: 0 },
  payoutText:   { fontFamily: F.bold, fontSize: 14 },

  callRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  callText: { fontFamily: F.semibold, fontSize: 13 },

  /* Stop done state */
  stopDoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stopDoneCheck:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stopDoneTitle:  { fontFamily: F.bold, fontSize: 16, color: WHITE },
  stopDoneSub:    { fontFamily: F.body, fontSize: 12, color: MUTED, marginTop: 2 },

  stopEarningsRow: { flexDirection: 'row', gap: 10 },
  earningCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  earningValue: { fontFamily: F.bold, fontSize: 16 },
  earningLabel: { fontFamily: F.body, fontSize: 10, color: MUTED, letterSpacing: 0.3, textAlign: 'center' },

  nextStopLabel:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  nextStopDot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND },
  nextStopLabelText: { fontFamily: F.bold, fontSize: 11, color: BRAND, letterSpacing: 0.5, textTransform: 'uppercase' },

  /* Route done state */
  successWrap:  { alignItems: 'center', paddingTop: 8 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOpacity: 0.45, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  completedTextBlock: { alignItems: 'center', gap: 6 },
  completedTitle:     { fontFamily: F.display, fontSize: 24, color: WHITE, letterSpacing: -0.5 },
  completedSub:       { fontFamily: F.body, fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },

  /* Shared buttons */
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 28,
    shadowColor: BRAND, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  primaryBtnText: { fontFamily: F.bold, fontSize: 15 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ghostBtnText: { fontFamily: F.semibold, fontSize: 14, color: MUTED },

  pressed: { opacity: 0.7 },
});
