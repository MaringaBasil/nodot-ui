import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale target on press-in. Default 0.96 */
  scaleTo?: number;
  /** Haptic style on press. Pass null to disable. Default: Light */
  haptic?: Haptics.ImpactFeedbackStyle | null;
}

// Layout-only properties that must live on the outer Animated.View so the
// component participates correctly in parent flex/absolute layouts.
const LAYOUT_KEYS: (keyof ViewStyle)[] = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'alignSelf',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical',
  'position', 'top', 'bottom', 'left', 'right',
];

/**
 * Drop-in replacement for Pressable that adds a spring scale animation and
 * optional haptic feedback on press. Layout properties (flex, width, margin,
 * position) are automatically forwarded to the outer Animated.View so the
 * component participates correctly in parent flex rows and grids.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  style,
  scaleTo = 0.96,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 6,
      tension: 300,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 280,
    }).start();
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (haptic !== null && Platform.OS !== 'web') {
      Haptics.impactAsync(haptic);
    }
    onPress?.(e);
  };

  // Extract layout props from the flattened style so the outer Animated.View
  // correctly occupies space in the parent layout (e.g. flex: 1 in a row).
  const flat = StyleSheet.flatten(style) ?? {};
  const layoutStyle: ViewStyle = {};
  LAYOUT_KEYS.forEach((key) => {
    if (flat[key] !== undefined) {
      (layoutStyle as any)[key] = flat[key];
    }
  });

  return (
    <Animated.View
      style={[
        layoutStyle,
        { transform: [{ scale }] },
        disabled && { opacity: 0.55 },
      ]}
    >
      <Pressable
        style={style}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
