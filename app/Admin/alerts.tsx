/**
 * Admin/alerts.tsx
 * Alerts & Insights — operational alerts list + city policy scorecard.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { Divider } from '@/components/ui/Primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';

const ALERTS = [
    { id: '1', title: 'Illegal dumping reported', location: 'Region 3, Sector B', severity: 'high', icon: 'warning', time: '5 min ago' },
    { id: '2', title: 'Pickup delays above 15 min', location: '3 hubs affected', severity: 'medium', icon: 'schedule', time: '12 min ago' },
    { id: '3', title: 'Hub capacity at 80%', location: 'Rosebank Hub', severity: 'low', icon: 'inventory', time: '1 hour ago' },
    { id: '4', title: 'Driver shortage detected', location: 'Region 2, North', severity: 'medium', icon: 'person-off', time: '2 hours ago' },
];

const INSIGHTS = [
    { label: 'Participation rate', value: '68%', trend: 'up', target: '75%' },
    { label: 'Top material', value: 'PET plastic', trend: 'stable', target: null },
    { label: 'CO₂ saved', value: '2.4t', trend: 'up', target: '3t' },
    { label: 'Avg response time', value: '8 min', trend: 'down', target: '5 min' },
];

const SEVERITY_CONFIG = {
    high: { bg: '#FFEBEE', darkBg: 'rgba(198,40,40,0.15)', dot: '#C62828', label: 'High' },
    medium: { bg: '#FFF3E0', darkBg: 'rgba(230,81,0,0.15)', dot: '#F57C00', label: 'Medium' },
    low: { bg: '#F3F4F6', darkBg: 'rgba(100,100,100,0.12)', dot: '#9E9E9E', label: 'Low' },
};

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
        headerBlobTL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
        headerBlobBR: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },
        headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        headerLeft: { gap: 2 },
        headerTitle: { fontFamily: F.display, fontSize: 20, color: '#FFFFFF', letterSpacing: -0.3 },
        headerSub: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
        alertCountBadge: {
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        },
        alertCountText: { fontFamily: F.semibold, fontSize: 12, color: '#FFFFFF' },

        content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

        sectionLabel: { fontFamily: F.bold, fontSize: 17, color: C.ink },

        // Alert rows
        alertCard: {
            backgroundColor: C.card, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },
        alertRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 14, paddingVertical: 14, gap: 12,
        },
        alertIconWrap: {
            width: 38, height: 38, borderRadius: 19,
            alignItems: 'center', justifyContent: 'center',
        },
        alertContent: { flex: 1, gap: 2 },
        alertTitle: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
        alertLocation: { fontFamily: F.body, fontSize: 12, color: C.muted },
        alertRight: { alignItems: 'flex-end', gap: 4 },
        alertTime: { fontFamily: F.body, fontSize: 11, color: C.muted },
        severityPill: {
            paddingHorizontal: 7, paddingVertical: 2,
            borderRadius: 6,
        },
        severityText: { fontFamily: F.bold, fontSize: 10, color: '#FFFFFF' },

        // Incident log CTA
        logBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 18,
            backgroundColor: C.navy,
        },
        logBtnText: { fontFamily: F.bold, fontSize: 14, color: C.brand },

        // Policy insights card
        insightsCard: {
            backgroundColor: C.card, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },
        insightsHeader: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: cardBorder,
        },
        insightsHeaderTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
        insightsHeaderSub: { fontFamily: F.body, fontSize: 12, color: C.muted },
        insightRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 13,
        },
        insightLabel: { fontFamily: F.body, fontSize: 13, color: C.ink },
        insightRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        insightValue: { fontFamily: F.bold, fontSize: 13, color: C.brand },
        insightTarget: { fontFamily: F.body, fontSize: 11, color: C.muted },

        pressed: { opacity: 0.7 },
    });
}

export default function AdminAlerts() {
    const insets = useSafeAreaInsets();
    const { colors: C, gradients: G, isDark } = useTheme();
    const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((msg: string, type: typeof toast.type = 'info') =>
        setToast({ visible: true, message: msg, type }), []);
    const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => { setRefreshing(false); showToast('Alerts refreshed', 'success'); }, 1000);
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
                            <Text style={styles.headerSub}>Operational monitoring</Text>
                            <Text style={styles.headerTitle}>Alerts & Insights</Text>
                        </View>
                        <View style={styles.alertCountBadge}>
                            <Text style={styles.alertCountText}>{ALERTS.length} active</Text>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
                >
                    {/* Alerts section */}
                    <Text style={styles.sectionLabel}>Active Alerts</Text>

                    <View style={styles.alertCard}>
                        {ALERTS.map((alert, idx) => {
                            const sev = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
                            return (
                                <View key={alert.id}>
                                    <Pressable
                                        style={({ pressed }) => [styles.alertRow, pressed && styles.pressed]}
                                        onPress={() => { haptic(); showToast(`Viewing: ${alert.title}`, 'info'); }}
                                    >
                                        <View style={[styles.alertIconWrap, { backgroundColor: isDark ? sev.darkBg : sev.bg }]}>
                                            <MaterialIcons name={alert.icon as any} size={18} color={sev.dot} />
                                        </View>
                                        <View style={styles.alertContent}>
                                            <Text style={styles.alertTitle}>{alert.title}</Text>
                                            <Text style={styles.alertLocation}>{alert.location}</Text>
                                        </View>
                                        <View style={styles.alertRight}>
                                            <Text style={styles.alertTime}>{alert.time}</Text>
                                            <View style={[styles.severityPill, { backgroundColor: sev.dot }]}>
                                                <Text style={styles.severityText}>{sev.label}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                    {idx < ALERTS.length - 1 && <Divider inset={62} />}
                                </View>
                            );
                        })}
                    </View>

                    {/* Incident log CTA */}
                    <Pressable
                        style={({ pressed }) => [styles.logBtn, pressed && styles.pressed]}
                        onPress={() => { haptic(); showToast('Incident log opened', 'success'); }}
                    >
                        <MaterialIcons name="list-alt" size={18} color={C.brand} />
                        <Text style={styles.logBtnText}>View Incident Log</Text>
                    </Pressable>

                    {/* Policy Insights */}
                    <Text style={styles.sectionLabel}>Policy Insights</Text>

                    <View style={styles.insightsCard}>
                        <View style={styles.insightsHeader}>
                            <Text style={styles.insightsHeaderTitle}>City Scorecard</Text>
                            <Text style={styles.insightsHeaderSub}>Region 3 · Today</Text>
                        </View>
                        {INSIGHTS.map((item, idx) => (
                            <View key={item.label}>
                                <Pressable
                                    style={({ pressed }) => [styles.insightRow, pressed && styles.pressed]}
                                    onPress={() => { haptic(); showToast(`${item.label}: ${item.value}`, 'info'); }}
                                >
                                    <Text style={styles.insightLabel}>{item.label}</Text>
                                    <View style={styles.insightRight}>
                                        <Text style={styles.insightValue}>{item.value}</Text>
                                        {item.target && <Text style={styles.insightTarget}>of {item.target}</Text>}
                                        {item.trend !== 'stable' && (
                                            <MaterialIcons
                                                name={item.trend === 'up' ? 'trending-up' : 'trending-down'}
                                                size={14}
                                                color={item.trend === 'up' ? '#2E7D32' : '#B3261E'}
                                            />
                                        )}
                                    </View>
                                </Pressable>
                                {idx < INSIGHTS.length - 1 && <Divider inset={16} />}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}
