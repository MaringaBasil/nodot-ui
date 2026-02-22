import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F, Theme } from '@/constants/Colors';

const BRAND = Theme.colors.brand;
const NAVY = Theme.colors.navy;

// ─── Notification groups ─────────────────────────────────────────────────────
const GROUPS = [
  {
    id: 'activity',
    heading: 'Activity',
    items: [
      { id: 'scan_confirm',  icon: 'qr-code-outline',       label: 'Scan confirmations',       desc: 'When a scan is verified and points are awarded',   default: true  },
      { id: 'reward_unlock', icon: 'trophy-outline',        label: 'Reward unlocks',            desc: 'When you earn a new badge or reach a milestone',   default: true  },
      { id: 'referral',      icon: 'people-outline',        label: 'Referral updates',          desc: 'When a friend you referred makes their first scan', default: true  },
    ],
  },
  {
    id: 'hubs',
    heading: 'Hubs & Events',
    items: [
      { id: 'hub_update',    icon: 'storefront-outline',    label: 'Hub updates',               desc: 'New hubs nearby, hours changes, or closures',      default: false },
      { id: 'bonus_events',  icon: 'flash-outline',         label: 'Bonus & promo events',      desc: '2× and 3× point events on your area',              default: true  },
      { id: 'pickup_status', icon: 'car-outline',           label: 'Pickup status',             desc: 'Driver assigned, en route, and completed alerts',  default: true  },
    ],
  },
  {
    id: 'reports',
    heading: 'Reports',
    items: [
      { id: 'weekly_impact', icon: 'leaf-outline',          label: 'Weekly impact summary',     desc: 'A snapshot of your recycling impact each Sunday',  default: false },
      { id: 'monthly_stmt',  icon: 'document-text-outline', label: 'Monthly statement',         desc: 'Points earned, rand value, and CO₂ avoided',       default: false },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Initialise toggle state from defaults
  const initialState = Object.fromEntries(
    GROUPS.flatMap((g) => g.items.map((item) => [item.id, item.default]))
  );
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialState);

  const toggle = (id: string) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeCount = Object.values(enabled).filter(Boolean).length;
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top },
        {
          opacity: enterAnim,
          transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>{activeCount} of {Object.keys(enabled).length} enabled</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {GROUPS.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupHeading}>{group.heading}</Text>
            <View style={styles.card}>
              {group.items.map((item, idx) => (
                <View key={item.id}>
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: enabled[item.id] ? `${BRAND}18` : '#F0F0F0' }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={enabled[item.id] ? BRAND : '#B0B0B0'}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.rowDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={enabled[item.id]}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: '#E0E0E0', true: `${BRAND}60` }}
                      thumbColor={enabled[item.id] ? BRAND : '#FFFFFF'}
                      ios_backgroundColor="#E0E0E0"
                    />
                  </View>
                  {idx < group.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Master mute */}
        <View style={styles.muteCard}>
          <Ionicons name="notifications-off-outline" size={20} color="#9A9A9A" />
          <Text style={styles.muteText}>Mute all notifications</Text>
          <Switch
            value={Object.values(enabled).every((v) => !v)}
            onValueChange={(val) => {
              const next = Object.fromEntries(Object.keys(enabled).map((k) => [k, !val]));
              setEnabled(next);
            }}
            trackColor={{ false: '#E0E0E0', true: '#FFCDD2' }}
            thumbColor={Object.values(enabled).every((v) => !v) ? '#B3261E' : '#FFFFFF'}
            ios_backgroundColor="#E0E0E0"
          />
        </View>

        <Text style={styles.footnote}>
          Push notifications are delivered via your device settings. You can also manage them in iOS or Android notification preferences.
        </Text>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  /* Content */
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 20,
  },

  /* Groups */
  group: {
    gap: 8,
  },
  groupHeading: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#7A7A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: NAVY,
  },
  rowDesc: {
    fontFamily: F.body,
    fontSize: 12,
    color: '#7A7A7A',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 64,
  },

  /* Mute all */
  muteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  muteText: {
    flex: 1,
    fontFamily: F.semibold,
    fontSize: 14,
    color: '#5A5A5A',
  },

  /* Footnote */
  footnote: {
    fontFamily: F.body,
    fontSize: 12,
    color: '#9A9A9A',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
