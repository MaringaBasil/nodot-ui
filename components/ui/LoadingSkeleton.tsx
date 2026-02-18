import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Platform, DimensionValue } from 'react-native';
import { Theme } from '@/constants/Colors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = Theme.radius.s, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as DimensionValue, height, borderRadius },
        { opacity },
        style,
      ]}
    />
  );
};

export const CardSkeleton = () => (
  <View style={styles.card}>
    <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
    <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />
    <Skeleton width="100%" height={80} />
  </View>
);

export const ListItemSkeleton = () => (
  <View style={styles.listItem}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Theme.colors.neutral200,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.l,
    padding: 18,
    ...Theme.shadow.soft,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  listItemContent: {
    flex: 1,
  },
});
