import React, { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F, Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

const BRAND = Theme.colors.brand;
const NAVY  = Theme.colors.navy;
const useNativeDriver = Platform.OS !== 'web';

const achievements = [
  { id: 'first',    icon: 'trophy',              label: 'First Scan',   unlocked: true,  color: BRAND,     date: 'Jan 15'          },
  { id: 'streak',   icon: 'flame',               label: '7-Day Streak', unlocked: true,  color: Theme.colors.orange,  date: 'Jan 22'          },
  { id: 'eco',      icon: 'leaf',                label: 'Eco Warrior',  unlocked: true,  color: Theme.colors.green,   date: 'Feb 1'           },
  { id: 'hub',      icon: 'storefront-outline',  label: 'Hub Regular',  unlocked: false, color: Theme.colors.border,  progress: '2/5 visits'    },
  { id: 'volume',   icon: 'arrow-up-outline',    label: '50kg Club',    unlocked: false, color: Theme.colors.border,  progress: '15.2/50 kg'    },
  { id: 'referral', icon: 'people-outline',      label: 'Social Star',  unlocked: false, color: Theme.colors.border,  progress: '1/3 referrals' },
];

// ─── Animated stat ────────────────────────────────────────────────────────────
const AnimatedStat: React.FC<{ value: string; label: string; delay: number; icon: string }> = ({
  value, label, delay, icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const valueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver, friction: 6 }),
        Animated.timing(valueAnim, { toValue: 1, duration: 600, useNativeDriver }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[styles.stat, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon as any} size={14} color={Theme.colors.greenDark} />
      </View>
      <Animated.Text style={[styles.statValue, { opacity: valueAnim }]}>{value}</Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Achievement badge ────────────────────────────────────────────────────────
const AchievementBadge: React.FC<{ achievement: typeof achievements[0]; index: number }> = ({
  achievement, index,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300 + index * 100),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver, friction: 5 }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={[styles.achievementBadge, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color : Theme.colors.neutral200 }]}>
        <Ionicons
          name={achievement.icon as any}
          size={18}
          color={achievement.unlocked ? Theme.colors.card : Theme.colors.muted}
        />
      </View>
      <Text style={[styles.achievementLabel, !achievement.unlocked && styles.achievementLabelLocked]}>
        {achievement.label}
      </Text>
      {!achievement.unlocked && (
        <View style={styles.achievementLock}>
          <Ionicons name="lock-closed" size={10} color="#9E9E9E" />
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CitizenProfile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, changeLanguage, languages } = useLanguage();
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim  = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const avatarScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver, friction: 4 }),
    ]).start();
    Animated.stagger(150, cardsAnim.map((anim) =>
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

  const earnedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* Subtle brand tint behind profile card */}
        <Animated.View style={[styles.headerBackground, { opacity: headerAnim }]} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Profile card ── */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: headerAnim,
                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
                  <Text style={styles.avatarText}>JD</Text>
                </Animated.View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.name}>John Doe</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="leaf" size={12} color={Theme.colors.greenDark} />
                  <Text style={styles.roleText}>{t('citizen.profile.title')}</Text>
                </View>
                <View style={styles.memberSince}>
                  <Ionicons name="time-outline" size={12} color={Theme.colors.muted} />
                  <Text style={styles.memberSinceText}>Member since Jan 2024</Text>
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <AnimatedStat value="15.2kg" label={t('citizen.profile.stats.recycled')} delay={200} icon="sync-outline" />
              <AnimatedStat value="R 325"  label={t('citizen.profile.stats.earned')}   delay={350} icon="cash-outline" />
              <AnimatedStat value="8"      label={t('citizen.profile.stats.streak')}   delay={500} icon="flame" />
            </View>
          </Animated.View>

          {/* ── Achievements card ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[0],
                transform: [{ translateY: cardsAnim[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <SectionHeader
              title="Achievements"
              meta={`${earnedCount} of ${achievements.length} unlocked`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsRow}
            >
              {achievements.map((achievement, index) => (
                <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── Impact card ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[1],
                transform: [{ translateY: cardsAnim[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <SectionHeader title={t('citizen.profile.impact')} meta={t('citizen.profile.impactMeta')} />
            <View style={styles.impactRow}>
              <View style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                  <Ionicons name="leaf-outline" size={20} color={Theme.colors.greenDark} />
                </View>
                <Text style={styles.impactValue}>12</Text>
                <Text style={styles.impactLabel}>Trees saved</Text>
              </View>
              <View style={styles.impactCard}>
                <View style={[styles.impactIconWrap, { backgroundColor: 'rgba(44,110,145,0.12)' }]}>
                  <Ionicons name="water-outline" size={20} color={Theme.colors.blue} />
                </View>
                <Text style={styles.impactValue}>840L</Text>
                <Text style={styles.impactLabel}>Water saved</Text>
              </View>
              <View style={styles.impactCard}>
                <View style={[styles.impactIconWrap, { backgroundColor: 'rgba(226,143,60,0.12)' }]}>
                  <Ionicons name="flash-outline" size={20} color={Theme.colors.orange} />
                </View>
                <Text style={styles.impactValue}>24kg</Text>
                <Text style={styles.impactLabel}>CO₂ avoided</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Account card ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[2],
                transform: [{ translateY: cardsAnim[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <SectionHeader title={t('citizen.profile.account')} meta="Manage your preferences" />
            {[
              { label: t('citizen.profile.wallet'),        icon: 'wallet-outline',       badge: 'R 325', badgeColor: Theme.colors.brandLight, onPress: () => showToast(t('citizen.profile.toasts.wallet'), 'info') },
              { label: t('citizen.profile.notifications'), icon: 'notifications-outline', badge: '3',     badgeColor: '#FFEBEE',               onPress: () => showToast(t('citizen.profile.toasts.notifications'), 'info') },
              { label: t('citizen.profile.language'),      icon: 'globe-outline',         value: languages.find((l) => l.code === language)?.label, onPress: () => setLanguageOpen(true) },
              { label: t('citizen.profile.support'),       icon: 'help-circle-outline',   onPress: () => showToast(t('citizen.profile.toasts.support'), 'info') },
            ].map((item, idx) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.listIcon}>
                    <Ionicons name={item.icon as any} size={18} color={Theme.colors.greenDark} />
                  </View>
                  <Text style={styles.listText}>{item.label}</Text>
                  {item.badge && (
                    <View style={[styles.listBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.listBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.value ? <Text style={styles.listMeta}>{item.value}</Text> : null}
                  <Ionicons name="chevron-forward" size={18} color={Theme.colors.muted} />
                </Pressable>
                {idx < 3 && <Divider inset={54} />}
              </View>
            ))}
          </Animated.View>

          {/* ── Logout ── */}
          <Animated.View
            style={{
              opacity: cardsAnim[3],
              transform: [{ translateY: cardsAnim[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }}
          >
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={() => handlePress(() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast(t('citizen.profile.loggingOut'), 'info');
                setTimeout(() => router.replace('/Auth/login'), 800);
              })}
              accessibilityRole="button"
              accessibilityLabel={t('citizen.profile.logout')}
            >
              <Ionicons name="log-out-outline" size={18} color="#B3261E" />
              <Text style={styles.logoutText}>{t('citizen.profile.logout')}</Text>
            </Pressable>
          </Animated.View>

          {/* ── Language modal ── */}
          <Modal transparent animationType="fade" visible={languageOpen} onRequestClose={() => setLanguageOpen(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setLanguageOpen(false)}>
              <Animated.View style={styles.modalCard}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>{t('citizen.profile.chooseLanguage')}</Text>
                {languages.map((option) => (
                  <Pressable
                    key={option.code}
                    style={({ pressed }) => [
                      styles.modalOption,
                      option.code === language && styles.modalOptionActive,
                      pressed && styles.modalOptionPressed,
                    ]}
                    onPress={() => {
                      changeLanguage(option.code);
                      setLanguageOpen(false);
                      showToast(t('citizen.profile.toasts.languageSet', { language: option.label }), 'success');
                    }}
                  >
                    <Text style={[styles.modalOptionText, option.code === language && styles.modalOptionTextActive]}>
                      {option.label}
                    </Text>
                    {option.code === language && (
                      <Ionicons name="checkmark-circle" size={18} color={Theme.colors.greenDark} />
                    )}
                  </Pressable>
                ))}
              </Animated.View>
            </Pressable>
          </Modal>

        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(78,200,49,0.05)',
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 14,
  },

  // ── Profile card
  profileCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.card,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: F.display,
    color: Theme.colors.card,
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: F.display,
    color: Theme.colors.ink,
    letterSpacing: -0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.brandLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontFamily: F.display,
    color: Theme.colors.greenDark,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  memberSinceText: {
    fontSize: 11,
    fontFamily: F.body,
    color: Theme.colors.muted,
  },

  // ── Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stat: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Theme.colors.wash,
    borderRadius: Theme.radius.m,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(46,125,50,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontFamily: F.display,
    color: Theme.colors.greenDark,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: F.body,
    color: Theme.colors.muted,
    textAlign: 'center',
  },

  // ── Cards
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },

  // ── Achievements
  achievementsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    paddingLeft: 2,
  },
  achievementBadge: {
    alignItems: 'center',
    width: 70,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  achievementLabel: {
    fontSize: 10,
    fontFamily: F.body,
    color: Theme.colors.ink,
    textAlign: 'center',
  },
  achievementLabelLocked: {
    color: Theme.colors.muted,
  },
  achievementLock: {
    position: 'absolute',
    top: 30,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  // ── Impact
  impactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  impactCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Theme.radius.m,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  impactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 18,
    fontFamily: F.display,
    color: Theme.colors.ink,
  },
  impactLabel: {
    fontSize: 10,
    fontFamily: F.body,
    color: Theme.colors.muted,
    textAlign: 'center',
  },

  // ── Account list
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: Theme.radius.s,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  listRowPressed: {
    backgroundColor: Theme.colors.wash,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    fontFamily: F.body,
    color: Theme.colors.ink,
  },
  listBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 4,
  },
  listBadgeText: {
    fontSize: 11,
    fontFamily: F.display,
    color: Theme.colors.ink,
  },
  listMeta: {
    fontSize: 13,
    fontFamily: F.body,
    color: Theme.colors.muted,
    marginRight: 4,
  },

  // ── Logout
  logoutButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: Theme.radius.m,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutButtonPressed: {
    backgroundColor: '#FFCDD2',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: F.display,
    color: '#B3261E',
  },

  // ── Language modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 8,
    ...Theme.shadow.soft,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: F.display,
    color: Theme.colors.ink,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.m,
    backgroundColor: Theme.colors.wash,
    marginTop: 4,
  },
  modalOptionActive: {
    backgroundColor: Theme.colors.brandLight,
    borderWidth: 1,
    borderColor: 'rgba(78,200,49,0.3)',
  },
  modalOptionPressed: {
    opacity: 0.8,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: F.body,
    color: Theme.colors.ink,
  },
  modalOptionTextActive: {
    color: Theme.colors.greenDark,
    fontFamily: F.display,
  },
});
