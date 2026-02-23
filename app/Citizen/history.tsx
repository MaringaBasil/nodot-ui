import React, { useMemo, useState } from 'react';
import {
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

type FilterKey = 'All' | 'Plastic' | 'Paper' | 'Glass' | 'Metal';

const FILTERS: FilterKey[] = ['All', 'Plastic', 'Paper', 'Glass', 'Metal'];

const SCANS = [
  { id: '1', material: 'PET Plastic',   category: 'Plastic', weight: '0.8 kg', points: 40, value: 'R 4.00',  date: 'Today, 14:23',     icon: 'water',            color: '#2C6E91' },
  { id: '2', material: 'Cardboard',     category: 'Paper',   weight: '1.2 kg', points: 24, value: 'R 2.40',  date: 'Yesterday, 09:15', icon: 'document-outline', color: '#C6A35C' },
  { id: '3', material: 'Glass Bottle',  category: 'Glass',   weight: '2.0 kg', points: 60, value: 'R 6.00',  date: 'Mon, 11:30',       icon: 'wine-outline',     color: '#3F8B7B' },
  { id: '4', material: 'Aluminium Can', category: 'Metal',   weight: '0.3 kg', points: 45, value: 'R 4.50',  date: 'Sun, 16:42',       icon: 'cube-outline',     color: '#9E9E9E' },
  { id: '5', material: 'HDPE Plastic',  category: 'Plastic', weight: '0.6 kg', points: 30, value: 'R 3.00',  date: 'Sat, 08:05',       icon: 'water',            color: '#2E7D32' },
  { id: '6', material: 'Newspaper',     category: 'Paper',   weight: '0.9 kg', points: 18, value: 'R 1.80',  date: 'Fri, 12:00',       icon: 'newspaper-outline',color: '#E28F3C' },
  { id: '7', material: 'Steel Tin',     category: 'Metal',   weight: '0.4 kg', points: 32, value: 'R 3.20',  date: 'Thu, 10:15',       icon: 'archive-outline',  color: '#5C635E' },
];

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    root: { flex: 1 },

    header: {
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: C.card,
      borderBottomWidth: 1, borderBottomColor: cardBorder,
    },
    headerTitle: { fontFamily: F.display, fontSize: 24, color: C.ink, letterSpacing: -0.5 },
    headerSub: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },

    summaryRow: {
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10,
      backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: cardBorder,
    },
    summaryChip: {
      flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12,
      backgroundColor: C.brandLight, borderRadius: 14,
    },
    summaryChipNavy: { backgroundColor: C.navy },
    summaryValue: { fontFamily: F.bold, fontSize: 14, color: C.ink },
    summaryLabel: { fontFamily: F.body, fontSize: 11, color: C.muted },
    summaryValueLight: { fontFamily: F.bold, fontSize: 14, color: '#FFFFFF' },
    summaryLabelLight: { fontFamily: F.body, fontSize: 11, color: 'rgba(255,255,255,0.7)' },

    filterRow: { flexGrow: 0, flexShrink: 0 },
    filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
    filterChip: {
      paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
      backgroundColor: C.card, borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    },
    filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
    filterText: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
    filterTextActive: { color: C.brand },

    list: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
    scanItem: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 14, padding: 14, gap: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    },
    scanIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    scanInfo: { flex: 1, gap: 3 },
    scanMaterial: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
    scanMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
    scanRight: { alignItems: 'flex-end', gap: 3 },
    scanPoints: { fontFamily: F.bold, fontSize: 14, color: C.brand },
    scanValue: { fontFamily: F.body, fontSize: 12, color: C.muted },
  });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, gradients: G, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const [filter, setFilter] = useState<FilterKey>('All');

  const visible = filter === 'All' ? SCANS : SCANS.filter((s) => s.category === filter);

  const totalPoints = SCANS.reduce((sum, s) => sum + s.points, 0);
  const totalValue  = SCANS.reduce((sum, s) => sum + parseFloat(s.value.replace('R ', '')), 0);
  const totalWeight = SCANS.reduce((sum, s) => sum + parseFloat(s.weight), 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={G.surface} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>{SCANS.length} items · last 7 days</Text>
      </View>

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, styles.summaryChipNavy]}>
          <Ionicons name="trophy" size={15} color={C.brand} />
          <Text style={styles.summaryValueLight}>{totalPoints}</Text>
          <Text style={styles.summaryLabelLight}>Points</Text>
        </View>
        <View style={styles.summaryChip}>
          <Ionicons name="cash-outline" size={15} color={C.brand} />
          <Text style={styles.summaryValue}>R {totalValue.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Earned</Text>
        </View>
        <View style={styles.summaryChip}>
          <Ionicons name="sync-outline" size={15} color={C.brand} />
          <Text style={styles.summaryValue}>{totalWeight.toFixed(1)} kg</Text>
          <Text style={styles.summaryLabel}>Recycled</Text>
        </View>
      </View>

      {/* Filter row */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterRow} contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((f) => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Scan list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
      >
        {visible.map((item) => (
          <Pressable key={item.id} style={({ pressed }) => [styles.scanItem, pressed && { opacity: 0.75 }]}>
            <LinearGradient colors={G.card} style={StyleSheet.absoluteFill} />
            <View style={[styles.scanIconWrap, { backgroundColor: `${item.color}30` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.scanInfo}>
              <Text style={styles.scanMaterial}>{item.material}</Text>
              <Text style={styles.scanMeta}>{item.weight} · {item.date}</Text>
            </View>
            <View style={styles.scanRight}>
              <Text style={styles.scanPoints}>+{item.points} pts</Text>
              <Text style={styles.scanValue}>{item.value}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
