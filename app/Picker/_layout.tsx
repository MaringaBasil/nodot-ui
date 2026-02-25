import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { RouteProvider } from '@/contexts/RouteContext';
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

// ─── Animated Tab Button ─────────────────────────────────────────────────────
const AnimatedTabButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  accessibilityState: { selected?: boolean };
}> = ({ children, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, friction: 5 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, Platform.select({ web: { outlineStyle: 'none', cursor: 'pointer' } as any })]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
const TabIcon: React.FC<{ name: string; color: string; focused: boolean }> = ({ name, color, focused }) => {
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
      <Animated.View style={[styles.tabIndicator, {
        width: indicatorWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }),
        opacity: indicatorWidth,
      }]} />
      <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <IconSymbol size={22} name={name as any} color={color} />
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function PickerLayout() {
  const colorScheme = useColorScheme();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const tabHMargin = isTablet ? Math.max(16, (width - 480) / 2) : 16;
  const tabBMargin = Math.max(insets.bottom + 6, 16);

  const tabBarStyle = {
    position: 'absolute' as const,
    backgroundColor: Platform.OS === 'android'
      ? (isDark ? 'rgba(22,25,30,0.96)' : 'rgba(255,255,255,0.96)')
      : 'transparent',
    borderRadius: 32,
    marginHorizontal: tabHMargin,
    marginBottom: tabBMargin,
    height: 68,
    paddingBottom: 6,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.72)',
    ...(Platform.OS === 'android'
      ? { elevation: 16 }
      : { shadowColor: '#000' as const, shadowOpacity: isDark ? 0.50 : 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } }),
  };

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
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: { fontFamily: Theme.fonts.display, fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
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
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon name="house.fill" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Jobs', tabBarIcon: ({ color, focused }) => <TabIcon name="shippingbox.fill" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ color, focused }) => <TabIcon name="clock.fill" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings', tabBarIcon: ({ color, focused }) => <TabIcon name="wallet.pass.fill" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <TabIcon name="person.fill" color={color} focused={focused} /> }}
      />
      {/* Hidden stack-navigable screens */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="support"       options={{ href: null }} />
      <Tabs.Screen name="navigate"      options={{ href: null, tabBarStyle: { display: 'none' }, headerShown: false }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  tabIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  tabIconActive: { backgroundColor: 'rgba(78, 200, 49, 0.12)' },
  tabIndicator: { height: 3, backgroundColor: Theme.colors.brand, borderRadius: 2, marginBottom: 4 },
});
