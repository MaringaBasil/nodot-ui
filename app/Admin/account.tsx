/**
 * Admin/account.tsx
 * Admin profile — identity, region settings, and session controls.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
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

function createStyles(C: ReturnType<typeof useTheme>['colors'], isDark: boolean) {
    const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: C.surface },

        header: {
            paddingHorizontal: 20, paddingBottom: 28,
            borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }, elevation: 4,
        },
        headerBlobTL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(78,200,49,0.07)', top: -60, left: -50 },
        headerBlobBR: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, right: -30 },

        // Avatar block inside gradient header
        avatarBlock: { alignItems: 'center', gap: 10, marginTop: 16 },
        avatar: {
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
        },
        avatarText: { fontFamily: F.black, fontSize: 26, color: '#FFFFFF' },
        adminName: { fontFamily: F.bold, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.2 },
        adminEmail: { fontFamily: F.body, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
        badgeRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
        roleBadge: {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
        },
        roleBadgeText: { fontFamily: F.semibold, fontSize: 11, color: '#FFFFFF' },

        content: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },

        sectionLabel: { fontFamily: F.semibold, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },

        // Settings card
        card: {
            backgroundColor: C.card, borderRadius: 18,
            borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1,
        },
        settingRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 15, gap: 14,
        },
        settingIconWrap: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: isDark ? 'rgba(78,200,49,0.10)' : 'rgba(78,200,49,0.08)',
            alignItems: 'center', justifyContent: 'center',
        },
        settingIconWrapNeutral: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0F0F0',
        },
        settingLeft: { flex: 1, gap: 1 },
        settingTitle: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
        settingMeta: { fontFamily: F.body, fontSize: 12, color: C.muted },
        settingChevron: {},

        // Region value chip
        regionChip: {
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: isDark ? 'rgba(78,200,49,0.12)' : 'rgba(78,200,49,0.08)',
            borderRadius: 8,
        },
        regionChipText: { fontFamily: F.semibold, fontSize: 12, color: C.greenDark },

        // Stats row
        statsRow: { flexDirection: 'row', gap: 10 },
        statTile: {
            flex: 1, alignItems: 'center', paddingVertical: 16,
            backgroundColor: C.card, borderRadius: 16,
            borderWidth: 1, borderColor: cardBorder, gap: 4,
        },
        statVal: { fontFamily: F.bold, fontSize: 20, color: C.ink },
        statLabel: { fontFamily: F.body, fontSize: 11, color: C.muted, textAlign: 'center' },

        // Logout
        logoutBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 15, borderRadius: 18,
            backgroundColor: isDark ? 'rgba(229,57,53,0.14)' : '#FFEBEE',
            borderWidth: 1, borderColor: isDark ? 'rgba(229,57,53,0.3)' : 'rgba(229,57,53,0.2)',
        },
        logoutText: { fontFamily: F.bold, fontSize: 15, color: '#C62828' },

        versionText: { fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center', paddingBottom: 8 },

        pressed: { opacity: 0.7 },
    });
}

const REGIONS = ['Region 1', 'Region 2', 'Region 3', 'All'];

export default function AdminAccount() {
    const insets = useSafeAreaInsets();
    const { colors: C, gradients: G, isDark } = useTheme();
    const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);

    const [notificationsOn, setNotificationsOn] = useState(true);
    const [regionIdx, setRegionIdx] = useState(2); // Region 3
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((msg: string, type: typeof toast.type = 'info') =>
        setToast({ visible: true, message: msg, type }), []);
    const haptic = useCallback(() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, []);

    const cycleRegion = () => {
        haptic();
        const next = (regionIdx + 1) % REGIONS.length;
        setRegionIdx(next);
        showToast(`Region set to ${REGIONS[next]}`, 'success');
    };

    const SETTINGS = [
        {
            icon: 'notifications', title: 'Push Notifications',
            meta: notificationsOn ? 'Receiving alerts' : 'Muted',
            control: (
                <Switch
                    value={notificationsOn}
                    onValueChange={(v) => { haptic(); setNotificationsOn(v); }}
                    trackColor={{ false: '#E0E0E0', true: C.brand }}
                    thumbColor={'#FFFFFF'}
                />
            ),
            neutral: false,
            onPress: undefined,
        },
        {
            icon: 'place', title: 'Active Region',
            meta: 'Tap to cycle regions',
            control: (
                <View style={styles.regionChip}>
                    <Text style={styles.regionChipText}>{REGIONS[regionIdx]}</Text>
                </View>
            ),
            neutral: false,
            onPress: cycleRegion,
        },
        {
            icon: 'download', title: 'Export Data',
            meta: 'CSV / JSON report',
            control: <MaterialIcons name="chevron-right" size={20} color={C.muted} />,
            neutral: true,
            onPress: () => { haptic(); showToast('Export coming soon', 'info'); },
        },
        {
            icon: 'help-outline', title: 'Admin Help',
            meta: 'View documentation',
            control: <MaterialIcons name="chevron-right" size={20} color={C.muted} />,
            neutral: true,
            onPress: () => { haptic(); showToast('Opening help docs…', 'info'); },
        },
    ];

    return (
        <ErrorBoundary>
            <View style={styles.root}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type}
                    onHide={() => setToast(t => ({ ...t, visible: false }))} />

                {/* Header with avatar */}
                <LinearGradient colors={G.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <View style={styles.headerBlobTL} />
                    <View style={styles.headerBlobBR} />
                    <View style={styles.avatarBlock}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>A</Text>
                        </View>
                        <Text style={styles.adminName}>Admin User</Text>
                        <Text style={styles.adminEmail}>admin@nodot.co.za</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.roleBadge}>
                                <MaterialIcons name="verified" size={12} color="#FFFFFF" />
                                <Text style={styles.roleBadgeText}>Super Admin</Text>
                            </View>
                            <View style={styles.roleBadge}>
                                <MaterialIcons name="place" size={12} color="#FFFFFF" />
                                <Text style={styles.roleBadgeText}>{REGIONS[regionIdx]}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                >
                    {/* Quick stats */}
                    <View style={styles.statsRow}>
                        {[
                            { val: '847', label: 'Pickups Today' },
                            { val: '28', label: 'Pickers Live' },
                            { val: '4', label: 'Flags Open' },
                        ].map(s => (
                            <View key={s.label} style={styles.statTile}>
                                <Text style={styles.statVal}>{s.val}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Settings */}
                    <Text style={styles.sectionLabel}>Settings</Text>
                    <View style={styles.card}>
                        {SETTINGS.map((s, idx) => (
                            <View key={s.title}>
                                <Pressable
                                    style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
                                    onPress={s.onPress}
                                >
                                    <View style={[styles.settingIconWrap, s.neutral && styles.settingIconWrapNeutral]}>
                                        <MaterialIcons name={s.icon as any} size={18} color={s.neutral ? C.muted : C.brand} />
                                    </View>
                                    <View style={styles.settingLeft}>
                                        <Text style={styles.settingTitle}>{s.title}</Text>
                                        <Text style={styles.settingMeta}>{s.meta}</Text>
                                    </View>
                                    {s.control}
                                </Pressable>
                                {idx < SETTINGS.length - 1 && <Divider inset={66} />}
                            </View>
                        ))}
                    </View>

                    {/* Logout */}
                    <Pressable
                        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
                        onPress={() => { haptic(); showToast('Logging out…', 'info'); }}
                    >
                        <MaterialIcons name="logout" size={18} color="#C62828" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </Pressable>

                    <Text style={styles.versionText}>NoDot Admin · v1.0.0</Text>
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}
