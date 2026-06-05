/**
 * Admin/fraud.tsx
 * Fraud Review Queue — full-screen view of all 5-gate automated flags.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon as MaterialIcons } from '@/components/ui/AppIcon';
import { F } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

// ─── Types ────────────────────────────────────────────────────────────────────
type FraudSeverity = 'critical' | 'high' | 'medium';
type FraudGate = 1 | 2 | 3 | 4 | 5;

const GATE_LABELS: Record<FraudGate, string> = {
    1: 'Geo-Lock Fail',
    2: 'HMAC / QR Invalid',
    3: 'Photo AI Fail',
    4: 'Depot Weight Block',
    5: 'Weight Discrepancy',
};
const GATE_ICONS: Record<FraudGate, string> = {
    1: 'location-off', 2: 'qr-code-2', 3: 'camera-alt', 4: 'scale', 5: 'sync-problem',
};

const FRAUD_FLAGS: {
    id: string;
    gate: FraudGate;
    severity: FraudSeverity;
    pickerId: string;
    citizenId: string;
    jobId: string;
    detail: string;
    time: string;
    dismissed?: boolean;
}[] = [
        {
            id: 'f1', gate: 2, severity: 'critical',
            pickerId: 'PKR-0042', citizenId: 'CIT-1182', jobId: 'JOB-8812',
            detail: 'QR scanned 3.2 km from citizen address. Geo-lock rejected, bag locked.',
            time: '8 min ago',
        },
        {
            id: 'f2', gate: 3, severity: 'high',
            pickerId: 'PKR-0091', citizenId: 'CIT-0234', jobId: 'JOB-8814',
            detail: 'Photo perceptual hash matches previous submission (duplicate photo detected).',
            time: '22 min ago',
        },
        {
            id: 'f3', gate: 5, severity: 'high',
            pickerId: 'PKR-0057', citizenId: 'CIT-3301', jobId: 'JOB-8798',
            detail: 'Picker declared 12.4 kg; depot confirmed 6.1 kg (51% discrepancy). Payout blocked.',
            time: '1h ago',
        },
        {
            id: 'f4', gate: 1, severity: 'medium',
            pickerId: 'PKR-0033', citizenId: 'CIT-2244', jobId: 'JOB-8801',
            detail: 'Same citizen-picker pair on 7 of last 8 jobs. Possible collusion signal.',
            time: '3h ago',
        },
    ];

// ─── Styles ───────────────────────────────────────────────────────────────────
function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
    const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.surface },

        header: {
            paddingHorizontal: 20, paddingBottom: 22,
            borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }, elevation: 4,
        },
        headerBlobTL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(229,57,53,0.08)', top: -60, left: -50 },
        headerBlobBR: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
        headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        headerLeft: { gap: 2 },
        headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
        headerSub: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
        pendingBadge: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: 'rgba(229,57,53,0.22)',
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)',
        },
        pendingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF5350' },
        pendingText: { fontFamily: F.semibold, fontSize: 12, color: '#FFCDD2' },

        content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

        // Filter tabs
        filterRow: { flexDirection: 'row', backgroundColor: isDark ? C.neutral100 : '#EBEBEB', borderRadius: 22, padding: 3, gap: 3 },
        filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 20, alignItems: 'center' },
        filterBtnActive: { backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
        filterText: { fontFamily: F.semibold, fontSize: 12, color: C.muted },
        filterTextActive: { color: C.ink },

        // Fraud card
        fraudCard: {
            backgroundColor: C.card, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder,
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },
        severityStripe: { height: 4, width: '100%' },
        fraudBody: { padding: 14, gap: 10 },
        fraudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        fraudGateBadge: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        },
        fraudGateBadgeCritical: { backgroundColor: isDark ? 'rgba(198,40,40,0.2)' : '#FFEBEE' },
        fraudGateBadgeHigh: { backgroundColor: isDark ? 'rgba(230,81,0,0.2)' : '#FFF3E0' },
        fraudGateBadgeMedium: { backgroundColor: isDark ? 'rgba(21,101,192,0.2)' : '#E3F2FD' },
        fraudGateText: { fontFamily: F.bold, fontSize: 11 },
        fraudGateTextCritical: { color: isDark ? '#EF9A9A' : '#C62828' },
        fraudGateTextHigh: { color: isDark ? '#FFCC80' : '#E65100' },
        fraudGateTextMedium: { color: isDark ? '#90CAF9' : '#1565C0' },
        fraudTime: { fontFamily: F.body, fontSize: 11, color: C.muted },
        fraudIds: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        fraudIdChip: {
            backgroundColor: C.wash, paddingHorizontal: 6, paddingVertical: 2,
            borderRadius: 6, borderWidth: 1, borderColor: cardBorder,
        },
        fraudIdText: { fontFamily: F.semibold, fontSize: 10, color: C.muted },
        fraudDetail: { fontFamily: F.body, fontSize: 13, color: C.ink, lineHeight: 18 },
        fraudActions: {
            flexDirection: 'row', gap: 8,
            borderTopWidth: 1, borderTopColor: cardBorder, paddingTop: 12,
        },
        fraudBtn: {
            flex: 1, alignItems: 'center', justifyContent: 'center',
            paddingVertical: 11, borderRadius: 12,
            borderWidth: 1, borderColor: cardBorder,
        },
        fraudBtnDismissText: { fontFamily: F.bold, fontSize: 13, color: C.muted },
        fraudBtnAction: {
            backgroundColor: isDark ? '#B71C1C' : '#C62828',
            borderColor: isDark ? '#B71C1C' : '#C62828',
        },
        fraudBtnActionText: { fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' },

        // Empty state
        emptyWrap: { alignItems: 'center', paddingVertical: 56, gap: 12 },
        emptyCircle: {
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: isDark ? 'rgba(78,200,49,0.10)' : 'rgba(78,200,49,0.08)',
            alignItems: 'center', justifyContent: 'center',
        },
        emptyTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
        emptySub: { fontFamily: F.body, fontSize: 13, color: C.muted },

        pressed: { opacity: 0.7 },
    });
}

const SEVERITY_COLORS = {
    critical: '#C62828',
    high: '#E65100',
    medium: '#1565C0',
};
const FILTERS = ['All', 'Critical', 'High', 'Medium'] as const;
type Filter = typeof FILTERS[number];

export default function AdminFraud() {
    const insets = useSafeAreaInsets();
    const { colors: C, gradients: G, isDark } = useTheme();
    const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

    const [flags, setFlags] = useState(FRAUD_FLAGS);
    const [filter, setFilter] = useState<Filter>('All');
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((msg: string, type: typeof toast.type = 'info') =>
        setToast({ visible: true, message: msg, type }), []);
    const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

    const visible = flags.filter(f => {
        if (f.dismissed) return false;
        if (filter === 'All') return true;
        return f.severity === filter.toLowerCase();
    });

    const pendingCount = flags.filter(f => !f.dismissed).length;

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => { setRefreshing(false); showToast('Fraud queue refreshed', 'success'); }, 1000);
    }, [showToast]);

    return (
        <ErrorBoundary>
            <View style={styles.root}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type}
                    onHide={() => setToast(t => ({ ...t, visible: false }))} />

                {/* Header */}
                <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <View style={styles.headerBlobTL} />
                    <View style={styles.headerBlobBR} />
                    <View style={styles.headerInner}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerSub}>5-gate automated detection</Text>
                            <Text style={styles.headerTitle}>Fraud Queue</Text>
                        </View>
                        <View style={styles.pendingBadge}>
                            <View style={styles.pendingDot} />
                            <Text style={styles.pendingText}>{pendingCount} pending</Text>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
                >
                    {/* Filter tabs */}
                    <View style={styles.filterRow}>
                        {FILTERS.map(f => (
                            <Pressable key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                                onPress={() => { haptic(); setFilter(f); }}>
                                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Fraud cards */}
                    {visible.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyCircle}>
                                <MaterialIcons name="verified-user" size={32} color={C.brand} />
                            </View>
                            <Text style={styles.emptyTitle}>Queue Clear</Text>
                            <Text style={styles.emptySub}>No active fraud flags{filter !== 'All' ? ` for severity: ${filter}` : ''}</Text>
                        </View>
                    ) : (
                        visible.map(flag => (
                            <View key={flag.id} style={styles.fraudCard}>
                                {/* Severity top stripe */}
                                <View style={[styles.severityStripe, { backgroundColor: SEVERITY_COLORS[flag.severity] }]} />
                                <View style={styles.fraudBody}>
                                    {/* Badge + time */}
                                    <View style={styles.fraudHeader}>
                                        <View style={[
                                            styles.fraudGateBadge,
                                            flag.severity === 'critical' ? styles.fraudGateBadgeCritical
                                                : flag.severity === 'high' ? styles.fraudGateBadgeHigh
                                                    : styles.fraudGateBadgeMedium
                                        ]}>
                                            <MaterialIcons name={GATE_ICONS[flag.gate] as any} size={14} color={
                                                flag.severity === 'critical' ? (isDark ? '#EF9A9A' : '#C62828')
                                                    : flag.severity === 'high' ? (isDark ? '#FFCC80' : '#E65100')
                                                        : (isDark ? '#90CAF9' : '#1565C0')
                                            } />
                                            <Text style={[
                                                styles.fraudGateText,
                                                flag.severity === 'critical' ? styles.fraudGateTextCritical
                                                    : flag.severity === 'high' ? styles.fraudGateTextHigh
                                                        : styles.fraudGateTextMedium
                                            ]}>{GATE_LABELS[flag.gate]}</Text>
                                        </View>
                                        <Text style={styles.fraudTime}>{flag.time}</Text>
                                    </View>

                                    {/* IDs */}
                                    <View style={styles.fraudIds}>
                                        {[flag.jobId, flag.pickerId, flag.citizenId].map(id => (
                                            <View key={id} style={styles.fraudIdChip}>
                                                <Text style={styles.fraudIdText}>{id}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <Text style={styles.fraudDetail}>{flag.detail}</Text>

                                    {/* Actions */}
                                    <View style={styles.fraudActions}>
                                        <Pressable
                                            style={({ pressed }) => [styles.fraudBtn, pressed && styles.pressed]}
                                            onPress={() => {
                                                haptic();
                                                setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, dismissed: true } : f));
                                                showToast('Flag dismissed. Users noted.', 'info');
                                            }}
                                        >
                                            <Text style={styles.fraudBtnDismissText}>Dismiss</Text>
                                        </Pressable>
                                        <Pressable
                                            style={({ pressed }) => [styles.fraudBtn, styles.fraudBtnAction, pressed && styles.pressed]}
                                            onPress={() => {
                                                haptic();
                                                setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, dismissed: true } : f));
                                                showToast('Users suspended pending review', 'error');
                                            }}
                                        >
                                            <Text style={styles.fraudBtnActionText}>Take Action</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}
