import { Platform } from 'react-native';

const tintColorLight = '#2E7D32';
const tintColorDark = '#E6EFE6';

export const Colors = {
  light: {
    text: '#1A1D1A',
    background: '#F4F3EE',
    tint: tintColorLight,
    icon: '#5C635E',
    tabIconDefault: '#7A817B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

const displayFont = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const bodyFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const monoFont = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const Theme = {
  colors: {
    ink: '#1A1D1A',
    muted: '#5C635E',
    paper: '#F4F3EE',
    card: '#FFFFFF',
    wash: '#E6EFE6',
    border: '#D7DED5',
    green: '#2E7D32',
    greenDark: '#1E5A25',
    greenSoft: '#8BD3A1',
    orange: '#E28F3C',
    gold: '#C6A35C',
    teal: '#3F8B7B',
    blue: '#2C6E91',
    neutral100: '#F7F8F5',
    neutral200: '#EAEFE9',
    neutral300: '#DCE4DC',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
  },
  radius: {
    s: 12,
    m: 18,
    l: 24,
    xl: 32,
  },
  fonts: {
    display: displayFont,
    body: bodyFont,
    mono: monoFont,
  },
  text: {
    title: {
      fontFamily: displayFont,
      fontSize: 20,
      color: '#1A1D1A',
    },
    body: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: '#2B2F2B',
    },
    caption: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: '#5C635E',
    },
  },
  shadow: {
    subtle: {
      shadowColor: '#0C120D',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
    soft: {
      shadowColor: '#0C120D',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    lift: {
      shadowColor: '#0C120D',
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
    },
    glow: {
      shadowColor: '#2E7D32',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
};
