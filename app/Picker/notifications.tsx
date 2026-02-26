import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const NOTIFICATIONS = [
  { id: '1', title: 'New job nearby', body: '456 Market Rd, Sandton · R 60', time: 'Just now', icon: 'cube-outline' as const, color: '#4EC831', read: false },
  { id: '2', title: 'Payout processed', body: 'R 86 transferred to your wallet', time: '1h ago', icon: 'wallet-outline' as const, color: '#2C6E91', read: false },
  { id: '3', title: 'Weight confirmed', body: '5.2 kg PET Plastic · Rosebank pickup', time: 'Yesterday', icon: 'checkmark-circle-outline' as const, color: '#4EC831', read: true },
  { id: '4', title: 'Profile verified', body: 'Your ID and vehicle have been verified', time: '3 days ago', icon: 'shield-checkmark-outline' as const, color: '#7B52AB', read: true },
  { id: '5', title: 'January summary', body: 'You completed 18 pickups · R 410 earned', time: '5 days ago', icon: 'document-text-outline' as const, color: '#E28F3C', read: true },
];

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
    headerInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerLeft: { flex: 1, gap: 1 },
    headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
    headerSub: { fontFamily: F.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' },

    content: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40 },
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },
    row: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    rowUnread: { backgroundColor: isDark ? 'rgba(78,200,49,0.04)' : 'rgba(78,200,49,0.03)' },
    iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 2 },
    title: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    body: { fontFamily: F.body, fontSize: 12, color: C.muted },
    time: { fontFamily: F.body, fontSize: 11, color: C.muted },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand, marginTop: 4 },
    markAllText: { fontFamily: F.semibold, fontSize: 13, color: C.brand },

    footer: { alignItems: 'center', paddingVertical: 28, gap: 8 },
    footerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(78,200,49,0.10)' : 'rgba(78,200,49,0.08)', alignItems: 'center', justifyContent: 'center' },
    footerText: { fontFamily: F.semibold, fontSize: 14, color: C.muted },
    footerSub: { fontFamily: F.body, fontSize: 12, color: C.muted },

    pressed: { opacity: 0.7 },
  });
}

export default function PickerNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const [notes, setNotes] = useState(NOTIFICATIONS);
  const unreadCount = notes.filter(n => !n.read).length;
  const markAllRead = useCallback(() => {
    haptic();
    setNotes(prev => prev.map(n => ({ ...n, read: true })));
  }, [haptic]);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.root}>
          <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerBlobTL} />
            <View style={styles.headerBlobBR} />
            <View style={styles.headerInner}>
              <Pressable style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>Stay informed</Text>
                <Text style={styles.headerTitle}>Notifications</Text>
              </View>
              {unreadCount > 0 && (
                <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={markAllRead}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </Pressable>
              )}
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          >
            <View style={styles.card}>
              {notes.map((n, idx) => (
                <View key={n.id}>
                  <Pressable style={({ pressed }) => [styles.row, !n.read && styles.rowUnread, pressed && styles.pressed]} onPress={() => {
                    haptic();
                    setNotes(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                  }}>
                    <View style={[styles.iconWrap, { backgroundColor: `${n.color}18` }]}>
                      <Ionicons name={n.icon} size={18} color={n.color} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.title}>{n.title}</Text>
                      <Text style={styles.body}>{n.body}</Text>
                      <Text style={styles.time}>{n.time}</Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
                  </Pressable>
                  {idx < notes.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerIcon}>
                <Ionicons name="checkmark-done-outline" size={22} color={C.brand} />
              </View>
              <Text style={styles.footerText}>You're all caught up</Text>
              <Text style={styles.footerSub}>New alerts will appear here</Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
