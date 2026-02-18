import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Colors';

export const Camera = () => (
  <View style={styles.container}>
    <View style={styles.frame}>
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />
      <View style={styles.scanLine} />
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>Align item inside the frame</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1510',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '82%',
    height: '70%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: Theme.colors.greenSoft,
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTopRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    width: '75%',
    height: 2,
    backgroundColor: Theme.colors.greenSoft,
    opacity: 0.8,
  },
  tipBox: {
    position: 'absolute',
    bottom: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  tipText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#E8F1E4',
  },
});
