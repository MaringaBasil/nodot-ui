import React, { useCallback, useMemo, useRef, useEffect } from 'react';
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
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

const UND = Platform.OS !== 'web';

const FAQS = [
  { q: 'How do I request an additional pickup?',  a: 'Go to the Pickups tab and tap the + button. Choose your site, preferred time, and materials. Your account manager will confirm within 4 hours.' },
  { q: 'How is my waste weight measured?',        a: 'Each pickup is weighed on certified scales at your site. You receive a weight certificate within 24 hours of collection.' },
  { q: 'How do I dispute a recorded weight?',     a: 'Open the relevant pickup in the Pickups tab, tap "Manage", and select "Dispute weight". Our team will review within 48 hours.' },
  { q: 'When are invoices generated?',            a: 'Invoices are generated within 24 hours of a completed pickup. Payment terms are net 30 days unless otherwise agreed.' },
  { q: 'Can I add more pickup sites?',            a: 'Yes. Go to Account → Manage Sites and tap "Add Site". A site verification visit will be scheduled within 5 business days.' },
];

const CATEGORIES = [
  { label: 'Billing & Invoices', icon: 'cash-outline' as const,          color: '#E28F3C' },
  { label: 'Pickup Issues',      icon: 'cube-outline' as const,          color: '#2C6E91' },
  { label: 'Account & Access',   icon: 'person-outline' as const,        color: '#7B52AB' },
  { label: 'Reporting',          icon: 'bar-chart-outline' as const,     color: '#3F8B7B' },
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

    content: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },
    section: { gap: 10 },
    sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
    card: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder,
      shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 62 },
    dividerFull: { height: 1, backgroundColor: cardBorder },

    /* Category grid */
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catItem: {
      width: '47.5%', padding: 16, borderRadius: 16, gap: 8,
      backgroundColor: C.card, borderWidth: 1, borderColor: cardBorder,
      alignItems: 'flex-start',
    },
    catIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    catLabel: { fontFamily: F.semibold, fontSize: 13, color: C.ink },

    /* FAQ rows */
    faqRow: { padding: 16, gap: 6 },
    faqQ: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    faqA: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 20 },

    /* Contact card */
    contactCard: {
      backgroundColor: C.card, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: cardBorder, padding: 16, gap: 14,
    },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
    contactInfo: { flex: 1, gap: 2 },
    contactLabel: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    contactMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    contactDivider: { height: 1, backgroundColor: cardBorder },
    ctaBtn: { paddingVertical: 14, borderRadius: 28, backgroundColor: C.navy, alignItems: 'center' },
    ctaBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand, letterSpacing: 0.5 },

    pressed: { opacity: 0.7 },
  });
}

export default function BusinessSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

  const [toast, setToast] = React.useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const toast_ = useCallback((msg: string, type: typeof toast.type = 'info') => setToast({ visible: true, message: msg, type }), []);
  const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: UND }).start();
  }, []);

  return (
    <ErrorBoundary>
      <Animated.View style={[{ flex: 1 }, {
        opacity: enterAnim,
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }]}>
        <View style={styles.root}>
          <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

          <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerBlobTL} />
            <View style={styles.headerBlobBR} />
            <View style={styles.headerInner}>
              <Pressable style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerLeft}>
                <Text style={styles.headerSub}>We're here to help</Text>
                <Text style={styles.headerTitle}>Support</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          >
            {/* ── Categories ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse by topic</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.label}
                    style={({ pressed }) => [styles.catItem, pressed && styles.pressed]}
                    onPress={() => { haptic(); toast_(`${cat.label} — coming soon`, 'info'); }}
                  >
                    <View style={[styles.catIcon, { backgroundColor: `${cat.color}18` }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── FAQs ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FAQs</Text>
              <View style={styles.card}>
                {FAQS.map((faq, idx) => (
                  <View key={faq.q}>
                    <View style={styles.faqRow}>
                      <Text style={styles.faqQ}>{faq.q}</Text>
                      <Text style={styles.faqA}>{faq.a}</Text>
                    </View>
                    {idx < FAQS.length - 1 && <View style={styles.dividerFull} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Contact ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact us</Text>
              <View style={styles.contactCard}>
                {[
                  { icon: 'person-outline' as const, label: 'Account Manager', meta: 'Thabo Nkosi — Mon–Fri, 08:00–17:00' },
                  { icon: 'mail-outline' as const,   label: 'Email support',   meta: 'business@nodot.co.za' },
                  { icon: 'call-outline' as const,   label: 'Phone',           meta: '+27 11 000 1234' },
                ].map((c, idx, arr) => (
                  <View key={c.label}>
                    <View style={styles.contactRow}>
                      <View style={styles.contactIcon}>
                        <Ionicons name={c.icon} size={18} color={C.brand} />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>{c.label}</Text>
                        <Text style={styles.contactMeta}>{c.meta}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.contactDivider} />}
                  </View>
                ))}
                <Pressable
                  style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
                  onPress={() => { haptic(); toast_('Support ticket coming soon', 'info'); }}
                >
                  <Text style={styles.ctaBtnText}>SUBMIT A TICKET</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
}
