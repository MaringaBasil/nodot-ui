import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Theme } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/hooks/useTheme';

// ─── Animated Tab Button ────────────────────────────────────────────────────
const AnimatedTabButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  accessibilityState: { selected?: boolean };
}> = ({ children, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, friction: 5 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.tabButton,
        Platform.select({ web: { outlineStyle: 'none', cursor: 'pointer' } as any }),
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ─── Tab Icon ───────────────────────────────────────────────────────────────
const TabIcon: React.FC<{
  name: string;
  color: string;
  focused: boolean;
}> = ({ name, color, focused }) => {
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorWidth, { toValue: focused ? 1 : 0, useNativeDriver: false, friction: 6 }),
      Animated.spring(iconScale, { toValue: focused ? 1.1 : 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabIconWrapper}>
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            width: indicatorWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }),
            opacity: indicatorWidth,
          },
        ]}
      />
      <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <IconSymbol size={22} name={name as any} color={color} />
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Bags Tab Icon (centre CTA) ─────────────────────────────────────────────
const BagsTabIcon: React.FC<{
  color: string;
  focused: boolean;
}> = ({ color, focused }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Adaptive sizing — all derived from one base value
  const SCAN_SIZE = isTablet ? 64 : 58;
  const SCAN_RADIUS = SCAN_SIZE / 2;
  const PULSE_SIZE = SCAN_SIZE + 6;
  const INNER_SIZE = SCAN_SIZE - 18;
  const ICON_SIZE = isTablet ? 28 : 24;
  // Proportional lift: ~28% of button diameter above the tab bar top edge
  const LIFT = -(SCAN_SIZE * 0.28);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [focused]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.05 : 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }, [focused]);

  return (
    <View style={[styles.scanTabWrapper, { marginTop: LIFT }]}>
      {focused && (
        <Animated.View
          style={[
            styles.scanPulseRing,
            { width: PULSE_SIZE, height: PULSE_SIZE, borderRadius: PULSE_SIZE / 2 },
            {
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
              transform: [
                { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
              ],
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.scanTabIcon,
          focused && styles.scanTabIconActive,
          {
            width: SCAN_SIZE,
            height: SCAN_SIZE,
            borderRadius: SCAN_RADIUS,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.scanIconInner,
            { width: INNER_SIZE, height: INNER_SIZE, borderRadius: INNER_SIZE / 2 },
          ]}
        >
          <IconSymbol size={ICON_SIZE} name="bag.fill" color={focused ? '#FFFFFF' : color} />
        </View>
        {/* Corner accents for scanner feel */}
        <View style={[styles.scanCorner, styles.scanCornerTL]} />
        <View style={[styles.scanCorner, styles.scanCornerTR]} />
        <View style={[styles.scanCorner, styles.scanCornerBL]} />
        <View style={[styles.scanCorner, styles.scanCornerBR]} />
      </Animated.View>
    </View>
  );
};

// ─── Layout ─────────────────────────────────────────────────────────────────
export default function CitizenLayout() {
  const colorScheme = useColorScheme();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // Tablets: center bar at max 480 px wide. Phones: 16 px each side.
  const tabHMargin = isTablet ? Math.max(16, (width - 480) / 2) : 16;
  // Honour device bottom safe-area (home indicator / gesture bar) + 6 px gap.
  const tabBMargin = Math.max(insets.bottom + 6, 16);

  // BlurView provides the glass background — tab bar container is transparent
  const tabBarStyle = {
    position: 'absolute' as const,
    // transparent so BlurView behind shows through; Android fallback is semi-opaque
    backgroundColor: Platform.OS === 'android'
      ? (isDark ? 'rgba(22,25,30,0.96)' : 'rgba(255,255,255,0.96)')
      : (isDark ? 'rgba(20,25,35,0.85)' : 'rgba(255,255,255,0.85)'),
    borderRadius: 32,
    marginHorizontal: tabHMargin,
    marginBottom: tabBMargin,
    height: 68,
    paddingBottom: 6,
    paddingTop: 6,
    // Specular rim — the 1 px highlight that sells the glass edge
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.72)',
    ...(Platform.OS === 'android'
      ? { elevation: 16 }
      : {
        shadowColor: '#000' as const,
        shadowOpacity: isDark ? 0.50 : 0.16,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 12 },
      }),
  };

  // Glass pill rendered as the tab bar background (content scrolls and blurs behind it)
  const tabBarBackground = () => (
    <BlurView
      intensity={92}
      tint={isDark ? 'dark' : 'extraLight'}
      style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.display,
          fontSize: 10,
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarStyle,
        tabBarBackground,
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarButton: (props) => (
          <AnimatedTabButton
            onPress={props.onPress as () => void}
            accessibilityState={props.accessibilityState as { selected?: boolean }}
          >
            {props.children}
          </AnimatedTabButton>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="clock.fill" color={color} focused={focused} />
          ),
        }}
      />
      {/* ── Centre CTA: My Bags ── */}
      <Tabs.Screen
        name="bags"
        options={{
          title: 'My Bags',
          tabBarIcon: ({ color, focused }) => (
            <BagsTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="creditcard.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.fill" color={color} focused={focused} />
          ),
        }}
      />
      {/* Hidden navigable screens */}
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="bag-qr" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="pickup" options={{ href: null }} />
      <Tabs.Screen name="hubs" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="tips" options={{ href: null }} />
      <Tabs.Screen name="profile-notifications" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Tab button wrapper
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Regular tab icon
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconActive: {
    backgroundColor: 'rgba(78, 200, 49, 0.12)',
  },
  tabIndicator: {
    height: 3,
    backgroundColor: Theme.colors.brand,
    borderRadius: 2,
    marginBottom: 4,
  },

  // Scan button — dimensions applied inline for responsiveness
  scanTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPulseRing: {
    position: 'absolute',
    backgroundColor: Theme.colors.brand,
  },
  scanTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.navy,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  scanTabIconActive: {
    backgroundColor: Theme.colors.brand,
    shadowColor: Theme.colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  scanIconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scanner corner accents
  scanCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scanCornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  scanCornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  scanCornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  scanCornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
});
