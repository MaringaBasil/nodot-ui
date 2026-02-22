import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale target on press-in. Default 0.96 */
  scaleTo?: number;
  /** Haptic style on press. Pass null to disable. Default: Light */
  haptic?: Haptics.ImpactFeedbackStyle | null;
}

/**
 * Drop-in replacement for Pressable that adds a spring scale animation and
 * optional haptic feedback on press. The scale animates the outer
 * Animated.View so shadows / border-radius on `style` are unaffected.
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

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, disabled && { opacity: 0.55 }]}
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
