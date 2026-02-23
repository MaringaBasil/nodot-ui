import { Platform } from 'react-native';

const tintColorLight = '#4EC831';
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

// ─── Nunito type scale ─────────────────────────────────────────────────────
// Keys must match the font names registered in useFonts() in _layout.tsx.
// Do NOT combine these with fontWeight — RN would attempt synthetic synthesis
// on web, overriding the explicit weight variant.
export const F = {
  black:    'Nunito_900Black',       // wordmarks, splash hero
  display:  'Nunito_800ExtraBold',   // screen headings, CTA button labels
  bold:     'Nunito_700Bold',        // section titles, card headings
  semibold: 'Nunito_600SemiBold',    // field labels, nav items, chips
  body:     'Nunito_400Regular',     // body copy, input text, descriptions
} as const;

// Mono stays platform-native — used for codes / IDs only
const monoFont = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

// ─── Light theme ───────────────────────────────────────────────────────────
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
    // Brand design system (from no-dot-ui.pdf)
    brand: '#4EC831',       // vivid lime green – primary brand color
    brandDark: '#3BA625',   // darker for pressed states
    brandLight: '#E8F8E0',  // light tint for backgrounds
    navy: '#1B2C3A',        // dark navy – primary button background
    surface: '#F0F2F5',     // light gray – form screen background
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
  // Unified Nunito font scale + legacy aliases for existing screens
  fonts: {
    black:    F.black,
    display:  F.display,
    bold:     F.bold,
    semibold: F.semibold,
    body:     F.body,
    mono:     monoFont,
  },
  text: {
    title: {
      fontFamily: F.display,
      fontSize: 20,
      color: '#1A1D1A',
    },
    body: {
      fontFamily: F.body,
      fontSize: 14,
      color: '#2B2F2B',
    },
    caption: {
      fontFamily: F.body,
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
      shadowColor: '#4EC831',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
  gradients: {
    card:    ['#FFFFFF', '#F5F7FB'] as [string, string],
    header:  ['#253E55', '#1B2C3A'] as [string, string],
    accent:  ['#5AD03A', '#4EC831'] as [string, string],
    surface: ['#F4F6FA', '#ECF0F7'] as [string, string],
    statPrimary: ['#EDF7E5', '#D9F0C7'] as [string, string],
  },
};

// ─── Dark theme ────────────────────────────────────────────────────────────
export type ThemeType = typeof Theme;

export const ThemeDark: ThemeType = {
  colors: {
    ink: '#ECEDEE',
    muted: '#9BA1A6',
    paper: '#0F1218',
    card: '#1E2535',
    wash: '#252D40',
    border: '#2A3450',
    green: '#4CAF50',
    greenDark: '#66BB6A',
    greenSoft: '#2E5C34',
    orange: '#E28F3C',
    gold: '#C6A35C',
    teal: '#5BA392',
    blue: '#5B9FD4',
    neutral100: '#1E2535',
    neutral200: '#252D40',
    neutral300: '#2A3450',
    brand: '#4EC831',
    brandDark: '#5CD63C',
    brandLight: '#1E3D1A',
    navy: '#1B2E4A',
    surface: '#181D2B',
  },
  spacing: Theme.spacing,
  radius: Theme.radius,
  fonts: Theme.fonts,
  text: {
    title: {
      fontFamily: F.display,
      fontSize: 20,
      color: '#ECEDEE',
    },
    body: {
      fontFamily: F.body,
      fontSize: 14,
      color: '#D1D3D4',
    },
    caption: {
      fontFamily: F.body,
      fontSize: 12,
      color: '#9BA1A6',
    },
  },
  shadow: {
    subtle: {
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
    soft: {
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    lift: {
      shadowColor: '#000000',
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
    },
    glow: {
      shadowColor: '#4EC831',
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
  gradients: {
    card:    ['#252E48', '#191E30'] as [string, string],
    header:  ['#1F3558', '#101D35'] as [string, string],
    accent:  ['#5AD03A', '#4EC831'] as [string, string],
    surface: ['#1E2535', '#131824'] as [string, string],
    statPrimary: ['#1A3A20', '#0F2214'] as [string, string],
  },
};

export function getTheme(scheme: 'light' | 'dark' | null | undefined): ThemeType {
  return scheme === 'dark' ? ThemeDark : Theme;
}
