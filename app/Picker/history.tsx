import React, { useMemo, useRef, useEffect } from 'react';
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

const UND = Platform.OS !== 'web';

type CompletedPickup = {
  id: string; address: string; weight: number;
  material: string; payout: number; date: string; group: string;
};

const COMPLETED: CompletedPickup[] = [
  { id: 'c1', address: '321 Oak Drive, Melville',         weight: 8.7,  material: 'Glass bottles',     payout: 35, date: '09:45', group: 'Today' },
  { id: 'c2', address: '123 Main St, Rosebank',           weight: 5.2,  material: 'PET Plastic',        payout: 26, date: '08:20', group: 'Today' },
  { id: 'c3', address: '15 Vilakazi St, Soweto',          weight: 6.3,  material: 'PET Plastic',        payout: 32, date: '17:10', group: 'Yesterday' },
  { id: 'c4', address: '78 Long St, Braamfontein',        weight: 9.1,  material: 'Mixed recyclables',  payout: 46, date: '14:35', group: 'Yesterday' },
  { id: 'c5', address: '456 Market Rd, Sandton',          weight: 12.0, material: 'Mixed recyclables',  payout: 60, date: '11:00', group: 'Mon, 20 Feb' },
  { id: 'c6', address: '789 Township Ave, Alexandra',     weight: 3.5,  material: 'Cardboard',          payout: 14, date: '09:30', group: 'Mon, 20 Feb' },
];

const GROUPS = Array.from(new Set(COMPLETED.map(c => c.group)));

const STATS = {
  totalEarned: COMPLETED.reduce((s, c) => s + c.payout, 0),
  totalKg:     Math.round(COMPLETED.reduce((s, c) => s + c.weight, 0) * 10) / 10,
  totalJobs:   COMPLETED.length,
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

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    groupLabel: { fontFamily: F.semibold, fontSize: 13, color: C.muted, paddingLeft: 4, paddingBottom: 4 },

    /* Stats row */
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 5,
      paddingVertical: 14, paddingHorizontal: 6, borderRadius: 16,
      backgroundColor: C.wash, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.10)' : cardBorder,
    },
    statCardPrimary: {
      backgroundColor: C.brandLight,
      borderColor: isDark ? 'rgba(78,200,49,0.28)' : 'rgba(78,200,49,0.25)',
    },
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
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },

    /* Pickup row */
    pickupRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    pickupIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    pickupInfo: { flex: 1, gap: 2 },
    pickupAddress: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    pickupMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    pickupRight: { alignItems: 'flex-end', gap: 3 },
    pickupPayout: { fontFamily: F.bold, fontSize: 14, color: C.brand },
    pickupTime: { fontFamily: F.body, fontSize: 11, color: C.muted },

    emptyBox: { padding: 40, alignItems: 'center', gap: 10 },
    emptyText: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center' },

    pressed: { opacity: 0.7 },
  });
}

export default function PickerHistory() {
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.root}>

          {/* ── Header ── */}
          <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerBlobTL} />
            <View style={styles.headerBlobBR} />
            <View style={styles.headerInner}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>Your collection record</Text>
                <Text style={styles.headerTitle}>History</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          >
            {/* ── Stats ── */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <View style={[styles.statIconWrap, styles.statIconWrapPrimary]}>
                  <Ionicons name="wallet-outline" size={16} color={C.brand} />
                </View>
                <Text style={styles.statValue}>R {STATS.totalEarned}</Text>
                <Text style={styles.statLabel}>Total earned</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="scale-outline" size={16} color={C.brand} />
                </View>
                <Text style={styles.statValue}>{STATS.totalKg} kg</Text>
                <Text style={styles.statLabel}>Total collected</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={C.brand} />
                </View>
                <Text style={styles.statValue}>{STATS.totalJobs}</Text>
                <Text style={styles.statLabel}>Total jobs</Text>
              </View>
            </View>

            {/* ── Grouped pickup list ── */}
            {GROUPS.length === 0 ? (
              <View style={[styles.card, styles.emptyBox]}>
                <Ionicons name="archive-outline" size={32} color={C.muted} />
                <Text style={styles.emptyText}>No completed pickups yet.{'\n'}Your history will appear here.</Text>
              </View>
            ) : GROUPS.map(group => (
              <View key={group} style={styles.section}>
                <Text style={styles.groupLabel}>{group}</Text>
                <View style={styles.card}>
                  {COMPLETED.filter(c => c.group === group).map((pickup, idx, arr) => (
                    <View key={pickup.id}>
                      <Pressable style={({ pressed }) => [styles.pickupRow, pressed && styles.pressed]}>
                        <View style={styles.pickupIcon}>
                          <Ionicons name="cube-outline" size={18} color={C.brand} />
                        </View>
                        <View style={styles.pickupInfo}>
                          <Text style={styles.pickupAddress} numberOfLines={1}>{pickup.address}</Text>
                          <Text style={styles.pickupMeta}>{pickup.weight} kg · {pickup.material}</Text>
                        </View>
                        <View style={styles.pickupRight}>
                          <Text style={styles.pickupPayout}>+R {pickup.payout}</Text>
                          <Text style={styles.pickupTime}>{pickup.date}</Text>
                        </View>
                      </Pressable>
                      {idx < arr.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
