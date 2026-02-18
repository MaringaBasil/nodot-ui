import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, Animated, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Theme } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Custom Tab Bar Button with animations
const AnimatedTabButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  accessibilityState: { selected?: boolean };
}> = ({ children, onPress, accessibilityState }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const focused = accessibilityState?.selected;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Tab Icon with animated indicator
const TabIcon: React.FC<{
  name: string;
  color: string;
  focused: boolean;
  label: string;
}> = ({ name, color, focused, label }) => {
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorWidth, {
        toValue: focused ? 1 : 0,
        useNativeDriver: false,
        friction: 6,
      }),
      Animated.spring(iconScale, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        friction: 6,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabIconWrapper}>
      <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <IconSymbol size={22} name={name as any} color={color} />
        </Animated.View>
      </View>
      {/* Animated indicator dot */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            width: indicatorWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 20],
            }),
            opacity: indicatorWidth,
          },
        ]}
      />
    </View>
  );
};

// Special Scan Button with glow effect
const ScanTabIcon: React.FC<{
  color: string;
  focused: boolean;
}> = ({ color, focused }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
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
    <View style={styles.scanTabWrapper}>
      {/* Outer glow ring */}
      {focused && (
        <Animated.View
          style={[
            styles.scanPulseRing,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0],
              }),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.6],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.scanTabIcon,
          focused && styles.scanTabIconActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.scanIconInner}>
          <IconSymbol size={28} name="viewfinder" color={focused ? '#FFFFFF' : color} />
        </View>
        {/* Corner accents for scanner effect */}
        <View style={[styles.scanCorner, styles.scanCornerTL]} />
        <View style={[styles.scanCorner, styles.scanCornerTR]} />
        <View style={[styles.scanCorner, styles.scanCornerBL]} />
        <View style={[styles.scanCorner, styles.scanCornerBR]} />
      </Animated.View>
    </View>
  );
};

export default function CitizenLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.greenDark,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.display,
          fontSize: 10,
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: 32,
            marginHorizontal: 20,
            marginBottom: 24,
            height: 76,
            paddingBottom: 8,
            paddingTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.04)',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          },
          android: {
            position: 'absolute',
            backgroundColor: '#FFFFFF',
            borderRadius: 32,
            marginHorizontal: 16,
            marginBottom: 20,
            height: 72,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 12,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.04)',
          },
          default: {
            position: 'absolute',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 32,
            marginHorizontal: 20,
            marginBottom: 24,
            height: 76,
            paddingBottom: 8,
            paddingTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.06)',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          },
        }),
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarButton: (props) => (
          <AnimatedTabButton
            onPress={props.onPress as () => void}
            accessibilityState={props.accessibilityState as { selected?: boolean }}
          >
            {props.children}
          </AnimatedTabButton>
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house.fill" color={color} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <ScanTabIcon color={color} focused={focused} />
          ),
          tabBarLabelStyle: {
            fontFamily: Theme.fonts.display,
            fontSize: 10,
            marginTop: 8,
            letterSpacing: 0.2,
          },
        }}
      />
      <Tabs.Screen
        name="pickup"
        options={{
          title: 'Pickup',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="shippingbox.fill" color={color} focused={focused} label="Pickup" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.fill" color={color} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
  },
  tabIndicator: {
    height: 3,
    backgroundColor: Theme.colors.green,
    borderRadius: 2,
    marginTop: 4,
  },

  // Scan button styles
  scanTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  scanPulseRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Theme.colors.green,
  },
  scanTabIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.wash,
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
    backgroundColor: Theme.colors.green,
    shadowColor: Theme.colors.green,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  scanIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  scanCornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  scanCornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  scanCornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  scanCornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
});
