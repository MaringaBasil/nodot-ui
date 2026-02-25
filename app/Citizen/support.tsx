import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
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

const FAQS = [
  { q: 'How do I get paid for my recyclables?',       a: 'Once your scan is verified at the hub, your rand value is added to your Wallet. You can cash out to a bank account or use your balance to purchase airtime and data directly in the app.' },
  { q: 'How long does scan verification take?',        a: 'Most scans are verified instantly. If a hub attendant needs to manually confirm the material grade, this can take up to 30 minutes. You will receive a push notification as soon as it is confirmed.' },
  { q: 'Which materials can I recycle?',               a: 'We currently accept PET plastic, HDPE plastic, glass (all colours), aluminium cans, steel cans, cardboard, and mixed paper. The scan screen shows you the grade and value of each item before you commit.' },
  { q: 'Why was my item rejected?',                    a: 'Common reasons include: heavy contamination (food residue), mixed materials that cannot be separated, or items that fall below the minimum weight threshold. Rinsing and sorting before your visit prevents most rejections.' },
  { q: 'How do I find a hub near me?',                 a: 'Tap "Find a hub near you" on the home screen or open the map from the Nearby Hubs section. The map shows live open/closed status and operating hours for every registered hub.' },
  { q: 'My points did not arrive. What do I do?',      a: 'First check the History screen — points may still be processing. If they do not appear within 2 hours of your visit, tap "Report a missing scan" below and our team will investigate within 24 hours.' },
  { q: 'Can I refer friends and earn?',                a: 'Yes. Share your referral code from the Profile screen. You earn 100 bonus points for every friend who signs up and completes their first scan. There is no cap on referrals.' },
];

const CONTACTS = [
  { id: 'whatsapp', icon: 'logo-whatsapp',      label: 'WhatsApp us',          desc: 'Typically replies in under 2 hours',         color: '#25D366', onPress: () => Linking.openURL('https://wa.me/27000000000') },
  { id: 'email',    icon: 'mail-outline',        label: 'Email support',        desc: 'support@nodot.co.za · 24h response',         color: '#2C6E91', onPress: () => Linking.openURL('mailto:support@nodot.co.za?subject=NoDot Support') },
  { id: 'report',   icon: 'alert-circle-outline',label: 'Report a missing scan',desc: 'For scans that did not earn points',          color: '#E28F3C', onPress: () => Linking.openURL('mailto:support@nodot.co.za?subject=Missing Scan Report') },
];

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 18,
      borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden',
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
    headerCenter: { alignItems: 'center', gap: 2 },
    headerTitle: { fontFamily: F.bold, fontSize: 17, color: '#FFFFFF' },
    headerSub: { fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    content: { paddingTop: 20, paddingHorizontal: 16, gap: 20 },
    section: { gap: 8 },
    sectionHeading: { fontFamily: F.bold, fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 4 },
    card: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: cardBorder, shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
    divider: { height: 1, backgroundColor: cardBorder, marginLeft: 64 },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    contactIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactText: { flex: 1, gap: 2 },
    contactLabel: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    contactDesc: { fontFamily: F.body, fontSize: 12, color: C.muted },
    faqQ: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
    faqQText: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.ink, lineHeight: 20 },
    faqA: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 4 },
    footerText: { flex: 1, fontFamily: F.body, fontSize: 12, color: C.muted, lineHeight: 18 },
  });
}

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable style={({ pressed }) => [styles.faqQ, pressed && { opacity: 0.75 }]} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.faqQText}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </Pressable>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
};

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 340, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.root, { paddingTop: insets.top }, {
        opacity: enterAnim,
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }]}
    >
      <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Support</Text>
          <Text style={styles.headerSub}>We're here to help</Text>
        </View>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Contact us</Text>
          <View style={styles.card}>
            {CONTACTS.map((c, idx) => (
              <View key={c.id}>
                <Pressable style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.75 }]} onPress={c.onPress}>
                  <View style={[styles.contactIcon, { backgroundColor: `${c.color}18` }]}>
                    <Ionicons name={c.icon as any} size={20} color={c.color} />
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>{c.label}</Text>
                    <Text style={styles.contactDesc}>{c.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.muted} />
                </Pressable>
                {idx < CONTACTS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Frequently asked</Text>
          <View style={styles.card}>
            {FAQS.map((faq, idx) => (
              <View key={faq.q}>
                <FaqItem q={faq.q} a={faq.a} />
                {idx < FAQS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={20} color={C.brand} />
          <Text style={styles.footerText}>All support conversations are private and handled by the NoDot team.</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
