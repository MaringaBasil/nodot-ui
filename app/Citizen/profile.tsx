import React, { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { Theme } from '@/constants/Colors';
import { Divider, SectionHeader } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { LinearGradient } from 'expo-linear-gradient';

const useNativeDriver = Platform.OS !== 'web';

// Achievement badges
const achievements = [
  { id: 'first', icon: 'emoji-events', label: 'First Scan', unlocked: true, color: '#FFD700', date: 'Jan 15' },
  { id: 'streak', icon: 'local-fire-department', label: '7-Day Streak', unlocked: true, color: '#FF6B35', date: 'Jan 22' },
  { id: 'eco', icon: 'eco', label: 'Eco Warrior', unlocked: true, color: '#4CAF50', date: 'Feb 1' },
  { id: 'hub', icon: 'store', label: 'Hub Regular', unlocked: false, color: '#9E9E9E', progress: '2/5 visits' },
  { id: 'volume', icon: 'trending-up', label: '50kg Club', unlocked: false, color: '#9E9E9E', progress: '15.2/50 kg' },
  { id: 'referral', icon: 'people', label: 'Social Star', unlocked: false, color: '#9E9E9E', progress: '1/3 referrals' },
];

// Activity history
const activityHistory = [
  { id: '1', type: 'scan', title: 'PET Bottle scanned', value: '+R 0.50', time: '2 hours ago', icon: 'qr-code-scanner' },
  { id: '2', type: 'pickup', title: 'Pickup completed', value: '+R 24.00', time: 'Yesterday', icon: 'local-shipping' },
  { id: '3', type: 'reward', title: 'Weekly bonus earned', value: '+R 15.00', time: '3 days ago', icon: 'card-giftcard' },
  { id: '4', type: 'achievement', title: 'Eco Warrior unlocked', value: '+50 XP', time: 'Feb 1', icon: 'emoji-events' },
];

// Referral program data
const referralData = {
  code: 'JOHN2024',
  referrals: 1,
  earnings: 25,
  pending: 2,
};

// Animated stat component
const AnimatedStat: React.FC<{ value: string; label: string; delay: number; icon: string }> = ({ value, label, delay, icon }) => {
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
        <MaterialIcons name={icon as any} size={14} color={Theme.colors.greenDark} />
      </View>
      <Animated.Text style={[styles.statValue, { opacity: valueAnim }]}>{value}</Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// Achievement badge component
const AchievementBadge: React.FC<{ achievement: typeof achievements[0]; index: number }> = ({ achievement, index }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300 + index * 100),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver, friction: 5 }),
    ]).start();

    if (achievement.unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver }),
        ])
      ).start();
    }
  }, [index, achievement.unlocked]);

  return (
    <Animated.View style={[styles.achievementBadge, { transform: [{ scale: scaleAnim }] }]}>
      {achievement.unlocked && (
        <Animated.View
          style={[
            styles.achievementGlow,
            { backgroundColor: achievement.color, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] }) },
          ]}
        />
      )}
      <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color : '#E0E0E0' }]}>
        <MaterialIcons name={achievement.icon as any} size={18} color={achievement.unlocked ? '#FFFFFF' : '#9E9E9E'} />
      </View>
      <Text style={[styles.achievementLabel, !achievement.unlocked && styles.achievementLabelLocked]}>
        {achievement.label}
      </Text>
      {!achievement.unlocked && (
        <View style={styles.achievementLock}>
          <MaterialIcons name="lock" size={10} color="#9E9E9E" />
        </View>
      )}
    </Animated.View>
  );
};

export default function CitizenProfile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, changeLanguage, languages } = useLanguage();
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header animation
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver }).start();

    // Avatar bounce
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver, friction: 4 }),
    ]).start();

    // Rotate avatar ring
    Animated.loop(
      Animated.timing(avatarRotate, { toValue: 1, duration: 8000, useNativeDriver })
    ).start();

    // Stagger cards
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

  const rotateInterpolate = avatarRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        {/* Gradient Header Background */}
        <Animated.View style={[styles.headerBackground, { opacity: headerAnim }]}>
          <LinearGradient
            colors={['#E8F5E9', '#F1F8F1', Theme.colors.paper]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: headerAnim,
                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <View style={styles.profileHeader}>
              {/* Animated Avatar with rotating ring */}
              <View style={styles.avatarContainer}>
                <Animated.View style={[styles.avatarRing, { transform: [{ rotate: rotateInterpolate }] }]}>
                  <LinearGradient
                    colors={[Theme.colors.green, Theme.colors.greenDark, '#1B5E20']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarRingGradient}
                  />
                </Animated.View>
                <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
                  <Text style={styles.avatarText}>JD</Text>
                </Animated.View>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>John Doe</Text>
                <View style={styles.roleBadge}>
                  <MaterialIcons name="eco" size={12} color={Theme.colors.greenDark} />
                  <Text style={styles.roleText}>{t('citizen.profile.title')}</Text>
                </View>
                <View style={styles.memberSince}>
                  <MaterialIcons name="schedule" size={12} color={Theme.colors.muted} />
                  <Text style={styles.memberSinceText}>Member since Jan 2024</Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <AnimatedStat value="15.2kg" label={t('citizen.profile.stats.recycled')} delay={200} icon="recycling" />
              <AnimatedStat value="R 325" label={t('citizen.profile.stats.earned')} delay={350} icon="payments" />
              <AnimatedStat value="8 🔥" label={t('citizen.profile.stats.streak')} delay={500} icon="local-fire-department" />
            </View>
          </Animated.View>

          {/* Achievements Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[0],
                transform: [{ translateY: cardsAnim[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <SectionHeader title="Achievements" meta="3 of 5 unlocked" />
              <View style={styles.achievementProgress}>
                <View style={styles.achievementProgressBar}>
                  <View style={[styles.achievementProgressFill, { width: '60%' }]} />
                </View>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsRow}>
              {achievements.map((achievement, index) => (
                <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Impact Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[1],
                transform: [{ translateY: cardsAnim[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <SectionHeader title={t('citizen.profile.impact')} meta={t('citizen.profile.impactMeta')} />
            <View style={styles.impactRow}>
              <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.cardPressed]}>
                <View style={styles.impactIconWrap}>
                  <MaterialIcons name="park" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.impactValue}>12</Text>
                <Text style={styles.impactLabel}>Trees saved</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.cardPressed]}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialIcons name="water-drop" size={20} color="#2196F3" />
                </View>
                <Text style={styles.impactValue}>840L</Text>
                <Text style={styles.impactLabel}>Water saved</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.impactCard, pressed && styles.cardPressed]}>
                <View style={[styles.impactIconWrap, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialIcons name="bolt" size={20} color="#FF9800" />
                </View>
                <Text style={styles.impactValue}>24kg</Text>
                <Text style={styles.impactLabel}>CO₂ avoided</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Account Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardsAnim[2],
                transform: [{ translateY: cardsAnim[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }
            ]}
          >
            <SectionHeader title={t('citizen.profile.account')} meta="Manage your preferences" />
            {[
              { label: t('citizen.profile.wallet'), icon: 'account-balance-wallet', badge: 'R 325', badgeColor: '#E8F5E9', onPress: () => showToast(t('citizen.profile.toasts.wallet'), 'info') },
              { label: t('citizen.profile.notifications'), icon: 'notifications', badge: '3', badgeColor: '#FFEBEE', onPress: () => showToast(t('citizen.profile.toasts.notifications'), 'info') },
              { label: t('citizen.profile.language'), icon: 'translate', value: languages.find((l) => l.code === language)?.label, onPress: () => setLanguageOpen(true) },
              { label: t('citizen.profile.support'), icon: 'support-agent', onPress: () => showToast(t('citizen.profile.toasts.support'), 'info') },
            ].map((item, idx) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                >
                  <View style={styles.listIcon}>
                    <MaterialIcons name={item.icon as any} size={18} color={Theme.colors.greenDark} />
                  </View>
                  <Text style={styles.listText}>{item.label}</Text>
                  {item.badge && (
                    <View style={[styles.listBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.listBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.value ? <Text style={styles.listMeta}>{item.value}</Text> : null}
                  <MaterialIcons name="chevron-right" size={18} color={Theme.colors.muted} />
                </Pressable>
                {idx < 3 && <Divider inset={54} />}
              </View>
            ))}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            style={{
              opacity: cardsAnim[3],
              transform: [{ translateY: cardsAnim[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
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
              <MaterialIcons name="logout" size={18} color="#B3261E" />
              <Text style={styles.logoutText}>{t('citizen.profile.logout')}</Text>
            </Pressable>
          </Animated.View>

          {/* Language Modal */}
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
                      pressed && styles.modalOptionPressed
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
                      <MaterialIcons name="check-circle" size={18} color={Theme.colors.greenDark} />
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
    backgroundColor: Theme.colors.paper,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 14,
  },
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
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
  },
  avatarRingGradient: {
    flex: 1,
    borderRadius: 36,
    opacity: 0.3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 22,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
    letterSpacing: -0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontFamily: Theme.fonts.display,
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
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },
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
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.greenDark,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Theme.shadow.soft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Achievements
  achievementProgress: {
    width: 60,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Theme.colors.green,
    borderRadius: 2,
  },
  achievementsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  achievementBadge: {
    alignItems: 'center',
    width: 70,
  },
  achievementGlow: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontFamily: Theme.fonts.body,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Impact
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
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
  impactLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    textAlign: 'center',
  },

  // List
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
    fontFamily: Theme.fonts.body,
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
    fontFamily: Theme.fonts.display,
    color: Theme.colors.ink,
  },
  listMeta: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
    marginRight: 4,
  },

  // Logout
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
    fontFamily: Theme.fonts.display,
    color: '#B3261E',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.display,
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
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  modalOptionPressed: {
    opacity: 0.8,
  },
  modalOptionText: {
    fontSize: 15,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
  },
  modalOptionTextActive: {
    color: Theme.colors.greenDark,
    fontFamily: Theme.fonts.display,
  },
});
