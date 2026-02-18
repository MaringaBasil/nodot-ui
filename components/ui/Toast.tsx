import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { Theme } from '@/constants/Colors';
import { AppIcon as MaterialIcons } from './AppIcon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  duration?: number;
  onHide?: () => void;
}

export const Toast = ({ message, type = 'info', visible, duration = 3000, onHide }: ToastProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver,
          tension: 65,
          friction: 8,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onHide]);

  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: Theme.colors.green };
      case 'error':
        return { icon: 'error', color: Theme.colors.orange };
      case 'warning':
        return { icon: 'warning', color: Theme.colors.gold };
      default:
        return { icon: 'info', color: Theme.colors.blue };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.content, { borderLeftColor: color }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.m,
    padding: 12,
    gap: 10,
    ...Theme.shadow.lift,
    borderLeftWidth: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
    lineHeight: 18,
  },
});
