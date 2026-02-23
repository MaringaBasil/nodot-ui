import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
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

// ─── Tip data ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'prep',
    heading: 'Preparation',
    icon: 'construct-outline',
    tips: [
      { id: 'p1', icon: 'water-outline',  color: '#2C6E91', title: 'Rinse before you bring',  summary: 'Clean items earn a higher material grade', detail: 'Food residue lowers the value of recyclable plastic and glass. A quick rinse under the tap removes contamination and can push your item into a higher payout bracket. No need for soap — water is enough.' },
      { id: 'p2', icon: 'layers-outline', color: '#3F8B7B', title: 'Crush containers flat',   summary: 'Fit more recyclables in each trip',         detail: 'Crushed plastic bottles and aluminium cans take up far less space. This means you can bring more per trip, earn more per visit, and reduce the number of journeys you need to make.' },
      { id: 'p3', icon: 'list-outline',   color: '#E28F3C', title: 'Sort before scanning',    summary: 'Sorting saves time and boosts your payout', detail: 'Separate your recyclables by material type — plastic, glass, metal, and paper — before arriving at the hub. Sorted items are processed faster and reduce the chance of cross-contamination lowering your grade.' },
    ],
  },
  {
    id: 'earn',
    heading: 'Earning More',
    icon: 'cash-outline',
    tips: [
      { id: 'e1', icon: 'trophy-outline',  color: '#C6A35C', title: 'Scan during bonus events', summary: 'Double or triple your points on weekends',       detail: 'Keep an eye on the promo banner on your home screen. NoDot regularly runs 2× and 3× point events on specific materials or weekends. Planning your drop-offs around these events can significantly increase your earnings.' },
      { id: 'e2', icon: 'people-outline',  color: '#7B52AB', title: 'Refer friends & earn',    summary: '100 points for every successful referral',       detail: 'Share your referral code with friends and family. Every time someone signs up and makes their first scan, you both receive bonus points. The more people you refer, the more passive points you earn.' },
      { id: 'e3', icon: 'ribbon-outline',  color: '#4EC831', title: 'Unlock badge bonuses',    summary: 'Badges unlock point multipliers',                detail: 'Each badge tier unlocks a permanent point multiplier on your scans. For example, reaching "Top Recycler" adds a 10% bonus to every scan. Work through the badge system to make every drop-off worth more.' },
    ],
  },
  {
    id: 'material',
    heading: 'Material Grades',
    icon: 'information-circle-outline',
    tips: [
      { id: 'm1', icon: 'beaker-outline',   color: '#2C6E91', title: 'PET plastic pays most', summary: 'Clear PET bottles are the highest-value plastic',    detail: 'PET (the clear plastic used in water and cool-drink bottles) fetches the highest rate among plastics. Remove the cap and label where possible, and make sure the bottle is rinsed and crushed for maximum value.' },
      { id: 'm2', icon: 'wine-outline',     color: '#3F8B7B', title: 'Glass by colour',       summary: 'Clear glass is worth more than coloured glass',       detail: 'Recycling plants process glass by colour. Clear (flint) glass has the widest reuse market and attracts a premium. Keep your clear bottles separate from green and brown glass for the best payout.' },
      { id: 'm3', icon: 'newspaper-outline',color: '#A0522D', title: 'Keep paper dry',         summary: 'Wet paper loses most of its value',                  detail: 'Paper fibre degrades quickly when wet. Store your cardboard and paper recyclables in a dry place before bringing them to the hub. Even slightly damp paper is graded significantly lower than dry stock.' },
    ],
  },
  {
    id: 'impact',
    heading: 'Your Impact',
    icon: 'earth-outline',
    tips: [
      { id: 'i1', icon: 'leaf-outline',  color: '#2E7D32', title: 'Every scan counts',       summary: 'One bottle recycled = 3 hours of LED lamp energy',   detail: 'Recycling a single 500 ml PET bottle saves enough energy to power an LED lamp for three hours. When you multiply that across dozens of scans, your individual contribution becomes genuinely significant.' },
      { id: 'i2', icon: 'cloud-outline', color: '#5C7FA3', title: 'Recycling cuts emissions', summary: 'Recycled aluminium uses 95% less energy than new',    detail: 'Manufacturing aluminium from recycled cans uses 95% less energy than smelting it from raw bauxite ore. Every aluminium can you recycle directly reduces greenhouse gas emissions and energy consumption.' },
    ],
  },
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
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    headerCenter: { alignItems: 'center', gap: 2 },
    headerTitle: { fontFamily: F.bold, fontSize: 17, color: '#FFFFFF' },
    headerSub: { fontFamily: F.body, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    content: { paddingTop: 20, paddingHorizontal: 16, gap: 24 },
    categoryBlock: { gap: 10 },
    categoryHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
    categoryTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink, letterSpacing: 0.3, textTransform: 'uppercase' },
    tipCard: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: cardBorder, overflow: 'hidden', shadowColor: '#0C120D', shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
    tipIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    tipBody: { flex: 1, gap: 4 },
    tipTitle: { fontFamily: F.semibold, fontSize: 15, color: C.ink, lineHeight: 20 },
    tipSummary: { fontFamily: F.semibold, fontSize: 12, color: C.brand, lineHeight: 16 },
    tipDetail: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 4 },
    footer: { alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 32 },
    footerText: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  });
}

export default function TipsScreen() {
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
      {/* Header */}
      <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Eco Tips</Text>
          <Text style={styles.headerSub}>Small habits, big impact</Text>
        </View>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.categoryBlock}>
            <View style={styles.categoryHeading}>
              <Ionicons name={cat.icon as any} size={16} color={C.brand} />
              <Text style={styles.categoryTitle}>{cat.heading}</Text>
            </View>
            {cat.tips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={[styles.tipIconWrap, { backgroundColor: `${tip.color}18` }]}>
                  <Ionicons name={tip.icon as any} size={22} color={tip.color} />
                </View>
                <View style={styles.tipBody}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipSummary}>{tip.summary}</Text>
                  <Text style={styles.tipDetail}>{tip.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.footer}>
          <Ionicons name="earth-outline" size={28} color={C.brand} />
          <Text style={styles.footerText}>Every scan you make helps build a cleaner, greener South Africa.</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
