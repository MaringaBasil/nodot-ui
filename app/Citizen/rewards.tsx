import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F, Theme } from '@/constants/Colors';

const BRAND = '#4EC831';
const NAVY  = '#1B2C3A';
const MUTED = '#7A7A7A';

const CURRENT_POINTS = 1240;
const NEXT_TIER      = 2000;
const TIER_LABEL     = 'Silver';
const NEXT_TIER_LABEL = 'Gold';

const BADGES = [
  { id: '1', name: 'First Scan',   icon: 'ribbon-outline', color: BRAND,     earned: true,  requirement: 'Make your first scan' },
  { id: '2', name: 'Eco Warrior',  icon: 'leaf',           color: '#2E7D32', earned: true,  requirement: 'Recycle 5 kg total' },
  { id: '3', name: '7-Day Streak', icon: 'flame',          color: '#E28F3C', earned: true,  requirement: 'Scan 7 days in a row' },
  { id: '4', name: 'Hub Explorer', icon: 'map',            color: '#2C6E91', earned: false, requirement: 'Visit 3 different hubs' },
  { id: '5', name: 'Plastic Pro',  icon: 'water',          color: '#3F8B7B', earned: false, requirement: 'Scan 20 plastic items' },
  { id: '6', name: 'Gold Tier',    icon: 'trophy',         color: '#C6A35C', earned: false, requirement: 'Reach 2,000 points' },
];

const REWARDS = [
  { id: '1', title: '10% off at GreenMart',      subtitle: 'Valid until 28 Feb 2026',       cost: 500,  icon: 'pricetag-outline', available: true  },
  { id: '2', title: 'R 25 Cash Out',             subtitle: 'Deposited to your wallet',      cost: 250,  icon: 'cash-outline',     available: true  },
  { id: '3', title: 'Tree Planted in Your Name', subtitle: 'Certificate emailed to you',    cost: 150,  icon: 'leaf-outline',     available: true  },
  { id: '4', title: 'Hub Priority Token',        subtitle: 'Skip the queue at any hub',     cost: 100,  icon: 'flash-outline',    available: true  },
  { id: '5', title: 'NoDot Branded Tote Bag',    subtitle: 'Eco-friendly recycled material',cost: 2000, icon: 'bag-outline',      available: false },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const tierProgress = CURRENT_POINTS / NEXT_TIER;
  const earnedCount  = BADGES.filter((b) => b.earned).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <Text style={styles.headerSub}>{earnedCount} of {BADGES.length} badges earned</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ── Points card ── */}
        <View style={styles.pointsCard}>
          {/* Decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <View style={styles.pointsTop}>
            <View>
              <Text style={styles.pointsLabel}>Your Points Balance</Text>
              <Text style={styles.pointsValue}>{CURRENT_POINTS.toLocaleString()}</Text>
            </View>
            <View style={styles.tierBadge}>
              <Ionicons name="trophy" size={14} color={NAVY} />
              <Text style={styles.tierText}>{TIER_LABEL}</Text>
            </View>
          </View>

          {/* Tier progress bar */}
          <View style={styles.tierTrack}>
            <View style={[styles.tierFill, { width: `${Math.min(tierProgress * 100, 100)}%` as any }]} />
          </View>
          <View style={styles.tierLabels}>
            <Text style={styles.tierHint}>{TIER_LABEL}</Text>
            <Text style={styles.tierHint}>
              {(NEXT_TIER - CURRENT_POINTS).toLocaleString()} pts to {NEXT_TIER_LABEL}
            </Text>
          </View>
        </View>

        {/* ── Badges ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Badges</Text>
            <Text style={styles.sectionMeta}>{earnedCount}/{BADGES.length} earned</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeRow}
          >
            {BADGES.map((badge) => (
              <Pressable
                key={badge.id}
                style={({ pressed }) => [styles.badgeItem, pressed && { opacity: 0.75 }]}
                onPress={() => {
                  if (badge.earned) {
                    Alert.alert(badge.name, 'Badge earned! Keep up the great work. 🎉');
                  } else {
                    Alert.alert(`🔒 ${badge.name}`, `How to unlock:\n${badge.requirement}`);
                  }
                }}
              >
                <View
                  style={[
                    styles.badgeCircle,
                    { backgroundColor: badge.earned ? `${badge.color}28` : '#F0F0F0' },
                  ]}
                >
                  <Ionicons
                    name={badge.icon as any}
                    size={24}
                    color={badge.earned ? badge.color : '#C0C0C0'}
                  />
                  {!badge.earned && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={10} color="#B0B0B0" />
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Rewards catalogue ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Redeem Rewards</Text>
          </View>
          {REWARDS.map((reward) => {
            const canAfford = CURRENT_POINTS >= reward.cost;
            return (
              <Pressable
                key={reward.id}
                style={({ pressed }) => [
                  styles.rewardItem,
                  !canAfford && styles.rewardItemLocked,
                  pressed && canAfford && { opacity: 0.8 },
                ]}
                disabled={!canAfford}
                onPress={() =>
                  Alert.alert('Redeem reward', `Redeem "${reward.title}" for ${reward.cost} pts?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Redeem', style: 'default' },
                  ])
                }
              >
                <View style={[styles.rewardIcon, !canAfford && styles.rewardIconLocked]}>
                  <Ionicons
                    name={reward.icon as any}
                    size={20}
                    color={canAfford ? BRAND : '#C0C0C0'}
                  />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardTitle, !canAfford && styles.rewardTitleLocked]}>
                    {reward.title}
                  </Text>
                  <Text style={styles.rewardSub}>{reward.subtitle}</Text>
                </View>
                <View style={[styles.rewardCost, canAfford && styles.rewardCostActive]}>
                  <Text style={[styles.rewardCostValue, canAfford && styles.rewardCostValueActive]}>
                    {reward.cost}
                  </Text>
                  <Text style={[styles.rewardCostLabel, canAfford && styles.rewardCostLabelActive]}>
                    pts
                  </Text>
                </View>
                {canAfford && (
                  <Ionicons name="chevron-forward" size={16} color={MUTED} style={styles.rewardChevron} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 24,
    color: NAVY,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: F.body,
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },

  content: {
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  /* Points card */
  pointsCard: {
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(78,200,49,0.08)',
    top: -60,
    right: -50,
  },
  blob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: 20,
  },
  pointsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pointsLabel: {
    fontFamily: F.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 4,
  },
  pointsValue: {
    fontFamily: F.black,
    fontSize: 42,
    color: BRAND,
    letterSpacing: -1,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: BRAND,
    borderRadius: 20,
  },
  tierText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: NAVY,
  },
  tierTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tierFill: {
    height: 8,
    backgroundColor: BRAND,
    borderRadius: 4,
  },
  tierLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierHint: {
    fontFamily: F.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },

  /* Sections */
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: NAVY,
  },
  sectionMeta: {
    fontFamily: F.body,
    fontSize: 13,
    color: MUTED,
  },

  /* Badges */
  badgeRow: {
    gap: 12,
    paddingBottom: 4,
    paddingLeft: 2,
  },
  badgeItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  badgeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgeName: {
    fontFamily: F.semibold,
    fontSize: 11,
    color: NAVY,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#B0B0B0',
  },

  /* Rewards */
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  rewardItemLocked: {
    opacity: 0.55,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconLocked: {
    backgroundColor: '#F0F0F0',
  },
  rewardInfo: {
    flex: 1,
    gap: 3,
  },
  rewardTitle: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: NAVY,
  },
  rewardTitleLocked: {
    color: '#9A9A9A',
  },
  rewardSub: {
    fontFamily: F.body,
    fontSize: 12,
    color: MUTED,
  },
  rewardCost: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  rewardCostActive: {
    backgroundColor: NAVY,
  },
  rewardCostValue: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#9A9A9A',
  },
  rewardCostValueActive: {
    color: BRAND,
  },
  rewardCostLabel: {
    fontFamily: F.body,
    fontSize: 10,
    color: '#B0B0B0',
  },
  rewardCostLabelActive: {
    color: 'rgba(255,255,255,0.6)',
  },
  rewardChevron: {
    marginLeft: -4,
  },
});
